import { NextResponse } from "next/server";
import { withApiAnalytics } from "@/lib/analytics/api-wrapper";
import {
  OpenF1Session,
  OpenF1Driver,
  OpenF1Position,
  OpenF1Interval,
  OpenF1RaceControl,
  OpenF1Weather,
  LiveTimingPayload,
  TimingRowData,
  SessionStatus,
} from "@/lib/timing";
import { fetchSeasonSchedule } from "@/lib/schedule";
import { getWeekendContext } from "@/lib/weekend";
import { buildSessionBriefing } from "@/lib/session-briefing";
import { LIVE_CACHE } from "@/lib/cache/live";

export type OpenF1Lap = {
  meeting_key: number;
  session_key: number;
  driver_number: number;
  lap_number: number;
  date_start: string;
  duration_sector_1: number;
  duration_sector_2: number;
  duration_sector_3: number;
  i1_speed: number;
  i2_speed: number;
  is_pit_out_lap: boolean;
  lap_duration: number;
  st_speed: number;
};

// OpenF1 base URL
const OPENF1_BASE = "https://api.openf1.org/v1";

function formatLapTime(seconds: number): string {
  if (seconds === Infinity) return "";
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(3);
  return mins > 0 ? `${mins}:${secs.padStart(6, "0")}` : secs;
}

