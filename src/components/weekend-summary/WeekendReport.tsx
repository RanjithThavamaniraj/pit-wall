"use client";

import { memo } from "react";

type Props = {
  report?: string;
};

function WeekendReportComponent({ report }: Props) {
  if (!report) {
    return null;
  }

  return (
    <section className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-5 backdrop-blur-xl sm:p-6">
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-amber-300/60 via-amber-300/20 to-transparent"
        aria-hidden="true"
      />
      <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-amber-300/80">
        <span aria-hidden="true">📝</span>
        Weekend Report
      </h3>
      <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
        {report}
      </p>
      <p className="mt-3 text-[10px] uppercase tracking-[0.18em] text-slate-600">
        Archive summary · AI reports coming later
      </p>
    </section>
  );
}

export const WeekendReport = memo(WeekendReportComponent);
