import type { LiveRaceState } from "@/lib/live";

export type TrackMapProps = {
  circuitSvgUrl: string;
  state: LiveRaceState;
  className?: string;
  /** Accessible name for the live circuit graphic. */
  label?: string;
  /** Fired once the circuit SVG has been parsed and is renderable. */
  onReady?: () => void;
};
