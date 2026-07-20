import type { LiveRaceProvider } from "./provider";
import type { LiveRaceState } from "./types";

/**
 * Placeholder MotoGP provider.
 * Returns the LiveRaceState interface; wire PulseLive APIs later.
 */
export function createMotoGpProvider(): LiveRaceProvider {
  const state: LiveRaceState = {
    championship: "motogp",
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
    id: "motogp",
    subscribe(listener) {
      listener(state);
      return () => undefined;
    },
    getSnapshot() {
      return state;
    },
  };
}
