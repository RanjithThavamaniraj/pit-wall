import { generateRaceSlug, type SessionStatus } from "./utils";
import { CACHE, MOTOGP_SCHEDULE_MEMORY_MS } from "./motogp/cache";

const MOTOGP_BASE = "https://api.motogp.pulselive.com/motogp/v1";

const MAIN_CATEGORIES = ["MotoGP™", "Moto2™", "Moto3™"] as const;
export type MotoGpCategoryName = (typeof MAIN_CATEGORIES)[number];

// ─── Domain types ─────────────────────────────────────────────────────────────

export type MotoGpSessionKey = string;

export type MotoGpSession = {
  key: MotoGpSessionKey;
  label: string;
  dateUtc: string;
  status: SessionStatus;
  sessionId: string;
  apiType: string;
};

export type MotoGpFinisher = {
  position: number;
  riderName: string;
  riderNumber: number;
  teamName: string;
};

export type MotoGpEvent = {
  id: string;
  slug: string;
  round: number;
  season: number;
  name: string;
  shortName: string;
  circuit: string;
  locality: string;
  country: string;
  countryCode: string;
  dateStart: string;
  dateEnd: string;
  sessions: MotoGpSession[];
  podium: MotoGpFinisher[];
  isNext: boolean;
  isPast: boolean;
  isCurrent: boolean;
  eventStatus: string;
};

export type MotoGpSchedule = {
  seasonId: string;
  season: number;
  totalRaces: number;
  races: MotoGpEvent[];
};

export type MotoGpRiderStanding = {
  position: number;
  riderName: string;
  riderNumber: number;
  nationality: string;
  countryCode: string;
  teamName: string;
  points: number;
  wins: number;
  gapToLeader: number;
};

export type MotoGpTeamStanding = {
  position: number;
  name: string;
  points: number;
  wins: number;
  gapToLeader: number;
};

export type MotoGpStandings = {
  season: number;
  round: number;
  category: MotoGpCategoryName;
  riders: MotoGpRiderStanding[];
  teams: MotoGpTeamStanding[];
};

export type MotoGpCategory = {
  id: string;
  name: MotoGpCategoryName;
};

// ─── API response types ───────────────────────────────────────────────────────

type ApiSeason = {
  id: string;
  year: number;
  current: boolean;
};

type ApiCountry = {
  iso: string;
  name: string;
};

type ApiCircuit = {
  name: string;
  place?: string;
};

type ApiEvent = {
  id: string;
  name: string;
  short_name: string;
  country: ApiCountry;
  circuit: ApiCircuit;
  date_start: string;
  date_end: string;
  status: string;
  test?: boolean;
  season?: { year: number };
};

type ApiCategory = {
  id: string;
  name: string;
};

type ApiSession = {
  id: string;
  type: string;
  number?: number;
  date?: string;
  status?: string;
};

type ApiClassificationEntry = {
  position: number;
  points?: number;
  race_wins?: number;
  rider?: {
    full_name?: string;
    number?: number;
    country?: ApiCountry;
  };
  team?: {
    id?: string;
    name?: string;
  };
};

type ApiStandingsResponse = {
  classification: ApiClassificationEntry[];
};

// ─── Module cache ─────────────────────────────────────────────────────────────

let cachedSeasonId: string | null = null;
let cachedSeasonYear: number | null = null;
let cachedCategories: MotoGpCategory[] | null = null;
let cachedSchedule: { data: MotoGpSchedule; fetchedAt: number } | null = null;

const MOTOGP_SESSION_DURATION_MINUTES: Record<string, number> = {
  race: 45,
  sprint: 30,
  wup: 20,
  pr: 30,
  q1: 15,
  q2: 15,
  fp1: 45,
  fp2: 45,
  fp3: 45,
  fp4: 45,
};

