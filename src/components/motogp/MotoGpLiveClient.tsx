"use client";

import { useEffect, useState, useRef } from "react";
import type { MotoGpFinisher } from "@/lib/motogp";
import type { MotoGpWeekendContext } from "@/lib/motogp-weekend";
import { MotoGpUpcomingView } from "@/components/motogp/MotoGpUpcomingView";
import { EmptyWeekendState } from "@/components/live/WeekendPreviewShared";
import { SessionCountdown } from "@/components/SessionCountdown";
import { Container, GlassCard, StatusPill } from "@/components/ui";
import { countryCodeToFlag } from "@/lib/utils";
import { LIVE_CACHE } from "@/lib/cache/live";

type Props = {
  initialContext: MotoGpWeekendContext | null;
  initialResults: MotoGpFinisher[];
};

export default function MotoGpLiveClient({
  initialContext,
  initialResults,
}: Props) {
  const [context, setContext] = useState(initialContext);
  const [results, setResults] = useState(initialResults);
  const requestIdRef = useRef(0);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    let cancelled = false;

    const refresh = async () => {
      const requestId = ++requestIdRef.current;
      let pollIntervalMs: number = LIVE_CACHE.MOTOGP_IDLE_POLL_MS;

      try {
        const res = await fetch("/api/motogp/weekend");
        if (!res.ok) return;
        const payload = await res.json();
        if (cancelled || requestId !== requestIdRef.current) return;
        setContext(payload.context);
        setResults(payload.results ?? []);
        pollIntervalMs =
          payload.context?.state === "LIVE"
            ? LIVE_CACHE.MOTOGP_LIVE_POLL_MS
            : LIVE_CACHE.MOTOGP_IDLE_POLL_MS;
      } catch {
        // Keep existing state on failure.
      } finally {
        if (!cancelled) {
          timeoutId = setTimeout(refresh, pollIntervalMs);
        }
      }
    };

    refresh();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, []);

  if (!context) {
    return (
      <section className="relative isolate py-16">
        <Container wide>
          <EmptyWeekendState sport="motogp" />
        </Container>
      </section>
    );
  }

  const { currentWeekend, state, activeSession, nextSession } = context;
  const flag = countryCodeToFlag(currentWeekend.countryCode);
  const isUpcoming = state === "UPCOMING";
  const isLive = state === "LIVE";
  const isBetweenSessions = state === "BETWEEN_SESSIONS";
  const isCompleted = state === "COMPLETED";
  const showSessionResults = isCompleted || isBetweenSessions;
  const countdownSession = nextSession ?? activeSession;

  return (
    <section className="relative isolate pb-12 pt-8 sm:pt-10">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(14,165,233,0.08),transparent_60%)]"
      />
      <Container wide>
        <div className="mb-5 flex items-baseline justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              {isUpcoming
                ? "Weekend Preview"
                : isLive
                ? "Live Weekend Hub"
                : "Session Results"}
            </h1>
            {!isUpcoming && (
              <>
                <p className="mt-2 text-sm text-slate-400">
                  <span className="mr-2" aria-hidden="true">
                    {flag}
                  </span>
                  {currentWeekend.name} · {currentWeekend.circuit}
                </p>
                {!isLive && (
                  <p className="mt-1 text-xs text-slate-500">
                    Live timing is not available from the public MotoGP API.
                  </p>
                )}
              </>
            )}
          </div>

          {isLive ? (
            <StatusPill tone="red">
              <span className="mr-1.5 inline-block size-1.5 animate-pulse rounded-full bg-red-400" />
              Live
            </StatusPill>
          ) : showSessionResults ? (
            <StatusPill tone="neutral">
              {isBetweenSessions ? "Between sessions" : "Completed"}
            </StatusPill>
          ) : (
            <StatusPill tone="green">Upcoming</StatusPill>
          )}
        </div>

        {isUpcoming ? (
          <MotoGpUpcomingView context={context} />
        ) : (
          <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
            <div className="space-y-5">
              {countdownSession?.dateUtc && isBetweenSessions && (
                <GlassCard className="p-6 text-center sm:p-8">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-400">
                    Coming up next
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    {countdownSession.label}
                  </h2>
                  <div className="mt-5">
                    <SessionCountdown
                      targetDate={countdownSession.dateUtc}
                      sessionLabel={countdownSession.label}
                      variant="full"
                    />
                  </div>
                </GlassCard>
              )}

              {isLive && activeSession && (
                <GlassCard className="border-amber-300/20 p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-300">
                    Session in progress
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    {activeSession.label}
                  </h2>
                  <p className="mt-2 text-sm text-slate-400">
                    Follow session progression and results below while the session
                    runs.
                  </p>
                </GlassCard>
              )}
            </div>

            <div>
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                Session progression
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {currentWeekend.sessions.map((session) => (
                  <div
                    key={session.sessionId}
                    className={`rounded-xl border p-4 ${
                      session.status === "completed"
                        ? "border-emerald-500/20 bg-emerald-500/10"
                        : session.status === "live"
                        ? "border-amber-500/30 bg-amber-500/10"
                        : nextSession?.sessionId === session.sessionId
                        ? "border-sky-500/30 bg-sky-500/10"
                        : "border-white/5 bg-white/[0.02]"
                    }`}
                  >
                    <p className="text-sm font-medium text-white">
                      {session.label}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-widest text-slate-400">
                      {session.status === "completed"
                        ? "Completed"
                        : session.status === "live"
                        ? "Live now"
                        : "Upcoming"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {!isUpcoming && results.length > 0 && (
          <GlassCard className="mt-5 p-5">
            <h2 className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
              {activeSession
                ? `${activeSession.label} — top 5`
                : "Latest results — top 5"}
            </h2>
            <div className="mt-4 space-y-3">
              {results.map((result) => (
                <div
                  key={result.position}
                  className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-slate-950/40 px-4 py-3"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-sm text-amber-200">
                      P{result.position}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        <span className="font-mono text-amber-200/80">
                          #{result.riderNumber}
                        </span>{" "}
                        {result.riderName}
                      </p>
                      <p className="text-xs text-slate-500">{result.teamName}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        )}
      </Container>
    </section>
  );
}
