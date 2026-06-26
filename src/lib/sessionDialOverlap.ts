export type RingPillLayout = {
  tangentOffset: number;
};

type PillDraft = {
  id: string;
  angleDeg: number;
  tangentOffset: number;
  x: number;
  y: number;
};

const CHIP_WIDTH = 88;
const CHIP_HEIGHT = 54;

/** Pill center in stage space (matches hero-dial-pill transform chain). */
function chipPosition(angleDeg: number, radius: number, tangent: number) {
  const rad = (angleDeg * Math.PI) / 180;
  const sin = Math.sin(rad);
  const cos = Math.cos(rad);
  return {
    x: radius * sin + tangent * cos,
    y: -radius * cos + tangent * sin,
  };
}

function syncPosition(pill: PillDraft, radius: number): void {
  const pos = chipPosition(pill.angleDeg, radius, pill.tangentOffset);
  pill.x = pos.x;
  pill.y = pos.y;
}

function minCenterDistance(chipW: number, chipH: number, gap: number): number {
  return Math.max(chipW, chipH) + gap;
}

function overlaps(
  a: PillDraft,
  b: PillDraft,
  chipW: number,
  chipH: number,
  gap: number
): boolean {
  const minDist = minCenterDistance(chipW, chipH, gap);
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy < minDist * minDist;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function dialRadiusPx(stageWidth: number): number {
  const min = 8.75 * 16;
  const preferred = stageWidth * 0.4;
  const max = 11.25 * 16;
  return Math.min(max, Math.max(min, preferred));
}

function normalizeAngle(angleDeg: number): number {
  let a = angleDeg % 360;
  if (a > 180) a -= 360;
  if (a <= -180) a += 360;
  return a;
}

function angularGapDeg(a: number, b: number): number {
  return Math.abs(normalizeAngle(a - b));
}

function clusterByArcProximity(
  pills: PillDraft[],
  ringRadius: number,
  chipW: number,
  minGap: number
): PillDraft[][] {
  if (pills.length === 0) return [];

  const sorted = [...pills].sort((a, b) => a.angleDeg - b.angleDeg);
  const threshold = chipW + minGap;
  const clusters: PillDraft[][] = [];
  let current: PillDraft[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const next = sorted[i];
    const arc = ringRadius * ((angularGapDeg(prev.angleDeg, next.angleDeg) * Math.PI) / 180);

    if (arc < threshold) {
      current.push(next);
    } else {
      clusters.push(current);
      current = [next];
    }
  }
  clusters.push(current);

  return clusters;
}

function pushApartTangent(
  a: PillDraft,
  b: PillDraft,
  radius: number,
  chipW: number,
  chipH: number,
  gap: number,
  maxTangent: number
): void {
  const minDist = minCenterDistance(chipW, chipH, gap);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.hypot(dx, dy);
  if (dist >= minDist) return;

  const push = (minDist - dist) / 2 + 2;

  for (const [pill, sign] of [
    [a, -1],
    [b, 1],
  ] as const) {
    pill.tangentOffset = clamp(
      pill.tangentOffset + push * sign,
      -maxTangent,
      maxTangent
    );
    syncPosition(pill, radius);
  }
}

function distributeCluster(
  cluster: PillDraft[],
  radius: number,
  chipW: number,
  chipH: number,
  minGap: number,
  maxTangent: number
): void {
  if (cluster.length <= 1) return;

  const step = chipH + minGap + 6;
  const sorted = [...cluster].sort((a, b) => a.angleDeg - b.angleDeg);
  const mid = (sorted.length - 1) / 2;

  sorted.forEach((pill, index) => {
    pill.tangentOffset = (index - mid) * step;
    syncPosition(pill, radius);
  });

  for (let pass = 0; pass < 28; pass++) {
    let moved = false;

    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        if (!overlaps(sorted[i], sorted[j], chipW, chipH, minGap)) continue;

        pushApartTangent(
          sorted[i],
          sorted[j],
          radius,
          chipW,
          chipH,
          minGap,
          maxTangent
        );
        moved = true;
      }
    }

    if (!moved) break;
  }

  const mean =
    sorted.reduce((sum, pill) => sum + pill.tangentOffset, 0) / sorted.length;
  sorted.forEach((pill) => {
    pill.tangentOffset = clamp(pill.tangentOffset - mean, -maxTangent, maxTangent);
    syncPosition(pill, radius);
  });
}

function refineGlobalTangent(
  pills: PillDraft[],
  radius: number,
  chipW: number,
  chipH: number,
  minGap: number,
  maxTangent: number
): void {
  for (let pass = 0; pass < 24; pass++) {
    let moved = false;

    for (let i = 0; i < pills.length; i++) {
      for (let j = i + 1; j < pills.length; j++) {
        const a = pills[i];
        const b = pills[j];
        if (!overlaps(a, b, chipW, chipH, minGap)) continue;

        pushApartTangent(a, b, radius, chipW, chipH, minGap, maxTangent);
        moved = true;
      }
    }

    if (!moved) break;
  }
}

/** Slide overlapping pills along the ring tangent; radial distance stays fixed. */
export function resolveRingPillOverlaps(
  sessions: { id: string; angleDeg: number }[],
  ringRadius: number,
  options?: {
    chipWidth?: number;
    chipHeight?: number;
    minGap?: number;
  }
): Map<string, RingPillLayout> {
  const chipW = options?.chipWidth ?? CHIP_WIDTH;
  const chipH = options?.chipHeight ?? CHIP_HEIGHT;
  const minGap = options?.minGap ?? 8;
  const maxTangent = Math.max(140, chipW * 1.6);

  const pills: PillDraft[] = sessions.map((session) => {
    const draft: PillDraft = {
      id: session.id,
      angleDeg: session.angleDeg,
      tangentOffset: 0,
      x: 0,
      y: 0,
    };
    syncPosition(draft, ringRadius);
    return draft;
  });

  const clusters = clusterByArcProximity(pills, ringRadius, chipW, minGap);
  for (const cluster of clusters) {
    distributeCluster(cluster, ringRadius, chipW, chipH, minGap, maxTangent);
  }

  refineGlobalTangent(pills, ringRadius, chipW, chipH, minGap, maxTangent);

  return new Map(
    pills.map((pill) => [
      pill.id,
      {
        tangentOffset: Math.round(pill.tangentOffset * 10) / 10,
      },
    ])
  );
}
