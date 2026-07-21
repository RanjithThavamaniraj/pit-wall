"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TrackMap } from "@/components/TrackMap";
import {
  deriveReplayStatus,
  replaySessionLabel,
  replaySportLabel,
  useReplay,
  type ReplayPackage,
} from "@/lib/replay";
import { ReplayControls } from "./ReplayControls";
import { ReplayStatus } from "./ReplayStatus";
import { ReplayTimeline } from "./ReplayTimeline";

type Props = {
  pkg: ReplayPackage;
  circuitSvgUrl: string;
  circuitName: string;
};

/**
 * Shared F1 + MotoGP replay surface.
 * TrackMap consumes LiveRaceState only; controls talk to ReplayEngine via useReplay.
 */
export function RaceReplayPlayer({
  pkg,
  circuitSvgUrl,
  circuitName,
}: Props) {
  const {
    state,
    controls,
    play,
    pause,
    restart,
    nextLap,
    previousLap,
    seek,
    setSpeed,
  } = useReplay(pkg);

  const [mapReady, setMapReady] = useState(false);
  const shellRef = useRef<HTMLDivElement | null>(null);

  const handleMapReady = useCallback(() => setMapReady(true), []);

  const seekCursor = useCallback(
    (nextCursor: number) => {
      const total = controls.totalLaps;
      const clamped = Math.min(Math.max(0, nextCursor), total);
      if (clamped >= total) {
        seek(total, 1);
        return;
      }
      const lap = Math.floor(clamped) + 1;
      const t = clamped - Math.floor(clamped);
      seek(lap, t);
    },
    [controls.totalLaps, seek]
  );

  const status = deriveReplayStatus({
    available: true,
    mapReady: mapReady && Boolean(state),
    controls,
  });

  useEffect(() => {
    const node = shellRef.current;
    if (!node) return;

    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      switch (event.key) {
        case " ":
        case "k":
        case "K":
          event.preventDefault();
          if (controls.playing) pause();
          else play();
          break;
        case "ArrowLeft":
        case "j":
        case "J":
          event.preventDefault();
          previousLap();
          break;
        case "ArrowRight":
        case "l":
        case "L":
          event.preventDefault();
          nextLap();
          break;
        case "Home":
          event.preventDefault();
          restart();
          break;
        default:
          break;
      }
    }

    node.addEventListener("keydown", onKeyDown);
    return () => node.removeEventListener("keydown", onKeyDown);
  }, [controls.playing, nextLap, pause, play, previousLap, restart]);

  const leaders =
    state?.drivers
      .slice()
      .sort((a, b) => a.position - b.position)
      .slice(0, 3)
      .map((d) => `P${d.position} ${d.code}`)
      .join(" · ") ?? null;

  return (
    <div
      ref={shellRef}
      className="space-y-5 sm:space-y-6"
      tabIndex={0}
      aria-label={`${replaySportLabel(pkg.sport)} ${replaySessionLabel(pkg.sessionKind)} replay player`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <ReplayStatus
          status={status}
          detail={`${replaySportLabel(pkg.sport)} · ${replaySessionLabel(pkg.sessionKind)}`}
        />
        <div className="min-w-0 sm:text-right">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-slate-500">
            Circuit
          </p>
          <p className="mt-1 truncate text-sm text-slate-300">{circuitName}</p>
          {leaders ? (
            <p className="mt-1 font-mono text-[0.7rem] tracking-[0.08em] text-slate-500">
              {leaders}
            </p>
          ) : null}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-gradient-to-b from-white/[0.07] to-black/40 sm:rounded-[1.75rem]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_18%,rgba(251,191,36,0.12),transparent_55%)]"
        />
        <div className="relative mx-auto flex min-h-[15rem] w-full max-w-xl items-center justify-center px-3 py-7 sm:min-h-[20rem] sm:px-6 sm:py-10">
          {state ? (
            <TrackMap
              circuitSvgUrl={circuitSvgUrl}
              state={state}
              label={`${circuitName} ${replaySessionLabel(pkg.sessionKind).toLowerCase()} replay`}
              onReady={handleMapReady}
              className="!pointer-events-none !relative !left-auto !top-auto !w-full !max-w-full !translate-x-0 !translate-y-0"
            />
          ) : (
            <p className="text-sm text-slate-500">Loading replay…</p>
          )}
        </div>
      </div>

      <div className="space-y-4 rounded-[1.25rem] border border-white/10 bg-black/20 p-3 sm:space-y-5 sm:rounded-[1.5rem] sm:p-5">
        <ReplayControls
          controls={controls}
          onPlay={play}
          onPause={pause}
          onRestart={restart}
          onPreviousLap={previousLap}
          onNextLap={nextLap}
          onSetSpeed={setSpeed}
        />

        <ReplayTimeline
          controls={controls}
          bookmarks={pkg.bookmarks}
          events={pkg.events}
          onSeekCursor={seekCursor}
          onSeekPoint={seek}
        />

        <p className="font-mono text-[0.6rem] leading-5 tracking-[0.12em] text-slate-600">
          Keyboard · Space play/pause · ← → lap · Home restart
        </p>
      </div>
    </div>
  );
}
