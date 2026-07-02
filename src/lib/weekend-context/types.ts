import type { RaceSummarySport } from "@/lib/race-summary/types";
import type { HubSession, WeekendPhase } from "@/lib/weekend-hub/types";
import type { WeekendIntelligence } from "@/lib/intelligence";
import type {
  DriverIntelligenceBundle,
} from "@/lib/driver-intelligence";
import type { WeekendStrategy } from "@/lib/weekend-hub/strategy";
import type { WeekendStory } from "@/lib/weekend-hub/story";

export type WeekendContextSport = RaceSummarySport;

/** A ranked contender surfaced from the Weekend Intelligence engine. */
export type TopContender = {
  name: string;
  team?: string;
  /** Normalised 0–100 from the Weekend Intelligence engine. */
  percentage: number;
  /** Raw score the percentage was derived from. */
  rawScore: number;
};

/** A single competitor recognised as a "favourite" of the weekend. */
export type WeekendFavourite = {
  name: string;
  team?: string;
  /** Source engine that established the favourite. */
  basis:
    | "weekend-intelligence"
    | "momentum"
    | "strategy-confidence"
    | "story";
  /** Human-readable reason for the pick. */
  reason: string;
  /** Normalised confidence 0–100 for display. */
  confidence: number;
};

export type MomentumLeader = {
  name: string;
  team?: string;
  /** 0–100 momentum rating from the Driver Intelligence engine. */
  momentum: number;
  /** Stable profile id from the Driver Intelligence engine. */
  profileId: string;
};

export type StrategyFavourite = {
  name: string;
  /** Strategy confidence label at time of generation. */
  confidence: "low" | "medium" | "high";
  /** Predicted strategy shape name. */
  predictedStrategy: string;
  reason: string;
};

/** Editor-facing story summary. */
export type StoryContextSummary = {
  headline: string;
  keyNarrative: string;
  biggestQuestion: string;
  weekendFocus: string;
};

/** Weather carried in the shared context. Mirrors the Strategy engine shape. */
export type WeekendWeather = {
  rainProbability: number;
  trackEvolution: "improving" | "stable" | "degrading";
  temperatureTrend: "rising" | "holding" | "falling";
};

/** A shared watch-for pointer. */
export type ContextWatchForItem = {
  id: string;
  title: string;
  detail: string;
  importance: "high" | "medium" | "low";
};

export type WeekendConfidence = "low" | "medium" | "high";

/**
 * The canonical weekend context object.
 *
 * This is the single source of truth returned by the Weekend Context
 * layer. It reuses already-resolved engine outputs and only orchestrates
 * them — it never recomputes scoring, ratings, or strategy blocks.
 */
export type WeekendContext = {
  sport: WeekendContextSport;
  weekendSlug: string;
  weekendName: string;
  generatedAt: string;
  phase: WeekendPhase;
  isSprintWeekend?: boolean;

  /** Top 5 contenders from the Weekend Intelligence engine. */
  topContenders: TopContender[];
  /** Single favourite, synthesised from engine signals. */
  favourite: WeekendFavourite;
  /** Highest-momentum driver/rider from Driver Intelligence. */
  momentumLeader: MomentumLeader | undefined;
  /** Competitor whose strategy confidence is highest. */
  strategyFavourite: StrategyFavourite | undefined;
  /** Editor-facing story summary derived from the Story engine. */
  story: StoryContextSummary;
  /** Weather forecast window. */
  weather: WeekendWeather;
  /** Overall confidence in the weekend read. Low when no engines produced output. */
  confidence: WeekendConfidence;
  /** 3–5 shared watch items blended from Strategy and Story engines. */
  watchFor: ContextWatchForItem[];

  /** Source engine outputs preserved verbatim so callers can drill in. */
  sources: {
    weekendIntelligence: WeekendIntelligence | null;
    driverIntelligence: DriverIntelligenceBundle | null;
    strategy: WeekendStrategy | null;
    story: WeekendStory | null;
  };
};

/**
 * Input required to build a `WeekendContext`.
 *
 * Engines carry their own context shapes; this input only needs to know
 * the weekend identity, the phase, the completed-weekend slugs to feed
 * recent-form engines, and the session list for engines that key off
 * sessions (Story, Strategy).
 */
export type WeekendContextInput = {
  sport: WeekendContextSport;
  weekendSlug: string;
  weekendName: string;
  phase?: WeekendPhase;
  isSprintWeekend?: boolean;
  /** Chronological list of completed weekend slugs (oldest-first). */
  completedWeekendSlugs: string[];
  /** Sessions for this weekend, used by phase-aware engines. */
  sessions?: HubSession[];
  /**
   * Already-resolved engine outputs. When supplied, the context layer
   * reuses them instead of re-resolving through the registries. This is
   * the supported path for SSR where a page has already fetched the
   * bundles it needs.
   */
  preResolved?: {
    weekendIntelligence?: WeekendIntelligence;
    driverIntelligence?: DriverIntelligenceBundle;
    strategy?: WeekendStrategy;
    story?: WeekendStory;
  };
  /** Optional provider id overrides for each engine. */
  providerIds?: {
    strategy?: string;
    story?: string;
    driverIntelligence?: string;
  };
};

export type WeekendContextProvider = {
  id: string;
  label: string;
  generate(input: WeekendContextInput): Promise<WeekendContext>;
};

export type WeekendContextProviderStatus = "ready" | "stub";

export type WeekendContextProviderRegistration = {
  provider: WeekendContextProvider;
  status: WeekendContextProviderStatus;
};

/** A future-ready extension hook. */
export type WeekendContextFactor = {
  id: string;
  label: string;
  weight: number;
};