"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import type { CompletedRaceCardData } from "@/lib/race-summary/types";
import { countryCodeToFlag } from "@/lib/utils";
import { StatusPill } from "@/components/ui";

type Props = {
  race: CompletedRaceCardData;
  isExpanded: boolean;
  onToggle: () => void;
};

function ExpandableRaceCardComponent({ race, isExpanded, onToggle }: Props) {
  const flag = countryCodeToFlag(race.countryCode);

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isExpanded}
      aria-controls={`weekend-summary-${race.slug}`}
      className={`group w-full rounded-[2rem] border p-5 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${
        isExpanded
          ? "border-amber-300/25 bg-white/[0.06] shadow-lg shadow-amber-500/5"
          : "border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06]"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden="true">
            {flag}
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">
              Round {race.round}
            </p>
            <h3
              className={`mt-0.5 text-sm font-semibold transition ${
                isExpanded
                  ? "text-white"
                  : "text-slate-400 group-hover:text-slate-300"
              }`}
            >
              {race.shortName}
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusPill tone="neutral">Completed</StatusPill>
          <motion.span
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-slate-500"
            aria-hidden="true"
          >
            ▾
          </motion.span>
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-600">{race.dateRange}</p>
      {race.circuit ? (
        <p className="mt-1 text-xs text-slate-600">{race.circuit}</p>
      ) : null}
      {!isExpanded && race.podium && race.podium.length > 0 ? (
        <div className="mt-4 space-y-1.5 border-t border-white/[0.06] pt-4">
          {race.podium.slice(0, 3).map((finisher) => (
            <div
              key={finisher.position}
              className="flex items-center justify-between text-xs"
            >
              <span className="font-mono text-slate-500">
                P{finisher.position}
              </span>
              <span className="flex-1 px-3 text-slate-300">
                {finisher.number !== undefined ? (
                  <span className="font-mono text-amber-200/80">
                    #{finisher.number}{" "}
                  </span>
                ) : null}
                {finisher.name}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </button>
  );
}

export const ExpandableRaceCard = memo(ExpandableRaceCardComponent);
