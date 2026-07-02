import type {
  WeekendContext,
  WeekendContextInput,
  WeekendContextProvider,
} from "./types";
import { buildWeekendContext } from "./generator";

const MOCK_LATENCY_MS = 300;

const mockProvider: WeekendContextProvider = {
  id: "mock",
  label: "Weekend Context Orchestrator",
  async generate(
    input: WeekendContextInput
  ): Promise<WeekendContext> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(buildWeekendContext(input));
      }, MOCK_LATENCY_MS);
    });
  },
};

const notImplemented = (
  id: string,
  label: string
): WeekendContextProvider => ({
  id,
  label,
  async generate(): Promise<WeekendContext> {
    throw new Error(
      `WeekendContextProvider "${id}" is registered as a stub. No live orchestrator is wired yet.`
    );
  },
});

export const MOCK_WEEKEND_CONTEXT_PROVIDER = mockProvider;
export const OPENAI_WEEKEND_CONTEXT_PROVIDER = notImplemented(
  "openai",
  "OpenAI"
);
export const GEMINI_WEEKEND_CONTEXT_PROVIDER = notImplemented(
  "gemini",
  "Gemini"
);
export const CLAUDE_WEEKEND_CONTEXT_PROVIDER = notImplemented(
  "claude",
  "Claude"
);
export const GLM_WEEKEND_CONTEXT_PROVIDER = notImplemented("glm", "GLM");

export const DEFAULT_WEEKEND_CONTEXT_PROVIDER_ID = "mock";