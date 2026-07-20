"use client";

import { memo, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useReducedMotion } from "framer-motion";
import type { LiveRaceState, RaceFlag } from "@/lib/live";
import {
  circuitSlugFromSvgUrl,
  getSectorBoundaries,
} from "@/lib/live";
import { TrackMarker } from "./TrackMarker";
import { SectorOverlay } from "./SectorOverlay";
import { PitLaneOverlay } from "./PitLaneOverlay";
import {
  getCachedPathLength,
  loadCircuitSvg,
  type ParsedCircuitSvg,
} from "./svgCache";
import type { TrackMapProps } from "./types";

function flagCssVars(flag: RaceFlag): CSSProperties {
  switch (flag) {
    case "yellow":
      return {
        "--track-stroke": "rgba(251, 191, 36, 0.55)",
        "--track-glow": "rgba(251, 191, 36, 0.35)",
        "--track-accent": "#fbbf24",
        "--track-sector": "rgba(251, 191, 36, 0.75)",
      } as CSSProperties;
    case "vsc":
      return {
        "--track-stroke": "rgba(251, 191, 36, 0.45)",
        "--track-glow": "rgba(251, 191, 36, 0.28)",
        "--track-accent": "#f59e0b",
        "--track-sector": "rgba(245, 158, 11, 0.7)",
      } as CSSProperties;
    case "safety_car":
      return {
        "--track-stroke": "rgba(250, 204, 21, 0.7)",
        "--track-glow": "rgba(250, 204, 21, 0.45)",
        "--track-accent": "#facc15",
        "--track-sector": "rgba(250, 204, 21, 0.8)",
      } as CSSProperties;
    case "red":
      return {
        "--track-stroke": "rgba(248, 113, 113, 0.65)",
        "--track-glow": "rgba(248, 113, 113, 0.4)",
        "--track-accent": "#f87171",
        "--track-sector": "rgba(248, 113, 113, 0.75)",
      } as CSSProperties;
    case "green":
    default:
      return {
        "--track-stroke": "rgba(251, 191, 36, 0.28)",
        "--track-glow": "rgba(251, 191, 36, 0.12)",
        "--track-accent": "#fbbf24",
        "--track-sector": "rgba(251, 191, 36, 0.65)",
      } as CSSProperties;
  }
}

function flagLabel(flag: RaceFlag): string {
  switch (flag) {
    case "yellow":
      return "Yellow flag";
    case "vsc":
      return "Virtual safety car";
    case "safety_car":
      return "Safety car";
    case "red":
      return "Red flag";
    default:
      return "Green flag";
  }
}

function statusSummary(state: LiveRaceState): string {
  const leaders = state.drivers
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((d) => `P${d.position} ${d.code}`)
    .join(", ");

  const lap =
    state.totalLaps > 0
      ? `Lap ${state.lap} of ${state.totalLaps}`
      : `Lap ${state.lap}`;

  const sector = state.activeSector
    ? `Sector ${state.activeSector}`
    : "No active sector";

  const finish = state.raceFinished ? "Race finished." : "";

  return [lap, flagLabel(state.flag), sector, leaders, finish]
    .filter(Boolean)
    .join(". ");
}

function liveStateEqual(a: LiveRaceState, b: LiveRaceState): boolean {
  if (a === b) return true;
  if (
    a.championship !== b.championship ||
    a.sessionStatus !== b.sessionStatus ||
    a.lap !== b.lap ||
    a.totalLaps !== b.totalLaps ||
    a.flag !== b.flag ||
    a.activeSector !== b.activeSector ||
    a.raceFinished !== b.raceFinished ||
    a.progressSource !== b.progressSource
  ) {
    return false;
  }

  const aFl = a.fastestLap;
  const bFl = b.fastestLap;
  if (aFl === null || bFl === null) {
    if (aFl !== bFl) return false;
  } else if (
    aFl.code !== bFl.code ||
    aFl.time !== bFl.time ||
    aFl.lap !== bFl.lap
  ) {
    return false;
  }

  if (a.drivers.length !== b.drivers.length) return false;
  for (let i = 0; i < a.drivers.length; i++) {
    const da = a.drivers[i];
    const db = b.drivers[i];
    if (
      da.position !== db.position ||
      da.code !== db.code ||
      da.pit !== db.pit ||
      Math.abs(da.progress - db.progress) > 1e-6
    ) {
      return false;
    }
  }
  return true;
}

