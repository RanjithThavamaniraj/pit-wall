import { LIVE_CACHE } from "@/lib/cache/live";
import type { LiveRaceProvider } from "./provider";
import type { LiveRaceState } from "./types";

type RaceStateResponse = {
  state: LiveRaceState | null;
  reason?: string;
};

/**
 * Client-side MotoGP provider — polls the server race-state aggregator.
 * PulseLive I/O and timing-based progress stay on the server.
 */
export function createMotoGpProvider(): LiveRaceProvider {
  let snapshot: LiveRaceState | null = null;
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let inFlight = false;
  const listeners = new Set<(state: LiveRaceState) => void>();

  async function refresh() {
    if (inFlight || typeof window === "undefined") return;
    inFlight = true;
    try {
      const res = await fetch("/api/live/race-state?sport=motogp", {
        cache: "no-store",
      });
      if (!res.ok) {
        snapshot = null;
        return;
      }
      const data = (await res.json()) as RaceStateResponse;
      snapshot = data.state;
      if (snapshot) {
        for (const listener of listeners) listener(snapshot);
      }
    } catch {
      snapshot = null;
    } finally {
      inFlight = false;
    }
  }

  function ensurePolling() {
    if (intervalId !== null || typeof window === "undefined") return;
    void refresh();
    intervalId = setInterval(refresh, LIVE_CACHE.MOTOGP_RACE_STATE_POLL_MS);
  }

  function stopIfIdle() {
    if (listeners.size === 0 && intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  return {
    id: "motogp",
    subscribe(listener) {
      listeners.add(listener);
      if (snapshot) listener(snapshot);
      ensurePolling();
      return () => {
        listeners.delete(listener);
        stopIfIdle();
      };
    },
    getSnapshot() {
      return snapshot;
    },
  };
}
