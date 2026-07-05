import { generateRaceSlug, getSessionStatus, type SessionStatus } from "./utils";
import { F1_CACHE } from "@/lib/cache/f1";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SessionKey =
  | "fp1"
  | "fp2"
  | "fp3"
  | "qualifying"
  | "sprint_qualifying"
  | "sprint"
  | "race";

export const SESSION_LABELS: Record<SessionKey, string> = {
  fp1: "Practice 1",
  fp2: "Practice 2",
  fp3: "Practice 3",
  sprint_qualifying: "Sprint Qualifying",
  sprint: "Sprint",
  qualifying: "Qualifying",
  race: "Race",
};

export type RaceSession = {
  key: SessionKey;
  label: string;
  dateUtc: string; // ISO 8601 — empty string if TBC
  status: SessionStatus;
};

export type RaceWeekend = {
  slug: string;
  round: number;
  season: number;
  name: string;          // "Monaco Grand Prix"
  shortName: string;     // "Monaco GP"
  circuit: string;       // "Circuit de Monaco"
  circuitId: string;     // "monaco" — stable Ergast/Jolpica circuit identifier
  locality: string;      // "Monte-Carlo"
  country: string;       // "Monaco"
  countryCode: string;   // "MC"
  sessions: RaceSession[];
  isNext: boolean;
  isPast: boolean;
  isCurrent: boolean;    // race weekend is happening right now
};

export type SeasonSchedule = {
  season: number;
  totalRaces: number;
  races: RaceWeekend[];
};

// ─── Jolpica API response types ────────────────────────────────────────────────

type JolpicaRace = {
  season: string;
  round: string;
  raceName: string;
  Circuit: {
    circuitId: string;
    circuitName: string;
    Location: {
      locality: string;
      country: string;
    };
  };
  date: string;        // "2025-05-25"
  time: string;        // "13:00:00Z"
  FirstPractice?: { date: string; time: string };
  SecondPractice?: { date: string; time: string };
  ThirdPractice?: { date: string; time: string };
  SprintQualifying?: { date: string; time: string };
  Sprint?: { date: string; time: string };
  Qualifying?: { date: string; time: string };
};

// ─── Country code map (Jolpica returns country name, not code) ─────────────────

const COUNTRY_TO_CODE: Record<string, string> = {
  Australia: "AU", Bahrain: "BH", "Saudi Arabia": "SA", Japan: "JP",
  China: "CN", USA: "US", "United States": "US", Miami: "US",
  Italy: "IT", Monaco: "MC", Canada: "CA", Spain: "ES",
  Austria: "AT", "United Kingdom": "GB", Hungary: "HU", Belgium: "BE",
  Netherlands: "NL", Singapore: "SG", Azerbaijan: "AZ", Mexico: "MX",
  "São Paulo": "BR", Brazil: "BR", "Las Vegas": "US", Qatar: "QA",
  "Abu Dhabi": "AE", UAE: "AE",
};

function getCountryCode(country: string, locality: string): string {
  return (
    COUNTRY_TO_CODE[country] ??
    COUNTRY_TO_CODE[locality] ??
    country.slice(0, 2).toUpperCase()
  );
}

// ─── Builders ─────────────────────────────────────────────────────────────────

function buildSessionDateUtc(
  sessionObj: { date: string; time: string } | undefined
): string {
  if (!sessionObj?.date) return "";
  const time = sessionObj.time ?? "00:00:00Z";
  const timeClean = /[zZ]|[+-]\d{2}/.test(time) ? time : `${time}Z`;
  return `${sessionObj.date}T${timeClean}`;
}

function buildSessions(race: JolpicaRace): RaceSession[] {
  const pairs: Array<{ key: SessionKey; src: { date: string; time: string } | undefined }> = [
    { key: "fp1", src: race.FirstPractice },
    { key: "fp2", src: race.SecondPractice },
    { key: "fp3", src: race.ThirdPractice },
    { key: "sprint_qualifying", src: race.SprintQualifying },
    { key: "sprint", src: race.Sprint },
    { key: "qualifying", src: race.Qualifying },
    {
      key: "race",
      src: race.date ? { date: race.date, time: race.time ?? "00:00:00Z" } : undefined,
    },
  ];

  return pairs
    .filter(({ src }) => src !== undefined)
    .filter(({ key }) => {
      // Skip fp3 on sprint weekends (replaced by sprint_qualifying)
      if (key === "fp3" && race.SprintQualifying) return false;
      return true;
    })
    .map(({ key, src }) => {
      const dateUtc = buildSessionDateUtc(src);
      return {
        key,
        label: SESSION_LABELS[key],
        dateUtc,
        status: "upcoming" as SessionStatus,
      };
    });
}

