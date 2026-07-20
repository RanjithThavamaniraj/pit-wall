import { LIVE_CACHE } from "@/lib/cache/live";
import type { OpenF1Driver, OpenF1Position, OpenF1RaceControl } from "@/lib/timing";
import {
  circuitProgressService,
  type LocationSample,
} from "../circuitProgress";
import type {
  ActiveSector,
  LiveDriverState,
  LiveRaceState,
  RaceFlag,
  SessionStatus,
} from "../types";

const OPENF1_BASE = "https://api.openf1.org/v1";

type OpenF1SessionFull = {
  session_key: number;
  session_name: string;
  session_type: string;
  circuit_key: number;
  circuit_short_name: string;
  date_start: string;
  date_end: string;
};

type OpenF1Lap = {
  driver_number: number;
  lap_number: number;
  lap_duration: number | null;
  duration_sector_1: number | null;
  duration_sector_2: number | null;
  duration_sector_3: number | null;
  is_pit_out_lap: boolean;
  date_start: string;
};

type OpenF1Location = {
  driver_number: number;
  x: number;
  y: number;
  z: number;
  date: string;
};

type OpenF1Pit = {
  driver_number: number;
  lap_number: number;
  date: string;
  lane_duration?: number;
  stop_duration?: number | null;
};

async function openf1Json<T>(
  path: string,
  revalidate: number
): Promise<T | null> {
  try {
    const res = await fetch(`${OPENF1_BASE}${path}`, {
      next: { revalidate },
    });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    return data as T;
  } catch {
    return null;
  }
}

function asArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function mapFlag(raceControl: OpenF1RaceControl[]): RaceFlag {
  const RAW: Record<string, RaceFlag> = {
    GREEN: "green",
    YELLOW: "yellow",
    "DOUBLE YELLOW": "yellow",
    DOUBLE_YELLOW: "yellow",
    RED: "red",
    CLEAR: "green",
    "SAFETY CAR": "safety_car",
    "SAFETY CAR DEPLOYED": "safety_car",
    "VIRTUAL SAFETY CAR": "vsc",
    VSC: "vsc",
  };

  for (let i = raceControl.length - 1; i >= 0; i--) {
    const rc = raceControl[i];
    if (rc.category === "SessionStatus") {
      const msg = (rc.message || "").toUpperCase();
      if (msg.includes("FINISHED") || msg.includes("ENDS")) return "green";
      continue;
    }
    if (!rc.flag || rc.flag === "NONE" || rc.flag.trim() === "") continue;
    const mapped = RAW[rc.flag.toUpperCase().trim()];
    if (mapped) return mapped;
  }
  return "green";
}

function mapSessionStatus(
  session: OpenF1SessionFull,
  raceControl: OpenF1RaceControl[],
  raceFinished: boolean
): SessionStatus {
  if (raceFinished) return "finished";

  for (let i = raceControl.length - 1; i >= 0; i--) {
    const rc = raceControl[i];
    if (rc.category !== "SessionStatus") continue;
    const msg = (rc.message || "").toUpperCase();
    if (msg.includes("SUSPENDED") || msg.includes("ABORTED")) return "suspended";
    if (msg.includes("FINISHED") || msg.includes("ENDS")) return "finished";
  }

  const now = Date.now();
  const start = new Date(session.date_start).getTime();
  const end = new Date(session.date_end).getTime();
  if (Number.isFinite(start) && Number.isFinite(end)) {
    if (now < start) return "upcoming";
    if (now > end) return "finished";
  }
  return "live";
}

function formatLapTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "";
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(3);
  return mins > 0 ? `${mins}:${secs.padStart(6, "0")}` : secs;
}

function latestByDriver<T extends { driver_number: number; date: string }>(
  rows: T[]
): Map<number, T> {
  const map = new Map<number, T>();
  for (const row of rows) {
    const prev = map.get(row.driver_number);
    if (!prev || row.date > prev.date) {
      map.set(row.driver_number, row);
    }
  }
  return map;
}

