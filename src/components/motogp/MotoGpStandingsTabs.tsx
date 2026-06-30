"use client";

import { useState } from "react";
import type {
  MotoGpCategoryName,
  MotoGpRiderStanding,
  MotoGpTeamStanding,
} from "@/lib/motogp";
import { MAIN_CATEGORIES } from "@/lib/motogp";
import { countryCodeToFlag } from "@/lib/utils";
import { PersonAvatar } from "@/components/weekend-summary/PersonAvatar";
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

const RIDER_TABLE_HEADERS = [
  { label: "Pos", className: "w-12 py-3 pl-5 pr-2 text-left" },
  { label: "Portrait", className: "sr-only w-12 py-3 pr-2" },
  { label: "Nation", className: "sr-only w-10 py-3 pr-3" },
  { label: "Rider", className: "py-3 pr-4 text-left" },
  { label: "Team", className: "hidden py-3 pr-4 text-left md:table-cell" },
  { label: "Gap", className: "hidden py-3 pr-5 text-right sm:table-cell" },
  { label: "Wins", className: "hidden py-3 pr-5 text-right md:table-cell" },
  { label: "Pts", className: "py-3 pr-5 text-right" },
] as const;

const TEAM_TABLE_HEADERS = [
  { label: "Pos", className: "py-3 pl-5 pr-3 text-left" },
  { label: "Team", className: "py-3 pr-4 text-left" },
  { label: "Pts", className: "py-3 pr-4 text-right" },
  { label: "Gap", className: "hidden py-3 pr-5 text-right sm:table-cell" },
  { label: "Wins", className: "hidden py-3 pr-5 text-right md:table-cell" },
] as const;

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
    activeTable === "riders" ? RIDER_TABLE_HEADERS : TEAM_TABLE_HEADERS;

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
                  portrait={
                    <PersonAvatar
                      sport="motogp"
                      name={rider.riderName}
                      team={rider.teamName}
                      size="sm"
                    />
                  }
                  accent={
                    <span aria-hidden="true">
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
                    key={`${header.label}-${index}`}
                    scope="col"
                    className={`text-xs font-semibold uppercase tracking-[0.22em] text-slate-600 ${header.className}`}
                  >
                    {header.label}
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
