import type { RaceSummarySport } from "@/lib/race-summary/types";

export type IntelligenceSport = RaceSummarySport;

/**
 * A single completed-weekend slice of form for one competitor.
 * Qualifying position is optional because not every summary carries it
 * on the podium-only record; it is carried when available through
 * `polePosition` and the session shape.
 */
export type CompetitorWeekend = {
  /** Canonical display name, matching the podium finisher name. */
  name: string;
  team?: string;
  /** Race finishing position (1-indexed). `null` if did not finish / did not classify. */
  racePosition: number | null;
  /** Sprint finishing position (1-indexed). `null` if there was no sprint or they didn't take part. */
  sprintPosition?: number | null;
  /** Qualifying position (1-indexed). `null` when not recoverable from the summary. */
  qualifyingPosition?: number | null;
  /** True if the competitor took pole for this weekend. */
  pole?: boolean;
  /** True if the competitor did not finish the race (DNF / retired). */
  dnf?: boolean;
  /** The round number of the weekend this slice belongs to. */
  round: number;
  /** The slug of the weekend this slice belongs to. */
  slug: string;
};

/** Aggregated, scored result for one competitor. */
export type IntelligenceEntry = {
  name: string;
  team?: string;
  /** Raw score before normalisation. */
  rawScore: number;
  /** Normalised percentage 0–100. Ordering matches rawScore descending. */
  percentage: number;
};

export type WeekendIntelligence = {
  sport: IntelligenceSport;
  generatedAt: string;
  /** The weekends that contributed form (most recent first). */
  sourceSlugs: string[];
  entries: IntelligenceEntry[];
};

/** A future-ready scoring factor hook. */
export type ScoringFactor = {
  id: string;
  label: string;
  weight: number;
};

/**
 * Scoring weights. Editable as a config object so future factors
 * (weather, track history, team upgrades, etc.) can be added
 * without touching the scoring core or the UI.
 */
export type ScoringConfig = {
  victory: number;
  podium: number;
  top5: number;
  top10: number;
  pole: number;
  sprintWin: number;
  sprintPodium: number;
  dnf: number;
  retirement: number;
  consecutivePodium: number;
  consecutiveTop5: number;
  /** Maximum number of completed weekends to look back over. */
  lookbackWeekends: number;
  /**
   * Minimum number of top entries to keep by name before aggregating
   * the remainder into a single "Others" bucket.
   */
  topN: number;
  othersLabel: string;
};

export type NormalizerConfig = {
  /**
   * Minimum raw score a competitor needs to be listed by name rather
   * than rolled into "Others". Prevents debris from a one-off classified
   * finisher dominating the long tail.
   */
  minRawScoreToWithName: number;
  othersLabel: string;
};