import type {
  ActiveSector,
  LiveDriverState,
  LiveRaceState,
  RaceFlag,
  SessionStatus,
} from "@/lib/live";
import type {
  ReplayControlsState,
  ReplayEngine,
  ReplayEvent,
  ReplayPackage,
  ReplayPlaybackSpeed,
  ReplaySample,
} from "./types";

const DEFAULT_MS_PER_LAP = 4000;

type IndexedSample = ReplaySample & { cursor: number };

function sampleCursor(sample: ReplaySample): number {
  const t = sample.t ?? 0;
  return sample.lap - 1 + Math.min(1, Math.max(0, t));
}

function eventCursor(event: ReplayEvent): number {
  const t = event.t ?? 0;
  return event.lap - 1 + Math.min(1, Math.max(0, t));
}

function clampCursor(cursor: number, totalLaps: number): number {
  if (!Number.isFinite(cursor)) return 0;
  return Math.min(Math.max(0, cursor), totalLaps);
}

/** Shortest-path lerp on a unit circle (handles start/finish wrap). */
function lerpProgress(a: number, b: number, t: number): number {
  let delta = b - a;
  if (delta > 0.5) delta -= 1;
  if (delta < -0.5) delta += 1;
  const next = a + delta * t;
  return ((next % 1) + 1) % 1;
}

function sectorFromProgress(progress: number): ActiveSector {
  if (progress < 0.32) return 1;
  if (progress < 0.68) return 2;
  return 3;
}

function indexSamples(samples: ReplaySample[]): IndexedSample[] {
  return samples
    .map((sample) => ({ ...sample, cursor: sampleCursor(sample) }))
    .sort((a, b) => a.cursor - b.cursor);
}

function findSampleWindow(
  indexed: IndexedSample[],
  cursor: number
): { before: IndexedSample; after: IndexedSample | null; mix: number } {
  const first = indexed[0];
  if (!first) {
    throw new Error("ReplayEngine requires at least one sample");
  }

  if (cursor <= first.cursor) {
    return { before: first, after: null, mix: 0 };
  }

  let before = first;
  for (let i = 1; i < indexed.length; i += 1) {
    const sample = indexed[i];
    if (!sample) break;
    if (sample.cursor > cursor) {
      const span = sample.cursor - before.cursor;
      const mix = span > 0 ? (cursor - before.cursor) / span : 0;
      return { before, after: sample, mix };
    }
    before = sample;
  }

  return { before, after: null, mix: 0 };
}

function interpolateDrivers(
  before: IndexedSample,
  after: IndexedSample | null,
  mix: number,
  fractionInLap: number
): LiveDriverState[] {
  // Dense same-lap samples: interpolate recorded progress.
  if (after && before.lap === after.lap && mix > 0) {
    const afterByCode = new Map(after.drivers.map((d) => [d.code, d]));
    return before.drivers.map((driver) => {
      const match = afterByCode.get(driver.code);
      if (!match) {
        return {
          ...driver,
          progress: (driver.progress + fractionInLap) % 1,
        };
      }
      return {
        position: mix < 0.5 ? driver.position : match.position,
        code: driver.code,
        progress: lerpProgress(driver.progress, match.progress, mix),
        pit: mix < 0.5 ? driver.pit : match.pit,
      };
    });
  }

  // Sparse lap samples: advance evenly within the lap, preserve gaps.
  return before.drivers.map((driver) => ({
    ...driver,
    progress: (driver.progress + fractionInLap) % 1,
  }));
}

