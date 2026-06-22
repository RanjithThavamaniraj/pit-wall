"use client";

import { SPORT_LABELS, type Sport } from "@/lib/sport";
import { useSportPreference } from "@/hooks/useSportPreference";

export function SportSwitcher() {
  const { activeSport, switchSport, hydrated } = useSportPreference();

  if (!hydrated) {
    return (
      <div
        aria-hidden="true"
        className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] p-1"
      >
        <span className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-slate-400">
          F1
        </span>
      </div>
    );
  }

  return (
    <div
      role="group"
      aria-label="Select sport"
      className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] p-1"
    >
      {(["f1", "motogp"] as Sport[]).map((sport) => {
        const isActive = activeSport === sport;
        return (
          <button
            key={sport}
            type="button"
            aria-pressed={isActive}
            onClick={() => switchSport(sport)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-wide transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${
              isActive
                ? "bg-amber-300 text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {SPORT_LABELS[sport]}
          </button>
        );
      })}
    </div>
  );
}
