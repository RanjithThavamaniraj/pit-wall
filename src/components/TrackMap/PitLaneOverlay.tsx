"use client";

import { memo } from "react";

type Props = {
  /** Pit-lane path `d` from the circuit SVG. Null when geometry is absent. */
  pitPathD: string | null;
  /** True when any of the displayed drivers is in pit. */
  anyInPit: boolean;
  reducedMotion: boolean;
};

/**
 * Glows the pit-lane path when present and a driver is in pit.
 * Does not invent geometry — if the SVG has no pit path, this renders nothing
 * (markers show a PIT badge instead).
 */
function PitLaneOverlayComponent({
  pitPathD,
  anyInPit,
  reducedMotion,
}: Props) {
  if (!pitPathD || !anyInPit) return null;

  return (
    <path
      d={pitPathD}
      fill="none"
      stroke="currentColor"
      strokeWidth={8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`pointer-events-none text-amber-300 ${
        reducedMotion ? "opacity-55" : "track-map__pit opacity-70"
      }`}
    />
  );
}

export const PitLaneOverlay = memo(PitLaneOverlayComponent);
