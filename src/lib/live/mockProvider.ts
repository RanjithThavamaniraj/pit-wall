import type { LiveRaceProvider } from "./provider";
import type {
  ActiveSector,
  LiveDriverState,
  LiveRaceState,
  RaceFlag,
} from "./types";

const TICK_MS = 2200;

function advanceProgress(current: number, delta: number): number {
  return (current + delta) % 1;
}

function createInitialState(): LiveRaceState {
  return {
    championship: "f1",
    sessionStatus: "live",
    lap: 12,
    totalLaps: 58,
    flag: "green",
    activeSector: 1,
    raceFinished: false,
    progressSource: "simulated",
    fastestLap: {
      code: "NOR",
      time: "1:12.448",
      lap: 9,
    },
    drivers: [
      { position: 1, code: "NOR", progress: 0.12, pit: false },
      { position: 2, code: "VER", progress: 0.08, pit: false },
      { position: 3, code: "LEC", progress: 0.04, pit: false },
    ],
  };
}

function pickFlag(tick: number, current: RaceFlag): RaceFlag {
  // Occasional incidents — keep mostly green
  if (tick % 47 === 0) return "red";
  if (tick % 31 === 0) return "safety_car";
  if (tick % 23 === 0) return "vsc";
  if (tick % 13 === 0) return "yellow";
  if (current !== "green" && tick % 5 === 0) return "green";
  return current;
}

function sectorFromProgress(progress: number): ActiveSector {
  if (progress < 0.32) return 1;
  if (progress < 0.68) return 2;
  return 3;
}

/**
 * Realistic local simulation for TrackMap development.
 * Moves P1–P3, advances lap, cycles sectors/flags, and occasional pits.
 */
export function createMockProvider(): LiveRaceProvider {
  let state = createInitialState();
  let tick = 0;
  let intervalId: ReturnType<typeof setInterval> | null = null;
  const listeners = new Set<(next: LiveRaceState | null) => void>();

  function emit() {
    for (const listener of listeners) listener(state);
  }

  function step() {
    if (state.raceFinished) return;

    tick += 1;
    const flag = pickFlag(tick, state.flag);
    const underCaution =
      flag === "yellow" ||
      flag === "vsc" ||
      flag === "safety_car" ||
      flag === "red";

    const speedScale = underCaution
      ? flag === "red"
        ? 0
        : flag === "safety_car"
        ? 0.35
        : 0.55
      : 1;

    const pitTick = tick % 37 === 0;
    const pitDriverIndex = pitTick ? tick % 3 : -1;

    const drivers: LiveDriverState[] = state.drivers.map((driver, index) => {
      const baseDelta =
        (0.028 - index * 0.004 + Math.sin(tick + index) * 0.004) * speedScale;
      const inPit = index === pitDriverIndex;
      return {
        ...driver,
        progress: inPit
          ? driver.progress
          : advanceProgress(driver.progress, Math.max(0, baseDelta)),
        pit: inPit,
      };
    });

    // Keep order roughly sensible — P1 slightly ahead
    drivers.sort((a, b) => b.progress - a.progress);
    const ranked = drivers.map((driver, index) => ({
      ...driver,
      position: (index + 1) as 1 | 2 | 3,
    }));

    const leader = ranked[0];
    const previousLeader = leader
      ? state.drivers.find((d) => d.code === leader.code)
      : undefined;
    const crossedLine =
      leader != null &&
      previousLeader != null &&
      leader.progress < 0.05 &&
      previousLeader.progress > 0.9;

    let lap = state.lap;
    if (crossedLine && !underCaution) {
      lap = Math.min(state.totalLaps, lap + 1);
    }

    const raceFinished = lap >= state.totalLaps && crossedLine;

    let fastestLap = state.fastestLap;
    if (tick % 41 === 0 && leader) {
      fastestLap = {
        code: leader.code,
        time: `1:1${(tick % 9) + 1}.${String(100 + (tick % 800)).slice(0, 3)}`,
        lap,
      };
    }

    state = {
      ...state,
      lap: raceFinished ? state.totalLaps : lap,
      flag: raceFinished ? "green" : flag,
      activeSector: leader ? sectorFromProgress(leader.progress) : null,
      drivers: ranked,
      sessionStatus: raceFinished ? "finished" : "live",
      raceFinished,
      fastestLap,
    };

    emit();
  }

  function ensureTicking() {
    if (intervalId !== null || typeof window === "undefined") return;
    intervalId = setInterval(step, TICK_MS);
  }

  function stopIfIdle() {
    if (listeners.size === 0 && intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  return {
    id: "mock",
    subscribe(listener) {
      listeners.add(listener);
      listener(state);
      ensureTicking();
      return () => {
        listeners.delete(listener);
        stopIfIdle();
      };
    },
    getSnapshot() {
      return state;
    },
  };
}
