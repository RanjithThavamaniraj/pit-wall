import type {
  DriverIntelligenceBundle,
  DriverIntelligenceContext,
  DriverIntelligenceProvider,
} from "./types";
import { fetchDriverIntelligence } from "./selectors";

const MOCK_LATENCY_MS = 350;

const mockProvider: DriverIntelligenceProvider = {
  id: "mock",
  label: "Driver Intelligence Engine",
  async generate(
    context: DriverIntelligenceContext
  ): Promise<DriverIntelligenceBundle> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(fetchDriverIntelligence(context));
      }, MOCK_LATENCY_MS);
    });
  },
};

const notImplemented = (
  id: string,
  label: string
): DriverIntelligenceProvider => ({
  id,
  label,
  async generate(): Promise<DriverIntelligenceBundle> {
    throw new Error(
      `DriverIntelligenceProvider "${id}" is registered as a stub. No live driver-intelligence API is wired yet.`
    );
  },
});

export const MOCK_DRIVER_INTELLIGENCE_PROVIDER = mockProvider;
export const OPENAI_DRIVER_INTELLIGENCE_PROVIDER = notImplemented(
  "openai",
  "OpenAI"
);
export const GEMINI_DRIVER_INTELLIGENCE_PROVIDER = notImplemented(
  "gemini",
  "Gemini"
);
export const CLAUDE_DRIVER_INTELLIGENCE_PROVIDER = notImplemented(
  "claude",
  "Claude"
);
export const GLM_DRIVER_INTELLIGENCE_PROVIDER = notImplemented("glm", "GLM");

export const DEFAULT_DRIVER_INTELLIGENCE_PROVIDER_ID = "mock";

// Re-export config so callers tuning the mock don't need to reach into
// the generator module directly.
export { DEFAULT_DRIVER_INTELLIGENCE_CONFIG } from "./generator";