function applyEvents(
  base: {
    flag: RaceFlag;
    activeSector: ActiveSector;
    drivers: LiveDriverState[];
    raceFinished: boolean;
    sessionStatus: SessionStatus;
    fastestLap: LiveRaceState["fastestLap"];
  },
  events: ReplayEvent[],
  cursor: number
) {
  const next = { ...base, drivers: base.drivers.map((d) => ({ ...d })) };

  for (const event of events) {
    if (eventCursor(event) > cursor) continue;
    const payload = event.payload;

    switch (event.type) {
      case "flag":
      case "safety_car":
        if (payload?.flag) next.flag = payload.flag;
        else if (event.type === "safety_car") next.flag = "safety_car";
        break;
      case "sector":
        if (
          payload?.activeSector === 1 ||
          payload?.activeSector === 2 ||
          payload?.activeSector === 3 ||
          payload?.activeSector === null
        ) {
          next.activeSector = payload.activeSector;
        }
        break;
      case "pit":
        if (typeof payload?.code === "string") {
          next.drivers = next.drivers.map((driver) =>
            driver.code === payload.code
              ? { ...driver, pit: payload.pit !== false }
              : { ...driver, pit: false }
          );
        }
        break;
      case "finish":
        next.raceFinished = true;
        next.sessionStatus = "finished";
        break;
      default:
        break;
    }
  }

  return next;
}

function projectState(
  pkg: ReplayPackage,
  indexed: IndexedSample[],
  events: ReplayEvent[],
  cursor: number
): LiveRaceState {
  const totalLaps = pkg.totalLaps;
  const clamped = clampCursor(cursor, totalLaps);
  const { before, after, mix } = findSampleWindow(indexed, clamped);
  const fractionInLap = clamped - Math.floor(clamped);

  const drivers = interpolateDrivers(before, after, mix, fractionInLap);

  const leader = [...drivers].sort((a, b) => a.position - b.position)[0];

  let flag: RaceFlag = before.flag ?? "green";
  let activeSector: ActiveSector =
    before.activeSector ??
    (leader ? sectorFromProgress(leader.progress) : null);
  let fastestLap = before.fastestLap ?? null;
  let raceFinished = before.raceFinished ?? false;
  let sessionStatus: SessionStatus = before.sessionStatus ?? "live";

  if (after && before.lap === after.lap && mix > 0) {
    if (after.flag) flag = after.flag;
    if (after.activeSector !== undefined) activeSector = after.activeSector;
    if (after.fastestLap !== undefined) fastestLap = after.fastestLap;
    if (typeof after.raceFinished === "boolean") {
      raceFinished = after.raceFinished;
    }
    if (after.sessionStatus) sessionStatus = after.sessionStatus;
  }

  const withEvents = applyEvents(
    { flag, activeSector, drivers, raceFinished, sessionStatus, fastestLap },
    events,
    clamped
  );

  const lapNumber = Math.min(
    totalLaps,
    Math.max(1, Math.floor(clamped) + 1)
  );

  if (clamped >= totalLaps) {
    withEvents.raceFinished = true;
    withEvents.sessionStatus = "finished";
  }

  return {
    championship: pkg.sport,
    sessionStatus: withEvents.sessionStatus,
    lap: withEvents.raceFinished ? totalLaps : lapNumber,
    totalLaps,
    flag: withEvents.flag,
    activeSector: withEvents.activeSector,
    drivers: withEvents.drivers,
    raceFinished: withEvents.raceFinished,
    fastestLap: withEvents.fastestLap,
    progressSource: "replay",
  };
}

/**
 * Owns playback cursor and projects ReplayPackage → LiveRaceState.
 * Controls never talk to TrackMap; TrackMap never talks to the engine.
 */
