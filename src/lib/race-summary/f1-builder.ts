import { F1_CACHE } from "@/lib/cache/f1";
import { fetchRaceBySlug } from "@/lib/schedule";
import { parseRoundFromSlug } from "@/lib/utils";
import { slugifyPerson } from "@/lib/race-summary/branding";
import type {
  ChampionshipRow,
  PodiumFinisher,
  RaceWeekendSummary,
  StandingsMovement,
  WeekendStat,
  WeekendTimelineEntry,
} from "@/lib/race-summary/types";

const JOLPICA_BASE = "https://api.jolpi.ca/ergast/f1";

type JolpicaDriver = {
  givenName: string;
  familyName: string;
  nationality: string;
  permanentNumber?: string;
};

type JolpicaConstructor = {
  name: string;
};

type JolpicaResult = {
  position: string;
  number: string;
  status: string;
  laps: string;
  Driver: JolpicaDriver;
  Constructor: JolpicaConstructor;
  Time?: { time: string; millis: string };
  FastestLap?: { rank: string; lap: string; Time?: { time: string } };
};

type JolpicaQualifyingResult = {
  position: string;
  Driver: JolpicaDriver;
  Q1?: string;
  Q2?: string;
  Q3?: string;
};

const NATIONALITY_TO_CODE: Record<string, string> = {
  American: "US",
  Argentine: "AR",
  Australian: "AU",
  Austrian: "AT",
  Belgian: "BE",
  Brazilian: "BR",
  British: "GB",
  Canadian: "CA",
  Chinese: "CN",
  Danish: "DK",
  Dutch: "NL",
  Finnish: "FI",
  French: "FR",
  German: "DE",
  Italian: "IT",
  Japanese: "JP",
  Mexican: "MX",
  Monegasque: "MC",
  "New Zealander": "NZ",
  Spanish: "ES",
  Swiss: "CH",
  Thai: "TH",
};

