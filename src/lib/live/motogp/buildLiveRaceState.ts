import type {
  ActiveSector,
  LiveDriverState,
  LiveRaceState,
  RaceFlag,
  SessionStatus,
} from "../types";

const MOTOGP_LIVETIMING =
  "https://api.motogp.pulselive.com/motogp/v1/timing-gateway/livetiming-lite";

type LiteHead = {
  category?: string;
  num_laps?: number | string;
  remaining?: string;
  session_status_id?: string;
  session_status_name?: string;
  session_name?: string;
  session_shortname?: string;
};

type LiteRider = {
  pos?: number | string;
  rider_number?: string;
  rider_shortname?: string;
  rider_surname?: string;
  num_lap?: number | string;
  lap_time?: string;
  last_lap_time?: string;
  gap_first?: string;
  gap_prev?: string;
  on_pit?: boolean;
  status_name?: string;
  trac_status?: string;
};

type LitePayload = {
  head?: LiteHead;
  rider?: Record<string, LiteRider>;
};

/** Process-local interpolator state for smooth timing-based progress. */
type TimingProgressMemory = {
  sessionId: string | null;
  progress: Map<string, number>;
  lastTick: number;
  avgLapSeconds: number;
};

const timingMemory: TimingProgressMemory = {
  sessionId: null,
  progress: new Map(),
  lastTick: 0,
  avgLapSeconds: 110,
};

function resetTimingMemory(sessionId: string) {
  timingMemory.sessionId = sessionId;
  timingMemory.progress.clear();
  timingMemory.lastTick = 0;
  timingMemory.avgLapSeconds = 110;
}

