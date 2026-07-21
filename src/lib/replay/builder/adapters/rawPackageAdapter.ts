import { buildPackage } from "@/lib/replay/buildPackage";
import type { ReplayPackage } from "@/lib/replay/types";
import type {
  AdapterResult,
  BuildContext,
  ReplaySourceAdapter,
  ReplayTimeline,
} from "../types";

function packageToTimeline(pkg: ReplayPackage): ReplayTimeline {
  return {
    sport: pkg.sport,
    slug: pkg.slug,
    sessionKind: pkg.sessionKind,
    totalLaps: pkg.totalLaps,
    ...(pkg.msPerLap !== undefined ? { msPerLap: pkg.msPerLap } : {}),
    ...(pkg.circuitSvgUrl !== undefined
      ? { circuitSvgUrl: pkg.circuitSvgUrl }
      : {}),
    laps: pkg.samples.map((sample) => ({
      lap: sample.lap,
      ...(sample.t !== undefined ? { t: sample.t } : {}),
      drivers: sample.drivers,
      ...(sample.flag !== undefined ? { flag: sample.flag } : {}),
      ...(sample.activeSector !== undefined
        ? { activeSector: sample.activeSector }
        : {}),
      ...(sample.fastestLap !== undefined
        ? { fastestLap: sample.fastestLap }
        : {}),
      ...(sample.sessionStatus !== undefined
        ? { sessionStatus: sample.sessionStatus }
        : {}),
      ...(sample.raceFinished !== undefined
        ? { raceFinished: sample.raceFinished }
        : {}),
    })),
    events: pkg.events,
    bookmarks: pkg.bookmarks,
  };
}

/**
 * Accepts an already-shaped ReplayPackage (or buildPackage-compatible JSON).
 * Useful for hand-authored or migrated content.
 */
export const rawPackageAdapter: ReplaySourceAdapter = {
  id: "raw",
  label: "Raw ReplayPackage JSON",
  async build(input: unknown, context: BuildContext): Promise<AdapterResult> {
    const pkg = buildPackage(input);
    if (!pkg) {
      return {
        ok: false,
        reason: "input is not a structurally valid ReplayPackage",
      };
    }

    if (pkg.sport !== context.sport || pkg.slug !== context.slug) {
      return {
        ok: false,
        reason: `package sport/slug ${pkg.sport}/${pkg.slug} does not match context ${context.sport}/${context.slug}`,
      };
    }

    return { ok: true, timeline: packageToTimeline(pkg) };
  },
};
