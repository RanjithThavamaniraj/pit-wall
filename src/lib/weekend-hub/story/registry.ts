import type { StoryContext, StoryProvider } from "./types";
import {
  MOCK_STORY_PROVIDER,
  OPENAI_STORY_PROVIDER,
  GEMINI_STORY_PROVIDER,
  CLAUDE_STORY_PROVIDER,
  GLM_STORY_PROVIDER,
} from "./providers";

const registry = new Map<string, StoryProvider>([
  [MOCK_STORY_PROVIDER.id, MOCK_STORY_PROVIDER],
  [OPENAI_STORY_PROVIDER.id, OPENAI_STORY_PROVIDER],
  [GEMINI_STORY_PROVIDER.id, GEMINI_STORY_PROVIDER],
  [CLAUDE_STORY_PROVIDER.id, CLAUDE_STORY_PROVIDER],
  [GLM_STORY_PROVIDER.id, GLM_STORY_PROVIDER],
]);

let defaultProviderId = MOCK_STORY_PROVIDER.id;

export function registerStoryProvider(provider: StoryProvider): void {
  registry.set(provider.id, provider);
}

export function getStoryProvider(id: string): StoryProvider | undefined {
  return registry.get(id);
}

export function listStoryProviderIds(): string[] {
  return [...registry.keys()];
}

export function setDefaultStoryProvider(id: string): void {
  if (!registry.has(id)) {
    throw new Error(`Unknown story provider: "${id}"`);
  }
  defaultProviderId = id;
}

export function getDefaultStoryProvider(): StoryProvider {
  const provider = registry.get(defaultProviderId) ?? MOCK_STORY_PROVIDER;
  return provider;
}

export type StoryRequestKey = string;

function storyRequestKey(context: StoryContext, providerId: string): StoryRequestKey {
  return `${providerId}:${context.sport}:${context.weekendSlug}:${context.phase}`;
}

type CacheEntry = {
  promise: Promise<import("./types").WeekendStory>;
};

const inflight = new Map<StoryRequestKey, CacheEntry>();
const resolved = new Map<StoryRequestKey, import("./types").WeekendStory>();
const generationCount = new Map<StoryRequestKey, number>();

export function getWeekendStory(
  context: StoryContext,
  providerId?: string
): Promise<import("./types").WeekendStory> {
  const provider =
    (providerId ? getStoryProvider(providerId) : undefined) ??
    getDefaultStoryProvider();
  const key = storyRequestKey(context, provider.id);

  const cached = resolved.get(key);
  if (cached) return Promise.resolve(cached);

  const existing = inflight.get(key);
  if (existing) return existing.promise;

  const promise = provider.generate(context).then((story) => {
    resolved.set(key, story);
    inflight.delete(key);
    generationCount.set(
      key,
      (generationCount.get(key) ?? 0) + 1
    );
    return story;
  });

  inflight.set(key, { promise });
  return promise;
}

export function regenerateWeekendStory(
  context: StoryContext,
  providerId?: string
): Promise<import("./types").WeekendStory> {
  const provider =
    (providerId ? getStoryProvider(providerId) : undefined) ??
    getDefaultStoryProvider();
  const key = storyRequestKey(context, provider.id);

  inflight.delete(key);
  resolved.delete(key);

  return getWeekendStory(context, providerId);
}

export function clearStoryCache(key?: StoryRequestKey): void {
  if (key) {
    inflight.delete(key);
    resolved.delete(key);
    return;
  }
  inflight.clear();
  resolved.clear();
}

export function hasCachedStory(context: StoryContext): boolean {
  const provider = getDefaultStoryProvider();
  return resolved.has(storyRequestKey(context, provider.id));
}

export function getStoryGenerationCount(context: StoryContext): number {
  const provider = getDefaultStoryProvider();
  return generationCount.get(storyRequestKey(context, provider.id)) ?? 0;
}