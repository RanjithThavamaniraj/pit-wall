import Link from "next/link";
import type { ReactNode } from "react";
import { SessionCountdown } from "@/components/SessionCountdown";
import { GlassCard } from "@/components/ui";

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

      <GlassCard className="border-amber-300/20 bg-amber-300/[0.03] p-5 text-center sm:p-6">
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
