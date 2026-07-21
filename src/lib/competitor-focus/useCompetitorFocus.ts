"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { LiveRaceState } from "@/lib/live";
import {
  deriveCompetitorFocusSnapshot,
  listFocusCompetitors,
  type CompetitorFocusMeta,
  type CompetitorFocusSnapshot,
} from "./deriveFocusSnapshot";

export type CompetitorFocusMetaMap = Record<string, CompetitorFocusMeta>;

/**
 * Selection state for Focus Mode. Driven by LiveRaceState only —
 * works for live providers and ReplayProvider alike.
 */
export function useCompetitorFocus(
  state: LiveRaceState | null,
  metaByCode?: CompetitorFocusMetaMap
) {
  const competitors = useMemo(() => listFocusCompetitors(state), [state]);
  const [focusedCode, setFocusedCode] = useState<string | null>(null);

  useEffect(() => {
    if (competitors.length === 0) {
      setFocusedCode(null);
      return;
    }
    setFocusedCode((prev) => {
      if (prev && competitors.some((c) => c.code === prev)) return prev;
      return competitors[0]?.code ?? null;
    });
  }, [competitors]);

  const select = useCallback((code: string) => {
    setFocusedCode(code);
  }, []);

  const clear = useCallback(() => {
    setFocusedCode(null);
  }, []);

  const snapshot: CompetitorFocusSnapshot | null = useMemo(() => {
    if (!state || !focusedCode) return null;
    return deriveCompetitorFocusSnapshot(
      state,
      focusedCode,
      metaByCode?.[focusedCode] ?? null
    );
  }, [state, focusedCode, metaByCode]);

  return {
    competitors,
    focusedCode,
    snapshot,
    select,
    clear,
  };
}
