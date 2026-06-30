"use client";

import { useState } from "react";
import type { DriverStanding, ConstructorStanding } from "@/lib/standings";
import { nationalityToFlag } from "@/lib/utils";
import { PersonAvatar } from "@/components/weekend-summary/PersonAvatar";
import { DriverRow } from "./DriverRow";
import { ConstructorRow } from "./ConstructorRow";
import { MobileStandingCard } from "./mobile/MobileStandingCard";

type Tab = "drivers" | "constructors";

type Props = {
  drivers: DriverStanding[];
  constructors: ConstructorStanding[];
  season: string;
  round: string;
};

const DRIVER_TABLE_HEADERS = [
  { label: "Pos", className: "w-12 py-3 pl-5 pr-2 text-left" },
  { label: "Portrait", className: "sr-only w-12 py-3 pr-2" },
  { label: "Nation", className: "sr-only w-10 py-3 pr-3" },
  { label: "Driver", className: "py-3 pr-4 text-left" },
  { label: "Team", className: "hidden py-3 pr-4 text-left md:table-cell" },
  { label: "Gap", className: "hidden py-3 pr-5 text-right sm:table-cell" },
  { label: "Wins", className: "hidden py-3 pr-5 text-right md:table-cell" },
  { label: "Pts", className: "py-3 pr-5 text-right" },
] as const;

const CONSTRUCTOR_TABLE_HEADERS = [
  { label: "Pos", className: "py-3 pl-5 pr-3 text-left" },
  { label: "Constructor", className: "py-3 pr-4 text-left" },
  { label: "Pts", className: "py-3 pr-4 text-right" },
  { label: "Gap", className: "hidden py-3 pr-5 text-right sm:table-cell" },
  { label: "Wins", className: "hidden py-3 pr-5 text-right md:table-cell" },
] as const;

export function StandingsTabs({ drivers, constructors, season, round }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("drivers");

  const tableHeaders =
    activeTab === "drivers"
      ? DRIVER_TABLE_HEADERS
      : CONSTRUCTOR_TABLE_HEADERS;

  return (
    <div>
      {/* Tab switcher */}
      <div
        role="tablist"
        aria-label="Standings category"
        className="flex gap-1 rounded-2xl border border-white/10 bg-white/[0.04] p-1"
      >
        {(["drivers", "constructors"] as Tab[]).map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            aria-controls={`${tab}-panel`}
            id={`${tab}-tab`}
            onClick={() => setActiveTab(tab)}
            className={`mobile-tab flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${
              activeTab === tab
                ? "bg-amber-300 text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Context line */}
      <p className="mt-3 text-xs text-slate-600">
        After Round {round} · {season} season
      </p>

      {/* Table */}
      <div
        role="tabpanel"
        id={`${activeTab}-panel`}
        aria-labelledby={`${activeTab}-tab`}
        className="mt-5 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04]"
      >
        {/* Mobile card layout */}
        <div className="mobile-card-stack md:hidden" aria-hidden={false}>
          {activeTab === "drivers"
            ? drivers.map((driver) => {
                const fullName = `${driver.firstName} ${driver.lastName}`;
                return (
                  <MobileStandingCard
                    key={driver.driverCode}
                    position={driver.position}
                    portrait={
                      <PersonAvatar
                        sport="f1"
                        name={fullName}
                        team={driver.constructorName}
                        size="sm"
                      />
                    }
                    accent={
                      <span aria-hidden="true">
                        {nationalityToFlag(driver.nationality)}
                      </span>
                    }
                    primary={
                      <>
                        <span className="font-mono text-amber-200">
                          {driver.driverCode}
                        </span>{" "}
                        {fullName}
                      </>
                    }
                    secondary={driver.constructorName}
                    points={driver.points}
                    gapLabel={
                      driver.gapToLeader === 0
                        ? "Leader"
                        : `−${driver.gapToLeader} to leader`
                    }
                    wins={driver.wins}
                  />
                );
              })
            : constructors.map((c) => (
                <MobileStandingCard
                  key={c.name}
                  position={c.position}
                  primary={c.name}
                  secondary={c.nationality}
                  colorBar={c.color}
                  points={c.points}
                  gapLabel={
                    c.gapToLeader === 0
                      ? "Leader"
                      : `−${c.gapToLeader} to leader`
                  }
                  wins={c.wins}
                />
              ))}
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full border-collapse">
            <caption className="sr-only">
              {activeTab === "drivers"
                ? `${season} World Drivers' Championship Standings after Round ${round}`
                : `${season} World Constructors' Championship Standings after Round ${round}`}
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
              {activeTab === "drivers"
                ? drivers.map((d) => (
                    <DriverRow key={d.driverCode} driver={d} />
                  ))
                : constructors.map((c) => (
                    <ConstructorRow
                      key={c.name}
                      constructor={c}
                    />
                  ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
