"use client";

import { memo, useEffect, useRef, useState, type RefObject } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { LiveDriverState } from "@/lib/live";

type Point = { x: number; y: number };
type TrailPoint = Point & { id: number };

type Props = {
  driver: LiveDriverState;
  pathRef: RefObject<SVGPathElement | null>;
  pathLength: number;
  reducedMotion: boolean;
  /** Presentation emphasis when Focus Mode is active. */
  emphasis?: "normal" | "focus" | "dim";
};

const TRAIL_LENGTH = 5;

function progressToPoint(
  path: SVGPathElement,
  pathLength: number,
  progress: number
): Point {
  const normalized = ((progress % 1) + 1) % 1;
  const point = path.getPointAtLength(pathLength * normalized);
  return { x: point.x, y: point.y };
}

function TrackMarkerComponent({
  driver,
  pathRef,
  pathLength,
  reducedMotion,
  emphasis = "normal",
}: Props) {
  const prefersReduced = useReducedMotion() ?? reducedMotion;
  const [point, setPoint] = useState<Point | null>(null);
  const [trail, setTrail] = useState<TrailPoint[]>([]);
  const trailId = useRef(0);

  useEffect(() => {
    const path = pathRef.current;
    if (!path || pathLength <= 0) return;

    const next = progressToPoint(path, pathLength, driver.progress);
    setPoint(next);

    if (prefersReduced || emphasis === "dim") {
      setTrail([]);
      return;
    }

    setTrail((prev) => {
      trailId.current += 1;
      return [...prev, { ...next, id: trailId.current }].slice(-TRAIL_LENGTH);
    });
  }, [driver.progress, pathLength, pathRef, prefersReduced, emphasis]);

  if (!point) return null;

  const label = driver.pit
    ? `P${driver.position} ${driver.code}, in pit`
    : `P${driver.position} ${driver.code}`;

  const dimmed = emphasis === "dim";
  const focused = emphasis === "focus";
  const groupOpacity = dimmed ? 0.28 : 1;
  const markerR = focused ? 6.5 : 5;

  return (
    <g
      aria-label={label}
      role="img"
      opacity={groupOpacity}
      style={{ transition: "opacity 0.25s ease" }}
    >
      {!prefersReduced &&
        !dimmed &&
        trail.map((entry, index) => {
          const opacity = ((index + 1) / (trail.length + 1)) * 0.35;
          return (
            <motion.circle
              key={entry.id}
              cx={entry.x}
              cy={entry.y}
              r={3.5}
              fill="currentColor"
              initial={{ opacity: opacity + 0.15, scale: 1 }}
              animate={{ opacity: 0, scale: 0.4 }}
              transition={{ duration: 0.85, ease: "easeOut" }}
              className="text-[color:var(--track-accent)]"
            />
          );
        })}

      <motion.g
        initial={false}
        animate={{ x: point.x, y: point.y }}
        transition={
          prefersReduced
            ? { duration: 0 }
            : { type: "spring", stiffness: 90, damping: 22, mass: 0.6 }
        }
      >
        {!prefersReduced && focused ? (
          <motion.circle
            r={14}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            className="text-[color:var(--track-accent)]"
            initial={{ opacity: 0.55, scale: 0.85 }}
            animate={{ opacity: [0.55, 0.15, 0.55], scale: [0.9, 1.35, 0.9] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          />
        ) : !prefersReduced && !dimmed ? (
          <motion.circle
            r={10}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.25}
            className="text-[color:var(--track-accent)]"
            initial={{ opacity: 0.45, scale: 0.85 }}
            animate={{ opacity: [0.45, 0.1, 0.45], scale: [0.85, 1.25, 0.85] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />
        ) : null}

        <circle
          r={markerR}
          fill="currentColor"
          className="text-[color:var(--track-accent)]"
          stroke="rgba(5,6,8,0.85)"
          strokeWidth={1.5}
        />

        <text
          x={12}
          y={4}
          className={`fill-white font-mono font-semibold tracking-[0.12em] ${
            focused ? "text-[12px]" : "text-[11px]"
          }`}
          style={{
            paintOrder: "stroke",
            stroke: "rgba(5,6,8,0.75)",
            strokeWidth: 3,
          }}
        >
          {driver.code}
        </text>

        {driver.pit ? (
          <text
            x={12}
            y={16}
            className="fill-amber-200 font-mono text-[8px] font-semibold tracking-[0.18em]"
            style={{
              paintOrder: "stroke",
              stroke: "rgba(5,6,8,0.8)",
              strokeWidth: 2.5,
            }}
          >
            PIT
          </text>
        ) : null}
      </motion.g>
    </g>
  );
}

export const TrackMarker = memo(
  TrackMarkerComponent,
  (prev, next) =>
    prev.pathLength === next.pathLength &&
    prev.reducedMotion === next.reducedMotion &&
    prev.pathRef === next.pathRef &&
    prev.emphasis === next.emphasis &&
    prev.driver.position === next.driver.position &&
    prev.driver.code === next.driver.code &&
    prev.driver.pit === next.driver.pit &&
    Math.abs(prev.driver.progress - next.driver.progress) < 1e-6
);
