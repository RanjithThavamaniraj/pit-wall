"use client";

import { useSyncExternalStore } from "react";
import type { LiveRaceProvider, LiveProviderId } from "./provider";
import { createMockProvider } from "./mockProvider";
import { createF1Provider } from "./f1Provider";
import { createMotoGpProvider } from "./motoGpProvider";
import type { Championship, LiveRaceState } from "./types";

const rawCache = new Map<LiveProviderId, LiveRaceProvider>();
const autoCache = new Map<Championship, LiveRaceProvider>();

function getRawProvider(id: LiveProviderId): LiveRaceProvider {
  const cached = rawCache.get(id);
  if (cached) return cached;

  const provider =
    id === "f1"
      ? createF1Provider()
      : id === "motogp"
      ? createMotoGpProvider()
      : createMockProvider();

  rawCache.set(id, provider);
  return provider;
}

/**
 * Prefers the championship live feed; falls back to mock when live is null.
 * Caches the resolved snapshot so getSnapshot stays referentially stable
 * between notifications (required by useSyncExternalStore).
 */
function getAutoProvider(championship: Championship): LiveRaceProvider {
  const cached = autoCache.get(championship);
  if (cached) return cached;

  const liveProvider =
    championship === "f1" ? getRawProvider("f1") : getRawProvider("motogp");
  const mockProvider = getRawProvider("mock");

  const listeners = new Set<(state: LiveRaceState | null) => void>();
  let snapshot: LiveRaceState | null = null;
  let liveUnsub: (() => void) | null = null;
  let mockUnsub: (() => void) | null = null;

  function recompute() {
    const live = liveProvider.getSnapshot();
    if (live && live.drivers.length > 0) {
      snapshot = live;
      return;
    }

    const mock = mockProvider.getSnapshot();
    if (!mock) {
      snapshot = null;
      return;
    }

    snapshot = {
      ...mock,
      championship,
      progressSource: "simulated",
    };
  }

  function emit() {
    recompute();
    for (const listener of listeners) listener(snapshot);
  }

  function ensureUpstream() {
    if (!liveUnsub) {
      liveUnsub = liveProvider.subscribe(() => emit());
    }
    if (!mockUnsub) {
      mockUnsub = mockProvider.subscribe(() => emit());
    }
  }

  function releaseUpstream() {
    if (listeners.size > 0) return;
    liveUnsub?.();
    liveUnsub = null;
    mockUnsub?.();
    mockUnsub = null;
  }

  const provider: LiveRaceProvider = {
    id: championship === "f1" ? "f1" : "motogp",
    subscribe(listener) {
      const wasEmpty = listeners.size === 0;
      listeners.add(listener);
      if (wasEmpty) ensureUpstream();
      recompute();
      listener(snapshot);
      return () => {
        listeners.delete(listener);
        releaseUpstream();
      };
    },
    getSnapshot() {
      return snapshot;
    },
  };

  autoCache.set(championship, provider);
  return provider;
}

/**
 * Subscribe to live race state for a championship.
 * TrackMap never calls APIs — selection + mock fallback live here.
 */
export function useLiveRaceState(
  championship: Championship = "f1"
): LiveRaceState | null {
  const provider = getAutoProvider(championship);

  return useSyncExternalStore(
    provider.subscribe,
    provider.getSnapshot,
    () => null
  );
}
