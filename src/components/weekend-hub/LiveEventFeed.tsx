"use client";

import { useEffect, useMemo, useState } from "react";
import { GlassCard, Skeleton, StatusPill } from "@/components/ui";
import {
  deriveWeekendPhase,
  getLiveEvents,
  groupEventsBySession,
  severityTone,
  type EventTone,
  type LiveEvent,
  type SessionEventGroup,
} from "@/lib/weekend-hub";
import type {
  HubSession,
  HubSport,
  WeekendHubData,
  WeekendPhase,
} from "@/lib/weekend-hub";
import { formatLocalTimeOnly } from "@/lib/utils";

type Props = {
  sport: HubSport;
  weekendSlug: string;
  phase?: WeekendPhase;
  sessions?: HubSession[];
  data?: WeekendHubData;
  limit?: number;
  headingId?: string;
  className?: string;
};

function typeLabel(type: LiveEvent["type"]): string {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

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

function emptyStateCopy(phase: WeekendPhase): { title: string; body: string } {
  switch (phase) {
    case "upcoming":
      return {
        title: "Feed warming up",
        body: "Live race control and on-track events will appear here once the weekend begins.",
      };
    case "live":
      return {
        title: "Waiting for events",
        body: "Events will populate here as race control reports them.",
      };
    case "completed":
      return {
        title: "No events recorded",
        body: "No live events were captured for this weekend.",
      };
    case "cancelled":
      return {
        title: "Event cancelled",
        body: "This weekend will not proceed.",
      };
  }
}

function EventRow({ event }: { event: LiveEvent }) {
  const tone = severityTone(event.severity);

  return (
    <li
      className="flex gap-3 rounded-2xl border border-white/[0.04] bg-slate-950/30 px-3.5 py-3 sm:px-4"
      aria-label={event.title}
    >
      <span
        aria-hidden="true"
        className={`mt-1 size-2 shrink-0 rounded-full ${
          tone === "red"
            ? "bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.65)]"
            : tone === "amber"
            ? "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.6)]"
            : tone === "green"
            ? "bg-emerald-400"
            : tone === "blue"
            ? "bg-cyan-400"
            : "bg-slate-500"
        }`}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-semibold text-white">{event.title}</p>
          <time
            className="shrink-0 font-mono text-[11px] text-slate-500"
            suppressHydrationWarning
            dateTime={event.timestamp}
          >
            {formatLocalTimeOnly(event.timestamp)}
          </time>
        </div>
        <p className="mt-0.5 text-xs leading-5 text-slate-400">
          {event.description}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <StatusPill tone={tone}>{typeLabel(event.type)}</StatusPill>
          {event.severity === "critical" ? (
            <StatusPill tone="red">Critical</StatusPill>
          ) : null}
        </div>
      </div>
    </li>
  );
}

function SessionGroupBlock({ group }: { group: SessionEventGroup }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between px-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-200/80">
          {group.label}
        </p>
        <span className="font-mono text-[10px] text-slate-600">
          {group.events.length} event{group.events.length === 1 ? "" : "s"}
        </span>
      </div>
      <ul role="list" className="space-y-2">
        {group.events.map((event) => (
          <EventRow key={event.id} event={event} />
        ))}
      </ul>
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="space-y-2">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex gap-3 rounded-2xl border border-white/[0.04] bg-slate-950/30 px-3.5 py-3"
        >
          <Skeleton className="mt-1 size-2 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-2/3 rounded-md" />
            <Skeleton className="h-3 w-full rounded-md" />
            <Skeleton className="h-4 w-24 rounded-full" />
          </div>
        </div>
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

export function LiveEventFeed({
  sport,
  weekendSlug,
  phase,
  sessions,
  data,
  limit,
  headingId,
  className = "",
}: Props) {
  const resolvedPhase = phaseOrDerived(phase, data);
  const sessionLabels = useMemo(() => {
    const map: Record<string, string> = {};
    for (const session of sessions ?? []) {
      map[session.key] = session.label;
    }
    return map;
  }, [sessions]);

  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    const input = {
      sport,
      weekendSlug,
      phase: resolvedPhase,
      sessions: (sessions ?? []).map((s) => ({
        key: s.key,
        label: s.label,
      })),
    };

    setLoading(true);
    setError(false);

    getLiveEvents(input)
      .then((result) => {
        if (cancelled) return;
        setEvents(result);
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
  }, [sport, weekendSlug, resolvedPhase, sessions]);

  const groups = useMemo<SessionEventGroup[]>(() => {
    const grouped = groupEventsBySession(events, sessionLabels);
    if (!limit) return grouped;
    let remaining = limit;
    const capped: SessionEventGroup[] = [];
    for (const group of grouped) {
      if (remaining <= 0) break;
      const take = group.events.slice(0, remaining);
      capped.push({ ...group, events: take });
      remaining -= take.length;
    }
    return capped.filter((group) => group.events.length > 0);
  }, [events, sessionLabels, limit]);

  const isEmpty = !loading && !error && events.length === 0;
  const headerTone = phaseHeaderTone(resolvedPhase);

  return (
    <GlassCard className={className}>
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <h2
          id={headingId}
          className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400"
        >
          Live event feed
        </h2>
        <div className="flex items-center gap-2">
          {error ? (
            <span className="text-xs font-semibold uppercase text-red-400">
              Connection lost
            </span>
          ) : resolvedPhase === "live" && !loading ? (
            <StatusPill tone={headerTone}>
              <span
                className="mr-1.5 inline-block size-1.5 animate-pulse rounded-full bg-red-400"
                aria-hidden="true"
              />
              Live
            </StatusPill>
          ) : (
            <StatusPill tone={headerTone}>
              {resolvedPhase === "completed"
                ? "Archive"
                : resolvedPhase === "cancelled"
                ? "Cancelled"
                : resolvedPhase === "live"
                ? "Live"
                : "Scheduled"}
            </StatusPill>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-5">
        {loading ? (
          <FeedSkeleton />
        ) : isEmpty ? (
          <EmptyState phase={resolvedPhase} />
        ) : (
          groups.map((group) => (
            <SessionGroupBlock key={group.key} group={group} />
          ))
        )}
      </div>
    </GlassCard>
  );
}