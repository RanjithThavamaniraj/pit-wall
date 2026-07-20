"use client";

import { memo } from "react";
import { TrackMap } from "./TrackMap";
import { useLiveRaceState, type LiveProviderId } from "@/lib/live";

type Props = {
  circuitSvgUrl: string;
  /** Defaults to mock until real championship providers are wired. */
  providerId?: LiveProviderId;
  className?: string;
  label?: string;
};

/**
 * Client bridge: selects a live provider and feeds TrackMap.
 * TrackMap itself never calls APIs.
 */
function LiveTrackMapComponent({
  circuitSvgUrl,
  providerId = "mock",
  className,
  label,
}: Props) {
  const state = useLiveRaceState(providerId);

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
