"use client";

import { memo } from "react";
import type { RaceSummarySport, ChampionshipRow } from "@/lib/race-summary/types";
import { PersonAvatar } from "./PersonAvatar";
import { TeamBadge } from "./TeamBadge";

const MOVEMENT_LABELS = {
  up: { icon: "▲", className: "text-emerald-400" },
  down: { icon: "▼", className: "text-rose-400" },
  unchanged: { icon: "—", className: "text-slate-500" },
} as const;

type Props = {
  sport: RaceSummarySport;
  title: string;
  icon?: string;
  rows: ChampionshipRow[];
  showTeam?: boolean;
  emptyMessage?: string;
};

function ChampionshipStandingsComponent({
  sport,
  title,
  icon = "🏆",
  rows,
  showTeam = true,
  emptyMessage = "Standings not available yet.",
}: Props) {
  const topFive = rows.slice(0, 5);

  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
      <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
        <span aria-hidden="true">{icon}</span>
        {title}
      </h3>
      {topFive.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">{emptyMessage}</p>
      ) : (
        <div className="mt-4 overflow-hidden rounded-xl border border-white/[0.06] bg-slate-950/30">
          <div className="hidden border-b border-white/[0.06] bg-slate-950/60 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 sm:grid sm:grid-cols-[2.5rem_3rem_minmax(0,1fr)_3rem_3.5rem] sm:gap-2">
            <span />
            <span>Pos</span>
            <span>Driver</span>
            <span className="text-center">Δ</span>
            <span className="text-right">Pts</span>
          </div>
          <ol>
            {topFive.map((row) => {
              const movement = row.movement
                ? MOVEMENT_LABELS[row.movement]
                : MOVEMENT_LABELS.unchanged;

              return (
                <li
                  key={`${row.position}-${row.name}`}
                  className="border-b border-white/[0.04] px-3 py-3 last:border-b-0 sm:grid sm:grid-cols-[2.5rem_3rem_minmax(0,1fr)_3rem_3.5rem] sm:items-center sm:gap-2 sm:py-2.5"
                >
                  <div className="flex items-center gap-3 sm:contents">
                    <PersonAvatar
                      sport={sport}
                      name={row.name}
                      team={row.team}
                      imageSlug={row.imageSlug}
                      size="sm"
                    />
                    <span className="font-mono text-sm text-slate-400 sm:block">
                      {row.position}
                    </span>
                    <div className="min-w-0 flex-1 sm:min-w-0">
                      <div className="flex items-center gap-2">
                        {showTeam && row.team ? (
                          <TeamBadge sport={sport} team={row.team} size="sm" />
                        ) : null}
                        <p className="truncate text-sm font-medium text-slate-100">
                          {row.name}
                        </p>
                      </div>
                      {showTeam && row.team ? (
                        <p className="truncate text-[11px] text-slate-500">
                          {row.team}
                        </p>
                      ) : null}
                    </div>
                    <div className="ml-auto flex shrink-0 items-center gap-3 sm:contents">
                      <span
                        className={`text-xs font-semibold sm:text-center ${movement.className}`}
                        title={
                          row.movement === "up"
                            ? "Moved up"
                            : row.movement === "down"
                              ? "Moved down"
                              : "Unchanged"
                        }
                      >
                        {movement.icon}
                      </span>
                      <span className="font-mono text-sm font-semibold text-amber-200/90 sm:text-right">
                        {row.points}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </section>
  );
}

export const ChampionshipStandings = memo(ChampionshipStandingsComponent);