async function jolpicaFetch<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${JOLPICA_BASE}/${path}`, {
      next: { revalidate: F1_CACHE.SCHEDULE },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function driverName(driver: JolpicaDriver): string {
  return `${driver.givenName} ${driver.familyName}`.trim();
}

function nationalityToCode(nationality: string): string | undefined {
  return NATIONALITY_TO_CODE[nationality];
}

function resultToFinisher(result: JolpicaResult): PodiumFinisher {
  const name = driverName(result.Driver);
  return {
    position: parseInt(result.position, 10),
    name,
    team: result.Constructor.name,
    number: result.Driver.permanentNumber ?? result.number,
    nationality: result.Driver.nationality,
    countryCode: nationalityToCode(result.Driver.nationality),
    imageSlug: slugifyPerson(name),
  };
}

function isDnf(status: string): boolean {
  const normalized = status.toLowerCase();
  return (
    !normalized.includes("finished") && !/^\+\d+ lap/.test(normalized)
  );
}

function buildTimelineFromWeekend(
  sessions: { label: string; key: string }[],
  isPast: boolean
): WeekendTimelineEntry[] {
  const dayForKey: Record<string, string> = {
    fp1: "Friday",
    fp2: "Friday",
    fp3: "Saturday",
    sprint_qualifying: "Saturday",
    qualifying: "Saturday",
    sprint: "Saturday",
    race: "Sunday",
  };

  return sessions.map((session) => ({
    day: dayForKey[session.key] ?? "Weekend",
    label: session.label,
    completed: isPast,
  }));
}

function buildWeekendReport(
  raceName: string,
  winner: string,
  pole: string | undefined,
  runnerUp: string | undefined
): string {
  const poleLine = pole
    ? pole === winner
      ? `${winner} converted pole position into victory`
      : `${pole} took pole, but ${winner} took the win`
    : `${winner} won the ${raceName}`;

  const gapLine = runnerUp ? ` ahead of ${runnerUp}.` : ".";

  return `${poleLine}${gapLine}`;
}

function movementForPosition(
  current: number,
  previous?: number
): StandingsMovement {
  if (previous === undefined) return "unchanged";
  if (current < previous) return "up";
  if (current > previous) return "down";
  return "unchanged";
}

async function fetchStandingsList(
  season: number,
  round: number,
  type: "driver" | "constructor"
): Promise<ChampionshipRow[]> {
  const path =
    type === "driver"
      ? `${season}/${round}/driverStandings.json`
      : `${season}/${round}/constructorStandings.json`;

  const json = await jolpicaFetch<{
    MRData?: {
      StandingsTable?: {
        StandingsLists?: Array<{
          DriverStandings?: Array<{
            position: string;
            points: string;
            Driver: JolpicaDriver;
            Constructors?: JolpicaConstructor[];
          }>;
          ConstructorStandings?: Array<{
            position: string;
            points: string;
            Constructor: JolpicaConstructor;
          }>;
        }>;
      };
    };
  }>(path);

  const list = json?.MRData?.StandingsTable?.StandingsLists?.[0];
  if (!list) return [];

  if (type === "driver" && list.DriverStandings) {
    return list.DriverStandings.map((row) => {
      const name = driverName(row.Driver);
      return {
        position: parseInt(row.position, 10),
        name,
        team: row.Constructors?.[0]?.name,
        points: parseFloat(row.points),
        imageSlug: slugifyPerson(name),
      };
    });
  }

  if (type === "constructor" && list.ConstructorStandings) {
    return list.ConstructorStandings.map((row) => ({
      position: parseInt(row.position, 10),
      name: row.Constructor.name,
      points: parseFloat(row.points),
    }));
  }

  return [];
}

async function fetchStandingsRows(
  season: number,
  round: number,
  type: "driver" | "constructor"
): Promise<ChampionshipRow[]> {
  const [current, previous] = await Promise.all([
    fetchStandingsList(season, round, type),
    round > 1 ? fetchStandingsList(season, round - 1, type) : Promise.resolve([]),
  ]);

  const previousByName = new Map(
    previous.map((row) => [row.name, row.position])
  );

  return current.slice(0, 5).map((row) => ({
    ...row,
    movement: movementForPosition(row.position, previousByName.get(row.name)),
  }));
}

function formatGap(winnerMillis: string, runnerUpMillis: string): string {
  const gapMs = parseInt(runnerUpMillis, 10) - parseInt(winnerMillis, 10);
  if (!Number.isFinite(gapMs) || gapMs <= 0) return "0.000s";
  const seconds = gapMs / 1000;
  return `${seconds.toFixed(3)}s`;
}

export async function buildF1RaceWeekendSummary(
  slug: string
): Promise<RaceWeekendSummary | null> {
  const round = parseRoundFromSlug(slug);
  if (!round) return null;

  const weekend = await fetchRaceBySlug(slug);
  if (!weekend?.isPast) return null;

  const season = weekend.season;
  const resultsJson = await jolpicaFetch<{
    MRData?: {
      RaceTable?: {
        Races?: Array<{
          Results?: JolpicaResult[];
        }>;
      };
    };
  }>(`${season}/${round}/results.json`);

  const race = resultsJson?.MRData?.RaceTable?.Races?.[0];
  const results = race?.Results ?? [];
  if (results.length === 0) return null;

  const qualifyingJson = await jolpicaFetch<{
    MRData?: {
      RaceTable?: {
        Races?: Array<{
          QualifyingResults?: JolpicaQualifyingResult[];
        }>;
      };
    };
  }>(`${season}/${round}/qualifying.json`);

  const qualifying =
    qualifyingJson?.MRData?.RaceTable?.Races?.[0]?.QualifyingResults;
  const poleResult = qualifying?.[0];
  const poleName = poleResult ? driverName(poleResult.Driver) : undefined;
  const poleTime =
    poleResult?.Q3 ?? poleResult?.Q2 ?? poleResult?.Q1 ?? undefined;

  const sprintJson = await jolpicaFetch<{
    MRData?: {
      RaceTable?: {
        Races?: Array<{
          SprintResults?: JolpicaResult[];
        }>;
      };
    };
  }>(`${season}/${round}/sprint.json`);

  const sprintResults =
    sprintJson?.MRData?.RaceTable?.Races?.[0]?.SprintResults ?? [];
  const sprintWinner = sprintResults[0]
    ? driverName(sprintResults[0].Driver)
    : undefined;

  const raceResults = results
    .filter((result) => {
      const position = parseInt(result.position, 10);
      return position >= 1 && position <= 3;
    })
    .map(resultToFinisher);

  const fastestLapResult = results.find(
    (result) => result.FastestLap?.rank === "1"
  );
  const fastestLap = fastestLapResult
    ? driverName(fastestLapResult.Driver)
    : undefined;

  const winner = results[0];
  const runnerUp = results[1];
  const winnerName = winner ? driverName(winner.Driver) : "Winner";
  const runnerUpName = runnerUp ? driverName(runnerUp.Driver) : undefined;

  const dnfCount = results.filter((result) => isDnf(result.status)).length;
  const winningMargin =
    winner?.Time?.time && runnerUp?.Time?.time
      ? `+${formatGap(winner.Time.millis, runnerUp.Time.millis)}`
      : undefined;

  const [driversChampionship, constructorsChampionship] = await Promise.all([
    fetchStandingsRows(season, round, "driver"),
    fetchStandingsRows(season, round, "constructor"),
  ]);

  const statistics: WeekendStat[] = [
    winner?.Time?.time
      ? { label: "Race duration", value: winner.Time.time, highlight: true }
      : null,
    winner?.laps ? { label: "Laps", value: winner.laps } : null,
    { label: "DNFs", value: String(dnfCount) },
    fastestLapResult?.FastestLap?.Time?.time
      ? {
          label: "Fastest lap",
          value: `${fastestLapResult.FastestLap.Time.time} · ${fastestLap}`,
        }
      : fastestLap
        ? { label: "Fastest lap", value: fastestLap }
        : null,
    poleTime && poleName
      ? { label: "Pole time", value: `${poleTime} · ${poleName}` }
      : null,
    winningMargin
      ? { label: "Winning margin", value: winningMargin }
      : null,
  ].filter((stat): stat is WeekendStat => stat !== null);

  return {
    sport: "f1",
    slug,
    round,
    season,
    name: weekend.name,
    shortName: weekend.shortName,
    raceResults,
    polePosition: poleName,
    fastestLap,
    sprintWinner,
    driversChampionship,
    constructorsChampionship,
    statistics,
    timeline: buildTimelineFromWeekend(
      weekend.sessions.map((session) => ({
        label: session.label,
        key: session.key,
      })),
      true
    ),
    weekendReport: buildWeekendReport(
      weekend.name,
      winnerName,
      poleName,
      runnerUpName
    ),
  };
}
