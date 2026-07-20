import type { ReplayEngine, ReplayRaceProvider } from "./types";

/**
 * Adapts ReplayEngine to the shared LiveRaceState provider contract.
 * Independent from the live → mock auto-selection graph.
 */
export function createReplayProvider(
  engine: ReplayEngine
): ReplayRaceProvider {
  return {
    id: "replay",
    subscribe(listener) {
      const notify = () => {
        listener(engine.getRaceSnapshot());
      };
      notify();
      return engine.subscribeRace(notify);
    },
    getSnapshot() {
      return engine.getRaceSnapshot();
    },
  };
}
