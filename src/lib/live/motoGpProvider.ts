import { LIVE_CACHE } from "@/lib/cache/live";
import { createPollingRaceProvider } from "./pollingProvider";
import type { LiveRaceProvider } from "./provider";

export function createMotoGpProvider(): LiveRaceProvider {
  return createPollingRaceProvider({
    id: "motogp",
    sport: "motogp",
    pollMs: LIVE_CACHE.MOTOGP_RACE_STATE_POLL_MS,
  });
}