export function createReplayEngine(pkg: ReplayPackage): ReplayEngine {
  const indexed = indexSamples(pkg.samples);
  const events = [...pkg.events].sort(
    (a, b) => eventCursor(a) - eventCursor(b)
  );
  const msPerLap = pkg.msPerLap ?? DEFAULT_MS_PER_LAP;
  const totalLaps = pkg.totalLaps;

  let cursor = 0;
  let playing = false;
  let speed: ReplayPlaybackSpeed = 1;
  let rafId: number | null = null;
  let lastTs: number | null = null;
  let destroyed = false;

  let raceSnapshot = projectState(pkg, indexed, events, cursor);
  const raceListeners = new Set<() => void>();
  const controlListeners = new Set<() => void>();

  function emitRace() {
    raceSnapshot = projectState(pkg, indexed, events, cursor);
    for (const listener of raceListeners) listener();
  }

  function emitControls() {
    for (const listener of controlListeners) listener();
  }

  function emitAll() {
    emitRace();
    emitControls();
  }

  function stopLoop() {
    if (rafId !== null && typeof cancelAnimationFrame !== "undefined") {
      cancelAnimationFrame(rafId);
    }
    rafId = null;
    lastTs = null;
  }

  function tick(ts: number) {
    if (destroyed || !playing) {
      stopLoop();
      return;
    }

    if (lastTs === null) {
      lastTs = ts;
    } else {
      const deltaMs = ts - lastTs;
      lastTs = ts;
      const advance = (deltaMs / msPerLap) * speed;
      cursor = clampCursor(cursor + advance, totalLaps);

      if (cursor >= totalLaps) {
        cursor = totalLaps;
        playing = false;
        stopLoop();
        emitAll();
        return;
      }

      emitAll();
    }

    if (typeof requestAnimationFrame !== "undefined") {
      rafId = requestAnimationFrame(tick);
    }
  }

  function ensureLoop() {
    if (
      destroyed ||
      !playing ||
      rafId !== null ||
      typeof requestAnimationFrame === "undefined"
    ) {
      return;
    }
    lastTs = null;
    rafId = requestAnimationFrame(tick);
  }

  function setCursor(next: number, resumePlay: boolean) {
    cursor = clampCursor(next, totalLaps);
    if (cursor >= totalLaps) {
      playing = false;
      stopLoop();
    } else if (resumePlay) {
      playing = true;
      ensureLoop();
    }
    emitAll();
  }

  return {
    play() {
      if (destroyed) return;
      if (cursor >= totalLaps) {
        cursor = 0;
      }
      playing = true;
      ensureLoop();
      emitControls();
    },
    pause() {
      if (destroyed) return;
      playing = false;
      stopLoop();
      emitControls();
    },
    restart() {
      if (destroyed) return;
      playing = false;
      stopLoop();
      setCursor(0, false);
    },
    nextLap() {
      if (destroyed) return;
      const currentLap = Math.floor(cursor) + 1;
      setCursor(Math.min(totalLaps, currentLap), false);
    },
    previousLap() {
      if (destroyed) return;
      const currentLap = Math.floor(cursor) + 1;
      setCursor(Math.max(0, currentLap - 2), false);
    },
    seekLap(lap: number) {
      if (destroyed) return;
      const target = Math.min(totalLaps, Math.max(1, Math.floor(lap)));
      setCursor(target - 1, false);
    },
    seek(lap: number, t = 0) {
      if (destroyed) return;
      const safeLap = Math.min(totalLaps, Math.max(1, Math.floor(lap)));
      const fraction = Math.min(1, Math.max(0, t));
      setCursor(safeLap - 1 + fraction, false);
    },
    setSpeed(next: ReplayPlaybackSpeed) {
      if (destroyed) return;
      speed = next;
      emitControls();
    },
    destroy() {
      destroyed = true;
      playing = false;
      stopLoop();
      raceListeners.clear();
      controlListeners.clear();
    },
    getControlsSnapshot(): ReplayControlsState {
      const lap = Math.min(
        totalLaps,
        Math.max(1, Math.floor(cursor) + 1)
      );
      return {
        playing,
        speed,
        lap: cursor >= totalLaps ? totalLaps : lap,
        totalLaps,
        cursor,
        finished: cursor >= totalLaps || Boolean(raceSnapshot?.raceFinished),
      };
    },
    subscribeControls(listener) {
      controlListeners.add(listener);
      return () => {
        controlListeners.delete(listener);
      };
    },
    getRaceSnapshot() {
      return raceSnapshot;
    },
    subscribeRace(listener) {
      raceListeners.add(listener);
      return () => {
        raceListeners.delete(listener);
      };
    },
  };
}
