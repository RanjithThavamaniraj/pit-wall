import type { LiveEvent, LiveEventFeedInput } from "./types";
import { buildMockEvents, buildMockEventKey } from "./mock";

type CacheEntry = {
  promise: Promise<LiveEvent[]>;
};

const inflight = new Map<string, CacheEntry>();
const resolved = new Map<string, LiveEvent[]>();

const MOCK_LATENCY_MS = 350;

export function getLiveEvents(
  input: LiveEventFeedInput
): Promise<LiveEvent[]> {
  const key = buildMockEventKey(input);

  const cached = resolved.get(key);
  if (cached) return Promise.resolve(cached);

  const existing = inflight.get(key);
  if (existing) return existing.promise;

  const promise = new Promise<LiveEvent[]>((resolve) => {
    setTimeout(() => {
      const events = buildMockEvents(input);
      resolved.set(key, events);
      inflight.delete(key);
      resolve(events);
    }, MOCK_LATENCY_MS);
  });

  inflight.set(key, { promise });
  return promise;
}

export function clearLiveEventCache(key?: string): void {
  if (key) {
    inflight.delete(key);
    resolved.delete(key);
    return;
  }
  inflight.clear();
  resolved.clear();
}

export function hasCachedLiveEvents(input: LiveEventFeedInput): boolean {
  return resolved.has(buildMockEventKey(input));
}