import type {
  WeekendContext,
  WeekendContextInput,
  WeekendContextSport,
} from "./types";
import { buildWeekendContext } from "./generator";

const MOCK_F1_COMPLETED_SLUGS = [
  "mock-monaco-gp-r1",
  "mock-spanish-gp-r2",
  "mock-canadian-gp-r3",
];

const MOCK_MOTOGP_COMPLETED_SLUGS = [
  "mock-mugello-r1",
  "mock-assen-r2",
  "mock-sachsenring-r3",
];

function mockSlugsFor(sport: WeekendContextSport): string[] {
  return sport === "motogp"
    ? [...MOCK_MOTOGP_COMPLETED_SLUGS]
    : [...MOCK_F1_COMPLETED_SLUGS];
}

/** Build a deterministic `WeekendContextInput` suitable for tests/demos. */
export function buildMockWeekendContextInput(
  sport: WeekendContextSport,
  options: {
    weekendSlug?: string;
    weekendName?: string;
    completedWeekendSlugs?: string[];
  } = {}
): WeekendContextInput {
  const slug =
    options.weekendSlug ??
    (sport === "motogp" ? "mock-silverstone-gp" : "mock-silverstone-gp");
  const name =
    options.weekendName ??
    (sport === "motogp" ? "British Grand Prix" : "British Grand Prix");
  const completedWeekendSlugs =
    options.completedWeekendSlugs ?? mockSlugsFor(sport);

  return {
    sport,
    weekendSlug: slug,
    weekendName: name,
    phase: "upcoming",
    completedWeekendSlugs,
  };
}

/**
 * Build a deterministic mock `WeekendContext` without touching disk.
 *
 * The generator already degrades gracefully when local summaries are
 * unavailable, so this is a thin convenience wrapper over the real
 * generator seeded with mock completed slugs. Engine behaviours are
 * preserved — no parallel mock implementations are introduced.
 */
export async function buildMockWeekendContext(
  sport: WeekendContextSport,
  options: {
    weekendSlug?: string;
    weekendName?: string;
    completedWeekendSlugs?: string[];
  } = {}
): Promise<WeekendContext> {
  const input = buildMockWeekendContextInput(sport, options);
  return buildWeekendContext(input);
}