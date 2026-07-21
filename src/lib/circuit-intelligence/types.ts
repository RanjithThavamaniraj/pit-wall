import type { RaceSummarySport } from "@/lib/race-summary/types";

export type CircuitIntelligenceTrackCategory =
  | "High Speed"
  | "Technical"
  | "Street Circuit"
  | "Permanent Circuit";

export type CircuitIntelligenceMetric = {
  /** Visible label (must be real, not inferred). */
  label: string;
  /** Pre-formatted human value, or undefined to hide. */
  value?: string;
  /** Optional icon for scanability. */
  icon?: string;
};

export type CircuitIntelligence = {
  sport: RaceSummarySport;
  circuitName: string;
  country: string;
  /** Optional: displayed when a circuit source provides it. */
  metrics: CircuitIntelligenceMetric[];
  /**
   * Reserved extension slots.
   * Values remain empty until a provider supplies them in the future.
   */
  futureSlots: Array<{
    id: string;
    label: string;
    value?: string;
  }>;
};