function sectorFromLap(lap: OpenF1Lap | undefined): ActiveSector {
  if (!lap) return null;
  if (lap.duration_sector_3 != null) return 3;
  if (lap.duration_sector_2 != null) return 2;
  if (lap.duration_sector_1 != null) return 1;
  return 1;
}

function timingProgressFromLap(lap: OpenF1Lap | undefined): number {
  if (!lap) return 0;
  const s1 = lap.duration_sector_1 ?? 0;
  const s2 = lap.duration_sector_2 ?? 0;
  const s3 = lap.duration_sector_3 ?? 0;
  if (s1 && s2 && s3) return 0.98;
  if (s1 && s2) return 0.55 + Math.min(0.3, s2 / 120);
  if (s1) return 0.15 + Math.min(0.25, s1 / 90);
  return 0.05;
}

/**
 * Build LiveRaceState from OpenF1.
 * Returns null when there is no usable live/recent session data
 * (caller should fall back to mock).
 */
export async function buildF1LiveRaceState(): Promise<LiveRaceState | null> {
  const sessions = await openf1Json<OpenF1SessionFull[]>(
    "/sessions?session_key=latest",
    LIVE_CACHE.OPENF1_SESSION
  );
  const session = sessions?.[0];
  if (!session?.session_key) return null;

  circuitProgressService.beginSession(String(session.session_key));

  const [driversRaw, positionsRaw, raceControlRaw, lapsRaw, pitsRaw] =
    await Promise.all([
      openf1Json<OpenF1Driver[]>(
        "/drivers?session_key=latest",
        LIVE_CACHE.OPENF1_DRIVERS
      ),
      openf1Json<OpenF1Position[]>(
        "/position?session_key=latest",
        LIVE_CACHE.OPENF1_POSITION
      ),
      openf1Json<OpenF1RaceControl[]>(
        "/race_control?session_key=latest",
        LIVE_CACHE.OPENF1_RACE_CONTROL
      ),
      openf1Json<OpenF1Lap[]>(
        "/laps?session_key=latest",
        LIVE_CACHE.OPENF1_LAPS_LIVE
      ),
      openf1Json<OpenF1Pit[]>(
        "/pit?session_key=latest",
        LIVE_CACHE.OPENF1_PIT
      ),
    ]);

  const drivers = asArray(driversRaw);
  const positions = asArray(positionsRaw);
  const raceControl = asArray(raceControlRaw);
  const laps = asArray(lapsRaw);
  const pits = asArray(pitsRaw);

  if (!drivers.length || !positions.length) return null;

  const latestPositions = latestByDriver(positions);
  const ranked = [...latestPositions.entries()]
    .map(([driver_number, row]) => ({
      driver_number,
      position: row.position,
    }))
    .filter((r) => r.position >= 1 && r.position <= 3)
    .sort((a, b) => a.position - b.position);

  if (ranked.length === 0) return null;

  const driverByNumber = new Map(
    drivers.map((d) => [d.driver_number, d] as const)
  );

  const lapsByDriver = new Map<number, OpenF1Lap[]>();
  for (const lap of laps) {
    const list = lapsByDriver.get(lap.driver_number) ?? [];
    list.push(lap);
    lapsByDriver.set(lap.driver_number, list);
  }
  for (const list of lapsByDriver.values()) {
    list.sort((a, b) => a.lap_number - b.lap_number);
  }

  const newestLapNumber = Math.max(
    0,
    ...laps.map((l) => l.lap_number || 0),
    0
  );

  let fastest: LiveRaceState["fastestLap"] = null;
  let bestDuration = Infinity;
  for (const lap of laps) {
    if (!lap.lap_duration || lap.lap_duration <= 0) continue;
    if (lap.lap_duration < bestDuration) {
      bestDuration = lap.lap_duration;
      const d = driverByNumber.get(lap.driver_number);
      fastest = {
        code: d?.name_acronym ?? String(lap.driver_number),
        time: formatLapTime(lap.lap_duration),
        lap: lap.lap_number,
      };
    }
  }

  const recentlyPitted = new Set<number>();
  const pitCutoff = Date.now() - 90_000;
  for (const pit of pits) {
    const t = new Date(pit.date).getTime();
    if (Number.isFinite(t) && t >= pitCutoff) {
      recentlyPitted.add(pit.driver_number);
    }
  }

  // Location window — last ~4 seconds
  const since = new Date(Date.now() - 4000).toISOString();
  const locationResults = await Promise.all(
    ranked.map((r) =>
      openf1Json<OpenF1Location[]>(
        `/location?session_key=latest&driver_number=${r.driver_number}&date>=${encodeURIComponent(since)}`,
        LIVE_CACHE.OPENF1_LOCATION
      )
    )
  );

  const circuitKey = String(
    session.circuit_key || session.circuit_short_name || "unknown"
  );

  const leaderLocs = asArray(locationResults[0])
    .filter(
      (l) =>
        Number.isFinite(l.x) &&
        Number.isFinite(l.y) &&
        !(l.x === 0 && l.y === 0)
    )
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((l) => ({ x: l.x, y: l.y } satisfies LocationSample));

  if (leaderLocs.length > 0) {
    circuitProgressService.ingestLeaderSamples(circuitKey, leaderLocs);
  }

  const hasGps = circuitProgressService.hasCalibration(circuitKey);
  let anyLocation = false;

  const liveDrivers: LiveDriverState[] = ranked.map((row, index) => {
    const driver = driverByNumber.get(row.driver_number);
    const code =
      driver?.name_acronym ||
      driver?.last_name?.slice(0, 3).toUpperCase() ||
      String(row.driver_number);

    const locs = asArray(locationResults[index])
      .filter(
        (l) =>
          Number.isFinite(l.x) &&
          Number.isFinite(l.y) &&
          !(l.x === 0 && l.y === 0)
      )
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date));
    const latestLoc = locs[locs.length - 1];

    let progress: number;
    if (latestLoc) {
      anyLocation = true;
      const gps = circuitProgressService.progressAt(circuitKey, {
        x: latestLoc.x,
        y: latestLoc.y,
      });
      if (gps != null) {
        progress = gps;
      } else {
        const driverLaps = lapsByDriver.get(row.driver_number) ?? [];
        progress = timingProgressFromLap(driverLaps[driverLaps.length - 1]);
        progress = (progress - (row.position - 1) * 0.02 + 1) % 1;
      }
    } else {
      const driverLaps = lapsByDriver.get(row.driver_number) ?? [];
      progress = timingProgressFromLap(driverLaps[driverLaps.length - 1]);
      progress = (progress - (row.position - 1) * 0.02 + 1) % 1;
    }

    const driverLaps = lapsByDriver.get(row.driver_number) ?? [];
    const lastLap = driverLaps[driverLaps.length - 1];
    const inPit =
      recentlyPitted.has(row.driver_number) ||
      Boolean(lastLap?.is_pit_out_lap);

    return {
      position: row.position as 1 | 2 | 3,
      code,
      progress,
      pit: inPit,
    };
  });

  // Without location data at all, OpenF1 GPS path is not usable → signal null
  if (!anyLocation && !hasGps) {
    return null;
  }

  const raceFinished =
    mapSessionStatus(session, raceControl, false) === "finished" ||
    raceControl.some((rc) => (rc.flag || "").toUpperCase() === "CHEQUERED");

  const sessionStatus = mapSessionStatus(session, raceControl, raceFinished);

  // Only serve live (or briefly suspended) sessions — otherwise mock fallback.
  if (sessionStatus !== "live" && sessionStatus !== "suspended") {
    return null;
  }

  const leaderLaps = lapsByDriver.get(ranked[0].driver_number) ?? [];
  const activeSector = sectorFromLap(leaderLaps[leaderLaps.length - 1]);

  return {
    championship: "f1",
    sessionStatus,
    lap: newestLapNumber,
    totalLaps: 0,
    flag: raceFinished ? "green" : mapFlag(raceControl),
    activeSector,
    drivers: liveDrivers,
    raceFinished,
    fastestLap: fastest,
    progressSource: "gps",
  };
}
