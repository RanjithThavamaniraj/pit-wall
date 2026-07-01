import type { StoryContext, StoryProvider, WeekendStory } from "./types";
import { buildWeekendStory } from "./generator";

const MOCK_LATENCY_MS = 350;

const mockProvider: StoryProvider = {
  id: "mock",
  label: "Editorial Engine",
  async generate(context: StoryContext): Promise<WeekendStory> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(buildWeekendStory(context));
      }, MOCK_LATENCY_MS);
    });
  },
};

const notImplemented = (id: string, label: string): StoryProvider => ({
  id,
  label,
  async generate(): Promise<WeekendStory> {
    throw new Error(
      `StoryProvider "${id}" is registered as a stub. No live LLM API is wired yet.`
    );
  },
});

export const MOCK_STORY_PROVIDER = mockProvider;
export const OPENAI_STORY_PROVIDER = notImplemented("openai", "OpenAI");
export const GEMINI_STORY_PROVIDER = notImplemented("gemini", "Gemini");
export const CLAUDE_STORY_PROVIDER = notImplemented("claude", "Claude");
export const GLM_STORY_PROVIDER = notImplemented("glm", "GLM");

export const DEFAULT_STORY_PROVIDER_ID = "mock";