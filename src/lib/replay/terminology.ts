import type { Championship } from "@/lib/live";
import type { ReplaySessionKind } from "@/lib/replay/types";

/**
 * Sport-aware copy for the shared Replay Player.
 * Differences come only from championship / session metadata — not separate UIs.
 */
export function replaySportLabel(sport: Championship): string {
  return sport === "motogp" ? "MotoGP" : "Formula 1";
}

export function replayCompetitorLabel(
  sport: Championship,
  plural = true
): string {
  if (sport === "motogp") return plural ? "riders" : "rider";
  return plural ? "drivers" : "driver";
}

export function replaySessionLabel(kind: ReplaySessionKind): string {
  switch (kind) {
    case "practice":
      return "Practice";
    case "qualifying":
      return "Qualifying";
    case "sprint":
      return "Sprint";
    case "race":
    default:
      return "Race";
  }
}

export function replaySectionEyebrow(sport: Championship): string {
  return `${replaySportLabel(sport)} Replay`;
}

export function replaySectionTitle(sessionKind: ReplaySessionKind): string {
  const session = replaySessionLabel(sessionKind);
  return session === "Race" ? "Relive the race" : `Relive ${session}`;
}

export function replaySectionDescription(sport: Championship): string {
  const competitors = replayCompetitorLabel(sport);
  return `Scrub lap by lap, watch the leading ${competitors}, and see flags and pit stops as they happened — on the same circuit map used for live timing.`;
}
