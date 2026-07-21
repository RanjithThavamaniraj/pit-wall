"use client";

import { memo } from "react";
import { CompetitorFocusBoard } from "@/components/competitor-focus";
import { useLiveRaceState, type Championship } from "@/lib/live";

type Props = {
  circuitSvgUrl: string;
  circuitName?: string;
  sport: Championship;
};

/**
 * Client bridge: championship-aware live state → Focus Mode + TrackMap.
 * TrackMap itself never calls APIs. Focus reuses the same LiveRaceState.
 */
function LiveTrackMapComponent({
  circuitSvgUrl,
  circuitName = "Circuit",
  sport,
}: Props) {
  const state = useLiveRaceState(sport);

  if (!state || state.drivers.length === 0) {
    return null;
  }

  return (
    <CompetitorFocusBoard
      state={state}
      circuitSvgUrl={circuitSvgUrl}
      mapLabel={`${circuitName} live circuit`}
    />
  );
}

export const LiveTrackMap = memo(LiveTrackMapComponent);
