import type { WeekendPhase } from "@/lib/weekend-hub/types";
import { getWeekendIntelligence } from "@/lib/intelligence";
import {
  fetchDriverIntelligence,
  getTopProfile,
} from "@/lib/driver-intelligence";
import {
  getWeekendStrategy,
  rankWatchFor,
} from "@/lib/weekend-hub/strategy";
import {
  getWeekendStory,
  getStoryHeadline,
} from "@/lib/weekend-hub/story";
import type {
  IntelligenceEntry,
  WeekendIntelligence,
} from "@/lib/intelligence";
import type {
  DriverIntelligenceBundle,
} from "@/lib/driver-intelligence";
import type {
  WeekendStrategy,
} from "@/lib/weekend-hub/strategy";
import type {
  StoryContext,
  WeekendStory,
} from "@/lib/weekend-hub/story";
import type {
  ContextWatchForItem,
  MomentumLeader,
  StoryContextSummary,
  StrategyFavourite,
  TopContender,
  WeekendConfidence,
  WeekendContext,
  WeekendContextInput,
  WeekendFavourite,
  WeekendWeather,
} from "./types";

const TOP_CONTENDERS_COUNT = 5;
const MAX_WATCH_FOR = 5;
const MIN_WATCH_FOR = 3;
const OTHERS_LABEL = "Others";
const FIELD_LABEL = "Field";

function defaultPhase(): WeekendPhase {
  return "upcoming";
}

function toTopContender(entry: IntelligenceEntry): TopContender {
  return {
    name: entry.name,
    team: entry.team,
    percentage: entry.percentage,
    rawScore: entry.rawScore,
  };
}

function buildTopContenders(
  intelligence: WeekendIntelligence | null
): TopContender[] {
  if (!intelligence) return [];
  // Filter out both the "Others" bucket and the "Field" fallback sentinel
  // — neither represents a real contender derived from race data.
  const favourites = intelligence.entries.filter(
    (e) => e.name !== OTHERS_LABEL && e.name !== FIELD_LABEL
  );
  return favourites.slice(0, TOP_CONTENDERS_COUNT).map(toTopContender);
}

function deriveConfidence(
  bundles: {
    intelligence: WeekendIntelligence | null;
    drivers: DriverIntelligenceBundle | null;
    strategy: WeekendStrategy | null;
    story: WeekendStory | null;
  }
): WeekendConfidence {
  // Intelligence only counts as a signal when it produced real
  // contender entries — not just the "Field" fallback sentinel.
  const intelligenceHasRealEntries =
    bundles.intelligence !== null &&
    bundles.intelligence.entries.some(
      (e) => e.name !== OTHERS_LABEL && e.name !== FIELD_LABEL
    );

  const signals = [
    intelligenceHasRealEntries,
    bundles.drivers !== null && bundles.drivers.profiles.length > 0,
    bundles.strategy !== null,
    bundles.story !== null,
  ];
  const present = signals.filter(Boolean).length;
  if (present >= 3) return "high";
  if (present >= 2) return "medium";
  return "low";
}

function pickMomentumLeader(
  drivers: DriverIntelligenceBundle | null
): MomentumLeader | undefined {
  if (!drivers || drivers.profiles.length === 0) return undefined;
  const sorted = [...drivers.profiles].sort(
    (a, b) =>
      b.ratings.momentum - a.ratings.momentum ||
      a.name.localeCompare(b.name)
  );
  const top = sorted[0];
  return {
    name: top.name,
    team: top.team,
    momentum: top.ratings.momentum,
    profileId: top.id,
  };
}

function pickStrategyFavourite(
  strategy: WeekendStrategy | null,
  intelligence: WeekendIntelligence | null
): StrategyFavourite | undefined {
  if (!strategy) return undefined;

  const predicted = strategy.raceStrategy.predictedStrategy;
  const confidence = strategy.confidence;

  // Only name a competitor when Weekend Intelligence produced a real
  // entry — not just the "Field" or "Others" fallback sentinel.
  if (intelligence && intelligence.entries.length > 0) {
    const leader = intelligence.entries.find(
      (e) => e.name !== OTHERS_LABEL && e.name !== FIELD_LABEL
    );
    if (leader) {
      return {
        name: leader.name,
        confidence,
        predictedStrategy: predicted,
        reason: `Leading the field onto the ${predicted.toLowerCase()} shape.`,
      };
    }
  }

  // No real contender data — suppress rather than fabricate.
  return undefined;
}

