"use client";

import { memo } from "react";
import type { WeekendStat } from "@/lib/race-summary/types";

const DEFAULT_ICONS: Record<string, string> = {
  "race duration": "⏱",
  laps: "🔁",
  "safety cars": "🚨",
  dnfs: "⚠️",
  retirements: "⚠️",
  weather: "🌤",
  "race distance": "📏",
  "fastest lap": "⚡",
  "pole time": "🚦",
  "winning margin": "📐",
};

function statIcon(stat: WeekendStat): string {
  if (stat.icon) return stat.icon;
  return DEFAULT_ICONS[stat.label.toLowerCase()] ?? "📊";
}

type Props = {
  statistics: WeekendStat[];
  title?: string;
};

function WeekendStatsComponent({
  statistics,
  title = "Weekend statistics",
}: Props) {
  if (statistics.length === 0) {
    return null;
  }

  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
      <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
        {title}
      </h3>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {statistics.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-xl border px-4 py-3.5 ${
              stat.highlight
                ? "border-amber-300/15 bg-amber-300/[0.05]"
                : "border-white/[0.06] bg-slate-950/40"
            }`}
          >
            <dt className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              <span aria-hidden="true">{statIcon(stat)}</span>
              {stat.label}
            </dt>
            <dd className="mt-2 text-lg font-semibold tracking-tight text-slate-100">
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export const WeekendStats = memo(WeekendStatsComponent);
