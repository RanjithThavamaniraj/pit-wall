"use client";

import { useState } from "react";
import type {
  MotoGpCategoryName,
  MotoGpRiderStanding,
  MotoGpTeamStanding,
} from "@/lib/motogp";
import { MAIN_CATEGORIES } from "@/lib/motogp";
import { countryCodeToFlag } from "@/lib/utils";
import { MotoGpRiderRow } from "./MotoGpRiderRow";
import { MotoGpTeamRow } from "./MotoGpTeamRow";
import { MobileStandingCard } from "../mobile/MobileStandingCard";

type TableTab = "riders" | "teams";

type CategoryStandings = {
  riders: MotoGpRiderStanding[];
  teams: MotoGpTeamStanding[];
};

type Props = {
  standingsByCategory: Record<MotoGpCategoryName, CategoryStandings>;
  season: number;
  round: number;
};

const CATEGORY_LABELS: Record<MotoGpCategoryName, string> = {
  "MotoGP™": "MotoGP",
  "Moto2™": "Moto2",
  "Moto3™": "Moto3",
};

export function MotoGpStandingsTabs({
  standingsByCategory,
  season,
  round,
}: Props) {
  const [activeCategory, setActiveCategory] =
    useState<MotoGpCategoryName>("MotoGP™");
  const [activeTable, setActiveTable] = useState<TableTab>("riders");

  const current = standingsByCategory[activeCategory];
  const tableHeaders =
    activeTable === "riders"
      ? ["Pos", "Rider", "Points", "Gap", "Wins"]
      : ["Pos", "Team", "Points", "Gap", "Wins"];

  const panelId = `motogp-standings-${activeCategory}-${activeTable}`;

  return (
    <div>
      <div
        role="tablist"
        aria-label="MotoGP category"
        className="flex gap-1 rounded-2xl border border-white/10 bg-white/[0.04] p-1"
      >
        {MAIN_CATEGORIES.map((category) => (
          <button
            key={category}
            id={`category-tab-${category}`}
            role="tab"
            aria-selected={activeCategory === category}
            aria-controls={panelId}
            onClick={() => setActiveCategory(category)}
            className={`mobile-tab flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${
              activeCategory === category
                ? "bg-amber-300 text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {CATEGORY_LABELS[category]}
          </button>
        ))}
      </div>

      <div
        role="tablist"
        aria-label="Standings type"
        className="mt-4 flex gap-1 rounded-2xl border border-white/10 bg-white/[0.04] p-1"
      >
        {(["riders", "teams"] as TableTab[]).map((tab) => (
          <button
            key={tab}
            id={`table-tab-${tab}`}
            role="tab"
            aria-selected={activeTable === tab}
            aria-controls={panelId}
            onClick={() => setActiveTable(tab)}
            className={`mobile-tab flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${
              activeTable === tab
                ? "bg-white/[0.08] text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {tab === "riders" ? "Riders" : "Teams"}
          </button>
        ))}
      </div>

      <p className="mt-3 text-xs text-slate-600">
        After Round {round} · {season} season · {CATEGORY_LABELS[activeCategory]}
      </p>

      <div
        id={panelId}
        role="tabpanel"
        aria-labelledby={`category-tab-${activeCategory}`}
        className="mt-5 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04]"
      >
        <div className="mobile-card-stack md:hidden">
          {activeTable === "riders"
            ? current.riders.map((rider) => (
                <MobileStandingCard
                  key={`${rider.riderNumber}-${rider.riderName}`}
                  position={rider.position}
                  accent={
                    <span className="text-lg" aria-hidden="true">
                      {countryCodeToFlag(rider.countryCode)}
                    </span>
                  }
                  primary={
                    <>
                      <span className="font-mono text-amber-200">
                        #{rider.riderNumber}
                      </span>{" "}
                      {rider.riderName}
                    </>
                  }
                  secondary={rider.teamName}
                  points={rider.points}
                  gapLabel={
                    rider.gapToLeader === 0
                      ? "Leader"
                      : `−${rider.gapToLeader} to leader`
                  }
                  wins={rider.wins}
                />
              ))
            : current.teams.map((team) => (
                <MobileStandingCard
                  key={team.name}
                  position={team.position}
                  primary={team.name}
                  points={team.points}
                  gapLabel={
                    team.gapToLeader === 0
                      ? "Leader"
                      : `−${team.gapToLeader} to leader`
                  }
                  wins={team.wins}
                />
              ))}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full border-collapse">
            <caption className="sr-only">
              {season} {CATEGORY_LABELS[activeCategory]}{" "}
              {activeTable === "riders" ? "rider" : "team"} standings after round{" "}
              {round}
            </caption>
            <thead>
              <tr className="border-b border-white/10">
                {tableHeaders.map((header, index) => (
                  <th
                    key={header}
                    scope="col"
                    className={`py-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600 ${
                      index === 0
                        ? "pl-5 pr-3 text-left"
                        : index === 1
                        ? "pr-4 text-left"
                        : index === 2
                        ? "pr-4 text-right"
                        : index === 3
                        ? "hidden pr-5 text-right sm:table-cell"
                        : "hidden pr-5 text-right md:table-cell"
                    }`}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeTable === "riders"
                ? current.riders.map((rider) => (
                    <MotoGpRiderRow
                      key={`${rider.riderNumber}-${rider.riderName}`}
                      rider={rider}
                    />
                  ))
                : current.teams.map((team) => (
                    <MotoGpTeamRow key={team.name} team={team} />
                  ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
