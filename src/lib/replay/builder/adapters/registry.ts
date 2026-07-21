import { archiveSummaryAdapter } from "./archiveSummaryAdapter";
import { openF1HistoricalAdapter } from "./openF1HistoricalAdapter";
import { pulseLiveHistoricalAdapter } from "./pulseLiveHistoricalAdapter";
import { rawPackageAdapter } from "./rawPackageAdapter";
import { timelineAdapter } from "./timelineAdapter";
import type { ReplaySourceAdapter } from "../types";

const ADAPTERS: ReplaySourceAdapter[] = [
  rawPackageAdapter,
  timelineAdapter,
  openF1HistoricalAdapter,
  pulseLiveHistoricalAdapter,
  archiveSummaryAdapter,
];

const BY_ID = new Map(ADAPTERS.map((adapter) => [adapter.id, adapter]));

export function listReplayAdapters(): readonly ReplaySourceAdapter[] {
  return ADAPTERS;
}

export function getReplayAdapter(id: string): ReplaySourceAdapter | null {
  return BY_ID.get(id) ?? null;
}

export {
  archiveSummaryAdapter,
  openF1HistoricalAdapter,
  pulseLiveHistoricalAdapter,
  rawPackageAdapter,
  timelineAdapter,
};