/** PulseLive returns circuit-local wall times with a bogus +00:00 suffix. */
const CIRCUIT_TIMEZONES: Record<string, string> = {
  ARG: "America/Argentina/Buenos_Aires",
  AUS: "Australia/Phillip_Island",
  AUT: "Europe/Vienna",
  CAT: "Europe/Madrid",
  FRA: "Europe/Paris",
  GER: "Europe/Berlin",
  GBR: "Europe/London",
  INA: "Asia/Makassar",
  IND: "Asia/Kolkata",
  ITA: "Europe/Rome",
  JPN: "Asia/Tokyo",
  MAL: "Asia/Kuala_Lumpur",
  NED: "Europe/Amsterdam",
  POR: "Europe/Lisbon",
  QAT: "Asia/Qatar",
  RSA: "Africa/Johannesburg",
  SPA: "Europe/Madrid",
  THA: "Asia/Bangkok",
  USA: "America/Los_Angeles",
};

function circuitTimeZone(countryCode: string): string {
  return CIRCUIT_TIMEZONES[countryCode.toUpperCase()] ?? "Europe/Amsterdam";
}

/**
 * Convert a PulseLive ISO string (track-local wall clock tagged as UTC) to a
 * real UTC instant for countdowns and session status.
 */
export function pulseLiveDateToUtc(
  iso: string,
  countryCode: string
): string {
  const wall = iso.replace(/(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/, "");
  const [datePart, timePart = "00:00:00"] = wall.split("T");
  const [y, M, d] = datePart.split("-").map(Number);
  const [h, m, s = 0] = timePart.split(":").map(Number);
  const targetMs = Date.UTC(y, M - 1, d, h, m, Number(s));
  const timeZone = circuitTimeZone(countryCode);

  const formatInTz = (instant: number) => {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).formatToParts(new Date(instant));
    const get = (type: string) =>
      Number(parts.find((part) => part.type === type)?.value);
    return Date.UTC(
      get("year"),
      get("month") - 1,
      get("day"),
      get("hour"),
      get("minute"),
      get("second")
    );
  };

  let guess = targetMs;
  for (let i = 0; i < 4; i++) {
    guess += targetMs - formatInTz(guess);
  }
  return new Date(guess).toISOString();
}

// ─── Fetch helpers ────────────────────────────────────────────────────────────

async function motogpFetch<T>(
  path: string,
  revalidate: number = CACHE.MOTOGP_SCHEDULE,
  noStore = false
): Promise<T> {
  const res = await fetch(`${MOTOGP_BASE}${path}`, noStore
    ? { cache: "no-store" }
    : { next: { revalidate } });

  if (!res.ok) {
    throw new Error(`MotoGP API fetch failed (${res.status}): ${path}`);
  }

  return res.json() as Promise<T>;
}

function normalizeCategoryName(name: string): MotoGpCategoryName | null {
  if (name.includes("MotoGP")) return "MotoGP™";
  if (name.includes("Moto2")) return "Moto2™";
  if (name.includes("Moto3")) return "Moto3™";
  return null;
}

function splitRiderName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) {
    return { firstName: "", lastName: fullName };
  }
  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts[parts.length - 1],
  };
}

function sessionKeyFromApi(session: ApiSession): string | null {
  switch (session.type) {
    case "FP":
      return `fp${session.number ?? 1}`;
    case "Q":
      return `q${session.number ?? 1}`;
    case "PR":
      return "pr";
    case "SPR":
      return "sprint";
    case "WUP":
      return "wup";
    case "RAC":
      return "race";
    default:
      return null;
  }
}

function sessionLabelFromApi(session: ApiSession): string {
  switch (session.type) {
    case "FP":
      return session.number ? `Free Practice ${session.number}` : "Free Practice";
    case "Q":
      return session.number ? `Qualifying ${session.number}` : "Qualifying";
    case "PR":
      return "Practice";
    case "SPR":
      return "Sprint Race";
    case "WUP":
      return "Warm Up";
    case "RAC":
      return "Main Race";
    default:
      return session.type;
  }
}

