import Link from "next/link";
import type { ReactNode } from "react";
import { SessionCountdown } from "@/components/SessionCountdown";
import { GlassCard, StatusPill } from "@/components/ui";
import { formatLocalTime } from "@/lib/utils";

export type PreviewSession = {
  id: string;
  label: string;
  dateUtc: string;
  status: "upcoming" | "live" | "completed";
};

export type SnapshotMetric = {
  label: string;
  value: string;
  sub: string;
};

function sessionTone(status: PreviewSession["status"]) {
  if (status === "live") return "red" as const;
  if (status === "completed") return "neutral" as const;
  return "green" as const;
}

function sessionStatusLabel(status: PreviewSession["status"]) {
  if (status === "live") return "Live";
  if (status === "completed") return "Done";
  return "Upcoming";
}

export function WeekendHero({
  flag,
  eyebrow,
  title,
  subtitle,
  detailHref,
  detailLabel = "Full weekend schedule →",
}: {
  flag: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  detailHref: string;
  detailLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-4">
        <span className="text-4xl sm:text-5xl" aria-hidden="true">
          {flag}
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
            {eyebrow}
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-white sm:text-3xl">
            {title}
          </h2>
          <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
        </div>
      </div>
      <Link
        href={detailHref}
        className="shrink-0 text-sm font-semibold text-amber-300 transition hover:text-amber-200"
      >
        {detailLabel}
      </Link>
    </div>
  );
}

export function NextSessionPanel({
  sessionLabel,
  circuit,
  dateUtc,
  footnote,
}: {
  sessionLabel: string;
  circuit: string;
  dateUtc: string;
  footnote?: ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-400">
          Upcoming session
        </p>
        <h3 className="text-xl font-semibold text-white sm:text-2xl">
          {sessionLabel}
        </h3>
        <p className="text-sm text-slate-400">{circuit}</p>
      </div>

      <GlassCard className="p-5 text-center sm:p-6">
        <SessionCountdown
          targetDate={dateUtc}
          sessionLabel={sessionLabel}
          variant="full"
        />
      </GlassCard>

      {footnote}
    </div>
  );
}

export function WeekendPreviewGrid({
  sessions,
  nextSessionId,
  sidebar,
}: {
  sessions: PreviewSession[];
  nextSessionId?: string;
  sidebar: ReactNode;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:items-start">
      <div className="order-2 min-w-0 lg:order-1">
        <SessionScheduleList
          sessions={sessions}
          nextSessionId={nextSessionId}
          className="h-full"
        />
      </div>
      <aside className="order-1 space-y-4 lg:sticky lg:top-28 lg:order-2 lg:self-start">
        {sidebar}
      </aside>
    </div>
  );
}

export function ChampionshipSnapshot({
  metrics,
}: {
  metrics: SnapshotMetric[];
}) {
  if (!metrics.length) return null;

  return (
    <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="rounded-2xl border border-white/10 bg-white/[0.05] p-4"
        >
          <dt className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            {metric.label}
          </dt>
          <dd className="mt-2 text-lg font-semibold text-white leading-tight">
            {metric.value}
          </dd>
          <dd className="mt-0.5 text-sm text-slate-400">{metric.sub}</dd>
        </div>
      ))}
    </dl>
  );
}

