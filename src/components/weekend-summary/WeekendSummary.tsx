"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import type { RaceWeekendSummary } from "@/lib/race-summary/types";
import { PodiumCard } from "./PodiumCard";
import { ChampionshipStandings } from "./ChampionshipStandings";
import { PredictionSummary } from "./PredictionSummary";
import { WeekendStats } from "./WeekendStats";
import { WeekendReport } from "./WeekendReport";
import { WeekendTimeline } from "./WeekendTimeline";
import { WeatherCard } from "./WeatherCard";
import { Highlights } from "./Highlights";
import { SummarySection } from "./SummarySection";
import { summaryContainerVariants } from "./motion";

type Props = {
  summary: RaceWeekendSummary;
};

function HighlightRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value?: string;
}) {
  if (!value) return null;

  return (
    <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-slate-950/40 px-4 py-3">
      <span className="flex items-center gap-2 text-xs text-slate-400">
        <span aria-hidden="true">{icon}</span>
        {label}
      </span>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  );
}

function WeekendSummaryComponent({ summary }: Props) {
  const isF1 = summary.sport === "f1";

  return (
    <motion.div
      className="space-y-4"
      initial="hidden"
      animate="visible"
      variants={summaryContainerVariants}
    >
      {summary.weekendReport ? (
        <SummarySection>
          <WeekendReport report={summary.weekendReport} />
        </SummarySection>
      ) : null}

      <SummarySection>
        <div className="grid gap-4 lg:grid-cols-2">
          <PodiumCard
            sport={summary.sport}
            title={isF1 ? "Race Results" : "Grand Prix Results"}
            icon="🏆"
            finishers={summary.raceResults}
          />
          {!isF1 &&
          summary.sprintResults &&
          summary.sprintResults.length > 0 ? (
            <PodiumCard
              sport={summary.sport}
              title="Sprint Results"
              icon="🏁"
              finishers={summary.sprintResults}
            />
          ) : null}
        </div>
      </SummarySection>

      {summary.timeline?.length ? (
        <SummarySection>
          <WeekendTimeline entries={summary.timeline} />
        </SummarySection>
      ) : null}

      <SummarySection>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <HighlightRow icon="🥇" label="Pole Position" value={summary.polePosition} />
          <HighlightRow icon="⚡" label="Fastest Lap" value={summary.fastestLap} />
          {isF1 ? (
            <HighlightRow
              icon="🚀"
              label="Sprint Winner"
              value={summary.sprintWinner}
            />
          ) : null}
        </div>
      </SummarySection>

      {summary.weather ? (
        <SummarySection>
          <WeatherCard weather={summary.weather} />
        </SummarySection>
      ) : null}

      <SummarySection>
        <div className="grid gap-4 lg:grid-cols-2">
          {summary.driversChampionship &&
          summary.driversChampionship.length > 0 ? (
            <ChampionshipStandings
              sport={summary.sport}
              title={
                isF1
                  ? "Drivers Championship Top 5"
                  : "Riders Championship Top 5"
              }
              icon={isF1 ? "🏆" : "🏍"}
              rows={summary.driversChampionship}
            />
          ) : null}
          {summary.constructorsChampionship &&
          summary.constructorsChampionship.length > 0 ? (
            <ChampionshipStandings
              sport={summary.sport}
              title={
                isF1
                  ? "Constructors Championship Top 5"
                  : "Constructors Championship Top 5"
              }
              icon={isF1 ? "🏎" : "🏭"}
              rows={summary.constructorsChampionship}
              showTeam={false}
            />
          ) : null}
        </div>
      </SummarySection>

      {!isF1 &&
      summary.teamsChampionship &&
      summary.teamsChampionship.length > 0 ? (
        <SummarySection>
          <ChampionshipStandings
            sport={summary.sport}
            title="Teams Championship Top 5"
            icon="🏁"
            rows={summary.teamsChampionship}
            showTeam={false}
          />
        </SummarySection>
      ) : null}

      <SummarySection>
        <PredictionSummary
          sport={summary.sport}
          prediction={summary.communityPrediction}
        />
      </SummarySection>

      <SummarySection>
        <WeekendStats statistics={summary.statistics} />
      </SummarySection>

      {summary.highlights?.length ? (
        <SummarySection>
          <Highlights highlights={summary.highlights} />
        </SummarySection>
      ) : null}
    </motion.div>
  );
}

export const WeekendSummary = memo(WeekendSummaryComponent);