function getMotoGpSessionStatus(
  key: string,
  dateUtc: string,
  apiStatus?: string
): SessionStatus {
  if (!dateUtc) return "upcoming";

  const now = Date.now();
  const start = new Date(dateUtc).getTime();
  const durationMs =
    (MOTOGP_SESSION_DURATION_MINUTES[key] ?? 45) * 60 * 1000;
  const end = start + durationMs;

  if (apiStatus === "FINISHED" || apiStatus === "Official") {
    if (now < start) {
      return "upcoming";
    }
    return "completed";
  }

  if (now < start) return "upcoming";
  if (now >= start && now <= end) return "live";
  return "completed";
}

function mapIndividualSessions(
  rawSessions: ApiSession[],
  countryCode: string
): MotoGpSession[] {
  return rawSessions
    .filter((session) => session.date && sessionKeyFromApi(session))
    .map((session) => {
      const key = sessionKeyFromApi(session)!;
      const dateUtc = pulseLiveDateToUtc(session.date!, countryCode);
      return {
        key,
        label: sessionLabelFromApi(session),
        dateUtc,
        status: getMotoGpSessionStatus(key, dateUtc, session.status),
        sessionId: session.id,
        apiType: session.type,
      };
    })
    .sort(
      (a, b) => new Date(a.dateUtc).getTime() - new Date(b.dateUtc).getTime()
    );
}

function deriveEventFlags(
  event: MotoGpEvent,
  allEvents: MotoGpEvent[],
  now: number
): MotoGpEvent {
  const start = new Date(event.dateStart).getTime();
  const end = new Date(event.dateEnd).getTime() + 24 * 60 * 60 * 1000;
  const isPast = event.eventStatus === "FINISHED" || now > end;
  const isCurrent = !isPast && now >= start - 2 * 24 * 60 * 60 * 1000 && now <= end;

  return {
    ...event,
    isPast,
    isCurrent,
    isNext: false,
  };
}

function markNextEvent(events: MotoGpEvent[]): MotoGpEvent[] {
  const next = events.find((event) => !event.isPast);
  if (!next) return events;

  return events.map((event) => ({
    ...event,
    isNext: event.id === next.id,
  }));
}

function aggregateTeamStandings(
  riders: MotoGpRiderStanding[]
): MotoGpTeamStanding[] {
  const byTeam = new Map<
    string,
    { name: string; points: number; wins: number }
  >();

  for (const rider of riders) {
    const existing = byTeam.get(rider.teamName) ?? {
      name: rider.teamName,
      points: 0,
      wins: 0,
    };
    existing.points += rider.points;
    existing.wins += rider.wins;
    byTeam.set(rider.teamName, existing);
  }

  const teams = [...byTeam.values()]
    .sort((a, b) => b.points - a.points)
    .map((team, index) => ({
      position: index + 1,
      name: team.name,
      points: team.points,
      wins: team.wins,
      gapToLeader: 0,
    }));

  const leaderPoints = teams[0]?.points ?? 0;
  return teams.map((team) => ({
    ...team,
    gapToLeader: leaderPoints - team.points,
  }));
}

function mapRiderStandings(
  classification: ApiClassificationEntry[]
): MotoGpStandings["riders"] {
  const leaderPoints = classification[0]?.points ?? 0;

  return classification.map((entry) => ({
    position: entry.position,
    riderName: entry.rider?.full_name ?? "Unknown",
    riderNumber: entry.rider?.number ?? 0,
    nationality: entry.rider?.country?.name ?? "",
    countryCode: entry.rider?.country?.iso ?? "",
    teamName: entry.team?.name ?? "",
    points: entry.points ?? 0,
    wins: entry.race_wins ?? 0,
    gapToLeader: leaderPoints - (entry.points ?? 0),
  }));
}

// ─── Public fetchers ──────────────────────────────────────────────────────────