function pickStorySummary(
  story: WeekendStory | null,
  weekendName: string,
  phase: WeekendPhase
): StoryContextSummary {
  if (!story) {
    return {
      headline: `${weekendName} preview`,
      keyNarrative: "Form is still being assembled for this weekend.",
      biggestQuestion: "Who will set the early benchmark?",
      weekendFocus:
        phase === "completed"
          ? "Post-race review"
          : phase === "cancelled"
          ? "Weekend status"
          : "Pre-weekend positioning",
    };
  }

  const headline = getStoryHeadline(story);

  // The story engine produces ordered sections. Use the primary section
  // body as the key narrative, and the lowest-importance section prompt
  // as the open question. Fallbacks stay deterministic.
  const sections = story.sections;
  const primary = sections.find((s) => s.importance === "primary") ??
    sections[0];
  const secondary = sections.find((s) => s.importance === "secondary") ??
    sections[1];

  const keyNarrative = primary?.content ?? story.subtitle;
  const biggestQuestion = secondary?.heading ?? "What will decide the weekend?";
  const weekendFocus = primary?.heading ?? headline;

  return {
    headline,
    keyNarrative,
    biggestQuestion,
    weekendFocus,
  };
}

function deriveWeather(
  strategy: WeekendStrategy | null
): WeekendWeather {
  if (strategy) {
    return {
      rainProbability: strategy.weather.rainProbability,
      trackEvolution: strategy.weather.trackEvolution,
      temperatureTrend: strategy.weather.temperatureTrend,
    };
  }
  return {
    rainProbability: 0,
    trackEvolution: "stable",
    temperatureTrend: "holding",
  };
}

function mergeWatchFor(
  strategy: WeekendStrategy | null,
  story: WeekendStory | null
): ContextWatchForItem[] {
  const items: ContextWatchForItem[] = [];

  if (strategy) {
    const ranked = rankWatchFor(strategy.watchFor);
    for (const item of ranked) {
      items.push({
        id: `strategy-${item.id}`,
        title: item.title,
        detail: item.detail,
        importance: item.importance,
      });
      if (items.length >= MAX_WATCH_FOR) break;
    }
  }

  if (story && items.length < MIN_WATCH_FOR) {
    for (const section of story.sections) {
      if (items.length >= MAX_WATCH_FOR) break;
      if (section.importance === "tertiary") continue;
      const id = `story-${section.id}`;
      if (items.some((i) => i.id === id)) continue;
      items.push({
        id,
        title: section.heading,
        detail: firstSentence(section.content),
        importance:
          section.importance === "primary" ? "high" : "medium",
      });
    }
  }

  return items.slice(0, MAX_WATCH_FOR);
}

function firstSentence(content: string): string {
  const trimmed = content.trim();
  const end = trimmed.search(/[.!?]/);
  if (end === -1) return trimmed;
  return trimmed.slice(0, end + 1);
}

