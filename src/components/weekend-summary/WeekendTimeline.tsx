"use client";

import { memo, useMemo } from "react";
import type { WeekendTimelineEntry } from "@/lib/race-summary/types";

type Props = {
  entries?: WeekendTimelineEntry[];
};

function WeekendTimelineComponent({ entries }: Props) {
  const grouped = useMemo(() => {
    if (!entries?.length) return [];

    const groups = new Map<string, WeekendTimelineEntry[]>();
    for (const entry of entries) {
      const day = entry.day ?? "Weekend";
      const bucket = groups.get(day) ?? [];
      bucket.push(entry);
      groups.set(day, bucket);
    }
    return [...groups.entries()];
  }, [entries]);

  if (grouped.length === 0) {
    return null;
  }

  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
      <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
        Weekend Timeline
      </h3>
      <div className="mt-5 space-y-6">
        {grouped.map(([day, dayEntries]) => (
          <div key={day}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-300/70">
              {day}
            </p>
            <ol className="relative mt-3 space-y-0 border-l border-white/10 pl-4">
              {dayEntries.map((entry, index) => (
                <li
                  key={`${day}-${entry.label}`}
                  className="relative pb-4 last:pb-0"
                >
                  <span
                    className={`absolute -left-[1.27rem] top-1.5 h-2.5 w-2.5 rounded-full border-2 ${
                      entry.completed
                        ? "border-amber-300/50 bg-amber-300"
                        : "border-slate-600 bg-slate-800"
                    }`}
                    aria-hidden="true"
                  />
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.05] bg-slate-950/30 px-3 py-2.5">
                    <span className="text-sm text-slate-300">{entry.label}</span>
                    <span
                      className={`text-xs font-semibold ${
                        entry.completed ? "text-emerald-400" : "text-slate-600"
                      }`}
                    >
                      {entry.completed ? "✓" : "—"}
                    </span>
                  </div>
                  {index < dayEntries.length - 1 ? (
                    <span
                      className="absolute -left-px top-6 h-[calc(100%-0.5rem)] w-px bg-white/10"
                      aria-hidden="true"
                    />
                  ) : null}
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </section>
  );
}

export const WeekendTimeline = memo(WeekendTimelineComponent);
