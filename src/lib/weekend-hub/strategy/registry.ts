import type { StrategyContext, StrategyProvider } from "./types";
import {
  MOCK_STRATEGY_PROVIDER,
  OPENAI_STRATEGY_PROVIDER,
  GEMINI_STRATEGY_PROVIDER,
  CLAUDE_STRATEGY_PROVIDER,
  GLM_STRATEGY_PROVIDER,
} from "./providers";

const registry = new Map<string, StrategyProvider>([
  [MOCK_STRATEGY_PROVIDER.id, MOCK_STRATEGY_PROVIDER],
  [OPENAI_STRATEGY_PROVIDER.id, OPENAI_STRATEGY_PROVIDER],
  [GEMINI_STRATEGY_PROVIDER.id, GEMINI_STRATEGY_PROVIDER],
  [CLAUDE_STRATEGY_PROVIDER.id, CLAUDE_STRATEGY_PROVIDER],
  [GLM_STRATEGY_PROVIDER.id, GLM_STRATEGY_PROVIDER],
]);

let defaultProviderId = MOCK_STRATEGY_PROVIDER.id;

export function registerStrategyProvider(provider: StrategyProvider): void {
  registry.set(provider.id, provider);
}

export function getStrategyProvider(id: string): StrategyProvider | undefined {
  return registry.get(id);
}

export function listStrategyProviderIds(): string[] {
  return [...registry.keys()];
}

export function setDefaultStrategyProvider(id: string): void {
  if (!registry.has(id)) {
    throw new Error(`Unknown strategy provider: "${id}"`);
  }
  defaultProviderId = id;
}

export function getDefaultStrategyProvider(): StrategyProvider {
  const provider =
    registry.get(defaultProviderId) ?? MOCK_STRATEGY_PROVIDER;
  return provider;
}

export type StrategyRequestKey = string;

function strategyRequestKey(
  context: StrategyContext,
  providerId: string
): StrategyRequestKey {
  return `${providerId}:${context.sport}:${context.weekendSlug}:${context.phase}`;
}

type CacheEntry = {
  promise: Promise<import("./types").WeekendStrategy>;
};

const inflight = new Map<StrategyRequestKey, CacheEntry>();
const resolved = new Map<
  StrategyRequestKey,
  import("./types").WeekendStrategy
>();
const generationCount = new Map<StrategyRequestKey, number>();

export function getWeekendStrategy(
  context: StrategyContext,
  providerId?: string
): Promise<import("./types").WeekendStrategy> {
  const provider =
    (providerId ? getStrategyProvider(providerId) : undefined) ??
    getDefaultStrategyProvider();
  const key = strategyRequestKey(context, provider.id);

  const cached = resolved.get(key);
  if (cached) return Promise.resolve(cached);

  const existing = inflight.get(key);
  if (existing) return existing.promise;

  const promise = provider.generate(context).then((strategy) => {
    resolved.set(key, strategy);
    inflight.delete(key);
    generationCount.set(
      key,
      (generationCount.get(key) ?? 0) + 1
    );
    return strategy;
  });

  inflight.set(key, { promise });
  return promise;
}

export function regenerateWeekendStrategy(
  context: StrategyContext,
  providerId?: string
): Promise<import("./types").WeekendStrategy> {
  const provider =
    (providerId ? getStrategyProvider(providerId) : undefined) ??
    getDefaultStrategyProvider();
  const key = strategyRequestKey(context, provider.id);

  inflight.delete(key);
  resolved.delete(key);

  return getWeekendStrategy(context, providerId);
}

export function clearStrategyCache(key?: StrategyRequestKey): void {
  if (key) {
    inflight.delete(key);
    resolved.delete(key);
    return;
  }
  inflight.clear();
  resolved.clear();
}

export function hasCachedStrategy(context: StrategyContext): boolean {
  const provider = getDefaultStrategyProvider();
  return resolved.has(strategyRequestKey(context, provider.id));
}

export function getStrategyGenerationCount(
  context: StrategyContext
): number {
  const provider = getDefaultStrategyProvider();
  return (
    generationCount.get(strategyRequestKey(context, provider.id)) ?? 0
  );
}