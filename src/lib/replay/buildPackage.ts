import type {
  ActiveSector,
  Championship,
  FastestLap,
  LiveDriverState,
  RaceFlag,
  SessionStatus,
} from "@/lib/live";
import type {
  ReplayBookmark,
  ReplayBookmarkKind,
  ReplayEvent,
  ReplayEventType,
  ReplayPackage,
  ReplaySample,
  ReplaySessionKind,
} from "./types";

const SESSION_KINDS: ReadonlySet<string> = new Set([
  "practice",
  "qualifying",
  "sprint",
  "race",
]);

const BOOKMARK_KINDS: ReadonlySet<string> = new Set([
  "race_start",
  "half_distance",
  "safety_car",
  "overtake",
  "final_lap",
  "finish",
  "custom",
]);

const EVENT_TYPES: ReadonlySet<string> = new Set([
  "flag",
  "pit",
  "sector",
  "overtake",
  "safety_car",
  "finish",
  "bookmark",
]);

const FLAGS: ReadonlySet<string> = new Set([
  "green",
  "yellow",
  "vsc",
  "safety_car",
  "red",
]);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

function parseDriver(raw: unknown): LiveDriverState | null {
  if (!isObject(raw)) return null;
  if (typeof raw.code !== "string" || !raw.code) return null;
  if (typeof raw.progress !== "number" || !Number.isFinite(raw.progress)) {
    return null;
  }
  if (typeof raw.pit !== "boolean") return null;
  if (raw.position !== 1 && raw.position !== 2 && raw.position !== 3) {
    return null;
  }
  return {
    position: raw.position,
    code: raw.code,
    progress: clamp01(raw.progress),
    pit: raw.pit,
  };
}

function parseFlag(raw: unknown): RaceFlag | undefined {
  return typeof raw === "string" && FLAGS.has(raw)
    ? (raw as RaceFlag)
    : undefined;
}

function parseSector(raw: unknown): ActiveSector | undefined {
  if (raw === null) return null;
  if (raw === 1 || raw === 2 || raw === 3) return raw;
  return undefined;
}

function parseFastestLap(raw: unknown): FastestLap | undefined {
  if (raw === null) return null;
  if (!isObject(raw)) return undefined;
  if (typeof raw.code !== "string" || !raw.code) return undefined;
  if (typeof raw.time !== "string") return undefined;
  if (typeof raw.lap !== "number" || !Number.isFinite(raw.lap)) return undefined;
  return { code: raw.code, time: raw.time, lap: raw.lap };
}

function parseSessionStatus(raw: unknown): SessionStatus | undefined {
  if (
    raw === "upcoming" ||
    raw === "live" ||
    raw === "finished" ||
    raw === "suspended" ||
    raw === "cancelled"
  ) {
    return raw;
  }
  return undefined;
}

function parseSample(raw: unknown): ReplaySample | null {
  if (!isObject(raw)) return null;
  if (typeof raw.lap !== "number" || !Number.isFinite(raw.lap) || raw.lap < 1) {
    return null;
  }
  if (!Array.isArray(raw.drivers) || raw.drivers.length === 0) return null;

  const drivers: LiveDriverState[] = [];
  for (const entry of raw.drivers) {
    const driver = parseDriver(entry);
    if (!driver) return null;
    drivers.push(driver);
  }

  const sample: ReplaySample = {
    lap: Math.floor(raw.lap),
    drivers,
  };

  if (typeof raw.t === "number" && Number.isFinite(raw.t)) {
    sample.t = clamp01(raw.t);
  }

  const flag = parseFlag(raw.flag);
  if (flag) sample.flag = flag;

  const sector = parseSector(raw.activeSector);
  if (sector !== undefined) sample.activeSector = sector;

  const fastest = parseFastestLap(raw.fastestLap);
  if (fastest !== undefined) sample.fastestLap = fastest;

  const status = parseSessionStatus(raw.sessionStatus);
  if (status) sample.sessionStatus = status;

  if (typeof raw.raceFinished === "boolean") {
    sample.raceFinished = raw.raceFinished;
  }

  return sample;
}

