"use client";

import { useId, useState, type ReactNode } from "react";
import { TrackMap } from "@/components/TrackMap";
import type { LiveRaceState } from "@/lib/live";
import {
  useCompetitorFocus,
  type CompetitorFocusMetaMap,
} from "@/lib/competitor-focus";
import { getSportTerms } from "@/lib/sport-terms";
import { CompetitorFocusPanel } from "./CompetitorFocusPanel";
import { CompetitorFocusPicker } from "./CompetitorFocusPicker";

type Props = {
  state: LiveRaceState;
  circuitSvgUrl: string;
  mapLabel: string;
  onMapReady?: () => void;
  metaByCode?: CompetitorFocusMetaMap;
  /** Extra content below the map (e.g. replay controls). */
  footer?: ReactNode;
  mapClassName?: string;
};

/**
 * Shared Focus Mode stage for live and replay.
 * Consumes LiveRaceState only — no championship-specific boards.
 */
export function CompetitorFocusBoard({
  state,
  circuitSvgUrl,
  mapLabel,
  onMapReady,
  metaByCode,
  footer,
  mapClassName = "",
}: Props) {
  const terms = getSportTerms(state.championship);
  const { competitors, focusedCode, snapshot, select } = useCompetitorFocus(
    state,
    metaByCode
  );
  const sheetId = useId();
  const [sheetOpen, setSheetOpen] = useState(true);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-[0.6rem] uppercase tracking-[0.22em] text-slate-500">
            Focus Mode
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Select a {terms.competitor} to highlight on the circuit.
          </p>
        </div>
        <CompetitorFocusPicker
          competitors={competitors}
          focusedCode={focusedCode}
          onSelect={(code) => {
            select(code);
            setSheetOpen(true);
          }}
          terms={terms}
        />
      </div>

      {/* Desktop: map | panel */}
      <div className="hidden gap-4 lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(17rem,22rem)] lg:items-stretch">
        <div className="relative flex min-h-[22rem] items-center justify-center overflow-hidden rounded-[1.5rem] border border-white/10 bg-gradient-to-b from-white/[0.07] to-black/40 px-4 py-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_18%,rgba(251,191,36,0.12),transparent_55%)]"
          />
          <TrackMap
            circuitSvgUrl={circuitSvgUrl}
            state={state}
            label={mapLabel}
            onReady={onMapReady}
            focusedCode={focusedCode}
            className={`!pointer-events-none !relative !left-auto !top-auto !w-full !max-w-full !translate-x-0 !translate-y-0 ${mapClassName}`}
          />
        </div>
        <CompetitorFocusPanel snapshot={snapshot} terms={terms} />
      </div>

      {/* Mobile / tablet: map + bottom sheet */}
      <div className="lg:hidden">
        <div className="relative flex min-h-[16rem] items-center justify-center overflow-hidden rounded-[1.5rem] border border-white/10 bg-gradient-to-b from-white/[0.07] to-black/40 px-3 py-7 sm:min-h-[20rem]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_18%,rgba(251,191,36,0.12),transparent_55%)]"
          />
          <TrackMap
            circuitSvgUrl={circuitSvgUrl}
            state={state}
            label={mapLabel}
            onReady={onMapReady}
            focusedCode={focusedCode}
            className={`!pointer-events-none !relative !left-auto !top-auto !w-full !max-w-full !translate-x-0 !translate-y-0 ${mapClassName}`}
          />
        </div>

        <div className="mt-3 overflow-hidden rounded-[1.25rem] border border-white/10 bg-black/40 shadow-2xl shadow-black/40">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300/70"
            aria-expanded={sheetOpen}
            aria-controls={sheetId}
            onClick={() => setSheetOpen((open) => !open)}
          >
            <span>
              <span className="block font-mono text-[0.6rem] uppercase tracking-[0.2em] text-slate-500">
                {terms.competitorTitle} Focus
              </span>
              <span className="mt-0.5 block text-sm font-semibold text-white">
                {snapshot
                  ? `${snapshot.displayName} · P${snapshot.position}`
                  : `Choose a ${terms.competitor}`}
              </span>
            </span>
            <span className="font-mono text-xs text-slate-500" aria-hidden="true">
              {sheetOpen ? "▾" : "▴"}
            </span>
          </button>
          {sheetOpen ? (
            <div id={sheetId} className="border-t border-white/10 px-3 pb-3 pt-1">
              <CompetitorFocusPanel snapshot={snapshot} terms={terms} />
            </div>
          ) : null}
        </div>
      </div>

      {footer}
    </div>
  );
}
