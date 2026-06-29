"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type {
  CompletedRaceCardData,
  RaceSummarySport,
  RaceWeekendSummary,
} from "@/lib/race-summary/types";
import { ExpandableRaceCard } from "./ExpandableRaceCard";
import { WeekendSummary } from "./WeekendSummary";
import { PodiumCard } from "./PodiumCard";

const summaryCache = new Map<string, RaceWeekendSummary>();

const sectionVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] as const },
  },
};

type WeekendSummaryPanelProps = {
  sport: RaceSummarySport;
  slug: string;
  fallbackPodium?: CompletedRaceCardData["podium"];
};

function WeekendSummaryPanel({
  sport,
  slug,
  fallbackPodium,
}: WeekendSummaryPanelProps) {
  const [summary, setSummary] = useState<RaceWeekendSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const cacheKey = `${sport}:${slug}`;

  useEffect(() => {
    let cancelled = false;

    async function loadSummary() {
      const cached = summaryCache.get(cacheKey);
      if (cached) {
        setSummary(cached);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(false);

      try {
        const response = await fetch(`/api/${sport}/results/${slug}`);
        if (!response.ok) {
          if (!cancelled) {
            setError(true);
            setSummary(null);
          }
          return;
        }
        const data = (await response.json()) as RaceWeekendSummary;
        summaryCache.set(cacheKey, data);
        if (!cancelled) {
          setSummary(data);
        }
      } catch {
        if (!cancelled) {
          setError(true);
          setSummary(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSummary();

    return () => {
      cancelled = true;
    };
  }, [cacheKey, slug, sport]);

  const fallbackSummary = useMemo<RaceWeekendSummary | null>(() => {
    if (!fallbackPodium?.length) return null;
    return {
      sport,
      slug,
      round: 0,
      season: 0,
      name: "",
      shortName: "",
      raceResults: fallbackPodium,
      statistics: [],
    };
  }, [fallbackPodium, slug, sport]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-[1.5rem] border border-white/[0.06] bg-white/[0.03]"
          />
        ))}
      </div>
    );
  }

  if (summary) {
    return <WeekendSummary summary={summary} />;
  }

  if (error && fallbackSummary) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-500">
          Full weekend archive loading soon. Showing available podium data.
        </p>
        <PodiumCard
          sport={sport}
          title={sport === "f1" ? "Race Results" : "Grand Prix Results"}
          finishers={fallbackSummary.raceResults}
        />
      </div>
    );
  }

  return (
    <p className="rounded-[1.5rem] border border-white/[0.06] bg-white/[0.03] px-5 py-8 text-center text-sm text-slate-500">
      Weekend summary will be available soon for this round.
    </p>
  );
}

const MemoizedWeekendSummaryPanel = memo(WeekendSummaryPanel);

type Props = {
  sport: RaceSummarySport;
  races: CompletedRaceCardData[];
};

export function CompletedWeekendGrid({ sport, races }: Props) {
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {races.map((race) => {
        const isExpanded = expandedSlug === race.slug;

        return (
          <div
            key={race.slug}
            className={isExpanded ? "col-span-full" : undefined}
          >
            <ExpandableRaceCard
              race={race}
              isExpanded={isExpanded}
              onToggle={() =>
                setExpandedSlug((current) =>
                  current === race.slug ? null : race.slug
                )
              }
            />

            <AnimatePresence initial={false}>
              {isExpanded ? (
                <motion.div
                  id={`weekend-summary-${race.slug}`}
                  key={`summary-${race.slug}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <motion.div
                    variants={sectionVariants}
                    initial="hidden"
                    animate="visible"
                    className="mt-4 rounded-[2rem] border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl sm:p-6"
                  >
                    <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-white/[0.06] pb-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300/80">
                          Weekend archive
                        </p>
                        <h3 className="mt-1 text-xl font-semibold text-white sm:text-2xl">
                          {race.name}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          Round {race.round} · {race.dateRange}
                        </p>
                      </div>
                    </div>
                    <MemoizedWeekendSummaryPanel
                      sport={sport}
                      slug={race.slug}
                      fallbackPodium={race.podium}
                    />
                  </motion.div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
