"use client";

import { useSyncExternalStore } from "react";
import type { LiveRaceProvider, LiveProviderId } from "./provider";
import { createMockProvider } from "./mockProvider";
import { createF1Provider } from "./f1Provider";
import { createMotoGpProvider } from "./motoGpProvider";
import type { LiveRaceState } from "./types";

const providerCache = new Map<LiveProviderId, LiveRaceProvider>();

function getProvider(id: LiveProviderId): LiveRaceProvider {
  const cached = providerCache.get(id);
  if (cached) return cached;

  const provider =
    id === "f1"
      ? createF1Provider()
      : id === "motogp"
      ? createMotoGpProvider()
      : createMockProvider();

  providerCache.set(id, provider);
  return provider;
}

/**
 * Subscribe to a live race provider. TrackMap never calls APIs —
 * all fetching/simulation lives inside the selected provider.
 */
export function useLiveRaceState(
  providerId: LiveProviderId = "mock"
): LiveRaceState | null {
  const provider = getProvider(providerId);

  return useSyncExternalStore(
    provider.subscribe,
    provider.getSnapshot,
    () => null
  );
}
