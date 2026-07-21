import type { ReplayPackage } from "@/lib/replay/types";
import { compareByCursor } from "./cursor";
import {
  REPLAY_SCHEMA_VERSION,
  type ReplayTimeline,
} from "./types";

/**
 * Assemble a ReplayPackage from a source-neutral timeline.
 * Sorts samples / events / bookmarks; does not invent missing laps.
 */
export function assembleFromTimeline(timeline: ReplayTimeline): ReplayPackage {
  const samples = timeline.laps
    .map((lap) => ({
      lap: lap.lap,
      ...(lap.t !== undefined ? { t: lap.t } : {}),
      drivers: lap.drivers.map((driver) => ({ ...driver })),
      ...(lap.flag !== undefined ? { flag: lap.flag } : {}),
      ...(lap.activeSector !== undefined
        ? { activeSector: lap.activeSector }
        : {}),
      ...(lap.fastestLap !== undefined ? { fastestLap: lap.fastestLap } : {}),
      ...(lap.sessionStatus !== undefined
        ? { sessionStatus: lap.sessionStatus }
        : {}),
      ...(lap.raceFinished !== undefined
        ? { raceFinished: lap.raceFinished }
        : {}),
    }))
    .sort(compareByCursor);

  const events = [...(timeline.events ?? [])]
    .map((event) => ({ ...event }))
    .sort(compareByCursor);

  const bookmarks = [...(timeline.bookmarks ?? [])]
    .map((bookmark) => ({ ...bookmark }))
    .sort(compareByCursor);

  const pkg: ReplayPackage = {
    version: REPLAY_SCHEMA_VERSION,
    sport: timeline.sport,
    slug: timeline.slug,
    sessionKind: timeline.sessionKind,
    totalLaps: Math.floor(timeline.totalLaps),
    samples,
    events,
    bookmarks,
  };

  if (
    typeof timeline.msPerLap === "number" &&
    Number.isFinite(timeline.msPerLap) &&
    timeline.msPerLap > 0
  ) {
    pkg.msPerLap = timeline.msPerLap;
  }

  if (timeline.circuitSvgUrl) {
    pkg.circuitSvgUrl = timeline.circuitSvgUrl;
  }

  return pkg;
}