export async function getCurrentSeasonId(): Promise<{
  seasonId: string;
  seasonYear: number;
}> {
  if (cachedSeasonId && cachedSeasonYear) {
    return { seasonId: cachedSeasonId, seasonYear: cachedSeasonYear };
  }

  const seasons = await motogpFetch<ApiSeason[]>(
    "/results/seasons",
    CACHE.MOTOGP_PROFILES
  );
  const current =
    seasons.find((season) => season.current) ??
    [...seasons].sort((a, b) => b.year - a.year)[0];

  if (!current) {
    throw new Error("No MotoGP season found");
  }

  cachedSeasonId = current.id;
  cachedSeasonYear = current.year;

  return { seasonId: current.id, seasonYear: current.year };
}

export async function getSeasonCategories(
  seasonId?: string
): Promise<MotoGpCategory[]> {
  if (cachedCategories && !seasonId) {
    return cachedCategories;
  }

  const resolvedSeasonId = seasonId ?? (await getCurrentSeasonId()).seasonId;
  const categories = await motogpFetch<ApiCategory[]>(
    `/results/categories?seasonUuid=${resolvedSeasonId}`,
    CACHE.MOTOGP_PROFILES
  );

  const mapped = categories
    .map((category) => {
      const name = normalizeCategoryName(category.name);
      if (!name) return null;
      return { id: category.id, name };
    })
    .filter((category): category is MotoGpCategory => category !== null);

  if (!seasonId) {
    cachedCategories = mapped;
  }

  return mapped;
}

export async function getCategoryId(
  categoryName: MotoGpCategoryName,
  seasonId?: string
): Promise<string> {
  const categories = await getSeasonCategories(seasonId);
  const match = categories.find((category) => category.name === categoryName);
  if (!match) {
    throw new Error(`MotoGP category not found: ${categoryName}`);
  }
  return match.id;
}

export async function fetchSessionClassification(
  sessionId: string
): Promise<MotoGpFinisher[]> {
  const data = await motogpFetch<ApiStandingsResponse>(
    `/results/session/${sessionId}/classification?test=false`,
    CACHE.MOTOGP_HISTORY
  );

  return (data.classification ?? []).slice(0, 3).map((entry) => ({
    position: entry.position,
    riderName: entry.rider?.full_name ?? "Unknown",
    riderNumber: entry.rider?.number ?? 0,
    teamName: entry.team?.name ?? "",
  }));
}

export async function fetchSessionResults(
  sessionId: string,
  limit = 5,
  options?: { noStore?: boolean }
): Promise<MotoGpFinisher[]> {
  const data = await motogpFetch<ApiStandingsResponse>(
    `/results/session/${sessionId}/classification?test=false`,
    CACHE.MOTOGP_SESSION_RESULTS,
    options?.noStore ?? false
  );

  return (data.classification ?? []).slice(0, limit).map((entry) => ({
    position: entry.position,
    riderName: entry.rider?.full_name ?? "Unknown",
    riderNumber: entry.rider?.number ?? 0,
    teamName: entry.team?.name ?? "",
  }));
}

async function fetchEventSessions(
  eventId: string,
  categoryId: string,
  countryCode: string
): Promise<MotoGpSession[]> {
  const sessions = await motogpFetch<ApiSession[]>(
    `/results/sessions?eventUuid=${eventId}&categoryUuid=${categoryId}`,
    CACHE.MOTOGP_SCHEDULE
  );
  return mapIndividualSessions(sessions, countryCode);
}

