export type {
  F1Compound,
  MotoGpCompound,
  PitStintPlan,
  PitStrategy,
  RaceFactors,
  RaceStrategy,
  StrategyConfidence,
  StrategyContext,
  StrategyProvider,
  StrategyProviderRegistration,
  StrategyProviderStatus,
  TyreStrategy,
  WatchForItem,
  WeatherForecast,
  WeekendStrategy,
} from "./types";

export {
  buildMockStrategyContext,
  buildMockWeekendStrategy,
} from "./mock";

export { buildWeekendStrategy } from "./generator";

export {
  generateWeekendStrategy,
  getStrategyHeadline,
  getTopWatchFor,
  rainProbabilityPercent,
  rankWatchFor,
  safetyCarLikelihoodPercent,
} from "./selectors";

export {
  CLAUDE_STRATEGY_PROVIDER,
  DEFAULT_STRATEGY_PROVIDER_ID,
  GEMINI_STRATEGY_PROVIDER,
  GLM_STRATEGY_PROVIDER,
  MOCK_STRATEGY_PROVIDER,
  OPENAI_STRATEGY_PROVIDER,
} from "./providers";

export {
  clearStrategyCache,
  getDefaultStrategyProvider,
  getStrategyGenerationCount,
  getStrategyProvider,
  getWeekendStrategy,
  hasCachedStrategy,
  listStrategyProviderIds,
  regenerateWeekendStrategy,
  registerStrategyProvider,
  setDefaultStrategyProvider,
  type StrategyRequestKey,
} from "./registry";