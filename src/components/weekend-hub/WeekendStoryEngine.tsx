"use client";

import { useEffect, useMemo, useState } from "react";
import { GlassCard, Skeleton, StatusPill } from "@/components/ui";
import {
  deriveWeekendPhase,
  type EventTone,
} from "@/lib/weekend-hub";
import type {
  HubSession,
  HubSport,
  WeekendHubData,
  WeekendPhase,
} from "@/lib/weekend-hub";
import type { RaceWeekendSummary } from "@/lib/race-summary/types";
import type { LiveEvent } from "@/lib/weekend-hub/events";
import {
  getStoryHeadline,
  getWeekendStory,
  regenerateWeekendStory,
  type StoryContext,
  type WeekendStory,
} from "@/lib/weekend-hub/story";
import { formatLocalTimeOnly } from "@/lib/utils";
import { StoryCard } from "./StoryCard";

type Props = {
  sport: HubSport;
  weekendSlug: string;
  weekendName: string;
  phase?: WeekendPhase;
  sessions?: HubSession[];
  data?: WeekendHubData;
  liveEvents?: LiveEvent[];
  summary?: RaceWeekendSummary | null;
  isSprintWeekend?: boolean;
  providerId?: string;
  headingId?: string;
  className?: string;
};

function phaseOrDerived(
  phase: WeekendPhase | undefined,
  data: WeekendHubData | undefined
): WeekendPhase {
  if (phase) return phase;
  if (data) return deriveWeekendPhase(data);
  return "upcoming";
}

function phaseHeaderTone(phase: WeekendPhase): EventTone {
  switch (phase) {
    case "live":
      return "red";
    case "completed":
      return "neutral";
    case "cancelled":
      return "amber";
    case "upcoming":
      return "green";
  }
}

function phaseHeaderLabel(phase: WeekendPhase): string {
  switch (phase) {
    case "live":
      return "Live";
    case "completed":
      return "Recap";
    case "cancelled":
      return "Status";
    case "upcoming":
      return "Preview";
  }
}

function emptyStateCopy(phase: WeekendPhase): { title: string; body: string } {
  switch (phase) {
    case "upcoming":
      return {
        title: "Story developing",
        body: "The weekend briefing will populate here once the editorial engine has enough context to write from.",
      };
    case "live":
      return {
        title: "Story developing",
        body: "Live narrative sections will populate here as the weekend unfolds.",
      };
    case "completed":
      return {
        title: "No story available",
        body: "The recap could not be assembled for this weekend.",
      };
    case "cancelled":
      return {
        title: "Weekend cancelled",
        body: "This event will not proceed, so no weekend story will be generated.",
      };
  }
}

function buildContext(
  sport: HubSport,
  weekendSlug: string,
  weekendName: string,
  phase: WeekendPhase,
  sessions: HubSession[],
  liveEvents: LiveEvent[] | undefined,
  summary: RaceWeekendSummary | null | undefined,
  isSprintWeekend: boolean | undefined
): StoryContext {
  return {
    sport,
    weekendSlug,
    weekendName,
    phase,
    sessions,
    liveEvents,
    summary: summary ?? null,
    isSprintWeekend,
  };
}

function StorySkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((i) => (
        <GlassCard key={i} className="!p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Skeleton className="size-7 rounded-full" />
              <Skeleton className="h-5 w-40 rounded-md" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <div className="mt-4 space-y-2">
            <Skeleton className="h-3.5 w-full rounded-md" />
            <Skeleton className="h-3.5 w-11/12 rounded-md" />
            <Skeleton className="h-3.5 w-4/5 rounded-md" />
          </div>
        </GlassCard>
      ))}
    </div>
  );
}

function EmptyState({ phase }: { phase: WeekendPhase }) {
  const copy = emptyStateCopy(phase);
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-white/5 bg-slate-950/40 px-5 py-10 text-center">
      <p className="text-sm font-semibold text-white">{copy.title}</p>
      <p className="mt-1.5 max-w-xs text-xs leading-5 text-slate-400">
        {copy.body}
      </p>
    </div>
  );
}