export function SessionScheduleList({
  sessions,
  nextSessionId,
  title = "Session schedule",
  className = "",
}: {
  sessions: PreviewSession[];
  nextSessionId?: string;
  title?: string;
  className?: string;
}) {
  return (
    <GlassCard className={`flex h-full flex-col overflow-hidden p-0 ${className}`}>
      <div className="border-b border-white/10 px-5 py-4 sm:px-6">
        <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
          {title}
        </h2>
        <p className="mt-0.5 text-xs text-slate-600">
          Times shown in your local timezone
        </p>
      </div>
      <ul role="list" className="flex-1 divide-y divide-white/[0.06]">
        {sessions.map((session) => (
          <li
            key={session.id}
            className={`flex items-center justify-between gap-4 px-5 py-4 sm:px-6 ${
              session.status === "live"
                ? "bg-red-400/[0.06]"
                : session.id === nextSessionId
                ? "bg-sky-500/[0.06]"
                : session.status === "completed"
                ? "opacity-60"
                : ""
            }`}
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <StatusPill tone={sessionTone(session.status)}>
                  {sessionStatusLabel(session.status)}
                </StatusPill>
                <p className="text-sm font-semibold text-white">
                  {session.label}
                </p>
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
            </div>
            {session.status === "upcoming" && session.dateUtc && (
              <SessionCountdown
                targetDate={session.dateUtc}
                sessionLabel={session.label}
                variant="inline"
              />
            )}
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}

export function LivePreviewExplainer({ sport }: { sport: "f1" | "motogp" }) {
  const items =
    sport === "f1"
      ? [
          "Live timing board with positions and gaps",
          "Race control briefings and strategy messages",
          "Session results and classification between runs",
        ]
      : [
          "Session progression across the full weekend",
          "Results and top-five classification after each run",
          "Countdowns to the next session on track",
        ];

  return (
    <GlassCard className="p-5 sm:p-6">
      <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
        When the session starts
      </h2>
      <p className="mt-2 text-sm leading-7 text-slate-300">
        {sport === "f1"
          ? "This page switches to live mode automatically once Practice 1 begins. You will see:"
          : "This hub updates as each session runs. You will see:"}
      </p>
      <ul className="mt-4 space-y-2">
        {items.map((item) => (
          <li
            key={item}
            className="flex items-start gap-2.5 text-sm text-slate-400"
          >
            <span
              className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-300"
              aria-hidden="true"
            />
            {item}
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}

export type PodiumFinisher = {
  position: number;
  name: string;
  detail?: string;
};

export function PreviousRoundCard({
  round,
  title,
  subtitle,
  href,
  podium = [],
}: {
  round: number;
  title: string;
  subtitle: string;
  href: string;
  podium?: PodiumFinisher[];
}) {
  return (
    <GlassCard className="p-5 sm:p-6">
      <h2 className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
        Previous round
      </h2>
      <p className="mt-2 text-lg font-semibold text-white">{title}</p>
      <p className="mt-1 text-sm text-slate-400">
        Round {round} · {subtitle}
      </p>

      {podium.length > 0 && (
        <div className="mt-4 space-y-2 border-t border-white/[0.06] pt-4">
          {podium.map((finisher) => (
            <div
              key={finisher.position}
              className="flex items-center justify-between text-sm"
            >
              <span className="font-mono text-slate-500">
                P{finisher.position}
              </span>
              <span className="flex-1 px-3 text-slate-300">
                {finisher.detail ? (
                  <span className="font-mono text-amber-200/80">
                    {finisher.detail}{" "}
                  </span>
                ) : null}
                {finisher.name}
              </span>
            </div>
          ))}
        </div>
      )}

      <Link
        href={href}
        className="mt-4 inline-flex text-sm font-semibold text-amber-300 transition hover:text-amber-200"
      >
        View round details →
      </Link>
    </GlassCard>
  );
}

export function EmptyWeekendState({
  sport,
}: {
  sport: "f1" | "motogp";
}) {
  const isMotogp = sport === "motogp";
  const racesHref = isMotogp ? "/motogp/races" : "/races";
  const standingsHref = isMotogp ? "/motogp/standings" : "/standings";

  return (
    <div className="mx-auto max-w-lg text-center">
      <GlassCard className="p-8 sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-300">
          Off weekend
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-white">
          No active race weekend
        </h2>
        <p className="mt-3 text-sm leading-7 text-slate-400">
          The season may be between events or on a scheduled break. Check the
          calendar for the next Grand Prix or browse championship standings.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href={racesHref}
            className="rounded-full bg-amber-300 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-amber-200"
          >
            View race schedule
          </Link>
          <Link
            href={standingsHref}
            className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Championship standings
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
