import type {
  WeekendContext,
  WeekendContextInput,
  WeekendContextProvider,
} from "./types";
import {
  MOCK_WEEKEND_CONTEXT_PROVIDER,
  OPENAI_WEEKEND_CONTEXT_PROVIDER,
  GEMINI_WEEKEND_CONTEXT_PROVIDER,
  CLAUDE_WEEKEND_CONTEXT_PROVIDER,
  GLM_WEEKEND_CONTEXT_PROVIDER,
} from "./providers";

const registry = new Map<string, WeekendContextProvider>([
  [MOCK_WEEKEND_CONTEXT_PROVIDER.id, MOCK_WEEKEND_CONTEXT_PROVIDER],
  [OPENAI_WEEKEND_CONTEXT_PROVIDER.id, OPENAI_WEEKEND_CONTEXT_PROVIDER],
  [GEMINI_WEEKEND_CONTEXT_PROVIDER.id, GEMINI_WEEKEND_CONTEXT_PROVIDER],
  [CLAUDE_WEEKEND_CONTEXT_PROVIDER.id, CLAUDE_WEEKEND_CONTEXT_PROVIDER],
  [GLM_WEEKEND_CONTEXT_PROVIDER.id, GLM_WEEKEND_CONTEXT_PROVIDER],
]);

let defaultProviderId = MOCK_WEEKEND_CONTEXT_PROVIDER.id;

export function registerWeekendContextProvider(
  provider: WeekendContextProvider
): void {
  registry.set(provider.id, provider);
}

export function getWeekendContextProvider(
  id: string
): WeekendContextProvider | undefined {
  return registry.get(id);
}

export function listWeekendContextProviderIds(): string[] {
  return [...registry.keys()];
}

export function setDefaultWeekendContextProvider(id: string): void {
  if (!registry.has(id)) {
    throw new Error(`Unknown weekend context provider: "${id}"`);
  }
  defaultProviderId = id;
}

export function getDefaultWeekendContextProvider(): WeekendContextProvider {
  const provider =
    registry.get(defaultProviderId) ?? MOCK_WEEKEND_CONTEXT_PROVIDER;
  return provider;
}

export type WeekendContextRequestKey = string;

function requestKey(
  input: WeekendContextInput,
  providerId: string
): WeekendContextRequestKey {
  return [
    providerId,
    input.sport,
    input.weekendSlug,
    input.phase ?? "auto",
    input.completedWeekendSlugs.join(","),
  ].join(":");
}

type CacheEntry = {
  promise: Promise<WeekendContext>;
};

const inflight = new Map<WeekendContextRequestKey, CacheEntry>();
const resolved = new Map<WeekendContextRequestKey, WeekendContext>();
const generationCount = new Map<WeekendContextRequestKey, number>();

/**
 * Resolve a `WeekendContext` through the active provider.
 *
 * Cached by `(provider, sport, slug, phase, slugs)` so SSR and repeat
 * renders don't recompute. Concurrent calls for the same key share
 * the inflight promise, mirroring the Story / Strategy / Driver
 * Intelligence engine registries.
 */
export function getWeekendContext(
  input: WeekendContextInput,
  providerId?: string
): Promise<WeekendContext> {
  const provider =
    (providerId
      ? getWeekendContextProvider(providerId)
      : undefined) ?? getDefaultWeekendContextProvider();
  const key = requestKey(input, provider.id);

  const cached = resolved.get(key);
  if (cached) return Promise.resolve(cached);

  const existing = inflight.get(key);
  if (existing) return existing.promise;

  const promise = provider.generate(input).then((context) => {
    resolved.set(key, context);
    inflight.delete(key);
    generationCount.set(
      key,
      (generationCount.get(key) ?? 0) + 1
    );
    return context;
  });

  inflight.set(key, { promise });
  return promise;
}

export function regenerateWeekendContext(
  input: WeekendContextInput,
  providerId?: string
): Promise<WeekendContext> {
  const provider =
    (providerId
      ? getWeekendContextProvider(providerId)
      : undefined) ?? getDefaultWeekendContextProvider();
  const key = requestKey(input, provider.id);

  inflight.delete(key);
  resolved.delete(key);

  return getWeekendContext(input, providerId);
}

export function clearWeekendContextCache(
  key?: WeekendContextRequestKey
): void {
  if (key) {
    inflight.delete(key);
    resolved.delete(key);
    return;
  }
  inflight.clear();
  resolved.clear();
}

export function hasCachedWeekendContext(
  input: WeekendContextInput
): boolean {
  const provider = getDefaultWeekendContextProvider();
  return resolved.has(requestKey(input, provider.id));
}

export function getWeekendContextGenerationCount(
  input: WeekendContextInput
): number {
  const provider = getDefaultWeekendContextProvider();
  return generationCount.get(requestKey(input, provider.id)) ?? 0;
}