function deriveFavourite(
  intelligence: WeekendIntelligence | null,
  drivers: DriverIntelligenceBundle | null,
  strategy: WeekendStrategy | null,
  story: WeekendStory | null
): WeekendFavourite {
  // Prefer Weekend Intelligence's top entry; fall back to the momentum
  // leader if no recent-form percentage was produced; fall back to a
  // strategy-confidence hint; finally to a story-derived hint. Only
  // name a competitor when the source engine has real data — never
  // promote the "Field" or "Others" fallback sentinel as a real pick.
  if (intelligence) {
    const lead = intelligence.entries.find(
      (e) => e.name !== OTHERS_LABEL && e.name !== FIELD_LABEL
    );
    if (lead) {
      return {
        name: lead.name,
        team: lead.team,
        basis: "weekend-intelligence",
        reason: `Top recent-form pick at ${lead.percentage}%.`,
        confidence: lead.percentage,
      };
    }
  }

  if (drivers) {
    const leader = getTopProfile(drivers);
    if (leader) {
      return {
        name: leader.name,
        team: leader.team,
        basis: "momentum",
        reason: `Highest momentum rating (${leader.ratings.momentum}/100).`,
        confidence: leader.ratings.momentum,
      };
    }
  }

  if (strategy && strategy.confidence === "high") {
    const shape = strategy.raceStrategy.predictedStrategy;
    return {
      name: "Field",
      basis: "strategy-confidence",
      reason: `High-confidence ${shape.toLowerCase()} shape predicted.`,
      confidence: 0,
    };
  }

  if (story) {
    const primary = story.sections.find((s) => s.importance === "primary");
    if (primary) {
      return {
        name: "Field",
        basis: "story",
        reason: primary.heading,
        confidence: 0,
      };
    }
  }

  return {
    name: "Field",
    basis: "weekend-intelligence",
    reason: "Form is still being assembled.",
    confidence: 0,
  };
}

/**
 * Build a `WeekendContext` by orchestrating the existing intelligence
 * engines. Reuses already-resolved outputs in `input.preResolved` when
 * available; otherwise resolves them through each engine's registry.
 */
export async function buildWeekendContext(
  input: WeekendContextInput
): Promise<WeekendContext> {
  const phase = input.phase ?? defaultPhase();

  // ─── Resolve or reuse each engine ───────────────────────────────────────
  const intelligence: WeekendIntelligence | null =
    input.preResolved?.weekendIntelligence ??
    (await safeResolve(() =>
      getWeekendIntelligence(input.sport, input.completedWeekendSlugs)
    ));

  const drivers: DriverIntelligenceBundle | null =
    input.preResolved?.driverIntelligence ??
    (await safeResolve(() =>
      fetchDriverIntelligence({
        sport: input.sport,
        completedWeekendSlugs: input.completedWeekendSlugs,
      })
    ));

  const strategyContext = {
    sport: input.sport,
    weekendSlug: input.weekendSlug,
    weekendName: input.weekendName,
    phase,
    sessions: input.sessions ?? [],
    isSprintWeekend: input.isSprintWeekend,
  };
  const strategy: WeekendStrategy | null =
    input.preResolved?.strategy ??
    (await safeResolve(() =>
      getWeekendStrategy(strategyContext, input.providerIds?.strategy)
    ));

  const storyContext: StoryContext = {
    sport: input.sport,
    weekendSlug: input.weekendSlug,
    weekendName: input.weekendName,
    phase,
    sessions: input.sessions ?? [],
    isSprintWeekend: input.isSprintWeekend,
  };
  const story: WeekendStory | null =
    input.preResolved?.story ??
    (await safeResolve(() =>
      getWeekendStory(storyContext, input.providerIds?.story)
    ));

  // ─── Synthesise the shared context ─────────────────────────────────────
  const topContenders = buildTopContenders(intelligence);
  const momentumLeader = pickMomentumLeader(drivers);
  const strategyFavourite = pickStrategyFavourite(strategy, intelligence);
  const storySummary = pickStorySummary(story, input.weekendName, phase);
  const weather = deriveWeather(strategy);
  const watchFor = mergeWatchFor(strategy, story);
  const favourite = deriveFavourite(intelligence, drivers, strategy, story);
  const confidence = deriveConfidence({
    intelligence,
    drivers,
    strategy,
    story,
  });

  return {
    sport: input.sport,
    weekendSlug: input.weekendSlug,
    weekendName: input.weekendName,
    generatedAt: new Date().toISOString(),
    phase,
    isSprintWeekend: input.isSprintWeekend,
    topContenders,
    favourite,
    momentumLeader,
    strategyFavourite,
    story: storySummary,
    weather,
    confidence,
    watchFor,
    sources: {
      weekendIntelligence: intelligence,
      driverIntelligence: drivers,
      strategy,
      story,
    },
  };
}

async function safeResolve<T>(
  run: () => Promise<T>
): Promise<T | null> {
  try {
    return await run();
  } catch {
    return null;
  }
}