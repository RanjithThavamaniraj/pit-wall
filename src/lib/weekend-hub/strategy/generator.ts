import type { HubSport, WeekendPhase } from "../types";
import type {
  F1Compound,
  MotoGpCompound,
  PitStrategy,
  RaceFactors,
  RaceStrategy,
  StrategyConfidence,
  StrategyContext,
  TyreStrategy,
  WatchForItem,
  WeatherForecast,
  WeekendStrategy,
} from "./types";

function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

function pick<T>(pool: readonly T[], seed: number, salt = 0): T {
  return pool[(seed + salt) % pool.length];
}

function weekendHash(context: StrategyContext): number {
  return hashSeed(
    `${context.sport}:${context.weekendSlug}:${context.phase}`
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Static pools the deterministic generator draws from.
// ─────────────────────────────────────────────────────────────────────────────

const F1_STRATEGY_SHAPES: {
  name: string;
  description: string;
  stops: number;
  confidence: StrategyConfidence;
}[] = [
  {
    name: "One-stop hard-focused",
    description:
      "Track position matters more than pace here; the field spreads out quickly and a single well-timed stop onto the hard keeps the door open without surrendering track position.",
    stops: 1,
    confidence: "high",
  },
  {
    name: "Two-stop medium-leaning",
    description:
      "The medium holds together comfortably on a full stint, and a two-stop onto the soft late opens the door to undercut the front-runners if the early laps are clean.",
    stops: 2,
    confidence: "medium",
  },
  {
    name: "Two-stop soft/aggressive",
    description:
      "Degradation forces a two-stop, and the softest compound is fit enough over a short middle stint to attack into the final third.",
    stops: 2,
    confidence: "medium",
  },
  {
    name: "Neutral one-stop, weather reactive",
    description:
      "A one-stop base looks most likely, but the strategy has to leave a reactive branch for a late weather change.",
    stops: 1,
    confidence: "low",
  },
];

const MOTOGP_STRATEGY_SHAPES: {
  name: string;
  description: string;
  stops: number;
  confidence: StrategyConfidence;
}[] = [
  {
    name: "Late-brake racer, soft rear",
    description:
      "Outright rear grip is the deciding currency here; the soft rear gives a usable early window and rewards those who can manage degradation through the second half of the race.",
    stops: 0,
    confidence: "high",
  },
  {
    name: "Balanced medium rear, build the race",
    description:
      "With the field close on long-run pace, the medium rear rewards riders who set their own rhythm and avoid being forced into conserving early.",
    stops: 0,
    confidence: "medium",
  },
  {
    name: "Hard rear, attack late",
    description:
      "Degradation punishes early aggression here; the hard rear builds pressure through the middle stint and pays off in the final five laps.",
    stops: 0,
    confidence: "low",
  },
];

const WATCH_FOR_TEMPLATES: {
  title: string;
  detail: string;
  importance: StrategyConfidence;
}[] = [
  {
    title: "Watch for an early undercut",
    detail:
      "The first car to blink onto fresh rubber carries a real advantage here — track position is hard to recover against clean air.",
    importance: "medium",
  },
  {
    title: "Rain may influence strategy",
    detail:
      "Showers are inside the race window; any team that mediates the gamble could inherit track position if the timing lands.",
    importance: "medium",
  },
  {
    title: "Medium tyre expected to last longer",
    detail:
      "Across the simulation the medium is holding its pace deep into the second half, opening the door to a longer middle stint.",
    importance: "high",
  },
  {
    title: "Late Safety Car could change the podium fight",
    detail:
      "A neutralisation inside the final third would bunched the field up and reset the undercut calculus in one lap.",
    importance: "medium",
  },
  {
    title: "Hard compound warms up slowly here",
    detail:
      "The hard needs a full out-lap to switch on; expect drivers to skip the first undercut window and look later instead.",
    importance: "low",
  },
  {
    title: "Rear tyre management decides the last five laps",
    detail:
      "Those who save the rear early will be the ones who can attack when degradation bites with a handful of laps to go.",
    importance: "high",
  },
  {
    title: "Pit exit is narrow — clean stops matter",
    detail:
      "A slow release costs more than usual here; crews will be conservative early before pushing as track conditions evolve.",
    importance: "low",
  },
  {
    title: "Track limits will force a long-lap rethink",
    detail:
      "Track-limits strikes will pile up under braking; expect race direction to start enforcing long-lap penalties if it does.",
    importance: "medium",
  },
];

const F1_COMPOUND_OPTIONS: F1Compound[] = [
  "soft",
  "medium",
  "hard",
  "intermediate",
  "wet",
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function pickConfidence(
  seed: number,
  phase: WeekendPhase,
  base: StrategyConfidence
): StrategyConfidence {
  if (phase === "cancelled") return "low";
  if (phase === "live") {
    // Live strategy is firmer because the team has live data.
    return base === "low" ? "medium" : base;
  }
  return base;
}

function buildPitStrategy(
  seed: number,
  expectedStops: number,
  raceLaps: number
): PitStrategy | undefined {
  if (expectedStops <= 0) return undefined;

  const windows: PitStrategy["windows"] = [];
  const stintBorders = expectedStops === 1
    ? [Math.round(raceLaps * 0.45)]
    : expectedStops === 2
    ? [Math.round(raceLaps * 0.3), Math.round(raceLaps * 0.65)]
    : [
        Math.round(raceLaps * 0.25),
        Math.round(raceLaps * 0.5),
        Math.round(raceLaps * 0.75),
      ];

  for (let i = 0; i < stintBorders.length; i++) {
    const pivot = stintBorders[i];
    windows.push({
      stint: i + 2,
      fromLap: Math.max(2, pivot - 3),
      toLap: pivot + 5,
      compound: pick(F1_COMPOUND_OPTIONS, seed, i + 2),
    });
  }

  return {
    expectedStops,
    windows,
    undercutAdvantageSec: +(pick([0.4, 0.6, 0.9, 1.2], seed, 1)).toFixed(2),
    overcutAdvantageSec: +(pick([0.2, 0.4, 0.8], seed, 3)).toFixed(2),
  };
}

function buildF1TyreStrategy(seed: number): TyreStrategy {
  return {
    sport: "f1",
    openingCompound: pick(
      ["soft", "medium", "hard"] as F1Compound[],
      seed,
      0
    ),
    middleCompound: pick(
      ["medium", "hard"] as F1Compound[],
      seed,
      1
    ),
    finalCompound: pick(["soft", "medium", "hard"] as F1Compound[], seed, 2),
  };
}

function buildMotoGpTyreStrategy(seed: number): TyreStrategy {
  return {
    sport: "motogp",
    frontTyre: pick(
      ["soft", "medium", "hard"] as MotoGpCompound[],
      seed,
      0
    ),
    rearTyre: pick(
      ["soft", "medium", "hard"] as MotoGpCompound[],
      seed,
      1
    ),
    tyreRisk: pick(
      ["conservative", "balanced", "aggressive"] as const,
      seed,
      2
    ),
  };
}

function buildWeatherForecast(
  seed: number,
  phase: WeekendPhase
): WeatherForecast {
  const rainIndex = seed % 5;
  const rainProbability =
    phase === "cancelled"
      ? 0.85
      : [0.05, 0.15, 0.3, 0.55, 0.8][rainIndex];

  const evolutionByPhase: Record<
    WeekendPhase,
    WeatherForecast["trackEvolution"]
  > = {
    upcoming: pick(["improving", "stable", "degrading"] as const, seed, 1),
    live: pick(["stable", "improving"] as const, seed, 2),
    completed: "stable",
    cancelled: "degrading",
  };

  const trendByPhase: Record<
    WeekendPhase,
    WeatherForecast["temperatureTrend"]
  > = {
    upcoming: pick(["rising", "holding", "falling"] as const, seed, 3),
    live: pick(["holding", "rising"] as const, seed, 4),
    completed: pick(["holding", "falling"] as const, seed, 5),
    cancelled: "falling",
  };

  return {
    rainProbability,
    trackEvolution: evolutionByPhase[phase],
    temperatureTrend: trendByPhase[phase],
  };
}

function buildRaceFactors(
  seed: number,
  sport: HubSport
): RaceFactors {
  return {
    safetyCarLikelihood:
      sport === "f1"
        ? +pick([0.15, 0.3, 0.45, 0.6, 0.8], seed, 1).toFixed(2)
        : +pick([0.05, 0.1, 0.2], seed, 1).toFixed(2),
    tyreDegradation: +pick([0.3, 0.45, 0.6, 0.75], seed, 2).toFixed(2),
    fuelSaving: +pick([0.1, 0.25, 0.4, 0.55], seed, 3).toFixed(2),
    overtakingDifficulty:
      sport === "f1"
        ? +pick([0.25, 0.4, 0.55, 0.7], seed, 4).toFixed(2)
        : +pick([0.2, 0.35, 0.5, 0.65], seed, 4).toFixed(2),
  };
}

function buildWatchFor(
  seed: number,
  sport: HubSport,
  phase: WeekendPhase,
  count = 4
): WatchForItem[] {
  const pool =
    sport === "motogp"
      ? WATCH_FOR_TEMPLATES.filter(
          (item) =>
            !item.title.includes("Safety Car") &&
            !item.title.includes("Medium tyre expected") &&
            !item.title.includes("Hard compound warms up")
        )
      : WATCH_FOR_TEMPLATES;

  if (phase === "cancelled") {
    return [
      {
        id: "cancelled-no-strategy",
        title: "No strategy in play",
        detail:
          "The weekend has been called off, so tyre and pit planning is retired with the event.",
        importance: "low",
      },
    ];
  }

  const seen = new Set<string>();
  const out: WatchForItem[] = [];
  let salt = 0;
  while (out.length < count && salt < pool.length * 2) {
    const item = pick(pool, seed, salt);
    if (!seen.has(item.title)) {
      seen.add(item.title);
      out.push({
        id: `watch-${out.length + 1}`,
        title: item.title,
        detail: item.detail,
        importance: item.importance,
      });
    }
    salt += 1;
  }
  return out;
}

function buildRaceStrategyAndStops(
  seed: number,
  sport: HubSport,
  phase: WeekendPhase
): { strategy: RaceStrategy; stops: number } {
  const pool =
    sport === "motogp" ? MOTOGP_STRATEGY_SHAPES : F1_STRATEGY_SHAPES;
  const base = pick(pool, seed, 0);
  return {
    stops: base.stops,
    strategy: {
      predictedStrategy: base.name,
      description:
        phase === "completed"
          ? `${base.description} That read held through to the flag.`
          : phase === "live"
          ? `${base.description} That read is being validated through live running.`
          : phase === "cancelled"
          ? "No viable race strategy — the weekend will not proceed."
          : base.description,
      confidence: pickConfidence(seed, phase, base.confidence),
    },
  };
}

/** Estimated race distance — used to size pit windows. */
function raceLapTarget(sport: HubSport): number {
  return sport === "f1" ? 58 : 24;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public generator
// ─────────────────────────────────────────────────────────────────────────────

export function buildWeekendStrategy(context: StrategyContext): WeekendStrategy {
  const seed = weekendHash(context);
  const sport = context.sport;
  const phase = context.phase;

  const { strategy: raceStrategy, stops } = buildRaceStrategyAndStops(
    seed,
    sport,
    phase
  );

  const pitStrategy =
    sport === "f1"
      ? buildPitStrategy(seed, stops, raceLapTarget(sport))
      : undefined;

  const tyreStrategy =
    sport === "f1" ? buildF1TyreStrategy(seed) : buildMotoGpTyreStrategy(seed);

  const weather = buildWeatherForecast(seed, phase);
  const raceFactors = buildRaceFactors(seed, sport);
  const watchFor = buildWatchFor(seed, sport, phase, 4);

  const overallConfidence = pickConfidence(seed, phase, raceStrategy.confidence);

  return {
    sport,
    phase,
    generatedAt: new Date().toISOString(),
    confidence: overallConfidence,
    raceStrategy,
    pitStrategy,
    tyreStrategy,
    weather,
    raceFactors,
    watchFor,
  };
}