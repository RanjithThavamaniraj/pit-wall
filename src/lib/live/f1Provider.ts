import { LIVE_CACHE } from "@/lib/cache/live";
import { createPollingRaceProvider } from "./pollingProvider";
import type { LiveRaceProvider } from "./provider";

export function createF1Provider(): LiveRaceProvider {
  return createPollingRaceProvider({
    id: "f1",
    sport: "f1",
    pollMs: LIVE_CACHE.F1_RACE_STATE_POLL_MS,
  });
}
