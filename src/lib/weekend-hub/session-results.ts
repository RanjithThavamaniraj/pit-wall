import type { RaceWeekendSummary } from "@/lib/race-summary/types";
import type { HubSport } from "./types";

/**
 * Compact per-session highlights for the weekend schedule.
 * Sourced from archive summary when available — never invents results.
 */
export type SessionResultHighlight = {
  sessionKey: string;
  winner?: string;
  pole?: string;
  fastestLap?: string;
  /** Up to three names for a mini podium. */
  topThree?: string[];
};

function topThreeNames(
  finishers: RaceWeekendSummary["raceResults"] | undefined
): string[] | undefined {
  if (!finishers?.length) return undefined;
  const names = finishers
    .slice()
    .sort((a, b) => a.position - b.position)
    .slice(0, 3)
    .map((f) => f.name)
    .filter(Boolean);
  return names.length ? names : undefined;
}

/**
 * Map a weekend summary onto session keys used by F1 / MotoGP schedules.
 * Only attaches highlights to sessions that have known archive fields.
 */
export function buildSessionResultHighlights(
  sport: HubSport,
  summary: RaceWeekendSummary | null | undefined
): Map<string, SessionResultHighlight> {
  const map = new Map<string, SessionResultHighlight>();
  if (!summary) return map;

  if (summary.polePosition) {
    const qualiKeys =
      sport === "f1" ? ["qualifying"] : ["q1", "q2", "qualifying"];
    for (const key of qualiKeys) {
      const existing = map.get(key);
      map.set(key, {
        sessionKey: key,
        ...existing,
        pole: summary.polePosition,
      });
    }
  }

  if (summary.raceResults?.length || summary.fastestLap) {
    const topThree = topThreeNames(summary.raceResults);
    map.set("race", {
      sessionKey: "race",
      winner: summary.raceResults?.[0]?.name,
      fastestLap: summary.fastestLap,
      topThree,
    });
  }

  if (summary.sprintResults?.length || summary.sprintWinner) {
    const topThree = topThreeNames(summary.sprintResults);
    map.set("sprint", {
      sessionKey: "sprint",
      winner: summary.sprintWinner ?? summary.sprintResults?.[0]?.name,
      topThree,
    });
  }

  return map;
}

export function highlightForSession(
  highlights: Map<string, SessionResultHighlight>,
  sessionKey: string
): SessionResultHighlight | undefined {
  return highlights.get(sessionKey);
}
