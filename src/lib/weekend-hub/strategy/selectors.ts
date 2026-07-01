import type { StrategyContext, WeekendStrategy, WatchForItem } from "./types";
import { buildWeekendStrategy } from "./generator";

export { buildWeekendStrategy } from "./generator";

export function generateWeekendStrategy(
  context: StrategyContext
): WeekendStrategy {
  return buildWeekendStrategy(context);
}

/** One-line headline summarising the predicted strategy shape. */
export function getStrategyHeadline(strategy: WeekendStrategy): string {
  return strategy.raceStrategy.predictedStrategy;
}

/** Watch-for items sorted by importance (low → high).
 *  Useful when the UI wants to feature the high-impact points first. */
export function rankWatchFor(
  items: WatchForItem[]
): WatchForItem[] {
  const rank = { high: 0, medium: 1, low: 2 } as const;
  return [...items].sort((a, b) => rank[a.importance] - rank[b.importance]);
}

/** Most-impactful watch-for item, or undefined when there is none. */
export function getTopWatchFor(
  strategy: WeekendStrategy
): WatchForItem | undefined {
  return rankWatchFor(strategy.watchFor)[0];
}

export function rainProbabilityPercent(strategy: WeekendStrategy): number {
  return Math.round(strategy.weather.rainProbability * 100);
}

export function safetyCarLikelihoodPercent(strategy: WeekendStrategy): number {
  return Math.round(strategy.raceFactors.safetyCarLikelihood * 100);
}