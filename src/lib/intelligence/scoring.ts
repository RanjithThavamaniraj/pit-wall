import type { RaceWeekendSummary } from "@/lib/race-summary/types";
import type {
  CompetitorWeekend,
  ScoringConfig,
} from "./types";

/** Default weights published in the spec. Tunable through `ScoringConfig`. */
export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  victory: 100,
  podium: 75,
  top5: 55,
  top10: 35,
  pole: 20,
  sprintWin: 15,
  sprintPodium: 10,
  dnf: -40,
  retirement: -30,
  consecutivePodium: 15,
  consecutiveTop5: 10,
  lookbackWeekends: 3,
  topN: 5,
  othersLabel: "Others",
};

/** Sentinel position used when a competitor is recorded as a DNF. */
const DNF_POSITION = 99;

/**
 * Convert a podium-finisher-style result row from a `RaceWeekendSummary`
 * into a competitor-weekend slice. Caller controls round/slug.
 */
export function resultRowToCompetitorWeekend(
  row: { position: number; name: string; team?: string },
  round: number,
  slug: string,
  options: {
    sprint?: boolean;
    pole?: boolean;
    dnf?: boolean;
    qualifyingPosition?: number | null;
    sprintPosition?: number | null;
  } = {}
): CompetitorWeekend {
  const isDnf = options.dnf ?? row.position >= DNF_POSITION;
  return {
    name: row.name,
    team: row.team,
    racePosition: isDnf ? null : row.position,
    sprintPosition: options.sprintPosition ?? null,
    qualifyingPosition: options.qualifyingPosition ?? null,
    pole: options.pole,
    dnf: isDnf,
    round,
    slug,
  };
}

/**
 * Build per-competitor weekend slices from a `RaceWeekendSummary`.
 *
 * The summary in this codebase carries the podium finishers for the
 * race (and the sprint, if applicable), plus the pole-sitter name.
 * We derive qualifying position only for the pole-sitter (P1).
 *
 * The weekend counts as a form slice for every competitor who appeared
 * in the recorded race results or sprint results.
 */
export function extractCompetitorWeekends(
  summary: RaceWeekendSummary
): CompetitorWeekend[] {
  const out: CompetitorWeekend[] = [];
  const pole = summary.polePosition?.trim();

  for (const finisher of summary.raceResults ?? []) {
    out.push(
      resultRowToCompetitorWeekend(
        finisher,
        summary.round,
        summary.slug,
        {
          pole: Boolean(pole) && finisher.name.trim() === pole,
          qualifyingPosition:
            Boolean(pole) && finisher.name.trim() === pole ? 1 : null,
        }
      )
    );
  }

  for (const finisher of summary.sprintResults ?? []) {
    out.push(
      resultRowToCompetitorWeekend(
        finisher,
        summary.round,
        summary.slug,
        {
          sprint: true,
          sprintPosition: finisher.position,
          pole: Boolean(pole) && finisher.name.trim() === pole,
        }
      )
    );
  }

  return out;
}

function consecutivePodiumsAcross(
  byName: Map<string, CompetitorWeekend[]>
): Map<string, number> {
  const out = new Map<string, number>();
  for (const [name, weekends] of byName) {
    // Weekends sorted oldest-first within the lookback window.
    const sorted = [...weekends].sort((a, b) => a.round - b.round);
    let run = 0;
    let maxRun = 0;
    for (const w of sorted) {
      const pos = w.racePosition;
      if (pos !== null && pos <= 3) {
        run += 1;
        if (run > maxRun) maxRun = run;
      } else {
        run = 0;
      }
    }
    out.set(name, maxRun);
  }
  return out;
}

function consecutiveTop5Across(
  byName: Map<string, CompetitorWeekend[]>
): Map<string, number> {
  const out = new Map<string, number>();
  for (const [name, weekends] of byName) {
    const sorted = [...weekends].sort((a, b) => a.round - b.round);
    let run = 0;
    let maxRun = 0;
    for (const w of sorted) {
      const pos = w.racePosition;
      if (pos !== null && pos <= 5) {
        run += 1;
        if (run > maxRun) maxRun = run;
      } else {
        run = 0;
      }
    }
    out.set(name, maxRun);
  }
  return out;
}

function scoreSingle(weekend: CompetitorWeekend, config: ScoringConfig): number {
  let score = 0;
  const pos = weekend.racePosition;
  if (pos === null) {
    score += config.dnf;
    return score;
  }

  if (pos === 1) score += config.victory;
  if (pos <= 3) score += config.podium;
  if (pos <= 5) score += config.top5;
  if (pos <= 10) score += config.top10;

  if (weekend.pole) score += config.pole;

  const sprintPos = weekend.sprintPosition;
  if (typeof sprintPos === "number" && sprintPos !== null) {
    if (sprintPos === 1) score += config.sprintWin;
    if (sprintPos <= 3) score += config.sprintPodium;
  }

  if (weekend.dnf) score += config.retirement;

  return score;
}

export type ScoredCompetitor = {
  name: string;
  team?: string;
  rawScore: number;
  weekendsCounted: number;
};

/**
 * Score a population of competitor-weekend slices.
 *
 * Recent form only — caller is expected to pass only the last
 * `lookbackWeekends` of weekends, but this function will also trim
 * per-competitor to respect the configured lookback just in case.
 */
export function scoreCompetitors(
  slices: CompetitorWeekend[],
  config: ScoringConfig = DEFAULT_SCORING_CONFIG
): ScoredCompetitor[] {
  // Normalise name keys to avoid whitespace-induced duplicates.
  const byName = new Map<string, CompetitorWeekend[]>();
  const teamByName = new Map<string, string | undefined>();

  for (const slice of slices) {
    const name = slice.name.trim();
    if (!name) continue;
    const bucket = byName.get(name) ?? [];
    bucket.push({ ...slice, name });
    byName.set(name, bucket);
    teamByName.set(name, slice.team ?? teamByName.get(name));
  }

  const podiumRuns = consecutivePodiumsAcross(byName);
  const top5Runs = consecutiveTop5Across(byName);

  const scored: ScoredCompetitor[] = [];
  for (const [name, weekends] of byName) {
    const sorted = [...weekends].sort((a, b) => b.round - a.round);
    const window = sorted.slice(0, config.lookbackWeekends);

    let raw = 0;
    for (const w of window) {
      raw += scoreSingle(w, config);
    }

    const podiumRun = podiumRuns.get(name) ?? 0;
    const top5Run = top5Runs.get(name) ?? 0;
    if (podiumRun >= 2) raw += config.consecutivePodium;
    if (top5Run >= 2) raw += config.consecutiveTop5;

    scored.push({
      name,
      team: teamByName.get(name),
      rawScore: raw,
      weekendsCounted: window.length,
    });
  }

  scored.sort((a, b) => b.rawScore - a.rawScore || a.name.localeCompare(b.name));
  return scored;
}