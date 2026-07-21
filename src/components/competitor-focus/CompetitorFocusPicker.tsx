"use client";

import type { LiveDriverState } from "@/lib/live";
import type { SportTerms } from "@/lib/sport-terms";

type Props = {
  competitors: LiveDriverState[];
  focusedCode: string | null;
  onSelect: (code: string) => void;
  terms: SportTerms;
};

export function CompetitorFocusPicker({
  competitors,
  focusedCode,
  onSelect,
  terms,
}: Props) {
  if (competitors.length === 0) return null;

  return (
    <div
      className="flex flex-wrap gap-2"
      role="listbox"
      aria-label={`Select ${terms.competitor} to focus`}
    >
      {competitors.map((driver) => {
        const selected = driver.code === focusedCode;
        return (
          <button
            key={driver.code}
            type="button"
            role="option"
            aria-selected={selected}
            onClick={() => onSelect(driver.code)}
            className={`inline-flex min-h-11 min-w-[4.5rem] flex-col items-start justify-center rounded-xl border px-3 py-2 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300/70 ${
              selected
                ? "border-amber-300/45 bg-amber-300/15 text-amber-50"
                : "border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/20 hover:bg-white/[0.07]"
            }`}
          >
            <span className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-slate-500">
              P{driver.position}
            </span>
            <span className="font-mono text-sm font-semibold tracking-[0.08em]">
              {driver.code}
            </span>
          </button>
        );
      })}
    </div>
  );
}
