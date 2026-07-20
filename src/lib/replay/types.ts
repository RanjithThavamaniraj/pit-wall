import type {
  ActiveSector,
  Championship,
  FastestLap,
  LiveDriverState,
  LiveRaceState,
  RaceFlag,
  SessionStatus,
} from "@/lib/live";

/** Session kinds a ReplayPackage may represent. */
export type ReplaySessionKind =
  | "practice"
  | "qualifying"
  | "sprint"
  | "race";

export type ReplayPlaybackSpeed = 1 | 2 | 4;

export type ReplayBookmarkKind =
  | "race_start"
  | "half_distance"
  | "safety_car"
  | "overtake"
  | "final_lap"
  | "finish"
  | "custom";

/**
 * Named cursor into a package. UI may expose these later;
 * the engine already understands seek(lap, t).
 */
export type ReplayBookmark = {
  id: string;
  kind: ReplayBookmarkKind;
  label: string;
  lap: number;
  /** Sub-lap fraction in [0, 1). */
  t?: number;
};

/**
 * Sparse historical sample. Prefer one sample per lap at minimum;
 * denser `t` values improve interpolation fidelity.
 */
export type ReplaySample = {
  lap: number;
  /** Sub-lap fraction in [0, 1). Defaults to 0. */
  t?: number;
  drivers: LiveDriverState[];
  flag?: RaceFlag;
  activeSector?: ActiveSector;
  fastestLap?: FastestLap;
  sessionStatus?: SessionStatus;
  raceFinished?: boolean;
};

export type ReplayEventType =
  | "flag"
  | "pit"
  | "sector"
  | "overtake"
  | "safety_car"
  | "finish"
  | "bookmark";

export type ReplayEvent = {
  id: string;
  lap: number;
  t?: number;
  type: ReplayEventType;
  /** Event-specific payload; shape evolves without TrackMap changes. */
  payload?: {
    flag?: RaceFlag;
    activeSector?: ActiveSector;
    code?: string;
    pit?: boolean;
    bookmarkId?: string;
    label?: string;
    [key: string]: unknown;
  };
};

/**
 * First-class historical content. Adding a race replay means shipping a new
 * package file — not changing engine, provider, TrackMap, or controls.
 */
export type ReplayPackage = {
  version: 1;
  sport: Championship;
  slug: string;
  sessionKind: ReplaySessionKind;
  totalLaps: number;
  /** Wall-clock ms for one lap at 1×. Engine default applies when omitted. */
  msPerLap?: number;
  /** Optional override; pages may resolve circuit SVG separately. */
  circuitSvgUrl?: string;
  samples: ReplaySample[];
  events: ReplayEvent[];
  bookmarks: ReplayBookmark[];
};

export type ReplayControlsState = {
  playing: boolean;
  speed: ReplayPlaybackSpeed;
  /** Integer lap shown in controls (1-based, clamped). */
  lap: number;
  totalLaps: number;
  /** Continuous cursor: (lap - 1) + fraction in [0, totalLaps]. */
  cursor: number;
  finished: boolean;
};

/** Shared subscribe/getSnapshot contract — independent of live provider ids. */
export type ReplayRaceProvider = {
  id: "replay";
  subscribe: (listener: (state: LiveRaceState | null) => void) => () => void;
  getSnapshot: () => LiveRaceState | null;
};

export type ReplayEngine = {
  play: () => void;
  pause: () => void;
  restart: () => void;
  nextLap: () => void;
  previousLap: () => void;
  seekLap: (lap: number) => void;
  seek: (lap: number, t?: number) => void;
  setSpeed: (speed: ReplayPlaybackSpeed) => void;
  destroy: () => void;
  getControlsSnapshot: () => ReplayControlsState;
  subscribeControls: (listener: () => void) => () => void;
  /** Projected LiveRaceState at the current cursor. */
  getRaceSnapshot: () => LiveRaceState | null;
  subscribeRace: (listener: () => void) => () => void;
};
