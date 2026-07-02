import type {
  DriverIntelligenceBundle,
  DriverIntelligenceContext,
  DriverIntelligenceProvider,
} from "./types";
import {
  MOCK_DRIVER_INTELLIGENCE_PROVIDER,
  OPENAI_DRIVER_INTELLIGENCE_PROVIDER,
  GEMINI_DRIVER_INTELLIGENCE_PROVIDER,
  CLAUDE_DRIVER_INTELLIGENCE_PROVIDER,
  GLM_DRIVER_INTELLIGENCE_PROVIDER,
} from "./providers";

const registry = new Map<string, DriverIntelligenceProvider>([
  [MOCK_DRIVER_INTELLIGENCE_PROVIDER.id, MOCK_DRIVER_INTELLIGENCE_PROVIDER],
  [OPENAI_DRIVER_INTELLIGENCE_PROVIDER.id, OPENAI_DRIVER_INTELLIGENCE_PROVIDER],
  [GEMINI_DRIVER_INTELLIGENCE_PROVIDER.id, GEMINI_DRIVER_INTELLIGENCE_PROVIDER],
  [CLAUDE_DRIVER_INTELLIGENCE_PROVIDER.id, CLAUDE_DRIVER_INTELLIGENCE_PROVIDER],
  [GLM_DRIVER_INTELLIGENCE_PROVIDER.id, GLM_DRIVER_INTELLIGENCE_PROVIDER],
]);

let defaultProviderId = MOCK_DRIVER_INTELLIGENCE_PROVIDER.id;

export function registerDriverIntelligenceProvider(
  provider: DriverIntelligenceProvider
): void {
  registry.set(provider.id, provider);
}

export function getDriverIntelligenceProvider(
  id: string
): DriverIntelligenceProvider | undefined {
  return registry.get(id);
}

export function listDriverIntelligenceProviderIds(): string[] {
  return [...registry.keys()];
}

export function setDefaultDriverIntelligenceProvider(id: string): void {
  if (!registry.has(id)) {
    throw new Error(`Unknown driver intelligence provider: "${id}"`);
  }
  defaultProviderId = id;
}

export function getDefaultDriverIntelligenceProvider(): DriverIntelligenceProvider {
  const provider =
    registry.get(defaultProviderId) ?? MOCK_DRIVER_INTELLIGENCE_PROVIDER;
  return provider;
}

export type DriverIntelligenceRequestKey = string;

function requestKey(
  context: DriverIntelligenceContext,
  providerId: string
): DriverIntelligenceRequestKey {
  return `${providerId}:${context.sport}:${context.driverName ?? "*"}:${context.completedWeekendSlugs.join(",")}`;
}

type CacheEntry = {
  promise: Promise<DriverIntelligenceBundle>;
};

const inflight = new Map<DriverIntelligenceRequestKey, CacheEntry>();
const resolved = new Map<
  DriverIntelligenceRequestKey,
  DriverIntelligenceBundle
>();
const generationCount = new Map<DriverIntelligenceRequestKey, number>();

/**
 * Resolve a driver intelligence bundle through the active provider.
 *
 * Cached by (provider, sport, optional driver name, slug list) so SSR
 * and repeat renders don't recompute. Concurrent calls for the same key
 * share the inflight promise.
 */
export function getDriverIntelligence(
  context: DriverIntelligenceContext,
  providerId?: string
): Promise<DriverIntelligenceBundle> {
  const provider =
    (providerId
      ? getDriverIntelligenceProvider(providerId)
      : undefined) ?? getDefaultDriverIntelligenceProvider();
  const key = requestKey(context, provider.id);

  const cached = resolved.get(key);
  if (cached) return Promise.resolve(cached);

  const existing = inflight.get(key);
  if (existing) return existing.promise;

  const promise = provider.generate(context).then((bundle) => {
    resolved.set(key, bundle);
    inflight.delete(key);
    generationCount.set(
      key,
      (generationCount.get(key) ?? 0) + 1
    );
    return bundle;
  });

  inflight.set(key, { promise });
  return promise;
}

/** Force a fresh generation on the next call for this context. */
export function regenerateDriverIntelligence(
  context: DriverIntelligenceContext,
  providerId?: string
): Promise<DriverIntelligenceBundle> {
  const provider =
    (providerId
      ? getDriverIntelligenceProvider(providerId)
      : undefined) ?? getDefaultDriverIntelligenceProvider();
  const key = requestKey(context, provider.id);

  inflight.delete(key);
  resolved.delete(key);

  return getDriverIntelligence(context, providerId);
}

export function clearDriverIntelligenceCache(
  key?: DriverIntelligenceRequestKey
): void {
  if (key) {
    inflight.delete(key);
    resolved.delete(key);
    return;
  }
  inflight.clear();
  resolved.clear();
}

export function hasCachedDriverIntelligence(
  context: DriverIntelligenceContext
): boolean {
  const provider = getDefaultDriverIntelligenceProvider();
  return resolved.has(requestKey(context, provider.id));
}

export function getDriverIntelligenceGenerationCount(
  context: DriverIntelligenceContext
): number {
  const provider = getDefaultDriverIntelligenceProvider();
  return generationCount.get(requestKey(context, provider.id)) ?? 0;
}