function TrackMapComponent({
  circuitSvgUrl,
  state,
  className = "",
  label = "Live circuit map",
  onReady,
}: TrackMapProps) {
  const reducedMotion = useReducedMotion() ?? false;
  const pathRef = useRef<SVGPathElement | null>(null);
  const [parsed, setParsed] = useState<ParsedCircuitSvg | null>(null);
  const [pathLength, setPathLength] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const readySent = useRef(false);

  const circuitSlug = useMemo(
    () => circuitSlugFromSvgUrl(circuitSvgUrl),
    [circuitSvgUrl]
  );

  const boundaries = useMemo(
    () => getSectorBoundaries(circuitSlug ?? ""),
    [circuitSlug]
  );

  useEffect(() => {
    let cancelled = false;
    setLoadError(false);
    setPathLength(0);
    readySent.current = false;

    loadCircuitSvg(circuitSvgUrl)
      .then((result) => {
        if (!cancelled) setParsed(result);
      })
      .catch(() => {
        if (!cancelled) {
          setParsed(null);
          setLoadError(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [circuitSvgUrl]);

  useEffect(() => {
    if (parsed && !readySent.current) {
      readySent.current = true;
      onReady?.();
    }
  }, [parsed, onReady]);

  const setPathNode = (node: SVGPathElement | null) => {
    pathRef.current = node;
    if (!node) return;
    const length = getCachedPathLength(circuitSvgUrl, node);
    setPathLength((prev) => (prev === length ? prev : length));
  };

  const topThree = useMemo(
    () =>
      state.drivers
        .filter((d) => d.position >= 1 && d.position <= 3)
        .sort((a, b) => a.position - b.position)
        .slice(0, 3),
    [state.drivers]
  );

  const anyInPit = topThree.some((d) => d.pit);
  const cssVars = flagCssVars(state.flag);
  const trackClass =
    state.flag === "vsc" && !reducedMotion
      ? "track-map__path--vsc"
      : state.flag === "safety_car"
      ? "track-map__path--safety"
      : state.flag === "red"
      ? "track-map__path--red"
      : "";

  if (loadError || !parsed) {
    return null;
  }

  const gradientId = `track-finish-gradient-${circuitSlug ?? "circuit"}`;

  return (
    <div
      className={`track-map ${className}`}
      style={cssVars}
      role="img"
      aria-label={`${label}. ${statusSummary(state)}`}
    >
      <svg
        viewBox={parsed.viewBox}
        className="track-map__svg"
        aria-hidden="true"
      >
        <path
          d={parsed.trackPathD}
          fill="none"
          stroke="var(--track-glow)"
          strokeWidth={14}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="pointer-events-none opacity-80"
        />

        <path
          ref={setPathNode}
          d={parsed.trackPathD}
          fill="none"
          stroke="var(--track-stroke)"
          strokeWidth={7}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`track-map__path ${trackClass}`}
        />

        <SectorOverlay
          pathD={parsed.trackPathD}
          pathLength={pathLength}
          activeSector={state.activeSector}
          boundaries={boundaries}
          reducedMotion={reducedMotion}
        />

        <PitLaneOverlay
          pitPathD={parsed.pitPathD}
          anyInPit={anyInPit}
          reducedMotion={reducedMotion}
        />

        {state.raceFinished ? (
          <path
            d={parsed.trackPathD}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={10}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={
              reducedMotion
                ? "opacity-40"
                : "track-map__finish-wave opacity-70"
            }
            pathLength={100}
            strokeDasharray="24 76"
          />
        ) : null}

        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(251,191,36,0)" />
            <stop offset="50%" stopColor="rgba(251,191,36,0.95)" />
            <stop offset="100%" stopColor="rgba(251,191,36,0)" />
          </linearGradient>
        </defs>

        {pathLength > 0 &&
          topThree.map((driver) => (
            <TrackMarker
              key={driver.code}
              driver={driver}
              pathRef={pathRef}
              pathLength={pathLength}
              reducedMotion={reducedMotion}
            />
          ))}
      </svg>

      <div className="track-map__meta" aria-hidden="true">
        <span>
          L{state.lap}
          {state.totalLaps > 0 ? `/${state.totalLaps}` : ""}
        </span>
        {state.activeSector ? <span>S{state.activeSector}</span> : null}
        {state.fastestLap ? (
          <span className="track-map__meta-fl">FL {state.fastestLap.code}</span>
        ) : null}
      </div>
    </div>
  );
}

export const TrackMap = memo(TrackMapComponent, (prev, next) => {
  return (
    prev.circuitSvgUrl === next.circuitSvgUrl &&
    prev.className === next.className &&
    prev.label === next.label &&
    prev.onReady === next.onReady &&
    liveStateEqual(prev.state, next.state)
  );
});
