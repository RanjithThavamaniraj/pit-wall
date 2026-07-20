import type { LiveRaceState } from "@/lib/live/types";

/** Lightweight runtime guard before shipping state to clients. */
export function isValidLiveRaceState(
  value: unknown
): value is LiveRaceState {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;

  if (v.championship !== "f1" && v.championship !== "motogp") return false;
  if (
    v.progressSource !== "gps" &&
    v.progressSource !== "timing" &&
    v.progressSource !== "simulated" &&
    v.progressSource !== "replay"
  ) {
    return false;
  }
  if (!Array.isArray(v.drivers) || v.drivers.length === 0) return false;
  if (typeof v.lap !== "number" || !Number.isFinite(v.lap)) return false;
  if (typeof v.totalLaps !== "number" || !Number.isFinite(v.totalLaps)) {
    return false;
  }
  if (typeof v.raceFinished !== "boolean") return false;

  for (const driver of v.drivers) {
    if (!driver || typeof driver !== "object") return false;
    const d = driver as Record<string, unknown>;
    if (typeof d.code !== "string" || !d.code) return false;
    if (typeof d.progress !== "number" || !Number.isFinite(d.progress)) {
      return false;
    }
    if (d.progress < 0 || d.progress > 1) return false;
    if (typeof d.pit !== "boolean") return false;
    if (d.position !== 1 && d.position !== 2 && d.position !== 3) return false;
  }

  return true;
}
