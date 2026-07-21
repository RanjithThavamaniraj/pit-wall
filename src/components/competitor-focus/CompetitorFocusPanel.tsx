"use client";

import type { CompetitorFocusSnapshot } from "@/lib/competitor-focus";
import type { SportTerms } from "@/lib/sport-terms";
import { StatusPill } from "@/components/ui";

type Props = {
  snapshot: CompetitorFocusSnapshot | null;
  terms: SportTerms;
  className?: string;
};

export function CompetitorFocusPanel({
  snapshot,
  terms,
  className = "",
}: Props) {
  if (!snapshot) {
    return (
      <div
        className={`rounded-[1.5rem] border border-dashed border-white/15 bg-black/20 p-5 ${className}`}
        role="status"
      >
        <p className="text-sm text-slate-400">
          Select a {terms.competitor} to open Focus Mode.
        </p>
      </div>
    );
  }

  return (
    <section
      className={`rounded-[1.5rem] border border-white/10 bg-gradient-to-b from-white/[0.07] to-black/30 p-4 sm:p-5 ${className}`}
      aria-label={`${terms.competitorTitle} focus · ${snapshot.displayName}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[0.6rem] uppercase tracking-[0.22em] text-amber-300/90">
            {terms.competitorTitle} Focus
          </p>
          <h3 className="mt-1.5 truncate text-xl font-semibold tracking-[-0.03em] text-white sm:text-2xl">
            {snapshot.displayName}
          </h3>
          <p className="mt-1 font-mono text-xs tracking-[0.14em] text-slate-400">
            {snapshot.code}
            {snapshot.teamOrManufacturer
              ? ` · ${snapshot.teamOrManufacturer}`
              : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <StatusPill tone="amber">P{snapshot.position}</StatusPill>
          {snapshot.pit && terms.pitLabel ? (
            <StatusPill tone="red">{terms.pitLabel}</StatusPill>
          ) : null}
          {snapshot.isFastestLapHolder ? (
            <StatusPill tone="blue">FL</StatusPill>
          ) : null}
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-2.5 sm:gap-3">
        <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5">
          <dt className="font-mono text-[0.55rem] uppercase tracking-[0.18em] text-slate-500">
            Lap
          </dt>
          <dd className="mt-1 font-mono text-sm text-slate-100 tabular-nums">
            {snapshot.lap}
            {snapshot.totalLaps > 0 ? (
              <span className="text-slate-500"> / {snapshot.totalLaps}</span>
            ) : null}
          </dd>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5">
          <dt className="font-mono text-[0.55rem] uppercase tracking-[0.18em] text-slate-500">
            {terms.teamOrManufacturer}
          </dt>
          <dd className="mt-1 truncate text-sm text-slate-100">
            {snapshot.teamOrManufacturer ?? "—"}
          </dd>
        </div>
        {snapshot.nationality ? (
          <div className="col-span-2 rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 sm:col-span-1">
            <dt className="font-mono text-[0.55rem] uppercase tracking-[0.18em] text-slate-500">
              Nationality
            </dt>
            <dd className="mt-1 text-sm text-slate-100">
              {snapshot.nationality}
            </dd>
          </div>
        ) : null}
      </dl>

      <ul className="mt-4 space-y-0" role="list">
        {snapshot.metrics.map((metric) => (
          <li
            key={metric.label}
            className="flex items-baseline justify-between gap-3 border-b border-white/5 py-2.5 last:border-0"
          >
            <div className="min-w-0">
              <p className="text-xs text-slate-400">{metric.label}</p>
              {metric.kind === "reserved" && metric.hint ? (
                <p className="mt-0.5 text-[0.65rem] leading-4 text-slate-600">
                  {metric.hint}
                </p>
              ) : null}
            </div>
            <p
              className={`shrink-0 font-mono text-sm tabular-nums ${
                metric.kind === "value"
                  ? "text-amber-100"
                  : "text-slate-600"
              }`}
            >
              {metric.kind === "value" ? metric.value : "—"}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
