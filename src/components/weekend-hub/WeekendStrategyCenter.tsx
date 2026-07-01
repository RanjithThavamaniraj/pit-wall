"use client";

import { useEffect, useMemo, useState } from "react";
import { GlassCard, Skeleton, StatusPill } from "@/components/ui";
import {
  deriveWeekendPhase,
  type EventTone,
} from "@/lib/weekend-hub";
import type {
  HubSession,
  HubSport,
  WeekendHubData,
  WeekendPhase,
} from "@/lib/weekend-hub";
import {
  getStrategyHeadline,
  getWeekendStrategy,
  rainProbabilityPercent,
  rankWatchFor,
  regenerateWeekendStrategy,
  safetyCarLikelihoodPercent,
  type PitStrategy,
  type StrategyConfidence,
  type StrategyContext,
  type WeekendStrategy,
} from "@/lib/weekend-hub/strategy";
import { formatLocalTimeOnly } from "@/lib/utils";
import { StrategyCard } from "./StrategyCard";

type Props = {
  sport: HubSport;
  weekendSlug: string;
  weekendName: string;
  phase?: WeekendPhase;
  sessions?: HubSession[];
  data?: WeekendHubData;
  isSprintWeekend?: boolean;
  providerId?: string;
  headingId?: string;
  className?: string;
};

// ─── small presentational helpers ────────────────────────────────────────────

const CONFIDENCE_TONE: Record<
  StrategyConfidence,
  "amber" | "neutral" | "blue"
> = {
  high: "amber",
  medium: "neutral",
  low: "blue",
};

function phaseOrDerived(
  phase: WeekendPhase | undefined,
  data: WeekendHubData | undefined
): WeekendPhase {
  if (phase) return phase;
  if (data) return deriveWeekendPhase(data);
  return "upcoming";
}

function phaseHeaderTone(phase: WeekendPhase): EventTone {
  switch (phase) {
    case "live":
      return "red";
    case "completed":
      return "neutral";
    case "cancelled":
      return "amber";
    case "upcoming":
      return "green";
  }
}

function phaseHeaderLabel(phase: WeekendPhase): string {
  switch (phase) {
    case "live":
      return "Live";
    case "completed":
      return "Recap";
    case "cancelled":
      return "Status";
    case "upcoming":
      return "Preview";
  }
}

function emptyStateCopy(phase: WeekendPhase): {
  title: string;
  body: string;
} {
  switch (phase) {
    case "upcoming":
      return {
        title: "Strategy warming up",
        body: "The strategy model will populate here once the team has enough data to project from.",
      };
    case "live":
      return {
        title: "Strategy recalculating",
        body: "Live strategy blocks refresh as the race unfolds and the window tightens.",
      };
    case "completed":
      return {
        title: "Strategy archived",
        body: "The post-race strategy read was not recorded for this weekend.",
      };
    case "cancelled":
      return {
        title: "Weekend cancelled",
        body: "With the event not running, there is no race strategy to chart.",
      };
  }
}

function fallbackCopy(phase: WeekendPhase): {
  title: string;
  body: string;
} {
  switch (phase) {
    case "cancelled":
      return {
        title: "Weekend cancelled",
        body: "The weekend will not proceed, so there is no strategy to model.",
      };
    default:
      return {
        title: "Strategy unavailable",
        body: "Could not assemble a strategy read for this weekend.",
      };
  }
}

