/**
 * Converts OpenF1 Cartesian location samples into normalized circuit
 * progress (0.0–1.0) by projecting onto a self-calibrating reference ring.
 *
 * The ring is built from chronological leader samples — the same fraction
 * is then applied to the SVG outline in TrackMap (path-homologous progress).
 */

export type LocationSample = {
  x: number;
  y: number;
};

type ReferenceRing = {
  points: LocationSample[];
  cumulative: number[];
  totalLength: number;
  updatedAt: number;
};

const MIN_SAMPLES = 24;
const MAX_SAMPLES = 180;
const MIN_RING_LENGTH = 500; // OpenF1 units — reject degenerate rings
const MAX_PROJECTION_DISTANCE = 2500; // reject wild GPS outliers

function isValidSample(sample: LocationSample): boolean {
  return (
    Number.isFinite(sample.x) &&
    Number.isFinite(sample.y) &&
    !(sample.x === 0 && sample.y === 0)
  );
}

function dist(a: LocationSample, b: LocationSample): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function buildRing(samples: LocationSample[]): ReferenceRing | null {
  if (samples.length < MIN_SAMPLES) return null;

  const spaced: LocationSample[] = [samples[0]];
  for (let i = 1; i < samples.length; i++) {
    if (dist(spaced[spaced.length - 1], samples[i]) >= 40) {
      spaced.push(samples[i]);
    }
  }
  if (spaced.length < MIN_SAMPLES) return null;

  const cumulative: number[] = [0];
  let total = 0;
  for (let i = 1; i < spaced.length; i++) {
    total += dist(spaced[i - 1], spaced[i]);
    cumulative.push(total);
  }

  const close = dist(spaced[spaced.length - 1], spaced[0]);
  if (close < total * 0.15) {
    total += close;
    cumulative.push(total);
    spaced.push(spaced[0]);
  }

  if (total < MIN_RING_LENGTH) return null;

  return {
    points: spaced,
    cumulative,
    totalLength: total,
    updatedAt: Date.now(),
  };
}

function projectOntoRing(
  ring: ReferenceRing,
  point: LocationSample
): number | null {
  let bestDist = Infinity;
  let bestProgress = 0;

  for (let i = 1; i < ring.points.length; i++) {
    const a = ring.points[i - 1];
    const b = ring.points[i];
    const abx = b.x - a.x;
    const aby = b.y - a.y;
    const lengthSq = abx * abx + aby * aby;
    if (lengthSq < 1e-6) continue;

    let t = ((point.x - a.x) * abx + (point.y - a.y) * aby) / lengthSq;
    t = Math.max(0, Math.min(1, t));
    const proj = { x: a.x + abx * t, y: a.y + aby * t };
    const d = dist(point, proj);
    if (d < bestDist) {
      bestDist = d;
      const segStart = ring.cumulative[i - 1];
      const segLen = ring.cumulative[i] - segStart;
      bestProgress = (segStart + segLen * t) / ring.totalLength;
    }
  }

  if (!Number.isFinite(bestDist) || bestDist > MAX_PROJECTION_DISTANCE) {
    return null;
  }

  return ((bestProgress % 1) + 1) % 1;
}

/**
 * Session-scoped progress service. One instance is shared by the F1 builder
 * for the lifetime of the Node process (warm serverless invocations reuse it).
 */
export class CircuitProgressService {
  private leaderBuffers = new Map<string, LocationSample[]>();
  private rings = new Map<string, ReferenceRing>();
  private activeSessionKey: string | null = null;

  /**
   * Bind calibration to an OpenF1 session. Clears rings when the session changes
   * so a new weekend does not inherit a stale path.
   */
  beginSession(sessionKey: string): void {
    if (!sessionKey) return;
    if (this.activeSessionKey === sessionKey) return;
    this.reset();
    this.activeSessionKey = sessionKey;
  }

  /**
   * Ingest chronological leader samples to (re)build the reference ring
   * for a circuit key (OpenF1 circuit_key or short name).
   */
  ingestLeaderSamples(circuitKey: string, samples: LocationSample[]): void {
    if (!circuitKey || samples.length === 0) return;

    const valid = samples.filter(isValidSample);
    if (valid.length === 0) return;

    const existing = this.leaderBuffers.get(circuitKey) ?? [];
    const merged = [...existing, ...valid].slice(-MAX_SAMPLES);
    this.leaderBuffers.set(circuitKey, merged);

    const ring = buildRing(merged);
    if (ring) {
      this.rings.set(circuitKey, ring);
    }
  }

  /** Whether a usable reference ring exists for this circuit. */
  hasCalibration(circuitKey: string): boolean {
    return this.rings.has(circuitKey);
  }

  /**
   * Project an OpenF1 (x, y) onto the calibrated ring → progress 0–1.
   * Returns null when calibration is insufficient or the sample is invalid.
   */
  progressAt(
    circuitKey: string,
    sample: LocationSample
  ): number | null {
    if (!isValidSample(sample)) return null;
    const ring = this.rings.get(circuitKey);
    if (!ring) return null;
    return projectOntoRing(ring, sample);
  }

  /** Clear calibration (session change / tests). */
  reset(circuitKey?: string): void {
    if (circuitKey) {
      this.leaderBuffers.delete(circuitKey);
      this.rings.delete(circuitKey);
      return;
    }
    this.leaderBuffers.clear();
    this.rings.clear();
    this.activeSessionKey = null;
  }
}

/** Process-wide singleton used by the F1 race-state builder. */
export const circuitProgressService = new CircuitProgressService();
