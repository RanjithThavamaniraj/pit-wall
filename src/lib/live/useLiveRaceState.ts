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
 * Prefers the championship's live feed; falls back to mock when the live
 * provider has no session data or has failed.
 */
function getAutoProvider(championship: Championship): LiveRaceProvider {
  const cached = autoCache.get(championship);
  if (cached) return cached;

  const liveProvider =
    championship === "f1" ? getRawProvider("f1") : getRawProvider("motogp");
  const mockProvider = getRawProvider("mock");
  const listeners = new Set<(state: LiveRaceState) => void>();

  function resolve(): LiveRaceState | null {
    const live = liveProvider.getSnapshot();
    if (live && live.drivers.length > 0) return live;

    const mock = mockProvider.getSnapshot();
    if (!mock) return null;

    return {
      ...mock,
      championship,
      progressSource: "simulated",
    };
  }

  function emit() {
    const next = resolve();
    if (!next) return;
    for (const listener of listeners) listener(next);
  }

  liveProvider.subscribe(() => emit());
  mockProvider.subscribe(() => emit());

  const provider: LiveRaceProvider = {
    id: championship === "f1" ? "f1" : "motogp",
    subscribe(listener) {
      listeners.add(listener);
      const current = resolve();
      if (current) listener(current);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: resolve,
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