function capitalizeCompound(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function evolutionLabel(
  evolution: "improving" | "stable" | "degrading"
): string {
  switch (evolution) {
    case "improving":
      return "Improving";
    case "stable":
      return "Stable";
    case "degrading":
      return "Degrading";
  }
}

function trendLabel(trend: "rising" | "holding" | "falling"): string {
  switch (trend) {
    case "rising":
      return "Rising";
    case "holding":
      return "Holding";
    case "falling":
      return "Falling";
  }
}

function riskLabel(
  risk: "conservative" | "balanced" | "aggressive"
): string {
  switch (risk) {
    case "conservative":
      return "Conservative";
    case "balanced":
      return "Balanced";
    case "aggressive":
      return "Aggressive";
  }
}

// ─── metres: label/value row consistent with the cinematic language ──────────

function MetricRow({
  label,
  value,
  hint,
  highlight = false,
}: {
  label: string;
  value: string;
  hint?: string;
  highlight?: boolean;
}) {
  return (
    <li
      className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
        highlight
          ? "border-amber-300/20 bg-amber-300/[0.06]"
          : "border-white/[0.06] bg-slate-950/40"
      }`}
    >
      <span className="flex min-w-0 items-center gap-2 text-xs text-slate-400">
        <span className="truncate">{label}</span>
      </span>
      <span className="flex items-baseline gap-1.5">
        <span className="text-sm font-semibold text-white">{value}</span>
        {hint ? (
          <span className="text-[11px] text-slate-600">{hint}</span>
        ) : null}
      </span>
    </li>
  );
}

function SectionHeading({
  eyebrow,
  title,
  id,
}: {
  eyebrow?: string;
  title: string;
  id?: string;
}) {
  return (
    <div>
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300/80">
          {eyebrow}
        </p>
      ) : null}
      <h3
        id={id}
        className={`${eyebrow ? "mt-1.5" : ""} text-sm font-semibold uppercase tracking-[0.24em] text-slate-300`}
      >
        {title}
      </h3>
    </div>
  );
}

// ─── skeletons & empty states ────────────────────────────────────────────────

function StrategySkeleton() {
  return (
    <div className="space-y-4">
      <GlassCard className="!p-5">
        <Skeleton className="h-4 w-32 rounded-md" />
        <Skeleton className="mt-3 h-6 w-2/3 rounded-md" />
        <div className="mt-4 space-y-2">
          <Skeleton className="h-3.5 w-full rounded-md" />
          <Skeleton className="h-3.5 w-11/12 rounded-md" />
        </div>
      </GlassCard>

      <div className="grid gap-4 sm:grid-cols-2">
        {[0, 1].map((i) => (
          <GlassCard key={i} className="!p-5">
            <Skeleton className="h-4 w-28 rounded-md" />
            <div className="mt-4 space-y-2.5">
              <Skeleton className="h-9 w-full rounded-xl" />
              <Skeleton className="h-9 w-full rounded-xl" />
              <Skeleton className="h-9 w-full rounded-xl" />
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <GlassCard key={i} className="!p-5">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-40 rounded-md" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="mt-4 h-3.5 w-full rounded-md" />
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ phase }: { phase: WeekendPhase }) {
  const copy = emptyStateCopy(phase);
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-white/5 bg-slate-950/40 px-5 py-10 text-center">
      <p className="text-sm font-semibold text-white">{copy.title}</p>
      <p className="mt-1.5 max-w-xs text-xs leading-5 text-slate-400">
        {copy.body}
      </p>
    </div>
  );
}

// ─── pit window block ────────────────────────────────────────────────────────

function PitWindowRow({ window }: { window: PitStrategy["windows"][number] }) {
  return (
    <li className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-slate-950/40 px-4 py-3">
      <span className="text-xs text-slate-400">
        Stop {window.stint}
      </span>
      <span className="flex items-baseline gap-1.5">
        <span className="font-mono text-sm font-semibold text-white">
          L{window.fromLap}–{window.toLap}
        </span>
        <span className="text-[11px] uppercase tracking-wide text-slate-600">
          {capitalizeCompound(window.compound)}
        </span>
      </span>
    </li>
  );
}

function PitStrategyBlock({ pit }: { pit: PitStrategy }) {
  return (
    <GlassCard>
      <SectionHeading eyebrow="Tyres & stops" title="Pit strategy" />
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <MetricRow
          label="Expected stops"
          value={`${pit.expectedStops}`}
          hint={pit.expectedStops === 1 ? "stop" : "stops"}
          highlight
        />
        <MetricRow
          label="Undercut advantage"
          value={`${pit.undercutAdvantageSec.toFixed(2)}s`}
        />
        <MetricRow
          label="Overcut advantage"
          value={`${pit.overcutAdvantageSec.toFixed(2)}s`}
        />
        <MetricRow label="Window shape" value={`${pit.windows.length} plan${pit.windows.length === 1 ? "" : "s"}`} />
      </div>

      {pit.windows.length > 0 ? (
        <ul role="list" className="mt-4 space-y-2">
          {pit.windows.map((window) => (
            <PitWindowRow key={window.stint} window={window} />
          ))}
        </ul>
      ) : null}
    </GlassCard>
  );
}

// ─── tyre strategy block (handles F1 and MotoGP variants) ────────────────────

function TyreStrategyBlock({
  strategy,
}: {
  strategy: WeekendStrategy;
}) {
  const tyre = strategy.tyreStrategy;

  if (tyre.sport === "f1") {
    return (
      <GlassCard>
        <SectionHeading eyebrow="Tyres" title="Compound plan" />
        <ul role="list" className="mt-4 space-y-2.5">
          <MetricRow
            label="Opening compound"
            value={capitalizeCompound(tyre.openingCompound)}
            highlight
          />
          <MetricRow
            label="Middle compound"
            value={capitalizeCompound(tyre.middleCompound)}
          />
          <MetricRow
            label="Final compound"
            value={capitalizeCompound(tyre.finalCompound)}
          />
        </ul>
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <SectionHeading eyebrow="Tyres" title="Compound plan" />
      <ul role="list" className="mt-4 space-y-2.5">
        <MetricRow
          label="Front tyre"
          value={capitalizeCompound(tyre.frontTyre)}
          highlight
        />
        <MetricRow label="Rear tyre" value={capitalizeCompound(tyre.rearTyre)} />
        <MetricRow
          label="Tyre risk"
          value={riskLabel(tyre.tyreRisk)}
        />
      </ul>
    </GlassCard>
  );
}

// ─── weather block ───────────────────────────────────────────────────────────

function WeatherBlock({ strategy }: { strategy: WeekendStrategy }) {
  const rainPct = rainProbabilityPercent(strategy);
  return (
    <GlassCard>
      <SectionHeading eyebrow="Forecast" title="Weather" />
      <ul role="list" className="mt-4 space-y-2.5">
        <MetricRow
          label="Rain probability"
          value={`${rainPct}%`}
          highlight={rainPct >= 50}
        />
        <MetricRow
          label="Track evolution"
          value={evolutionLabel(strategy.weather.trackEvolution)}
        />
        <MetricRow
          label="Temperature trend"
          value={trendLabel(strategy.weather.temperatureTrend)}
        />
      </ul>
    </GlassCard>
  );
}

// ─── race factors block ──────────────────────────────────────────────────────

function RaceFactorsBlock({ strategy }: { strategy: WeekendStrategy }) {
  const scPct = safetyCarLikelihoodPercent(strategy);
  return (
    <GlassCard>
      <SectionHeading eyebrow="Track shape" title="Race factors" />
      <ul role="list" className="mt-4 space-y-2.5">
        <MetricRow
          label="Safety car likelihood"
          value={`${scPct}%`}
          highlight={scPct >= 50}
        />
        <MetricRow
          label="Tyre degradation"
          value={`${Math.round(strategy.raceFactors.tyreDegradation * 100)}%`}
        />
        <MetricRow
          label="Fuel saving"
          value={`${Math.round(strategy.raceFactors.fuelSaving * 100)}%`}
        />
        <MetricRow
          label="Overtaking difficulty"
          value={`${Math.round(
            strategy.raceFactors.overtakingDifficulty * 100
          )}%`}
        />
      </ul>
    </GlassCard>
  );
}

// ─── build context helper ────────────────────────────────────────────────────

function buildContext(
  sport: HubSport,
  weekendSlug: string,
  weekendName: string,
  phase: WeekendPhase,
  sessions: HubSession[],
  isSprintWeekend: boolean | undefined
): StrategyContext {
  return {
    sport,
    weekendSlug,
    weekendName,
    phase,
    sessions: sessions.map((s) => ({ key: s.key, label: s.label })),
    isSprintWeekend,
  };
}

// ─── the orchestrator ────────────────────────────────────────────────────────

export function WeekendStrategyCenter({
  sport,
  weekendSlug,
  weekendName,
  phase,
  sessions,
  data,
  isSprintWeekend,
  providerId,
  headingId,
  className = "",
}: Props) {
  const resolvedPhase = phaseOrDerived(phase, data);
  const resolvedSessions = useMemo(
    () => sessions ?? data?.sessions ?? [],
    [sessions, data]
  );

  const [strategy, setStrategy] = useState<WeekendStrategy | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [regenerating, setRegenerating] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    const context = buildContext(
      sport,
      weekendSlug,
      weekendName,
      resolvedPhase,
      resolvedSessions,
      isSprintWeekend
    );

    setLoading(true);
    setError(false);

    getWeekendStrategy(context, providerId)
      .then((result) => {
        if (cancelled) return;
        setStrategy(result);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    sport,
    weekendSlug,
    weekendName,
    resolvedPhase,
    resolvedSessions,
    isSprintWeekend,
    providerId,
  ]);

  function handleRegenerate() {
    if (regenerating || loading) return;
    const context = buildContext(
      sport,
      weekendSlug,
      weekendName,
      resolvedPhase,
      resolvedSessions,
      isSprintWeekend
    );

    setRegenerating(true);
    setError(false);

    regenerateWeekendStrategy(context, providerId)
      .then((result) => {
        setStrategy(result);
        setRegenerating(false);
      })
      .catch(() => {
        setError(true);
        setRegenerating(false);
      });
  }

  const isLoading = loading || regenerating;
  const isEmpty =
    !isLoading && !error && (!strategy || strategy.watchFor.length === 0);
  const headerTone = phaseHeaderTone(resolvedPhase);
  const headline = strategy ? getStrategyHeadline(strategy) : null;
  const fallback = fallbackCopy(resolvedPhase);

  const watchItems = useMemo(
    () => (strategy ? rankWatchFor(strategy.watchFor) : []),
    [strategy]
  );

  return (
    <section
      aria-labelledby={headingId}
      aria-label="Weekend strategy"
      className={className}
    >
      <div className="space-y-4">
        {/* header */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
              Strategy centre
            </p>
            <h2
              id={headingId}
              className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white sm:text-3xl"
            >
              {loading ? (
                <Skeleton className="h-7 w-64 rounded-md" />
              ) : strategy ? (
                headline
              ) : (
                `${weekendName} ${phaseHeaderLabel(resolvedPhase)}`
              )}
            </h2>
            {loading ? (
              <Skeleton className="mt-2 h-4 w-72 rounded-md" />
            ) : (
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Deterministic projection of the most likely race shape, tyre
                plan and pit windows for this weekend.
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {error ? (
              <span className="text-xs font-semibold uppercase text-red-400">
                {fallback.title}
              </span>
            ) : resolvedPhase === "live" && !isLoading ? (
              <StatusPill tone={headerTone}>
                <span
                  className="mr-1.5 inline-block size-1.5 animate-pulse rounded-full bg-red-400"
                  aria-hidden="true"
                />
                Live
              </StatusPill>
            ) : (
              <StatusPill tone={headerTone}>
                {phaseHeaderLabel(resolvedPhase)}
              </StatusPill>
            )}

            {!isLoading &&
            !error &&
            strategy &&
            strategy.watchFor.length > 0 ? (
              <button
                type="button"
                onClick={handleRegenerate}
                disabled={regenerating}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-slate-300 transition hover:border-amber-300/30 hover:text-amber-200 disabled:opacity-50"
                aria-label="Regenerate strategy"
              >
                <span
                  className={`inline-block size-1.5 rounded-full bg-amber-300 ${
                    regenerating ? "animate-pulse" : ""
                  }`}
                  aria-hidden="true"
                />
                {regenerating ? "Recalculating" : "Recalculate"}
              </button>
            ) : null}
          </div>
        </div>

        {/* body */}
        {isLoading ? (
          <StrategySkeleton />
        ) : error ? (
          <EmptyState phase={resolvedPhase} />
        ) : isEmpty ? (
          <EmptyState phase={resolvedPhase} />
        ) : strategy ? (
          <div className="space-y-4">
            {/* strategy overview */}
            <GlassCard className="relative overflow-hidden">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/40 to-transparent"
              />
              <SectionHeading
                eyebrow="Strategy overview"
                title="Predicted shape"
              />
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xl font-semibold tracking-[-0.02em] text-white sm:text-2xl">
                  {strategy.raceStrategy.predictedStrategy}
                </p>
                <StatusPill tone={CONFIDENCE_TONE[strategy.confidence]}>
                  {strategy.confidence === "high"
                    ? "High confidence"
                    : strategy.confidence === "medium"
                    ? "Medium confidence"
                    : "Low confidence"}
                </StatusPill>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                {strategy.raceStrategy.description}
              </p>
            </GlassCard>

            {/* tyre + pit/W weather/factors grid */}
            <div className="grid gap-4 lg:grid-cols-2">
              <TyreStrategyBlock strategy={strategy} />
              {strategy.pitStrategy ? (
                <PitStrategyBlock pit={strategy.pitStrategy} />
              ) : null}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <WeatherBlock strategy={strategy} />
              <RaceFactorsBlock strategy={strategy} />
            </div>

            {/* watch for */}
            <div>
              <SectionHeading eyebrow="AI insights" title="Watch for" />
              <div className="mt-4 space-y-3">
                {watchItems.map((item) => (
                  <StrategyCard
                    key={item.id}
                    title={item.title}
                    detail={item.detail}
                    importance={item.importance}
                    icon={item.importance === "high" ? "⚑" : "▹"}
                    headingId={`${headingId ?? "weekend-strategy"}-watch-${item.id}`}
                  />
                ))}
              </div>
            </div>

            {strategy.generatedAt ? (
              <p
                className="px-1 font-mono text-[11px] text-slate-600"
                suppressHydrationWarning
                title={strategy.generatedAt}
              >
                Strategy generated {formatLocalTimeOnly(strategy.generatedAt)}
                {sport === "f1" && strategy.pitStrategy
                  ? ` · ${strategy.pitStrategy.expectedStops}-stop base`
                  : ""}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}