function jolpicaToRaceWeekend(race: JolpicaRace): RaceWeekend {
  const round = parseInt(race.round);
  const season = parseInt(race.season);
  const country = race.Circuit.Location.country;
  const locality = race.Circuit.Location.locality;
  const slug = generateRaceSlug(race.raceName, round);
  const sessions = buildSessions(race);

  return {
    slug,
    round,
    season,
    name: race.raceName,
    shortName: race.raceName.replace(" Grand Prix", " GP"),
    circuit: race.Circuit.circuitName,
    circuitId: race.Circuit.circuitId ?? "",
    locality,
    country,
    countryCode: getCountryCode(country, locality),
    sessions,
    isPast: false,
    isCurrent: false,
    isNext: false,
  };
}

/** Recompute time-sensitive flags on every schedule read (not cached with Jolpica fetch). */
export function applyScheduleLiveState(
  schedule: SeasonSchedule,
  now: number = Date.now()
): SeasonSchedule {
  // Find the soonest upcoming race by date, not by array position — the
  // Jolpica feed is normally round-ordered, but a postponed/rescheduled
  // round can leave it out of chronological order. Relying on iteration
  // order + break could then lock onto an already-past round and leave
  // every race's `isNext` false, stranding the homepage with no target.
  let nextRaceRound = 0;
  let nextRaceTime = Infinity;
  for (const race of schedule.races) {
    const raceSession = race.sessions.find((s) => s.key === "race");
    const raceTime = raceSession?.dateUtc
      ? new Date(raceSession.dateUtc).getTime()
      : NaN;
    if (!Number.isNaN(raceTime) && raceTime > now && raceTime < nextRaceTime) {
      nextRaceTime = raceTime;
      nextRaceRound = race.round;
    }
  }

  return {
    ...schedule,
    races: schedule.races.map((race) => {
      const raceSession = race.sessions.find((s) => s.key === "race");
      const raceDate = raceSession?.dateUtc ?? "";
      const raceEndMs = raceDate
        ? new Date(raceDate).getTime() + 120 * 60 * 1000
        : 0;
      const fp1Date = race.sessions.find((s) => s.key === "fp1")?.dateUtc ?? "";

      return {
        ...race,
        isPast: raceDate ? raceEndMs <= now : false,
        isCurrent:
          fp1Date && raceDate
            ? new Date(fp1Date).getTime() <= now && raceEndMs > now
            : false,
        isNext: race.round === nextRaceRound,
        sessions: race.sessions.map((session) => ({
          ...session,
          status: session.dateUtc
            ? getSessionStatus(session.key, session.dateUtc, now)
            : "upcoming",
        })),
      };
    }),
  };
}

// ─── Fetcher ──────────────────────────────────────────────────────────────────

const JOLPICA_BASE = "https://api.jolpi.ca/ergast/f1";

export async function fetchSeasonSchedule(
  season: number | "current" = "current"
): Promise<SeasonSchedule> {
  const url = `${JOLPICA_BASE}/${season}/races.json?limit=30`;

  const res = await fetch(url, {
    next: { revalidate: F1_CACHE.SCHEDULE },
  });

  if (!res.ok) {
    throw new Error(`Jolpica schedule fetch failed: ${res.status}`);
  }

  const json = await res.json();
  const races: JolpicaRace[] =
    json?.MRData?.RaceTable?.Races ?? [];

  const raceWeekends = races.map((r) => jolpicaToRaceWeekend(r));

  return applyScheduleLiveState({
    season: parseInt(races[0]?.season ?? String(season)),
    totalRaces: raceWeekends.length,
    races: raceWeekends,
  });
}

export async function fetchRaceBySlug(
  slug: string
): Promise<RaceWeekend | null> {
  const schedule = await fetchSeasonSchedule("current");
  return schedule.races.find((r) => r.slug === slug) ?? null;
}

export function getNextRace(schedule: SeasonSchedule): RaceWeekend | null {
  return schedule.races.find((r) => r.isNext) ?? null;
}

export function getCurrentRace(schedule: SeasonSchedule): RaceWeekend | null {
  return schedule.races.find((r) => r.isCurrent) ?? null;
}

export function getPreviousRace(schedule: SeasonSchedule): RaceWeekend | null {
  const pastRaces = schedule.races.filter((race) => race.isPast);
  return pastRaces.length > 0 ? pastRaces[pastRaces.length - 1] : null;
}
