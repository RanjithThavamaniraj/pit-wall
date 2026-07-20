"use client";

import { memo } from "react";
import { TrackMap } from "./TrackMap";
import { useLiveRaceState, type Championship } from "@/lib/live";

type Props = {
  circuitSvgUrl: string;
  /** Championship selects F1 / MotoGP providers with mock fallback. */
  sport?: Championship;
  className?: string;
  label?: string;
};

/**
 * Client bridge: championship-aware live state → TrackMap.
 * TrackMap itself never calls APIs.
 */
function LiveTrackMapComponent({
  circuitSvgUrl,
  sport = "f1",
  className,
  label,
}: Props) {
  const state = useLiveRaceState(sport);

  if (!state || state.drivers.length === 0) {
    return null;
  }

  return (
    <TrackMap
      circuitSvgUrl={circuitSvgUrl}
      state={state}
      className={className}
      label={label}
    />
  );
}

export const LiveTrackMap = memo(LiveTrackMapComponent);
