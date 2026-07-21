import type {
  ActiveSector,
  Championship,
  LiveDriverState,
  LiveRaceState,
  RaceFlag,
} from "@/lib/live";

/** Optional enrichment outside LiveRaceState — never invents live timing. */
export type CompetitorFocusMeta = {
  displayName?: string;
  teamOrManufacturer?: string;
  nationality?: string;
  /** Reserved for future stint / tyre compound labels. */
  currentStint?: string;
};

export type FocusMetric =
  | { kind: "value"; label: string; value: string; hint?: string }
  | { kind: "reserved"; label: string; hint?: string };

/**
 * Presentation snapshot derived from LiveRaceState + optional meta.
 * Does not extend or alter the LiveRaceState contract.
 */
export type CompetitorFocusSnapshot = {
  championship: Championship;
  code: string;
  displayName: string;
  position: number;
  progress: number;
  pit: boolean;
  flag: RaceFlag;
  activeSector: ActiveSector;
  lap: number;
  totalLaps: number;
  isFastestLapHolder: boolean;
  fastestLapTime: string | null;
  teamOrManufacturer: string | null;
  nationality: string | null;
  currentStint: string | null;
  metrics: FocusMetric[];
};

export function listFocusCompetitors(
  state: LiveRaceState | null
): LiveDriverState[] {
  if (!state) return [];
  return state.drivers
    .filter((d) => d.position >= 1 && d.position <= 3)
    .sort((a, b) => a.position - b.position);
}

export function deriveCompetitorFocusSnapshot(
  state: LiveRaceState,
  code: string,
  meta?: CompetitorFocusMeta | null
): CompetitorFocusSnapshot | null {
  const driver = state.drivers.find((d) => d.code === code);
  if (!driver) return null;

  const isFl =
    state.fastestLap !== null && state.fastestLap.code === driver.code;

  const metrics: FocusMetric[] = [
    {
      kind: "value",
      label: "Position",
      value: `P${driver.position}`,
    },
    {
      kind: "reserved",
      label: "Gap to leader",
      hint: "Available when timing gaps are published",
    },
    {
      kind: "reserved",
      label: "Interval ahead",
      hint: "Available when interval data is published",
    },
    {
      kind: "reserved",
      label: "Last lap",
      hint: "Available when lap times are published",
    },
    isFl && state.fastestLap
      ? {
          kind: "value",
          label: "Best lap",
          value: state.fastestLap.time,
          hint: `Set on lap ${state.fastestLap.lap}`,
        }
      : {
          kind: "reserved",
          label: "Best lap",
          hint: "Shows when this competitor holds the session fastest lap",
        },
    {
      kind: "value",
      label: "Sector",
      value: state.activeSector ? `S${state.activeSector}` : "—",
      hint: "Session active sector",
    },
    {
      kind: "reserved",
      label: "Speed",
      hint: "Available when GPS or timing speed is published",
    },
  ];

  if (state.championship === "f1") {
    metrics.push({
      kind: "value",
      label: "Pit status",
      value: driver.pit ? "In pit" : "On track",
    });
  }

  metrics.push({
    kind: "value",
    label: "Track status",
    value: flagLabel(state.flag),
  });

  metrics.push({
    kind: "reserved",
    label: "Current stint",
    hint: "Future-ready — appears when stint data is published",
  });

  return {
    championship: state.championship,
    code: driver.code,
    displayName: meta?.displayName?.trim() || driver.code,
    position: driver.position,
    progress: driver.progress,
    pit: driver.pit,
    flag: state.flag,
    activeSector: state.activeSector,
    lap: state.lap,
    totalLaps: state.totalLaps,
    isFastestLapHolder: isFl,
    fastestLapTime: isFl && state.fastestLap ? state.fastestLap.time : null,
    teamOrManufacturer: meta?.teamOrManufacturer?.trim() || null,
    nationality: meta?.nationality?.trim() || null,
    currentStint: meta?.currentStint?.trim() || null,
    metrics,
  };
}

function flagLabel(flag: RaceFlag): string {
  switch (flag) {
    case "yellow":
      return "Yellow";
    case "vsc":
      return "VSC";
    case "safety_car":
      return "Safety car";
    case "red":
      return "Red flag";
    default:
      return "Green";
  }
}
