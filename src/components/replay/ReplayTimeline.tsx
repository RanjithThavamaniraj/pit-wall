"use client";

import { useId, useMemo } from "react";
import type {
  ReplayBookmark,
  ReplayControlsState,
  ReplayEvent,
} from "@/lib/replay";
import {
  buildBookmarkMarkers,
  buildEventMarkers,
} from "./timelineMarkers";

type Props = {
  controls: ReplayControlsState;
  bookmarks: ReplayBookmark[];
  events: ReplayEvent[];
  onSeekCursor: (cursor: number) => void;
  onSeekPoint: (lap: number, t?: number) => void;
};

export function ReplayTimeline({
  controls,
  bookmarks,
  events,
  onSeekCursor,
  onSeekPoint,
}: Props) {
  const labelId = useId();
  const { cursor, lap, totalLaps, finished } = controls;

  const bookmarkMarkers = useMemo(
    () => buildBookmarkMarkers(bookmarks, totalLaps),
    [bookmarks, totalLaps]
  );
  const eventMarkers = useMemo(
    () => buildEventMarkers(events, totalLaps),
    [events, totalLaps]
  );

  const progressPct =
    totalLaps > 0 ? Math.min(100, Math.max(0, (cursor / totalLaps) * 100)) : 0;

  const tickLaps = useMemo(() => {
    if (totalLaps <= 1) return [1];
    if (totalLaps <= 12) {
      return Array.from({ length: totalLaps }, (_, i) => i + 1);
    }
    const step = Math.max(1, Math.round(totalLaps / 8));
    const ticks = new Set<number>([1, totalLaps]);
    for (let n = step; n < totalLaps; n += step) ticks.add(n);
    return [...ticks].sort((a, b) => a - b);
  }, [totalLaps]);

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <p
          id={labelId}
          className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-slate-500"
        >
          Timeline
        </p>
        <p className="font-mono text-xs tracking-[0.14em] text-slate-300">
          Lap {lap}
          <span className="text-slate-500"> / {totalLaps}</span>
          {finished ? (
            <span className="ml-2 text-cyan-300/90">Finished</span>
          ) : null}
        </p>
      </div>

      <div className="relative pt-7 sm:pt-8">
        {bookmarkMarkers.length > 0 ? (
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-6 sm:h-7"
            aria-hidden={false}
          >
            {bookmarkMarkers.map((marker) => (
              <button
                key={marker.id}
                type="button"
                title={marker.label}
                aria-label={`Jump to ${marker.label}, lap ${marker.seekLap}`}
                onClick={() => onSeekPoint(marker.seekLap, marker.seekT)}
                className={`pointer-events-auto absolute top-0 z-20 -translate-x-1/2 rounded-md border px-1 py-0.5 text-[0.65rem] leading-none shadow-sm transition hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300/70 ${marker.toneClass}`}
                style={{ left: `${marker.progress * 100}%` }}
              >
                <span aria-hidden="true">{marker.glyph}</span>
                <span className="sr-only">{marker.label}</span>
              </button>
            ))}
          </div>
        ) : null}

        <div className="relative h-8 touch-none">
          <div
            className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-white/10"
            aria-hidden="true"
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-300/80 to-amber-200/90 transition-[width] duration-75 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {eventMarkers.map((marker) => (
            <button
              key={marker.id}
              type="button"
              title={marker.label}
              aria-label={`Jump to ${marker.label}, lap ${marker.seekLap}`}
              onClick={() => onSeekPoint(marker.seekLap, marker.seekT)}
              className="absolute top-1/2 z-10 flex h-4 min-w-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-black/40 px-1 font-mono text-[0.55rem] font-bold text-slate-950 shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300/70"
              style={{ left: `${marker.progress * 100}%` }}
            >
              <span
                className={`absolute inset-0 rounded-full ${marker.toneClass}`}
                aria-hidden="true"
              />
              <span className="relative">{marker.glyph}</span>
            </button>
          ))}

          <input
            type="range"
            min={0}
            max={totalLaps}
            step={0.01}
            value={Math.min(cursor, totalLaps)}
            aria-labelledby={labelId}
            aria-valuemin={0}
            aria-valuemax={totalLaps}
            aria-valuenow={Number(cursor.toFixed(2))}
            aria-valuetext={`Lap ${lap} of ${totalLaps}${finished ? ", finished" : ""}`}
            onChange={(event) => onSeekCursor(Number(event.target.value))}
            className="replay-timeline-input absolute inset-x-0 top-0 z-30 h-8 w-full cursor-pointer appearance-none bg-transparent"
          />
        </div>

        <div className="relative mt-2 hidden h-4 sm:block" aria-hidden="true">
          {tickLaps.map((tick) => {
            const left =
              totalLaps <= 1 ? 0 : ((tick - 1) / Math.max(1, totalLaps - 1)) * 100;
            return (
              <span
                key={tick}
                className={`absolute top-0 -translate-x-1/2 font-mono text-[0.6rem] tracking-[0.12em] ${
                  tick === lap ? "text-amber-200/90" : "text-slate-600"
                }`}
                style={{ left: `${left}%` }}
              >
                L{tick}
              </span>
            );
          })}
        </div>
      </div>

      {(bookmarkMarkers.length > 0 || eventMarkers.length > 0) && (
        <ul className="flex flex-wrap gap-x-3 gap-y-1.5 pt-1">
          {bookmarkMarkers.slice(0, 6).map((marker) => (
            <li key={`legend-${marker.id}`}>
              <button
                type="button"
                onClick={() => onSeekPoint(marker.seekLap, marker.seekT)}
                className="inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 text-left font-mono text-[0.65rem] tracking-[0.08em] text-slate-400 transition hover:text-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300/70"
              >
                <span aria-hidden="true">{marker.glyph}</span>
                <span>{marker.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
