"use client";

import { TrackMap } from "@/components/TrackMap";
import { useReplay, type ReplayPackage } from "@/lib/replay";
import { ReplayControls } from "./ReplayControls";

type Props = {
  pkg: ReplayPackage;
  circuitSvgUrl: string;
  circuitName: string;
};

/**
 * Active replay surface: TrackMap consumes LiveRaceState only.
 * Controls talk exclusively to the ReplayEngine via useReplay.
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
    seekLap,
    setSpeed,
  } = useReplay(pkg);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-gradient-to-b from-white/[0.07] to-black/40">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_20%,rgba(251,191,36,0.12),transparent_55%)]"
        />
        <div className="relative mx-auto flex min-h-[16rem] w-full max-w-xl items-center justify-center px-4 py-8 sm:min-h-[20rem] sm:px-6 sm:py-10">
          {state ? (
            <TrackMap
              circuitSvgUrl={circuitSvgUrl}
              state={state}
              label={`${circuitName} race replay`}
              className="!pointer-events-none !relative !left-auto !top-auto !w-full !max-w-full !translate-x-0 !translate-y-0"
            />
          ) : (
            <p className="text-sm text-slate-500">Preparing replay…</p>
          )}
        </div>
      </div>

      <ReplayControls
        controls={controls}
        onPlay={play}
        onPause={pause}
        onRestart={restart}
        onPreviousLap={previousLap}
        onNextLap={nextLap}
        onSeekLap={seekLap}
        onSetSpeed={setSpeed}
      />
    </div>
  );
}
