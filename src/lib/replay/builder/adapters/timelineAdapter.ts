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
  ReplayEvent,
  ReplaySessionKind,
} from "@/lib/replay/types";
import type {
  AdapterResult,
  BuildContext,
  ReplaySourceAdapter,
  ReplayTimeline,
  ReplayTimelineLap,
} from "../types";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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
    progress: raw.progress,
    pit: raw.pit,
  };
}

function parseLap(raw: unknown): ReplayTimelineLap | null {
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

  const lap: ReplayTimelineLap = { lap: Math.floor(raw.lap), drivers };

  if (typeof raw.t === "number" && Number.isFinite(raw.t)) lap.t = raw.t;
  if (typeof raw.flag === "string") lap.flag = raw.flag as RaceFlag;
  if (
    raw.activeSector === 1 ||
    raw.activeSector === 2 ||
    raw.activeSector === 3 ||
    raw.activeSector === null
  ) {
    lap.activeSector = raw.activeSector as ActiveSector;
  }
  if (raw.fastestLap === null || isObject(raw.fastestLap)) {
    lap.fastestLap = raw.fastestLap as FastestLap;
  }
  if (typeof raw.sessionStatus === "string") {
    lap.sessionStatus = raw.sessionStatus as SessionStatus;
  }
  if (typeof raw.raceFinished === "boolean") {
    lap.raceFinished = raw.raceFinished;
  }

  return lap;
}

/**
 * Canonical timeline JSON adapter.
 * Preferred interchange format for future historical providers.
 */
export const timelineAdapter: ReplaySourceAdapter = {
  id: "timeline",
  label: "Canonical ReplayTimeline JSON",
  async build(input: unknown, context: BuildContext): Promise<AdapterResult> {
    if (!isObject(input)) {
      return { ok: false, reason: "timeline input must be an object" };
    }

    const sport = (input.sport as Championship | undefined) ?? context.sport;
    const slug = (input.slug as string | undefined) ?? context.slug;
    const sessionKind =
      (input.sessionKind as ReplaySessionKind | undefined) ??
      context.sessionKind ??
      "race";

    if (sport !== context.sport || slug !== context.slug) {
      return {
        ok: false,
        reason: `timeline sport/slug ${sport}/${slug} does not match context ${context.sport}/${context.slug}`,
      };
    }

    if (
      typeof input.totalLaps !== "number" ||
      !Number.isFinite(input.totalLaps) ||
      input.totalLaps < 1
    ) {
      return {
        ok: false,
        reason: "timeline.totalLaps is required and must be >= 1",
      };
    }

    if (!Array.isArray(input.laps) || input.laps.length === 0) {
      return {
        ok: false,
        reason:
          "timeline.laps is required and must be non-empty — refusing to fabricate lap progress",
      };
    }

    const laps: ReplayTimelineLap[] = [];
    for (const entry of input.laps) {
      const lap = parseLap(entry);
      if (!lap) {
        return {
          ok: false,
          reason: "timeline.laps contains an invalid lap sample",
        };
      }
      laps.push(lap);
    }

    const timeline: ReplayTimeline = {
      sport,
      slug,
      sessionKind,
      totalLaps: Math.floor(input.totalLaps),
      laps,
    };

    if (typeof input.msPerLap === "number" && input.msPerLap > 0) {
      timeline.msPerLap = input.msPerLap;
    }

    if (typeof input.circuitSvgUrl === "string" && input.circuitSvgUrl) {
      timeline.circuitSvgUrl = input.circuitSvgUrl;
    } else if (context.circuitSvgUrl) {
      timeline.circuitSvgUrl = context.circuitSvgUrl;
    }

    if (Array.isArray(input.events)) {
      timeline.events = input.events as ReplayEvent[];
    }

    if (Array.isArray(input.bookmarks)) {
      timeline.bookmarks = input.bookmarks as ReplayBookmark[];
    }

    return { ok: true, timeline };
  },
};
