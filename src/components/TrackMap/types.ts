import type { LiveRaceState } from "@/lib/live";

export type TrackMapProps = {
  circuitSvgUrl: string;
  state: LiveRaceState;
  className?: string;
  /** Accessible name for the live circuit graphic. */
  label?: string;
  /** Fired once the circuit SVG has been parsed and is renderable. */
  onReady?: () => void;
  /**
   * Optional Focus Mode code. Presentation only — does not alter LiveRaceState.
   * When set, that marker is emphasized and others are dimmed.
   */
  focusedCode?: string | null;
};
