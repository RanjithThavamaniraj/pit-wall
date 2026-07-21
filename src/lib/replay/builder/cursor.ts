import type { ReplayEvent, ReplaySample } from "@/lib/replay/types";

/** Continuous cursor used for ordering samples / events / bookmarks. */
export function replayCursor(lap: number, t = 0): number {
  const fraction = Math.min(1, Math.max(0, t));
  return lap - 1 + fraction;
}

export function sampleCursor(sample: Pick<ReplaySample, "lap" | "t">): number {
  return replayCursor(sample.lap, sample.t ?? 0);
}

export function eventCursor(event: Pick<ReplayEvent, "lap" | "t">): number {
  return replayCursor(event.lap, event.t ?? 0);
}

export function compareByCursor(
  a: { lap: number; t?: number },
  b: { lap: number; t?: number }
): number {
  return replayCursor(a.lap, a.t ?? 0) - replayCursor(b.lap, b.t ?? 0);
}
