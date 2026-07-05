"use client";

import { useEffect, useState, useRef } from "react";
import type { LiveTimingPayload } from "@/lib/timing";
import type { WeekendContext } from "@/lib/weekend";
import { Container, GlassCard } from "@/components/ui";
import { EmptyWeekendState } from "@/components/live/WeekendPreviewShared";
import { SessionStatusHeader } from "@/components/live/SessionStatusHeader";
import { TimingBoard } from "@/components/live/TimingBoard";
import { SessionCountdown } from "@/components/SessionCountdown";
import { BriefingFeed } from "@/components/live/BriefingFeed";
import { UpcomingSessionView } from "@/components/live/UpcomingSessionView";
import { CompletedSessionView } from "@/components/live/CompletedSessionView";
import { LIVE_CACHE } from "@/lib/cache/live";

export default function LiveTimingClient({
  initialContext,
}: {
  initialContext: WeekendContext | null;
}) {
  const [data, setData] = useState<LiveTimingPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const currentContext = data?.weekendContext || initialContext;
  const state = currentContext?.state;
  const isLive = state === "LIVE";
  const isCompleted = state === "COMPLETED";
  const isBetweenSessions = state === "BETWEEN_SESSIONS";
  const isUpcoming = state === "UPCOMING";
  const showSessionResults = isCompleted || isBetweenSessions;

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    let cancelled = false;

    const fetchTiming = async () => {
      const requestId = ++requestIdRef.current;

      try {
        const res = await fetch("/api/live/timing");
        if (res.status === 404) {
          if (cancelled || requestId !== requestIdRef.current) return;
          setError(null);
          timeoutId = setTimeout(fetchTiming, LIVE_CACHE.F1_TIMING_IDLE_POLL_MS);
          return;
        }
        if (!res.ok) {
          throw new Error("Failed to fetch live timing");
        }
        const payload: LiveTimingPayload = await res.json();

        if (cancelled || requestId !== requestIdRef.current) return;

        setData(payload);
        setError(null);

        const isCurrentlyLive = payload.weekendContext?.state === "LIVE";
        timeoutId = setTimeout(
          fetchTiming,
          isCurrentlyLive
            ? LIVE_CACHE.F1_TIMING_LIVE_POLL_MS
            : LIVE_CACHE.F1_TIMING_IDLE_POLL_MS
        );
      } catch (err) {
        console.error("Live timing error:", err);
        if (!cancelled) {
          setError("Unable to connect to live timing.");
          timeoutId = setTimeout(fetchTiming, LIVE_CACHE.F1_TIMING_IDLE_POLL_MS);
        }
      }
    };

    fetchTiming();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, []);

  if (!currentContext) {
    return (
      <section className="relative isolate py-16">
        <Container wide>
          <EmptyWeekendState sport="f1" />
        </Container>
      </section>
    );
  }

  const nextSessionData = currentContext.nextSession
    ? {
        raceName: currentContext.currentWeekend.name,
        circuit: currentContext.currentWeekend.circuit,
        sessionName: currentContext.nextSession.label,
        dateUtc: currentContext.nextSession.dateUtc,
      }
    : null;

  return (
    <section className="relative isolate pb-12 pt-8 sm:pt-10">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(14,165,233,0.08),transparent_60%)]"
      />
      <Container wide>
        <div className="mb-5 flex items-baseline justify-between">
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {isUpcoming
              ? "Weekend Preview"
              : isLive
              ? "Live Timing"
              : "Session Results"}
          </h1>

          <div className="flex items-center gap-2">
            {isLive ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
                  Live
                </span>
              </>
            ) : showSessionResults ? (
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-slate-500">
                <span className="h-2 w-2 rounded-full bg-slate-500"></span>
                {isBetweenSessions ? "Between sessions" : "Completed"}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-amber-500">
                <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                Upcoming
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {isUpcoming ? (
          <UpcomingSessionView context={currentContext} />
        ) : showSessionResults ? (
          <div className="space-y-5">
            <CompletedSessionView
              context={currentContext}
              timing={data?.timing || []}
              betweenSessions={isBetweenSessions}
            />
            {isBetweenSessions && (
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(300px,360px)] lg:items-start">
                {currentContext.nextSession && (
                  <GlassCard className="mx-auto w-full max-w-2xl border-amber-300/20 bg-amber-300/[0.03] p-6 text-center lg:mx-0 lg:text-left">
                    <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
                      Coming Up Next
                    </h4>
                    <h3 className="mb-5 text-2xl font-semibold text-white">
                      {currentContext.nextSession.label}
                    </h3>
                    <SessionCountdown
                      targetDate={currentContext.nextSession.dateUtc}
                      sessionLabel={currentContext.nextSession.label}
                      variant="full"
                    />
                  </GlassCard>
                )}
                <BriefingFeed
                  nextSessionData={nextSessionData}
                  isActiveSession={false}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(300px,360px)]">
            <div className="flex min-w-0 flex-col gap-5">
              <SessionStatusHeader session={data?.session || null} />
              <TimingBoard timing={data?.timing || []} />
            </div>

            <div className="min-w-0">
              <BriefingFeed
                nextSessionData={nextSessionData}
                isActiveSession={true}
              />
            </div>
          </div>
        )}
      </Container>
    </section>
  );
}
