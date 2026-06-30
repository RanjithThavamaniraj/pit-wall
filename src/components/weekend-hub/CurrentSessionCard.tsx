"use client";

import { SessionCountdown } from "@/components/SessionCountdown";
import { GlassCard, StatusPill } from "@/components/ui";
import {
  deriveWeekendPhase,
  getFocusSession,
  getLiveSession,
  getNextSession,
  type WeekendHubData,
} from "@/lib/weekend-hub";
import { formatLocalTimeOnly } from "@/lib/utils";

type Props = {
  data: WeekendHubData;
};

export function CurrentSessionCard({ data }: Props) {
  const phase = deriveWeekendPhase(data);
  const liveSession = getLiveSession(data.sessions);
  const nextSession = getNextSession(data.sessions);
  const focusSession = getFocusSession(data);

  if (phase === "completed" || phase === "cancelled") {
    return (
      <GlassCard>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
          {phase === "cancelled" ? "Event status" : "Weekend status"}
        </p>
        <p className="mt-2 text-lg font-semibold text-white">
          {phase === "cancelled" ? "Event cancelled" : "Weekend complete"}
        </p>
        <p className="mt-1 text-sm text-slate-400">
          {phase === "cancelled"
            ? "This event has been cancelled."
            : "All sessions for this race weekend have concluded."}
        </p>
      </GlassCard>
    );
  }

  if (liveSession) {
    return (
      <GlassCard>
        <div className="flex flex-wrap items-center gap-2.5">
          <StatusPill tone="red">
            <span
              className="mr-1.5 inline-block size-1.5 animate-pulse rounded-full bg-red-400"
              aria-hidden="true"
            />
            Live
          </StatusPill>
        </div>
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
          Session in progress
        </p>
        <p className="mt-1 text-xl font-semibold text-white">
          {liveSession.label}
        </p>
        {liveSession.dateUtc ? (
          <p
            className="mt-1 text-xs text-slate-500"
            suppressHydrationWarning
          >
            Started {formatLocalTimeOnly(liveSession.dateUtc)}
          </p>
        ) : null}
      </GlassCard>
    );
  }

  if (!nextSession || !focusSession?.dateUtc) {
    return null;
  }

  return (
    <GlassCard>
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
        Next session
      </p>
      <p className="mt-1 text-xl font-semibold text-white">
        {nextSession.label}
      </p>
      <p
        className="mt-0.5 text-xs text-slate-500"
        suppressHydrationWarning
      >
        {formatLocalTimeOnly(nextSession.dateUtc)}
      </p>
      <div className="mt-6">
        <SessionCountdown
          targetDate={nextSession.dateUtc}
          sessionLabel={nextSession.label}
          variant="full"
        />
      </div>
    </GlassCard>
  );
}