export const GET = withApiAnalytics("/api/live/timing", async function GET() {
  try {
    // 1. Get the authoritative weekend state from Jolpica
    const schedule = await fetchSeasonSchedule("current");
    const weekendContext = getWeekendContext(schedule);

    if (!weekendContext) {
      return NextResponse.json({ error: "No weekend context found" }, { status: 404 });
    }

    const sessionBriefing = await buildSessionBriefing(weekendContext, schedule);

    // 2. Fetch the OpenF1 session mapping
    const sessionRes = await fetch(`${OPENF1_BASE}/sessions?session_key=latest`, {
      next: { revalidate: LIVE_CACHE.OPENF1_SESSION },
    });
    let currentSession: OpenF1Session | null = null;
    if (sessionRes.ok) {
      const sessionData: OpenF1Session[] = await sessionRes.json();
      currentSession = sessionData[0];
    }

    const isSessionResults =
      weekendContext.state === "COMPLETED" ||
      weekendContext.state === "BETWEEN_SESSIONS";

    // If there is NO active or completed session, and we are UPCOMING
    if (weekendContext.state === "UPCOMING" || !currentSession) {
      return NextResponse.json(
        {
          weekendContext,
          session: null,
          timing: [],
          sessionBriefing,
        },
        { headers: { "Cache-Control": `public, s-maxage=${LIVE_CACHE.TIMING_UPCOMING_S_MAXAGE}` } }
      );
    }

    // 3. Fetch base data (Drivers, Weather, RaceControl)
    const [driversRes, weatherRes, raceControlRes] = await Promise.all([
      fetch(`${OPENF1_BASE}/drivers?session_key=latest`, { next: { revalidate: LIVE_CACHE.OPENF1_DRIVERS } }),
      fetch(`${OPENF1_BASE}/weather?session_key=latest`, { next: { revalidate: LIVE_CACHE.OPENF1_WEATHER } }),
      fetch(`${OPENF1_BASE}/race_control?session_key=latest`, { next: { revalidate: LIVE_CACHE.OPENF1_RACE_CONTROL } }),
    ]);

    const drivers: OpenF1Driver[] = driversRes.ok
      ? await driversRes.json()
      : [];
    const weather: OpenF1Weather[] = weatherRes.ok
      ? await weatherRes.json()
      : [];
    const raceControl: OpenF1RaceControl[] = raceControlRes.ok
      ? await raceControlRes.json()
      : [];

    // Determine flag / session state.
    const RAW_FLAG_MAP: Record<string, SessionStatus["flag"]> = {
      "GREEN":                "GREEN",
      "YELLOW":               "YELLOW",
      "DOUBLE YELLOW":        "DOUBLE_YELLOW",
      "DOUBLE_YELLOW":        "DOUBLE_YELLOW",
      "RED":                  "RED",
      "CHEQUERED":            "CHEQUERED",
      "SAFETY CAR":           "SAFETY_CAR",
      "SAFETY CAR DEPLOYED":  "SAFETY_CAR",
      "VIRTUAL SAFETY CAR":   "VSC",
      "CLEAR":                "GREEN",
    };

    let currentFlag: SessionStatus["flag"] = "UNKNOWN";

    for (let i = raceControl.length - 1; i >= 0; i--) {
      const rc = raceControl[i];
      if (rc.category === "SessionStatus") {
        const msg = (rc.message || "").toUpperCase();
        if (msg.includes("FINISHED") || msg.includes("ENDS") || msg.includes("ABORTED")) {
          currentFlag = "FINISHED";
        } else if (msg.includes("STARTED") || msg.includes("BEGINS")) {
          currentFlag = "GREEN";
        }
        break;
      }
      if (!rc.flag || rc.flag.trim() === "" || rc.flag === "NONE") continue;
      const mapped = RAW_FLAG_MAP[rc.flag.toUpperCase().trim()];
      if (mapped) {
        currentFlag = mapped;
        break;
      }
      currentFlag = rc.flag as SessionStatus["flag"];
      break;
    }

    // Determine weather
    let trackTemp = 0;
    let airTemp = 0;
    if (weather.length > 0) {
      const latestWeather = weather[weather.length - 1];
      trackTemp = latestWeather.track_temperature;
      airTemp = latestWeather.air_temperature;
    }

    const sessionStatus: SessionStatus = {
      sessionKey: currentSession.session_key,
      sessionName: currentSession.session_name,
      circuitShortName: currentSession.circuit_short_name,
      flag: currentFlag,
      trackTemp,
      airTemp,
    };

    // 4. Determine Timing Logic based on state and session type
    const isPracticeOrQuali = currentSession.session_name.toLowerCase().includes("practice") || 
                              currentSession.session_name.toLowerCase().includes("qualifying");
    let timingRows: TimingRowData[] = [];

    if (isSessionResults && isPracticeOrQuali) {
      const lapsRes = await fetch(`${OPENF1_BASE}/laps?session_key=latest`, { next: { revalidate: LIVE_CACHE.OPENF1_LAPS } });
      const laps: OpenF1Lap[] = lapsRes.ok ? await lapsRes.json() : [];

      const bestLaps = new Map<number, number>(); // driver_number -> best lap duration
      for (const lap of laps) {
        if (lap.lap_duration) {
          const currentBest = bestLaps.get(lap.driver_number) ?? Infinity;
          if (lap.lap_duration < currentBest) {
            bestLaps.set(lap.driver_number, lap.lap_duration);
          }
        }
      }

      // Sort drivers by best lap
      const sortedDrivers = [...drivers]
        .filter((d) => bestLaps.has(d.driver_number))
        .sort((a, b) => bestLaps.get(a.driver_number)! - bestLaps.get(b.driver_number)!);

      const leaderTime = sortedDrivers.length > 0 ? bestLaps.get(sortedDrivers[0].driver_number)! : 0;

      timingRows = sortedDrivers.map((driver, index) => {
        const bestLap = bestLaps.get(driver.driver_number)!;
        const gap = bestLap - leaderTime;
        return {
          driverNumber: driver.driver_number,
          driverCode: driver.name_acronym || driver.last_name.substring(0, 3).toUpperCase(),
          firstName: driver.first_name,
          lastName: driver.last_name,
          teamName: driver.team_name,
          teamColor: `#${driver.team_colour}`,
          position: index + 1,
          intervalToLeader: index === 0 ? formatLapTime(bestLap) : `+${gap.toFixed(3)}s`,
          intervalToNext: index === 0 ? "Leader" : `+${gap.toFixed(3)}s`,
        };
      });

    } else {
      // Normal race or live behavior using /position and /intervals
      const [positionsRes, intervalsRes] = await Promise.all([
        fetch(`${OPENF1_BASE}/position?session_key=latest`, { next: { revalidate: LIVE_CACHE.OPENF1_POSITION } }),
        fetch(`${OPENF1_BASE}/intervals?session_key=latest`, { next: { revalidate: LIVE_CACHE.OPENF1_INTERVALS } }),
      ]);
      const positions: OpenF1Position[] = positionsRes.ok
        ? await positionsRes.json()
        : [];
      const intervals: OpenF1Interval[] = intervalsRes.ok
        ? await intervalsRes.json()
        : [];

      const latestPositions = new Map<number, number>();
      positions.forEach((p) => latestPositions.set(p.driver_number, p.position));

      const latestIntervals = new Map<number, OpenF1Interval>();
      if (Array.isArray(intervals)) {
        intervals.forEach((i) => latestIntervals.set(i.driver_number, i));
      }

      timingRows = drivers
        .map((driver) => {
          const position = latestPositions.get(driver.driver_number) || 0;
          const intervalObj = latestIntervals.get(driver.driver_number);
          let intToLeader = "";
          let intToNext = "";
          if (position === 1) {
            intToLeader = "Leader";
            intToNext = "Leader";
          } else if (intervalObj) {
            intToLeader = intervalObj.gap_to_leader ? `+${intervalObj.gap_to_leader.toFixed(3)}s` : "";
            intToNext = intervalObj.interval ? `+${intervalObj.interval.toFixed(3)}s` : "";
          }

          return {
            driverNumber: driver.driver_number,
            driverCode: driver.name_acronym || driver.last_name.substring(0, 3).toUpperCase(),
            firstName: driver.first_name,
            lastName: driver.last_name,
            teamName: driver.team_name,
            teamColor: `#${driver.team_colour}`,
            position,
            intervalToLeader: intToLeader,
            intervalToNext: intToNext,
          };
        })
        .filter((row) => row.position > 0)
        .sort((a, b) => a.position - b.position);
    }

    const payload: LiveTimingPayload = {
      weekendContext,
      session: sessionStatus,
      timing: timingRows,
      sessionBriefing,
    };

    // Cache long if completed, short if live
    const maxAge =
      weekendContext.state === "LIVE"
        ? LIVE_CACHE.TIMING_LIVE_S_MAXAGE
        : isSessionResults
          ? LIVE_CACHE.TIMING_COMPLETED_S_MAXAGE
          : LIVE_CACHE.TIMING_DEFAULT_S_MAXAGE;

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": `public, s-maxage=${maxAge}, stale-while-revalidate=${LIVE_CACHE.TIMING_STALE_WHILE_REVALIDATE}`,
      },
    });
  } catch (error) {
    console.error("Error fetching live timing:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
});
