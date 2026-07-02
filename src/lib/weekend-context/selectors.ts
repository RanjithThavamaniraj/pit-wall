import type { WeekendContext } from "./types";
import { buildWeekendContext } from "./generator";

export { buildWeekendContext } from "./generator";

/**
 * Resolve the canonical weekend context.
 *
 * Thin async wrapper over `buildWeekendContext` so the registry can
 * dispatch to whichever provider is active.
 */
export async function fetchWeekendContext(
  input: Parameters<typeof buildWeekendContext>[0]
): Promise<WeekendContext> {
  return buildWeekendContext(input);
}

// ─── Pure selectors over a built context ─────────────────────────────────────

/** Top contender at index 0, or `undefined` when no contenders are present. */
export function getLeadingContender(
  context: WeekendContext
): WeekendContext["topContenders"][number] | undefined {
  return context.topContenders[0];
}

/** The named favourite, regardless of which engine sourced it. */
export function getFavourite(
  context: WeekendContext
): WeekendContext["favourite"] {
  return context.favourite;
}

/** Convenience accessor for the momentum leader (may be `undefined`). */
export function getMomentumLeader(context: WeekendContext) {
  return context.momentumLeader;
}

/** Convenience accessor for the strategy favourite (may be `undefined`). */
export function getStrategyFavourite(context: WeekendContext) {
  return context.strategyFavourite;
}

/** One-line headline from the story engine, suitable for the header. */
export function getHeadline(context: WeekendContext): string {
  return context.story.headline;
}

/** Editor-facing week focus. */
export function getWeekendFocus(context: WeekendContext): string {
  return context.story.weekendFocus;
}

/** Shared watch-for items already ranked and de-duplicated. */
export function getWatchFor(context: WeekendContext) {
  return context.watchFor;
}

/** True when at least one engine produced usable output. */
export function hasSignal(context: WeekendContext): boolean {
  return context.confidence !== "low";
}

/** Rain probability as a clean 0–100 integer. */
export function rainProbabilityPercent(context: WeekendContext): number {
  return Math.round(context.weather.rainProbability * 100);
}