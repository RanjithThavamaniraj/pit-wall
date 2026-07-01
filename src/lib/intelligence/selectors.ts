import type { RaceWeekendSummary } from "@/lib/race-summary/types";
import { loadRaceWeekendSummary } from "@/lib/race-summary/loader";
import type {
  IntelligenceEntry,
  IntelligenceSport,
  WeekendIntelligence,
} from "./types";
import {
  DEFAULT_SCORING_CONFIG,
  extractCompetitorWeekends,
  scoreCompetitors,
} from "./scoring";
import { DEFAULT_NORMALIZER_CONFIG, normaliseScores } from "./normalizer";

export {
  DEFAULT_SCORING_CONFIG,
  extractCompetitorWeekends,
  scoreCompetitors,
} from "./scoring";
export {
  DEFAULT_NORMALIZER_CONFIG,
  normaliseScores,
} from "./normalizer";

/** Memoisation caches — keyed by sport. */
let cachedSport: IntelligenceSport | null = null;
let cachedSlugs: string[] | null = null;
let cachedResult: WeekendIntelligence | null = null;

function cacheKey(
  sport: IntelligenceSport,
  slugs: string[]
): { match: boolean } {
  if (cachedSport !== sport) return { match: false };
  if (!cachedSlugs) return { match: false };
  if (cachedSlugs.length !== slugs.length) return { match: false };
  for (let i = 0; i < slugs.length; i++) {
    if (cachedSlugs[i] !== slugs[i]) return { match: false };
  }
  return { match: true };
}

function setCache(
  sport: IntelligenceSport,
  slugs: string[],
  result: WeekendIntelligence
): void {
  cachedSport = sport;
  cachedSlugs = slugs;
  cachedResult = result;
}

/** Clear the memoised result. Useful when summaries are revalidated. */
export function clearIntelligenceCache(): void {
  cachedSport = null;
  cachedSlugs = null;
  cachedResult = null;
}

/** Get entries as a flat list (top favourites + Others) for the UI. */
export function getIntelligenceEntries(
  intelligence: WeekendIntelligence
): IntelligenceEntry[] {
  return intelligence.entries;
}

/** Subset of entries tagged as "favourites" (i.e. excluding the Others bucket). */
export function getWeekendFavourites(
  intelligence: WeekendIntelligence
): IntelligenceEntry[] {
  const othersLabel = DEFAULT_SCORING_CONFIG.othersLabel;
  return intelligence.entries.filter((e) => e.name !== othersLabel);
}

// ─── Fallback playwright ───────────────────────────────────────────────────
// When the season has not produced enough completed weekends yet, we
// fall back to a deterministic shape seeded on the latest summary (if any)
// so the homepage doesn't break out into a hard error. This keeps the
// math honest (still normalised to 100%) and obviously degrades.

function fallbackEntriesFromLatest(
  latest: RaceWeekendSummary | null
): IntelligenceEntry[] {
  const pole = latest?.polePosition?.trim();
  const winner = latest?.raceResults?.[0]?.name.trim();
  const podium = latest?.raceResults?.slice(0, 3) ?? [];

  const scores = new Map<string, number>();
  if (pole) scores.set(pole, (scores.get(pole) ?? 0) + 20);
  if (winner) scores.set(winner, (scores.get(winner) ?? 0) + 100);
  podium.forEach((finisher, i) => {
    const name = finisher.name.trim();
    if (!name) return;
    const base = i === 0 ? 100 : i === 1 ? 75 : 60;
    scores.set(name, (scores.get(name) ?? 0) + base);
  });

  if (scores.size === 0) {
    return [
      { name: "Field", rawScore: 100, percentage: 100 },
    ];
  }

  const sorted = [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, DEFAULT_SCORING_CONFIG.topN);

  const named = sorted.map(([name, score]) => ({ name, rawScore: score }));
  return normaliseScores(
    named.map((n) => ({
      name: n.name,
      rawScore: n.rawScore,
      weekendsCounted: 1,
    })),
    DEFAULT_NORMALIZER_CONFIG,
    DEFAULT_SCORING_CONFIG.topN
  );
}

/**
 * Main entry: build the Weekend Intelligence from the most recent
 * completed race weekends for a sport.
 *
 * The caller supplies the list of slugs (in chronological order,
 * oldest-first, as the schedule maintains them) so this module
 * stays UI/data-source agnostic.
 */
export async function getWeekendIntelligence(
  sport: IntelligenceSport,
  completedWeekendSlugs: string[]
): Promise<WeekendIntelligence> {
  // Most recent first.
  const recent = [...completedWeekendSlugs].reverse().slice(
    0,
    DEFAULT_SCORING_CONFIG.lookbackWeekends
  );
  const sourceSlugs = [...recent];

  if (cacheKey(sport, sourceSlugs).match && cachedResult) {
    return cachedResult;
  }

  const summaries: RaceWeekendSummary[] = [];
  for (const slug of recent) {
    const summary = await loadRaceWeekendSummary(sport, slug);
    if (summary) summaries.push(summary);
  }

  // Not enough finished weekends yet → deterministic fallback.
  if (summaries.length === 0) {
    const fallback = fallbackEntriesFromLatest(null);
    const fallbackResult: WeekendIntelligence = {
      sport,
      generatedAt: new Date().toISOString(),
      sourceSlugs,
      entries: fallback,
    };
    setCache(sport, sourceSlugs, fallbackResult);
    return fallbackResult;
  }

  const slices = summaries.flatMap(extractCompetitorWeekends);
  const scored = scoreCompetitors(slices, DEFAULT_SCORING_CONFIG);
  const entries = normaliseScores(
    scored,
    DEFAULT_NORMALIZER_CONFIG,
    DEFAULT_SCORING_CONFIG.topN
  );

  const result: WeekendIntelligence = {
    sport,
    generatedAt: new Date().toISOString(),
    sourceSlugs,
    entries,
  };

  setCache(sport, sourceSlugs, result);
  return result;
}

/** Force a fresh re-score on the next call. */
export function regenerateWeekendIntelligence(): void {
  clearIntelligenceCache();
}