export async function fetchMotoGpSchedule(
  options?: { force?: boolean }
): Promise<MotoGpSchedule> {
  if (
    cachedSchedule &&
    !options?.force &&
    Date.now() - cachedSchedule.fetchedAt < MOTOGP_SCHEDULE_MEMORY_MS
  ) {
    return cachedSchedule.data;
  }

  const { seasonId, seasonYear } = await getCurrentSeasonId();
  const motoGpCategoryId = await getCategoryId("MotoGP™", seasonId);

  const apiEvents = await motogpFetch<ApiEvent[]>(
    `/results/events?seasonUuid=${seasonId}`,
    CACHE.MOTOGP_SCHEDULE
  );

  const raceEvents = apiEvents
    .filter((event) => !event.test)
    .sort(
      (a, b) =>
        new Date(a.date_start).getTime() - new Date(b.date_start).getTime()
    );

  const now = Date.now();

  const settled = await Promise.allSettled(
    raceEvents.map(async (event, index) => {
      const round = index + 1;
      let sessions: MotoGpSession[] = [];
      try {
        sessions = await fetchEventSessions(
          event.id,
          motoGpCategoryId,
          event.country.iso
        );
      } catch {
        sessions = [];
      }

      const baseEvent: MotoGpEvent = {
        id: event.id,
        slug: generateRaceSlug(event.name, round),
        round,
        season: seasonYear,
        name: event.name,
        shortName: event.short_name,
        circuit: event.circuit.name,
        locality: event.circuit.place ?? "",
        country: event.country.name,
        countryCode: event.country.iso,
        dateStart: event.date_start,
        dateEnd: event.date_end,
        sessions,
        podium: [],
        isNext: false,
        isPast: false,
        isCurrent: false,
        eventStatus: event.status,
      };

      const flagged = deriveEventFlags(baseEvent, [], now);
      if (flagged.isPast) {
        const raceSession = sessions.find((session) => session.key === "race");
        if (raceSession) {
          try {
            flagged.podium = await fetchSessionClassification(
              raceSession.sessionId
            );
          } catch {
            flagged.podium = [];
          }
        }
      }

      return flagged;
    })
  );

  const racesWithSessions = settled
    .filter(
      (result): result is PromiseFulfilledResult<MotoGpEvent> =>
        result.status === "fulfilled"
    )
    .map((result) => result.value);

  const races = markNextEvent(racesWithSessions);

  const schedule: MotoGpSchedule = {
    seasonId,
    season: seasonYear,
    totalRaces: races.length,
    races,
  };

  cachedSchedule = { data: schedule, fetchedAt: Date.now() };
  return schedule;
}

export async function fetchMotoGpEventBySlug(
  slug: string
): Promise<MotoGpEvent | null> {
  const schedule = await fetchMotoGpSchedule();
  return schedule.races.find((race) => race.slug === slug) ?? null;
}

export async function fetchMotoGpStandings(
  categoryName: MotoGpCategoryName = "MotoGP™"
): Promise<MotoGpStandings> {
  const { seasonId, seasonYear } = await getCurrentSeasonId();
  const categoryId = await getCategoryId(categoryName, seasonId);

  const data = await motogpFetch<ApiStandingsResponse>(
    `/results/standings?seasonUuid=${seasonId}&categoryUuid=${categoryId}`,
    CACHE.MOTOGP_STANDINGS
  );

  const riders = mapRiderStandings(data.classification ?? []);
  const teams = aggregateTeamStandings(riders);
  const schedule = await fetchMotoGpSchedule();
  const finishedRounds = schedule.races.filter((race) => race.isPast).length;

  return {
    season: seasonYear,
    round: finishedRounds,
    category: categoryName,
    riders,
    teams,
  };
}

export function getCurrentMotoGpEvent(
  schedule: MotoGpSchedule
): MotoGpEvent | undefined {
  return schedule.races.find((race) => race.isCurrent);
}

export function getNextMotoGpEvent(
  schedule: MotoGpSchedule
): MotoGpEvent | undefined {
  return schedule.races.find((race) => race.isNext);
}

export function getPreviousMotoGpEvent(
  schedule: MotoGpSchedule
): MotoGpEvent | undefined {
  const pastRaces = schedule.races.filter((race) => race.isPast);
  return pastRaces.length > 0 ? pastRaces[pastRaces.length - 1] : undefined;
}

export { splitRiderName, MAIN_CATEGORIES };
