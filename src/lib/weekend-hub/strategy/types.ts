import type { HubSport, WeekendPhase } from "../types";

export type StrategyConfidence = "low" | "medium" | "high";

/** Compound options used across F1 stints. */
export type F1Compound = "soft" | "medium" | "hard" | "intermediate" | "wet";

/** Front/rear slick options used by MotoGP. */
export type MotoGpCompound =
  | "soft"
  | "medium"
  | "hard"
  | "extra-hard"
  | "intermediate"
  | "wet";

export type PitStintPlan = {
  /** 1-indexed stint number this plan covers. */
  stint: number;
  /** Best-guess lap window for the pit stop. */
  fromLap: number;
  toLap: number;
  /** Compound targeted for the next stint. */
  compound: F1Compound;
};

/** Full pit strategy block — only meaningful for F1. */
export type PitStrategy = {
  /** Predicted total number of pit stops across the race distance. */
  expectedStops: number;
  /** Lap windows the strategist expects stops to fall into, by stint. */
  windows: PitStintPlan[];
  /** Expected advantage, in seconds, of stopping first onto the new compound. */
  undercutAdvantageSec: number;
  /** Expected advantage, in seconds, of staying out longer than the undercut window. */
  overcutAdvantageSec: number;
};

export type TyreStrategy =
  | {
      sport: "f1";
      openingCompound: F1Compound;
      middleCompound: F1Compound;
      finalCompound: F1Compound;
    }
  | {
      sport: "motogp";
      frontTyre: MotoGpCompound;
      rearTyre: MotoGpCompound;
      /**
       * Risk profile for the tyre choice.
       * - "conservative" prioritises durability and consistency.
       * - "balanced" is the middle ground between pace and durability.
       * - "aggressive" leans toward outright grip with elevated degradation risk.
       */
      tyreRisk: "conservative" | "balanced" | "aggressive";
    };

export type WeatherForecast = {
  /** Probability of measurable rain during the race window, 0–1. */
  rainProbability: number;
  /**
   * How aggressively the track surface is expected to evolve through the race.
   * - "improving" — track rubbering in, times will drop.
   * - "stable" — surface holding steady.
   * - "degrading" — track going off, times rising.
   */
  trackEvolution: "improving" | "stable" | "degrading";
  /**
   * Direction the temperature is trending across the race window.
   * - "rising" — surface temps climbing.
   * - "holding" — stable temps.
   * - "falling" — temps dropping, often toward dusk.
   */
  temperatureTrend: "rising" | "holding" | "falling";
};

export type RaceFactors = {
  /** Likelihood of at least one safety car / virtual safety Car period, 0–1. */
  safetyCarLikelihood: number;
  /** Tyre degradation index for this track, 0–1 (1 = severe). */
  tyreDegradation: number;
  /** Fuel saving pressure index, 0–1 (1 = the field will be saving heavily). */
  fuelSaving: number;
  /** How hard overtaking is here, 0–1 (1 = very hard, train of cars likely). */
  overtakingDifficulty: number;
};

export type WatchForItem = {
  id: string;
  title: string;
  detail: string;
  importance: StrategyConfidence;
};

export type RaceStrategy = {
  /** Short, evocative name for the predicted race strategy shape. */
  predictedStrategy: string;
  /** Editorial description of why this strategy is the most likely. */
  description: string;
  /** Confidence in the predicted shape. */
  confidence: StrategyConfidence;
};

/** The full package returned from the strategy engine. */
export type WeekendStrategy = {
  sport: HubSport;
  phase: WeekendPhase;
  generatedAt: string;
  /** Overall confidence in the strategy model for this weekend. */
  confidence: StrategyConfidence;
  raceStrategy: RaceStrategy;
  pitStrategy?: PitStrategy;
  /* Tyre strategy is always present, but its shape depends on the sport. */
  tyreStrategy: TyreStrategy;
  /* Weather forecast window across the race distance. */
  weather: WeatherForecast;
  /* Race-shaping factors the strategist has to account for. */
  raceFactors: RaceFactors;
  /* Three to five AI-generated points to keep an eye on. */
  watchFor: WatchForItem[];
};

export type StrategyContext = {
  sport: HubSport;
  weekendSlug: string;
  weekendName: string;
  phase: WeekendPhase;
  sessions: { key: string; label: string }[];
  isSprintWeekend?: boolean;
};

export type StrategyProvider = {
  id: string;
  label: string;
  generate(context: StrategyContext): Promise<WeekendStrategy>;
};

export type StrategyProviderStatus = "ready" | "stub";

export type StrategyProviderRegistration = {
  provider: StrategyProvider;
  status: StrategyProviderStatus;
};