function parseGapSeconds(raw: string | undefined): number | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed === "0.000" || trimmed === "-") return 0;
  if (/lap/i.test(trimmed)) return null;
  const normalized = trimmed.replace("'", ":").replace(/^\+/, "");
  if (normalized.includes(":")) {
    const parts = normalized.split(":");
    const mins = Number(parts[0]);
    const secs = Number(parts[1]);
    if (!Number.isFinite(mins) || !Number.isFinite(secs)) return null;
    return mins * 60 + secs;
  }
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function parseLapTimeSeconds(raw: string | undefined): number | null {
  if (!raw) return null;
  // Formats: 1'47.617 or 1:47.617
  const m = raw.trim().match(/^(\d+)[':](\d+(?:\.\d+)?)$/);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

function riderCode(rider: LiteRider): string {
  if (rider.rider_shortname) {
    return rider.rider_shortname.slice(0, 3).toUpperCase();
  }
  if (rider.rider_surname) {
    return rider.rider_surname.slice(0, 3).toUpperCase();
  }
  return (rider.rider_number ?? "???").slice(0, 3);
}

function mapSessionStatus(head: LiteHead): SessionStatus {
  const id = (head.session_status_id || head.session_status_name || "")
    .toUpperCase()
    .trim();
  if (id === "F" || id === "FINISHED") return "finished";
  if (id === "C" || id === "CANCELLED") return "cancelled";
  if (id === "S" || id === "SUSPENDED") return "suspended";
  if (id === "N" || id === "NOT_STARTED") return "upcoming";
  // Active / running codes vary — treat remaining time / riders as live
  return "live";
}

function mapFlag(head: LiteHead, riders: LiteRider[]): RaceFlag {
  const status = mapSessionStatus(head);
  if (status === "suspended") return "red";
  // Lite feed does not expose yellow/SC reliably — stay green unless stopped
  const allPitted =
    riders.length > 0 && riders.every((r) => r.on_pit || r.status_name === "OUT");
  if (allPitted && status === "live") return "red";
  return "green";
}

function wrap01(value: number): number {
  return ((value % 1) + 1) % 1;
}

/**
 * Smooth timing-derived progress.
 * Large target deltas (low confidence) use a slower blend to avoid jumps.
 */
function blendProgress(
  previous: number | undefined,
  target: number,
  dtSeconds: number,
  confidence: number
): number {
  if (previous == null) return target;

  // Shortest path on the circle
  let delta = target - previous;
  if (delta > 0.5) delta -= 1;
  if (delta < -0.5) delta += 1;

  const abs = Math.abs(delta);
  // High confidence → catch up faster; low confidence / big jumps → crawl
  const baseRate = 0.35 + confidence * 0.55; // fraction of delta per second
  const jumpPenalty = abs > 0.2 ? 0.25 : abs > 0.1 ? 0.5 : 1;
  const alpha = Math.min(1, baseRate * jumpPenalty * Math.max(dtSeconds, 0.05));

  return wrap01(previous + delta * alpha);
}

function sectorFromProgress(progress: number): ActiveSector {
  if (progress < 0.33) return 1;
  if (progress < 0.66) return 2;
  return 3;
}

/**
 * Build LiveRaceState from PulseLive livetiming-lite.
 * Returns null when the feed is empty / unavailable.
 */
export async function buildMotoGpLiveRaceState(): Promise<LiveRaceState | null> {
  let payload: LitePayload | null = null;
  try {
    const res = await fetch(MOTOGP_LIVETIMING, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });
    if (!res.ok) return null;
    const text = await res.text();
    if (!text || !text.trim()) return null;
    try {
      payload = JSON.parse(text) as LitePayload;
    } catch {
      return null;
    }
    if (!payload || typeof payload !== "object") return null;
  } catch {
    return null;
  }

  if (!payload?.rider || !payload.head) return null;

  const riders = Object.values(payload.rider);
  if (riders.length === 0) return null;

  const ranked = riders
    .map((r) => ({
      rider: r,
      position: Number(r.pos),
    }))
    .filter((r) => Number.isFinite(r.position) && r.position >= 1 && r.position <= 3)
    .sort((a, b) => a.position - b.position);

  if (ranked.length === 0) return null;

  const sessionStatus = mapSessionStatus(payload.head);
  // Only live sessions — finished/upcoming fall through to mock.
  if (sessionStatus !== "live" && sessionStatus !== "suspended") {
    return null;
  }

  const sessionId = [
    payload.head.session_shortname ?? "",
    payload.head.session_name ?? "",
    String(payload.head.num_laps ?? ""),
  ].join("|");

  if (timingMemory.sessionId !== sessionId) {
    resetTimingMemory(sessionId);
  }

  // Learn average lap time from best visible lap times
  const lapSamples = ranked
    .map((r) => parseLapTimeSeconds(r.rider.lap_time) ?? parseLapTimeSeconds(r.rider.last_lap_time))
    .filter((n): n is number => n != null && n > 60 && n < 300);
  if (lapSamples.length > 0) {
    const avg =
      lapSamples.reduce((a, b) => a + b, 0) / lapSamples.length;
    timingMemory.avgLapSeconds =
      timingMemory.avgLapSeconds * 0.7 + avg * 0.3;
  }

  const now = Date.now();
  const dtSeconds =
    timingMemory.lastTick > 0
      ? Math.min(5, (now - timingMemory.lastTick) / 1000)
      : 1;
  timingMemory.lastTick = now;

  const leaderGap = 0;
  const avgLap = timingMemory.avgLapSeconds;

  // Leader advances with wall clock; others trail by gap_first / avgLap
  const leaderPrev = timingMemory.progress.get("__leader__");
  const leaderTarget = wrap01(
    (leaderPrev ?? 0) + dtSeconds / avgLap
  );

  const liveDrivers: LiveDriverState[] = ranked.map(({ rider, position }) => {
    const code = riderCode(rider);
    const gap =
      position === 1
        ? leaderGap
        : parseGapSeconds(rider.gap_first) ?? position * 1.5;

    const gapFraction =
      gap == null ? (position - 1) * 0.03 : Math.min(0.95, Math.max(0, gap / avgLap));

    const target = wrap01(leaderTarget - gapFraction);
    const key = code;
    const prev = timingMemory.progress.get(key);

    // Confidence: finite gap and stable lap clock
    const confidence =
      gap != null && Number.isFinite(gap) && avgLap > 70 ? 0.85 : 0.35;

    let progress = blendProgress(prev, target, dtSeconds, confidence);
    if (rider.on_pit) {
      // Freeze progress while in pit — no drift
      progress = prev ?? target;
    }

    timingMemory.progress.set(key, progress);

    return {
      position: position as 1 | 2 | 3,
      code,
      progress,
      pit: Boolean(rider.on_pit),
    };
  });

  timingMemory.progress.set("__leader__", leaderTarget);

  const leaderRider = ranked[0]?.rider;
  const lap = Number(leaderRider?.num_lap) || 0;
  const totalLaps = Number(payload.head.num_laps) || 0;

  let fastest: LiveRaceState["fastestLap"] = null;
  let best = Infinity;
  for (const { rider } of ranked) {
    const t = parseLapTimeSeconds(rider.lap_time);
    if (t != null && t < best) {
      best = t;
      fastest = {
        code: riderCode(rider),
        time: rider.lap_time ?? "",
        lap: Number(rider.num_lap) || lap,
      };
    }
  }

  const raceFinished = false;
  const leaderProgress = liveDrivers[0]?.progress ?? 0;

  return {
    championship: "motogp",
    sessionStatus,
    lap,
    totalLaps,
    flag: mapFlag(payload.head, ranked.map((r) => r.rider)),
    activeSector: sectorFromProgress(leaderProgress),
    drivers: liveDrivers,
    raceFinished,
    fastestLap: fastest,
    progressSource: "timing",
  };
}
