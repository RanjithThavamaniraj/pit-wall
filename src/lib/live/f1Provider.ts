import type { LiveRaceProvider } from "./provider";
import type { LiveRaceState } from "./types";

/**
 * Placeholder Formula 1 provider.
 * Returns the LiveRaceState interface; wire OpenF1 / timing APIs later.
 */
export function createF1Provider(): LiveRaceProvider {
  const state: LiveRaceState = {
    championship: "f1",
    sessionStatus: "upcoming",
    lap: 0,
    totalLaps: 0,
    flag: "green",
    activeSector: null,
    drivers: [],
    raceFinished: false,
    fastestLap: null,
  };

  return {
    id: "f1",
    subscribe(listener) {
      listener(state);
      return () => undefined;
    },
    getSnapshot() {
      return state;
    },
  };
}
