import type { RaceWeekendSummary } from "@/lib/race-summary/types";
import type {
  DriverIntelligenceBundle,
  DriverIntelligenceContext,
  DriverIntelligenceSport,
} from "./types";
import { buildDriverIntelligence, DEFAULT_DRIVER_INTELLIGENCE_CONFIG } from "./generator";

// ─── Deterministic synthetic summaries ───────────────────────────────────────
// Used by `buildMockDriverIntelligence` when no real result JSON is available
// (e.g. tests, demos). Produces stable, realistic-shaped form so the engine
// still returns differentiated profiles without external data.

const F1_GRID: { name: string; team: string }[] = [
  { name: "Lando Norris", team: "McLaren" },
  { name: "Oscar Piastri", team: "McLaren" },
  { name: "Max Verstappen", team: "Red Bull Racing" },
  { name: "Charles Leclerc", team: "Ferrari" },
  { name: "George Russell", team: "Mercedes" },
  { name: "Lewis Hamilton", team: "Ferrari" },
  { name: "Andrea Antonelli", team: "Mercedes" },
  { name: "Lando Stroll", team: "Aston Martin" },
];

const MOTOGP_GRID: { name: string; team: string }[] = [
  { name: "Francesco Bagnaia", team: "Ducati Lenovo Team" },
  { name: "Marc Marquez", team: "Ducati Lenovo Team" },
  { name: "Jorge Martin", team: "Aprilia Racing" },
  { name: "Pedro Acosta", team: "Red Bull GASGAS Tech3" },
  { name: "Enea Bastianini", team: "Ducati Lenovo Team" },
  { name: "Maverick Vinales", team: "Aprilia Racing" },
];

function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

function pseudoShuffle<T>(arr: T[], seed: number): T[] {
  const out = [...arr];
  let s = seed | 0;
  for (let i = out.length - 1; i > 0; i--) {
    s = Math.imul(s ^ (s << 13), 0x85ebca6b) | 0;
    const j = Math.abs(s) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function buildMockSummary(
  sport: DriverIntelligenceSport,
  slug: string,
  round: number,
  name: string,
  season: number
): RaceWeekendSummary {
  const grid = sport === "motogp" ? MOTOGP_GRID : F1_GRID;
  const seed = hashSeed(`${sport}:${slug}`);
  const order = pseudoShuffle(grid, seed);
  const podium = order.slice(0, 3);
  const pole = podium[0].name;
  const sprint = pseudoShuffle(grid, seed ^ 0x9e3779b9).slice(0, 3);

  return {
    sport,
    slug,
    round,
    season,
    name,
    shortName: name.split(" ").slice(-2).join(" "),
    raceResults: podium.map((entry, i) => ({
      position: i + 1,
      name: entry.name,
      team: entry.team,
    })),
    sprintResults: sprint.map((entry, i) => ({
      position: i + 1,
      name: entry.name,
      team: entry.team,
    })),
    polePosition: pole,
    fastestLap: podium[1].name,
    sprintWinner: sprint[0].name,
    statistics: [],
  };
}

const F1_MOCK_WEEKENDS: { slug: string; round: number; name: string }[] = [
  { slug: "mock-monaco-gp-r1", round: 1, name: "Monaco Grand Prix" },
  { slug: "mock-spanish-gp-r2", round: 2, name: "Spanish Grand Prix" },
  { slug: "mock-canadian-gp-r3", round: 3, name: "Canadian Grand Prix" },
];

const MOTOGP_MOCK_WEEKENDS: {
  slug: string;
  round: number;
  name: string;
}[] = [
  { slug: "mock-mugello-r1", round: 1, name: "GP of Italy" },
  { slug: "mock-assen-r2", round: 2, name: "Dutch TT" },
  { slug: "mock-sachsenring-r3", round: 3, name: "German GP" },
];

function resolveMockWeekends(
  sport: DriverIntelligenceSport
): RaceWeekendSummary[] {
  const source = sport === "motogp" ? MOTOGP_MOCK_WEEKENDS : F1_MOCK_WEEKENDS;
  const recent = source
    .slice()
    .reverse()
    .slice(0, DEFAULT_DRIVER_INTELLIGENCE_CONFIG.lookbackWeekends);
  const season = new Date().getFullYear();
  return recent.map((w) =>
    buildMockSummary(sport, w.slug, w.round, w.name, season)
  );
}

/** Build a deterministic mock bundle without touching disk. */
export function buildMockDriverIntelligence(
  sport: DriverIntelligenceSport,
  options: { driverName?: string; slugs?: string[] } = {}
): DriverIntelligenceBundle {
  const sourceSlugs =
    options.slugs ??
    (sport === "motogp"
      ? MOTOGP_MOCK_WEEKENDS
      : F1_MOCK_WEEKENDS
    ).map((w) => w.slug);

  const summaries = resolveMockWeekends(sport);

  return buildDriverIntelligence(
    summaries,
    sport,
    sourceSlugs,
    options.driverName,
    DEFAULT_DRIVER_INTELLIGENCE_CONFIG
  );
}

export function buildMockDriverIntelligenceContext(
  sport: DriverIntelligenceSport,
  options: { driverName?: string; slugs?: string[] } = {}
): DriverIntelligenceContext {
  const slugs =
    options.slugs ??
    (sport === "motogp"
      ? MOTOGP_MOCK_WEEKENDS
      : F1_MOCK_WEEKENDS
    ).map((w) => w.slug);
  return {
    sport,
    completedWeekendSlugs: slugs,
    driverName: options.driverName,
  };
}