import type { RaceSummarySport } from "@/lib/race-summary/types";

export type DriverIntelligenceSport = RaceSummarySport;

/** 0–100 rating block for a single competitor. */
export type DriverRatings = {
  momentum: number;
  qualifying: number;
  racePace: number;
  consistency: number;
  overtaking: number;
  tyreManagement: number;
};

/** Compact finishing record for one of the last three race weekends. */
export type RecentResult = {
  round: number;
  slug: string;
  /** Race finishing position, 1-indexed. `null` if DNF. */
  position: number | null;
  /** Sprint finishing position, 1-indexed. `null` if no sprint / didn't take part. */
  sprintPosition?: number | null;
  /** True if the competitor took pole for this weekend. */
  pole?: boolean;
};

/** Aggregated recent-form block. */
export type RecentForm = {
  /** Last three race results, most recent first. */
  lastThree: RecentResult[];
  podiumCount: number;
  victoryCount: number;
  /** Average race finishing position across the analysed window (DNF counted as 20). */
  averageFinish: number;
  /** Number of race weekends that contributed to the analysis. */
  weekendsCounted: number;
};

/** Deterministic, one-line insight string drawn from form. */
export type WeekendTrend = {
  id: string;
  label: string;
};

export type DriverConfidence = "low" | "medium" | "high";

/** A single named strength or weakness. */
export type TraitItem = {
  id: string;
  label: string;
};

/**
 * A full driver / rider intelligence profile.
 *
 * `id` is a slug-style identifier derived from `name`, stable across
 * regenerations so the UI can key off it.
 */
export type DriverIntelligenceProfile = {
  id: string;
  name: string;
  team?: string;
  sport: DriverIntelligenceSport;
  generatedAt: string;
  ratings: DriverRatings;
  recentForm: RecentForm;
  weekendTrend: WeekendTrend;
  strengths: TraitItem[];
  weaknesses: TraitItem[];
  confidence: DriverConfidence;
};

export type DriverIntelligenceBundle = {
  sport: DriverIntelligenceSport;
  generatedAt: string;
  /** Slugs of the weekends that provided form (most recent first). */
  sourceSlugs: string[];
  profiles: DriverIntelligenceProfile[];
};

/** Context consumed by the engine — kept sport/data-source agnostic. */
export type DriverIntelligenceContext = {
  sport: DriverIntelligenceSport;
  /** Completed weekend slugs (chronological, oldest-first). */
  completedWeekendSlugs: string[];
  /** Restrict generation to a specific competitor name. Optional. */
  driverName?: string;
};

export type DriverIntelligenceProvider = {
  id: string;
  label: string;
  generate(
    context: DriverIntelligenceContext
  ): Promise<DriverIntelligenceBundle>;
};

export type DriverIntelligenceProviderStatus = "ready" | "stub";

export type DriverIntelligenceProviderRegistration = {
  provider: DriverIntelligenceProvider;
  status: DriverIntelligenceProviderStatus;
};

/**
 * Future-ready scoring hooks. Each factor can be added without
 * changing the public API; the generator reads the active set to
 * blend additional signals into the rating blocks.
 */
export type DriverFactor = {
  id: string;
  label: string;
  weight: number;
};

/**
 * Tunable weights for the engine. Editing this object is the
 * supported way to rebalance ratings without code changes.
 */
export type DriverIntelligenceConfig = {
  /** Maximum number of completed weekends to analyse per driver. */
  lookbackWeekends: number;
  /** Position assumed when a competitor records a DNF, for averaging. */
  dnfAssumedPosition: number;
  /** Threshold (0–1) of weekends analysed above which confidence can rise to "high". */
  highConfidenceThreshold: number;
  /** Threshold (0–1) below which confidence drops to "low". */
  lowConfidenceThreshold: number;
  /** Minimum number of weekends a generation needs to produce a full bundle. */
  minImprovingTrendSample: number;
};