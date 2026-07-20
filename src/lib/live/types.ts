export type Championship = "f1" | "motogp";

export type SessionStatus =
  | "upcoming"
  | "live"
  | "finished"
  | "suspended"
  | "cancelled";

export type RaceFlag =
  | "green"
  | "yellow"
  | "vsc"
  | "safety_car"
  | "red";

export type ActiveSector = 1 | 2 | 3 | null;

/** How driver progress along the circuit was obtained. */
export type ProgressSource = "gps" | "timing" | "simulated" | "replay";

export type LiveDriverState = {
  position: 1 | 2 | 3;
  code: string;
  /** Progress along the circuit path, 0.0–1.0 */
  progress: number;
  pit: boolean;
};

export type FastestLap = {
  code: string;
  time: string;
  lap: number;
} | null;

/**
 * Unified live race snapshot for TrackMap.
 * Providers for F1 and MotoGP must both return this shape.
 * TrackMap never branches on championship.
 */
export type LiveRaceState = {
  championship: Championship;
  sessionStatus: SessionStatus;
  lap: number;
  totalLaps: number;
  flag: RaceFlag;
  activeSector: ActiveSector;
  drivers: LiveDriverState[];
  /** True once the chequered flag has fallen. */
  raceFinished: boolean;
  /** Current fastest lap holder, if known. */
  fastestLap: FastestLap;
  /**
   * Origin of driver progress values.
   * - gps: derived from location coordinates (F1 / OpenF1)
   * - timing: derived from gaps / lap clock (MotoGP)
   * - simulated: mock / local demo provider
   * - replay: historical ReplayPackage projection
   */
  progressSource: ProgressSource;
};
