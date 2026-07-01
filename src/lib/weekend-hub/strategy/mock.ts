import type { HubSport, WeekendPhase } from "../types";
import type { StrategyContext, WeekendStrategy } from "./types";
import { buildWeekendStrategy } from "./generator";

const F1_SESSIONS: { key: string; label: string }[] = [
  { key: "fp1", label: "Free Practice 1" },
  { key: "fp2", label: "Free Practice 2" },
  { key: "fp3", label: "Free Practice 3" },
  { key: "qualifying", label: "Qualifying" },
  { key: "race", label: "Race" },
];

const F1_SPRINT_SESSIONS: { key: string; label: string }[] = [
  { key: "fp1", label: "Free Practice 1" },
  { key: "sprint_qualifying", label: "Sprint Qualifying" },
  { key: "sprint", label: "Sprint" },
  { key: "qualifying", label: "Qualifying" },
  { key: "race", label: "Race" },
];

const MOTOGP_SESSIONS: { key: string; label: string }[] = [
  { key: "p1", label: "Practice 1" },
  { key: "p2", label: "Practice 2" },
  { key: "qualifying", label: "Qualifying" },
  { key: "sprint", label: "Sprint" },
  { key: "race", label: "Race" },
];

function sessionsFor(
  sport: HubSport,
  sprint: boolean
): { key: string; label: string }[] {
  if (sport === "motogp") return MOTOGP_SESSIONS;
  return sprint ? F1_SPRINT_SESSIONS : F1_SESSIONS;
}

export function buildMockStrategyContext(
  sport: HubSport,
  slug: string,
  name: string,
  phase: WeekendPhase,
  options: { sprint?: boolean } = {}
): StrategyContext {
  const sprint = options.sprint ?? true;
  return {
    sport,
    weekendSlug: slug,
    weekendName: name,
    phase,
    sessions: sessionsFor(sport, sprint),
    isSprintWeekend: sprint,
  };
}

export function buildMockWeekendStrategy(
  sport: HubSport,
  slug: string,
  name: string,
  phase: WeekendPhase
): WeekendStrategy {
  const context = buildMockStrategyContext(sport, slug, name, phase);
  return buildWeekendStrategy(context);
}