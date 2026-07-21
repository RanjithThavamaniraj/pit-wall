"use client";

import { GlassCard } from "@/components/ui";
import type { CircuitIntelligence, CircuitIntelligenceMetric } from "@/lib/circuit-intelligence/types";
import { useEffect, useState } from "react";
import type { RaceSummarySport } from "@/lib/race-summary/types";

type Props = {
  sport: RaceSummarySport;
  weekendSlug: string;
  className?: string;
};

function metricPill(metric: CircuitIntelligenceMetric) {
  if (!metric.value) return null;
  return (
    <div
      key={metric.label}
      className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3"
    >
      {metric.icon ? (
        <span aria-hidden="true" className="text-lg">
          {metric.icon}
        </span>
      ) : null}
      <div>
        <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          {metric.label}
        </dt>
        <dd className="mt-1 text-sm font-semibold text-slate-200">
          {metric.value}
        </dd>
      </div>
    </div>
  );
}

function CircuitIntelligenceSectionComponent({
  sport,
  weekendSlug,
  className,
}: Props) {
  const [intelligence, setIntelligence] = useState<
    CircuitIntelligence | null | undefined
  >(undefined);

  useEffect(() => {
    let cancelled = false;
    setIntelligence(undefined);

    (async () => {
      const res = await fetch(
        `/api/circuit-intelligence?sport=${encodeURIComponent(
          sport
        )}&weekendSlug=${encodeURIComponent(weekendSlug)}`,
        { cache: "no-store" }
      );

      if (!res.ok) {
        if (!cancelled) setIntelligence(null);
        return;
      }

      const json = (await res.json()) as { intelligence: CircuitIntelligence | null };
      if (!cancelled) setIntelligence(json.intelligence ?? null);
    })().catch(() => {
      if (!cancelled) setIntelligence(null);
    });

    return () => {
      cancelled = true;
    };
  }, [sport, weekendSlug]);

  const isLoading = intelligence === undefined;

  return (
    <GlassCard className={className}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Circuit Intelligence
          </p>
          {isLoading ? (
            <div className="mt-3 h-8 w-48 animate-pulse rounded bg-white/10" />
          ) : intelligence ? (
            <>
              <h2 className="mt-3 text-xl font-semibold tracking-[-0.02em] text-white">
                {intelligence.circuitName}
              </h2>
              <p className="mt-2 text-sm text-slate-300">
                {intelligence.country} ·{" "}
                {sport === "f1" ? "Formula 1" : "MotoGP"}
              </p>
            </>
          ) : null}
        </div>
      </div>

      {!isLoading && intelligence?.metrics.length ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {intelligence.metrics.map(metricPill)}
        </div>
      ) : null}

      {!isLoading && intelligence?.futureSlots.some((slot) => slot.value) ? (
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            Intelligence profile
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {intelligence.futureSlots
              .filter((slot) => slot.value)
              .map((slot) => (
                <span
                  key={slot.id}
                  className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm font-semibold text-slate-200"
                >
                  {slot.label}: {slot.value}
                </span>
              ))}
          </div>
        </div>
      ) : null}

      {!isLoading && !intelligence ? (
        <p className="mt-4 text-sm text-slate-500">
          Circuit intelligence is currently unavailable.
        </p>
      ) : null}
    </GlassCard>
  );
}

export const CircuitIntelligenceSection = CircuitIntelligenceSectionComponent;

