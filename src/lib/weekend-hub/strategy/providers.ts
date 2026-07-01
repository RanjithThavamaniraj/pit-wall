import type { StrategyContext, StrategyProvider, WeekendStrategy } from "./types";
import { buildWeekendStrategy } from "./generator";

const MOCK_LATENCY_MS = 350;

const mockProvider: StrategyProvider = {
  id: "mock",
  label: "Pit-Wall Strategy Engine",
  async generate(context: StrategyContext): Promise<WeekendStrategy> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(buildWeekendStrategy(context));
      }, MOCK_LATENCY_MS);
    });
  },
};

const notImplemented = (id: string, label: string): StrategyProvider => ({
  id,
  label,
  async generate(): Promise<WeekendStrategy> {
    throw new Error(
      `StrategyProvider "${id}" is registered as a stub. No live strategy API is wired yet.`
    );
  },
});

export const MOCK_STRATEGY_PROVIDER = mockProvider;
export const OPENAI_STRATEGY_PROVIDER = notImplemented("openai", "OpenAI");
export const GEMINI_STRATEGY_PROVIDER = notImplemented("gemini", "Gemini");
export const CLAUDE_STRATEGY_PROVIDER = notImplemented("claude", "Claude");
export const GLM_STRATEGY_PROVIDER = notImplemented("glm", "GLM");

export const DEFAULT_STRATEGY_PROVIDER_ID = "mock";