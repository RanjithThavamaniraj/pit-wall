import type { RaceWeekendSummary } from "@/lib/race-summary/types";
import { loadRaceWeekendSummary } from "@/lib/race-summary/loader";
import type {
  DriverIntelligenceBundle,
  DriverIntelligenceContext,
  DriverIntelligenceProfile,
} from "./types";
import {
  DEFAULT_DRIVER_INTELLIGENCE_CONFIG,
  buildDriverIntelligence,
} from "./generator";

export {
  DEFAULT_DRIVER_INTELLIGENCE_CONFIG,
  buildDriverIntelligence,
} from "./generator";

// ─── Pure selection helpers over a built bundle ─────────────────────────────

/** Look up a single profile by display name (case-insensitive trim). */
export function getProfileByName(
  bundle: DriverIntelligenceBundle,
  name: string
): DriverIntelligenceProfile | undefined {
  const target = name.trim().toLowerCase();
  return bundle.profiles.find((p) => p.name.toLowerCase() === target);
}

/** Look up a single profile by its stable `id`. */
export function getProfileById(
  bundle: DriverIntelligenceBundle,
  id: string
): DriverIntelligenceProfile | undefined {
  return bundle.profiles.find((p) => p.id === id);
}

/** Profiles whose momentum rating is at or above the given threshold (default 75). */
export function getHighMomentumProfiles(
  bundle: DriverIntelligenceBundle,
  threshold = 75
): DriverIntelligenceProfile[] {
  return bundle.profiles.filter((p) => p.ratings.momentum >= threshold);
}

/** The strongest profile by overall average of the six ratings. */
export function getTopProfile(
  bundle: DriverIntelligenceBundle
): DriverIntelligenceProfile | undefined {
  if (bundle.profiles.length === 0) return undefined;
  return [...bundle.profiles].sort((a, b) => {
    const avgA =
      (a.ratings.momentum +
        a.ratings.qualifying +
        a.ratings.racePace +
        a.ratings.consistency +
        a.ratings.overtaking +
        a.ratings.tyreManagement) /
      6;
    const avgB =
      (b.ratings.momentum +
        b.ratings.qualifying +
        b.ratings.racePace +
        b.ratings.consistency +
        b.ratings.overtaking +
        b.ratings.tyreManagement) /
      6;
    return avgB - avgA;
  })[0];
}

// ─── Resilient summary loader ───────────────────────────────────────────────
// Walks backwards through completed slugs, skipping weekends with no local
// result JSON, until `lookbackWeekends` valid summaries are collected (or
// the slug list is exhausted). Same resilience strategy as the Weekend
// Intelligence engine so partial local coverage doesn't produce empty output.

async function loadValidSummaries(
  context: DriverIntelligenceContext
): Promise<{ summaries: RaceWeekendSummary[]; sourceSlugs: string[] }> {
  const target = DEFAULT_DRIVER_INTELLIGENCE_CONFIG.lookbackWeekends;
  const ordered = [...context.completedWeekendSlugs].reverse();
  const summaries: RaceWeekendSummary[] = [];
  const sourceSlugs: string[] = [];

  for (const slug of ordered) {
    if (summaries.length >= target) break;
    const summary = await loadRaceWeekendSummary(context.sport, slug);
    if (!summary) continue;
    summaries.push(summary);
    sourceSlugs.push(slug);
  }

  return { summaries, sourceSlugs };
}

/** Convenience synchronous wrapper that builds from already-loaded summaries. */
export function generateDriverIntelligence(
  summaries: RaceWeekendSummary[],
  sport: DriverIntelligenceContext["sport"],
  sourceSlugs: string[],
  driverName?: string
): DriverIntelligenceBundle {
  return buildDriverIntelligence(
    summaries,
    sport,
    sourceSlugs,
    driverName,
    DEFAULT_DRIVER_INTELLIGENCE_CONFIG
  );
}

/** Async entry that performs resilient summary loading then builds. */
export async function fetchDriverIntelligence(
  context: DriverIntelligenceContext
): Promise<DriverIntelligenceBundle> {
  const { summaries, sourceSlugs } = await loadValidSummaries(context);
  return buildDriverIntelligence(
    summaries,
    context.sport,
    sourceSlugs,
    context.driverName,
    DEFAULT_DRIVER_INTELLIGENCE_CONFIG
  );
}