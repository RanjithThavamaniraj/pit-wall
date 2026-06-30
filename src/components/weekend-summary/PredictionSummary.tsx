"use client";

import { memo } from "react";
import type { CommunityPredictionSummary } from "@/lib/race-summary/types";
import { PersonAvatar } from "./PersonAvatar";

type Props = {
  sport: "f1" | "motogp";
  prediction?: CommunityPredictionSummary;
};

function PredictionSummaryComponent({ sport, prediction }: Props) {
  if (!prediction) {
    return null;
  }

  const correct =
    prediction.predictedWinner.toLowerCase() ===
    prediction.actualWinner.toLowerCase();

  const topPicks = prediction.topPicks?.length
    ? prediction.topPicks
    : [
        {
          name: prediction.predictedWinner,
          percentage: prediction.accuracy,
        },
      ];

  const maxPercentage = Math.max(...topPicks.map((pick) => pick.percentage), 1);

  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
          <span aria-hidden="true">📊</span>
          Community Prediction
        </h3>
        <div className="rounded-full border border-white/10 bg-slate-950/50 px-3 py-1 text-xs text-slate-400">
          {prediction.totalVotes
            ? `${prediction.totalVotes} votes`
            : "Community poll"}
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="space-y-4 order-2 lg:order-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Top community picks
          </p>
          {topPicks.map((pick) => (
            <div key={pick.name}>
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <span className="mobile-bar-label font-medium text-slate-200">
                  {pick.name}
                </span>
                <span className="font-mono text-xs text-amber-200/80">
                  {pick.percentage}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-900/80">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400/80 to-amber-300/50 transition-all duration-500"
                  style={{
                    width: `${(pick.percentage / maxPercentage) * 100}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3 order-1 lg:order-2">
          <div className="rounded-xl border border-white/[0.06] bg-slate-950/40 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Predicted winner
            </p>
            <div className="mt-3 flex items-center gap-3">
              <PersonAvatar
                sport={sport}
                name={prediction.predictedWinner}
                size="md"
              />
              <p className="text-sm font-semibold text-white">
                {prediction.predictedWinner}
              </p>
            </div>
          </div>
          <div
            className={`rounded-xl border p-4 ${
              correct
                ? "border-emerald-400/20 bg-emerald-400/[0.06]"
                : "border-white/[0.06] bg-slate-950/40"
            }`}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Actual winner
            </p>
            <div className="mt-3 flex items-center gap-3">
              <PersonAvatar
                sport={sport}
                name={prediction.actualWinner}
                size="md"
              />
              <div>
                <p className="text-sm font-semibold text-white">
                  {correct ? "✓ " : ""}
                  {prediction.actualWinner}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {prediction.accuracy}% community accuracy
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export const PredictionSummary = memo(PredictionSummaryComponent);