export function WeekendStoryEngine({
  sport,
  weekendSlug,
  weekendName,
  phase,
  sessions,
  data,
  liveEvents,
  summary,
  isSprintWeekend,
  providerId,
  headingId,
  className = "",
}: Props) {
  const resolvedPhase = phaseOrDerived(phase, data);
  const resolvedSessions = useMemo(
    () => sessions ?? data?.sessions ?? [],
    [sessions, data]
  );

  const [story, setStory] = useState<WeekendStory | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [regenerating, setRegenerating] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    const context = buildContext(
      sport,
      weekendSlug,
      weekendName,
      resolvedPhase,
      resolvedSessions,
      liveEvents,
      summary,
      isSprintWeekend
    );

    setLoading(true);
    setError(false);

    getWeekendStory(context, providerId)
      .then((result) => {
        if (cancelled) return;
        setStory(result);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    sport,
    weekendSlug,
    weekendName,
    resolvedPhase,
    resolvedSessions,
    liveEvents,
    summary,
    isSprintWeekend,
    providerId,
  ]);

  function handleRegenerate() {
    if (regenerating || loading) return;
    const context = buildContext(
      sport,
      weekendSlug,
      weekendName,
      resolvedPhase,
      resolvedSessions,
      liveEvents,
      summary,
      isSprintWeekend
    );

    setRegenerating(true);
    setError(false);

    regenerateWeekendStory(context, providerId)
      .then((result) => {
        setStory(result);
        setRegenerating(false);
      })
      .catch(() => {
        setError(true);
        setRegenerating(false);
      });
  }

  const isEmpty = !loading && !error && (!story || story.sections.length === 0);
  const isLoading = loading || regenerating;
  const headerTone = phaseHeaderTone(resolvedPhase);
  const headline = story ? getStoryHeadline(story) : null;

  return (
    <section
      aria-labelledby={headingId}
      className={className}
      aria-label="Weekend story"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
              Weekend briefing
            </p>
            <h2
              id={headingId}
              className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white sm:text-3xl"
            >
              {loading ? (
                <Skeleton className="h-7 w-64 rounded-md" />
              ) : story ? (
                story.title
              ) : (
                `${weekendName} ${phaseHeaderLabel(resolvedPhase)}`
              )}
            </h2>
            {loading ? (
              <Skeleton className="mt-2 h-4 w-72 rounded-md" />
            ) : story?.subtitle ? (
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                {story.subtitle}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {error ? (
              <span className="text-xs font-semibold uppercase text-red-400">
                Story unavailable
              </span>
            ) : resolvedPhase === "live" && !isLoading ? (
              <StatusPill tone={headerTone}>
                <span
                  className="mr-1.5 inline-block size-1.5 animate-pulse rounded-full bg-red-400"
                  aria-hidden="true"
                />
                Live
              </StatusPill>
            ) : (
              <StatusPill tone={headerTone}>
                {phaseHeaderLabel(resolvedPhase)}
              </StatusPill>
            )}

            {!isLoading && !error && story && story.sections.length > 0 ? (
              <button
                type="button"
                onClick={handleRegenerate}
                disabled={regenerating}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-slate-300 transition hover:border-amber-300/30 hover:text-amber-200 disabled:opacity-50"
                aria-label="Regenerate weekend briefing"
              >
                <span
                  className={`inline-block size-1.5 rounded-full bg-amber-300 ${
                    regenerating ? "animate-pulse" : ""
                  }`}
                  aria-hidden="true"
                />
                {regenerating ? "Rewriting" : "Refresh"}
              </button>
            ) : null}
          </div>
        </div>

        {isLoading ? (
          <StorySkeleton />
        ) : error ? (
          <EmptyState phase={resolvedPhase} />
        ) : isEmpty ? (
          <EmptyState phase={resolvedPhase} />
        ) : story ? (
          <div className="space-y-4">
            {story.sections.map((section) => (
              <StoryCard
                key={section.id}
                title={section.heading}
                content={section.content}
                importance={section.importance}
                icon={section.icon}
                headingId={`${headingId ?? "weekend-story"}-${section.id}`}
              />
            ))}

            {story.generatedAt ? (
              <p
                className="px-1 font-mono text-[11px] text-slate-600"
                suppressHydrationWarning
                title={story.generatedAt}
              >
                Briefing generated {formatLocalTimeOnly(story.generatedAt)}
                {headline ? ` · Lead: ${headline}` : ""}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}