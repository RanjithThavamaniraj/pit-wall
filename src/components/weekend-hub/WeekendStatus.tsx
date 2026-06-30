"use client";

import Link from "next/link";
import { SessionCountdown } from "@/components/SessionCountdown";
import { GlassCard, StatusPill } from "@/components/ui";
import {
  deriveWeekendPhase,
  getFocusSession,
  getLiveSession,
  phaseLabel,
  phaseTone,
  type WeekendHubData,
} from "@/lib/weekend-hub";

type Props = {
  data: WeekendHubData;
};

export function WeekendStatus({ data }: Props) {
  const phase = deriveWeekendPhase(data);
  const liveSession = getLiveSession(data.sessions);
  const focusSession = getFocusSession(data);
  const tone = phaseTone(phase);

  return (
    <GlassCard className="!p-5 sm:!p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <StatusPill tone={tone}>
              {phase === "live" ? (
                <>
                  <span
                    className="mr-1.5 inline-block size-1.5 animate-pulse rounded-full bg-red-400"
                    aria-hidden="true"
                  />
                  {phaseLabel(phase)}
                </>
              ) : (
                phaseLabel(phase)
              )}
            </StatusPill>
            {phase === "completed" ? (
              <StatusPill tone="neutral">Weekend complete</StatusPill>
            ) : null}
            {phase === "cancelled" ? (
              <StatusPill tone="amber">Event cancelled</StatusPill>
            ) : null}
          </div>

          {liveSession ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Current session
              </p>
              <p className="mt-1 text-lg font-semibold text-white">
                {liveSession.label}
              </p>
            </div>
          ) : focusSession && phase !== "completed" ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                {phase === "upcoming" ? "Next session" : "On deck"}
              </p>
              <p className="mt-1 text-lg font-semibold text-white">
                {focusSession.label}
              </p>
            </div>
          ) : phase === "completed" ? (
            <p className="text-sm text-slate-400">
              All sessions have concluded for this race weekend.
            </p>
          ) : null}
        </div>

        {focusSession?.dateUtc &&
        phase !== "completed" &&
        phase !== "cancelled" ? (
          <div className="shrink-0 sm:text-right">
            <SessionCountdown
              targetDate={focusSession.dateUtc}
              sessionLabel={focusSession.label}
              variant="inline"
            />
          </div>
        ) : null}
      </div>

      {data.liveLinkHref && phase !== "completed" ? (
        <Link
          href={data.liveLinkHref}
          className="mt-4 inline-flex text-sm font-semibold text-amber-300 transition hover:text-amber-200"
        >
          {data.liveLinkLabel ?? "Go to live timing →"}
        </Link>
      ) : null}
    </GlassCard>
  );
}
