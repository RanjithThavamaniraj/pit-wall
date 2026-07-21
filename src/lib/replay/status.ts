import type { ReplayControlsState } from "@/lib/replay/types";

export type ReplayUiStatus =
  | "loading"
  | "ready"
  | "playing"
  | "paused"
  | "finished"
  | "unavailable";

export type ReplayStatusTone = "green" | "amber" | "red" | "blue" | "neutral";

export function deriveReplayStatus(options: {
  available: boolean;
  mapReady: boolean;
  controls: ReplayControlsState | null;
}): ReplayUiStatus {
  if (!options.available) return "unavailable";
  if (!options.mapReady || !options.controls) return "loading";
  if (options.controls.finished) return "finished";
  if (options.controls.playing) return "playing";
  if (options.controls.cursor > 0) return "paused";
  return "ready";
}

export function replayStatusLabel(status: ReplayUiStatus): string {
  switch (status) {
    case "loading":
      return "Loading Replay";
    case "ready":
      return "Replay Ready";
    case "playing":
      return "Playing";
    case "paused":
      return "Paused";
    case "finished":
      return "Finished";
    case "unavailable":
      return "Replay Not Available";
  }
}

export function replayStatusTone(status: ReplayUiStatus): ReplayStatusTone {
  switch (status) {
    case "playing":
      return "green";
    case "paused":
      return "amber";
    case "finished":
      return "blue";
    case "loading":
      return "neutral";
    case "ready":
      return "amber";
    case "unavailable":
      return "neutral";
  }
}