function parseEvent(raw: unknown): ReplayEvent | null {
  if (!isObject(raw)) return null;
  if (typeof raw.id !== "string" || !raw.id) return null;
  if (typeof raw.lap !== "number" || !Number.isFinite(raw.lap) || raw.lap < 1) {
    return null;
  }
  if (typeof raw.type !== "string" || !EVENT_TYPES.has(raw.type)) return null;

  const event: ReplayEvent = {
    id: raw.id,
    lap: Math.floor(raw.lap),
    type: raw.type as ReplayEventType,
  };

  if (typeof raw.t === "number" && Number.isFinite(raw.t)) {
    event.t = clamp01(raw.t);
  }

  if (isObject(raw.payload)) {
    event.payload = raw.payload as ReplayEvent["payload"];
  }

  return event;
}

function parseBookmark(raw: unknown): ReplayBookmark | null {
  if (!isObject(raw)) return null;
  if (typeof raw.id !== "string" || !raw.id) return null;
  if (typeof raw.label !== "string" || !raw.label) return null;
  if (typeof raw.kind !== "string" || !BOOKMARK_KINDS.has(raw.kind)) {
    return null;
  }
  if (typeof raw.lap !== "number" || !Number.isFinite(raw.lap) || raw.lap < 1) {
    return null;
  }

  const bookmark: ReplayBookmark = {
    id: raw.id,
    kind: raw.kind as ReplayBookmarkKind,
    label: raw.label,
    lap: Math.floor(raw.lap),
  };

  if (typeof raw.t === "number" && Number.isFinite(raw.t)) {
    bookmark.t = clamp01(raw.t);
  }

  return bookmark;
}

/**
 * Normalize unknown JSON into a typed ReplayPackage.
 * Returns null when the payload is not a usable historical package.
 */
export function buildPackage(raw: unknown): ReplayPackage | null {
  if (!isObject(raw)) return null;
  if (raw.version !== 1) return null;
  if (raw.sport !== "f1" && raw.sport !== "motogp") return null;
  if (typeof raw.slug !== "string" || !raw.slug) return null;
  if (typeof raw.sessionKind !== "string" || !SESSION_KINDS.has(raw.sessionKind)) {
    return null;
  }
  if (
    typeof raw.totalLaps !== "number" ||
    !Number.isFinite(raw.totalLaps) ||
    raw.totalLaps < 1
  ) {
    return null;
  }
  if (!Array.isArray(raw.samples) || raw.samples.length === 0) return null;

  const samples: ReplaySample[] = [];
  for (const entry of raw.samples) {
    const sample = parseSample(entry);
    if (!sample) return null;
    samples.push(sample);
  }

  const events: ReplayEvent[] = [];
  if (Array.isArray(raw.events)) {
    for (const entry of raw.events) {
      const event = parseEvent(entry);
      if (!event) return null;
      events.push(event);
    }
  }

  const bookmarks: ReplayBookmark[] = [];
  if (Array.isArray(raw.bookmarks)) {
    for (const entry of raw.bookmarks) {
      const bookmark = parseBookmark(entry);
      if (!bookmark) return null;
      bookmarks.push(bookmark);
    }
  }

  const pkg: ReplayPackage = {
    version: 1,
    sport: raw.sport as Championship,
    slug: raw.slug,
    sessionKind: raw.sessionKind as ReplaySessionKind,
    totalLaps: Math.floor(raw.totalLaps),
    samples,
    events,
    bookmarks,
  };

  if (typeof raw.msPerLap === "number" && Number.isFinite(raw.msPerLap) && raw.msPerLap > 0) {
    pkg.msPerLap = raw.msPerLap;
  }

  if (typeof raw.circuitSvgUrl === "string" && raw.circuitSvgUrl) {
    pkg.circuitSvgUrl = raw.circuitSvgUrl;
  }

  return pkg;
}
