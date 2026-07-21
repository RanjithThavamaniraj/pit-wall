"use client";

import { useSyncExternalStore } from "react";
import type { LiveWeather } from "./types";

type WeatherKey = `${"f1" | "motogp"}:${string}`;

export type WeatherProvider = {
  key: WeatherKey;
  subscribe: (listener: (value: LiveWeather | null) => void) => () => void;
  getSnapshot: () => LiveWeather | null;
};

const cache = new Map<WeatherKey, WeatherProvider>();

const POLL_MS = 60_000;
const MAX_BACKOFF_MS = 30_000;

export function getWeatherProvider(key: WeatherKey): WeatherProvider {
  const existing = cache.get(key);
  if (existing) return existing;

  let snapshot: LiveWeather | null = null;
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let inFlight = false;
  let consecutiveFailures = 0;
  let nextAllowedAt = 0;
  let abortController: AbortController | null = null;
  const listeners = new Set<(value: LiveWeather | null) => void>();

  const [sport, weekendSlug] = key.split(":") as [
    "f1" | "motogp",
    string
  ];

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
      const res = await fetch(
        `/api/live/weather?sport=${encodeURIComponent(
          sport
        )}&weekendSlug=${encodeURIComponent(weekendSlug)}`,
        { cache: "no-store", signal: controller.signal }
      );

      if (!res.ok) {
        consecutiveFailures += 1;
        nextAllowedAt =
          Date.now() +
          Math.min(MAX_BACKOFF_MS, POLL_MS * 2 ** consecutiveFailures);
        return;
      }

      const json = (await res.json()) as { weather?: LiveWeather | null };
      if (controller.signal.aborted) return;

      consecutiveFailures = 0;
      nextAllowedAt = 0;

      // Keep last snapshot on null to avoid flicker.
      if (json.weather) snapshot = json.weather;
      notify();
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      consecutiveFailures += 1;
      nextAllowedAt =
        Date.now() +
        Math.min(MAX_BACKOFF_MS, POLL_MS * 2 ** consecutiveFailures);
    } finally {
      if (abortController === controller) inFlight = false;
    }
  }

  function ensurePolling() {
    if (intervalId !== null || typeof window === "undefined") return;
    void refresh();
    intervalId = setInterval(() => {
      void refresh();
    }, POLL_MS);
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

  const provider: WeatherProvider = {
    key,
    subscribe(listener) {
      listeners.add(listener);
      ensurePolling();
      listener(snapshot);
      return () => {
        listeners.delete(listener);
        stopIfIdle();
      };
    },
    getSnapshot() {
      return snapshot;
    },
  };

  cache.set(key, provider);
  return provider;
}

export function useLiveWeather(
  sport: "f1" | "motogp",
  weekendSlug: string
): LiveWeather | null {
  const provider = getWeatherProvider(`${sport}:${weekendSlug}`);
  return useSyncExternalStore(
    provider.subscribe,
    provider.getSnapshot,
    () => null
  );
}

