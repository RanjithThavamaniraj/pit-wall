import type { LiveProviderId, LiveRaceProvider } from "./provider";
import type { LiveRaceState } from "./types";
import { isValidLiveRaceState } from "./validateState";

type RaceStateResponse = {
  state: unknown;
  reason?: string;
};

type PollingOptions = {
  id: LiveProviderId;
  sport: "f1" | "motogp";
  pollMs: number;
};

const MAX_BACKOFF_MS = 30_000;

/**
 * Shared client poller for /api/live/race-state.
 * - Cancels in-flight requests before starting a new one
 * - Notifies on every completed refresh (including null → mock fallback)
 * - Backs off after failures; resets on success
 * - Clears timer + aborts when idle
 */
export function createPollingRaceProvider({
  id,
  sport,
  pollMs,
}: PollingOptions): LiveRaceProvider {
  let snapshot: LiveRaceState | null = null;
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let abortController: AbortController | null = null;
  let inFlight = false;
  let consecutiveFailures = 0;
  let nextAllowedAt = 0;
  const listeners = new Set<(state: LiveRaceState | null) => void>();

  function notify() {
    for (const listener of listeners) listener(snapshot);
  }

  async function refresh() {
    if (typeof window === "undefined") return;
    if (inFlight) return;
    if (Date.now() < nextAllowedAt) return;

    inFlight = true;
    abortController?.abort();
    const controller = new AbortController();
    abortController = controller;

    try {
      const res = await fetch(`/api/live/race-state?sport=${sport}`, {
        cache: "no-store",
        signal: controller.signal,
      });

      if (controller.signal.aborted) return;

      if (!res.ok) {
        consecutiveFailures += 1;
        nextAllowedAt =
          Date.now() +
          Math.min(MAX_BACKOFF_MS, pollMs * 2 ** consecutiveFailures);
        snapshot = null;
        notify();
        return;
      }

      const data = (await res.json()) as RaceStateResponse;
      if (controller.signal.aborted) return;

      const next =
        data.state && isValidLiveRaceState(data.state) ? data.state : null;
      consecutiveFailures = 0;
      nextAllowedAt = 0;
      snapshot = next;
      notify();
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      consecutiveFailures += 1;
      nextAllowedAt =
        Date.now() +
        Math.min(MAX_BACKOFF_MS, pollMs * 2 ** consecutiveFailures);
      snapshot = null;
      notify();
    } finally {
      if (abortController === controller) {
        inFlight = false;
      }
    }
  }

  function ensurePolling() {
    if (intervalId !== null || typeof window === "undefined") return;
    void refresh();
    intervalId = setInterval(() => {
      void refresh();
    }, pollMs);
  }

  function stopIfIdle() {
    if (listeners.size > 0) return;
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
    abortController?.abort();
    abortController = null;
    inFlight = false;
  }

  return {
    id,
    subscribe(listener) {
      listeners.add(listener);
      listener(snapshot);
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
