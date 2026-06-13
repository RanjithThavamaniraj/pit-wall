"use client";

import { useState } from "react";
import type { DriverStanding, ConstructorStanding } from "@/lib/standings";
import { DriverRow } from "./DriverRow";
import { ConstructorRow } from "./ConstructorRow";

type Tab = "drivers" | "constructors";

type Props = {
  drivers: DriverStanding[];
  constructors: ConstructorStanding[];
  season: string;
  round: string;
};

export function StandingsTabs({ drivers, constructors, season, round }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("drivers");

  const tableHeaders =
    activeTab === "drivers"
      ? ["Pos", "Driver", "Points", "Gap", "Wins"]
      : ["Pos", "Constructor", "Points", "Gap", "Wins"];

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
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${
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
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <caption className="sr-only">
              {activeTab === "drivers"
                ? `${season} World Drivers' Championship Standings after Round ${round}`
                : `${season} World Constructors' Championship Standings after Round ${round}`}
            </caption>
            <thead>
              <tr className="border-b border-white/10">
                {tableHeaders.map((header, i) => (
                  <th
                    key={header}
                    scope="col"
                    className={`py-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600 ${
                      i === 0
                        ? "pl-5 pr-3 text-left"
                        : i === 1
                        ? "pr-4 text-left"
                        : i === 2
                        ? "pr-4 text-right"
                        : i === 3
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
