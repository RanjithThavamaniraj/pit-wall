"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { createReplayEngine } from "./engine";
import { createReplayProvider } from "./createReplayProvider";
import type {
  ReplayControlsState,
  ReplayPackage,
  ReplayPlaybackSpeed,
} from "./types";
import type { LiveRaceState } from "@/lib/live";

export type UseReplayResult = {
  state: LiveRaceState | null;
  controls: ReplayControlsState;
  play: () => void;
  pause: () => void;
  restart: () => void;
  nextLap: () => void;
  previousLap: () => void;
  seekLap: (lap: number) => void;
  setSpeed: (speed: ReplayPlaybackSpeed) => void;
};

const EMPTY_CONTROLS: ReplayControlsState = {
  playing: false,
  speed: 1,
  lap: 1,
  totalLaps: 1,
  cursor: 0,
  finished: false,
};

/**
 * Bind a ReplayPackage to engine + provider for React consumers.
 * TrackMap receives only `state` (LiveRaceState).
 */
export function useReplay(pkg: ReplayPackage): UseReplayResult {
  const engine = useMemo(() => createReplayEngine(pkg), [pkg]);

  useEffect(() => {
    return () => {
      engine.destroy();
    };
  }, [engine]);

  const provider = useMemo(() => createReplayProvider(engine), [engine]);

  const state = useSyncExternalStore(
    provider.subscribe,
    provider.getSnapshot,
    () => null
  );

  const controls = useSyncExternalStore(
    engine.subscribeControls,
    engine.getControlsSnapshot,
    () => EMPTY_CONTROLS
  );

  return {
    state,
    controls,
    play: engine.play,
    pause: engine.pause,
    restart: engine.restart,
    nextLap: engine.nextLap,
    previousLap: engine.previousLap,
    seekLap: engine.seekLap,
    setSpeed: engine.setSpeed,
  };
}
