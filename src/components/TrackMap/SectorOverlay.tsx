"use client";

import { memo, useMemo } from "react";
import type { ActiveSector, SectorBoundaries } from "@/lib/live";
import { getSectorRange } from "@/lib/live";

type Props = {
  pathD: string;
  pathLength: number;
  activeSector: ActiveSector;
  boundaries: SectorBoundaries;
  reducedMotion: boolean;
};

/**
 * Highlights only the active sector along the main track path.
 * Uses stroke-dasharray so we never need separate sector path geometry.
 */
function SectorOverlayComponent({
  pathD,
  pathLength,
  activeSector,
  boundaries,
  reducedMotion,
}: Props) {
  const style = useMemo(() => {
    if (!activeSector || pathLength <= 0) return null;
    const [start, end] = getSectorRange(boundaries, activeSector);
    const startLen = start * pathLength;
    const sectorLen = Math.max(1, (end - start) * pathLength);
    return {
      strokeDasharray: `${sectorLen} ${pathLength}`,
      strokeDashoffset: -startLen,
    };
  }, [activeSector, boundaries, pathLength]);

  if (!style) return null;

  return (
    <path
      d={pathD}
      fill="none"
      stroke="currentColor"
      strokeWidth={9}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={style.strokeDasharray}
      strokeDashoffset={style.strokeDashoffset}
      className={`pointer-events-none text-[color:var(--track-sector)] ${
        reducedMotion ? "opacity-40" : "track-map__sector opacity-50"
      }`}
    />
  );
}

export const SectorOverlay = memo(SectorOverlayComponent);
