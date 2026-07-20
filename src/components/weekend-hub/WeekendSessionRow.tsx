"use client";

import { memo } from "react";
import { SessionCountdown } from "@/components/SessionCountdown";
import { StatusPill } from "@/components/ui";
import type { HubSession, HubSessionStatus } from "@/lib/weekend-hub";
import type { SessionResultHighlight } from "@/lib/weekend-hub/session-results";
import { formatLocalTime } from "@/lib/utils";

type Props = {
  session: HubSession;
  results?: SessionResultHighlight;
};

function sessionTone(status: HubSessionStatus) {
  if (status === "live") return "red" as const;
  if (status === "completed") return "neutral" as const;
  if (status === "cancelled") return "amber" as const;
  return "green" as const;
}

function sessionStatusLabel(status: HubSessionStatus) {
  if (status === "live") return "Live";
  if (status === "completed") return "Completed";
  if (status === "cancelled") return "Cancelled";
  return "Upcoming";
}

function SessionResultStrip({ results }: { results: SessionResultHighlight }) {
  const chips: { label: string; value: string }[] = [];
  if (results.winner) chips.push({ label: "Winner", value: results.winner });
  if (results.pole) chips.push({ label: "Pole", value: results.pole });
  if (results.fastestLap) {
    chips.push({ label: "Fastest lap", value: results.fastestLap });
  }

  if (chips.length === 0 && !results.topThree?.length) return null;

  return (
    <div className="mt-3 space-y-2 border-t border-white/[0.06] pt-3">
      {chips.length > 0 ? (
        <dl className="flex flex-wrap gap-x-5 gap-y-2">
          {chips.map((chip) => (
            <div key={chip.label}>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                {chip.label}
              </dt>
              <dd className="mt-0.5 text-sm font-semibold text-slate-200">
                {chip.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
      {results.topThree && results.topThree.length > 0 ? (
        <p className="font-mono text-[11px] tracking-wide text-slate-500">
          {results.topThree.map((name, index) => (
            <span key={`${index}-${name}`}>
              {index > 0 ? (
                <span className="mx-1.5 text-white/15" aria-hidden="true">
                  ·
                </span>
              ) : null}
              <span className="text-slate-400">P{index + 1}</span>{" "}
              <span className="text-slate-300">{name}</span>
            </span>
          ))}
        </p>
      ) : null}
    </div>
  );
}

function SessionTimingState({ session }: { session: HubSession }) {
  if (session.status === "live") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-400/30 bg-red-400/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-red-300">
        <span
          className="size-1.5 animate-pulse rounded-full bg-red-400"
          aria-hidden="true"
        />
        Live
      </span>
    );
  }

  if (session.status === "completed") {
    return (
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        Finished
      </span>
    );
  }

  if (session.status === "cancelled") {
    return (
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-200/80">
        Cancelled
      </span>
    );
  }

  if (session.dateUtc) {
    return (
      <div className="text-right">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
          Starts in
        </p>
        <SessionCountdown
          targetDate={session.dateUtc}
          sessionLabel={session.label}
          variant="inline"
        />
      </div>
    );
  }

  return (
    <span className="text-xs text-slate-600">Time TBC</span>
  );
}

function WeekendSessionRowComponent({ session, results }: Props) {
  const isLive = session.status === "live";
  const isCompleted = session.status === "completed";

  return (
    <li
      id={`session-${session.id}`}
      className={`scroll-mt-28 px-5 py-4 sm:px-6 ${
        isLive
          ? "bg-red-400/[0.06]"
          : isCompleted
          ? "opacity-80"
          : session.status === "cancelled"
          ? "opacity-60"
          : ""
      }`}
    >
      <div className="flex min-h-[3.5rem] items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <StatusPill tone={sessionTone(session.status)}>
              {sessionStatusLabel(session.status)}
            </StatusPill>
            <p className="text-sm font-semibold text-white">{session.label}</p>
          </div>
          {session.dateUtc ? (
            <p
              className="mt-1.5 text-xs text-slate-500"
              suppressHydrationWarning
            >
              {formatLocalTime(session.dateUtc)}
            </p>
          ) : (
            <p className="mt-1.5 text-xs text-slate-600">Date TBC</p>
          )}
          {isCompleted && results ? (
            <SessionResultStrip results={results} />
          ) : null}
        </div>
        <div className="shrink-0 pt-0.5">
          <SessionTimingState session={session} />
        </div>
      </div>
    </li>
  );
}

export const WeekendSessionRow = memo(
  WeekendSessionRowComponent,
  (prev, next) =>
    prev.session.id === next.session.id &&
    prev.session.status === next.session.status &&
    prev.session.dateUtc === next.session.dateUtc &&
    prev.session.label === next.session.label &&
    prev.results === next.results
);
