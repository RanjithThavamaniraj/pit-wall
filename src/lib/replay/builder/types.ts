import type {
  ActiveSector,
  Championship,
  FastestLap,
  LiveDriverState,
  RaceFlag,
} from "@/lib/live";
import type {
  ReplayBookmark,
  ReplayEvent,
  ReplayPackage,
  ReplaySessionKind,
} from "@/lib/replay/types";

/** Schema version currently emitted by the builder (`ReplayPackage.version`). */
export const REPLAY_SCHEMA_VERSION = 1 as const;

export type ValidationSeverity = "error" | "warning";

export type ValidationIssue = {
  path: string;
  message: string;
  severity: ValidationSeverity;
};

export type ValidationResult =
  | { ok: true; package: ReplayPackage; warnings: ValidationIssue[] }
  | { ok: false; issues: ValidationIssue[] };

/**
 * Source-neutral race timeline.
 * Adapters map provider-specific history into this shape; the builder
 * assembles a ReplayPackage. Never invent lap progress here.
 */
export type ReplayTimelineLap = {
  lap: number;
  t?: number;
  drivers: LiveDriverState[];
  flag?: RaceFlag;
  activeSector?: ActiveSector;
  fastestLap?: FastestLap;
  sessionStatus?: ReplayPackage["samples"][number]["sessionStatus"];
  raceFinished?: boolean;
};

export type ReplayTimeline = {
  sport: Championship;
  slug: string;
  sessionKind: ReplaySessionKind;
  totalLaps: number;
  msPerLap?: number;
  circuitSvgUrl?: string;
  laps: ReplayTimelineLap[];
  events?: ReplayEvent[];
  bookmarks?: ReplayBookmark[];
};

export type BuildContext = {
  sport: Championship;
  slug: string;
  sessionKind?: ReplaySessionKind;
  /** Optional circuit SVG override written into the package. */
  circuitSvgUrl?: string;
};

export type AdapterResult =
  | { ok: true; timeline: ReplayTimeline }
  | { ok: false; reason: string; issues?: ValidationIssue[] };

/**
 * Converts historical source input into a ReplayTimeline.
 * Adapters must not fabricate driver progress when data is missing.
 */
export type ReplaySourceAdapter = {
  id: string;
  label: string;
  build: (input: unknown, context: BuildContext) => Promise<AdapterResult>;
};

export type BuildReplayPackageResult =
  | {
      ok: true;
      package: ReplayPackage;
      warnings: ValidationIssue[];
      adapterId: string;
    }
  | {
      ok: false;
      issues: ValidationIssue[];
      adapterId: string;
      reason?: string;
    };

export type WritePackageResult = {
  path: string;
  package: ReplayPackage;
};
