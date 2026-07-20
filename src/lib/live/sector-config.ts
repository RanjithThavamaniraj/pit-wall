/**
 * Per-circuit sector boundaries as progress along the outline path (0–1).
 *
 * Boundaries are intentional, not equal thirds — they approximate where
 * timing sectors typically fall on each layout. Adjust per-circuit as
 * timing data becomes available; TrackMap never hardcodes thirds.
 */

export type SectorBoundaries = {
  /** Inclusive start, exclusive end (except sector 3 which includes 1.0). */
  sector1: readonly [number, number];
  sector2: readonly [number, number];
  sector3: readonly [number, number];
};

/** Fallback when a circuit slug has no entry yet. */
export const DEFAULT_SECTOR_BOUNDARIES: SectorBoundaries = {
  sector1: [0, 0.32],
  sector2: [0.32, 0.68],
  sector3: [0.68, 1],
};

/**
 * Keyed by circuit outline slug (same as public/circuits/<sport>/<slug>.svg).
 * Shared across F1 and MotoGP when the layout is the same venue.
 */
const SECTOR_CONFIG: Record<string, SectorBoundaries> = {
  // ── F1 ──────────────────────────────────────────────────────────────────
  "albert-park": { sector1: [0, 0.3], sector2: [0.3, 0.64], sector3: [0.64, 1] },
  shanghai: { sector1: [0, 0.34], sector2: [0.34, 0.66], sector3: [0.66, 1] },
  suzuka: { sector1: [0, 0.29], sector2: [0.29, 0.61], sector3: [0.61, 1] },
  miami: { sector1: [0, 0.31], sector2: [0.31, 0.67], sector3: [0.67, 1] },
  "gilles-villeneuve": {
    sector1: [0, 0.33],
    sector2: [0.33, 0.65],
    sector3: [0.65, 1],
  },
  monaco: { sector1: [0, 0.27], sector2: [0.27, 0.58], sector3: [0.58, 1] },
  catalunya: { sector1: [0, 0.32], sector2: [0.32, 0.66], sector3: [0.66, 1] },
  "red-bull-ring": {
    sector1: [0, 0.28],
    sector2: [0.28, 0.62],
    sector3: [0.62, 1],
  },
  silverstone: { sector1: [0, 0.3], sector2: [0.3, 0.63], sector3: [0.63, 1] },
  "spa-francorchamps": {
    sector1: [0, 0.26],
    sector2: [0.26, 0.6],
    sector3: [0.6, 1],
  },
  hungaroring: { sector1: [0, 0.31], sector2: [0.31, 0.65], sector3: [0.65, 1] },
  zandvoort: { sector1: [0, 0.29], sector2: [0.29, 0.64], sector3: [0.64, 1] },
  monza: { sector1: [0, 0.35], sector2: [0.35, 0.68], sector3: [0.68, 1] },
  madring: { sector1: [0, 0.33], sector2: [0.33, 0.67], sector3: [0.67, 1] },
  baku: { sector1: [0, 0.36], sector2: [0.36, 0.7], sector3: [0.7, 1] },
  "marina-bay": { sector1: [0, 0.28], sector2: [0.28, 0.59], sector3: [0.59, 1] },
  cota: { sector1: [0, 0.3], sector2: [0.3, 0.64], sector3: [0.64, 1] },
  "hermanos-rodriguez": {
    sector1: [0, 0.31],
    sector2: [0.31, 0.66],
    sector3: [0.66, 1],
  },
  interlagos: { sector1: [0, 0.27], sector2: [0.27, 0.61], sector3: [0.61, 1] },
  "las-vegas": { sector1: [0, 0.34], sector2: [0.34, 0.69], sector3: [0.69, 1] },
  losail: { sector1: [0, 0.32], sector2: [0.32, 0.65], sector3: [0.65, 1] },
  "yas-marina": { sector1: [0, 0.3], sector2: [0.3, 0.63], sector3: [0.63, 1] },

  // ── MotoGP-only (shared venues reuse keys above) ────────────────────────
  buriram: { sector1: [0, 0.31], sector2: [0.31, 0.66], sector3: [0.66, 1] },
  goiania: { sector1: [0, 0.33], sector2: [0.33, 0.67], sector3: [0.67, 1] },
  jerez: { sector1: [0, 0.3], sector2: [0.3, 0.64], sector3: [0.64, 1] },
  "le-mans-bugatti": {
    sector1: [0, 0.29],
    sector2: [0.29, 0.63],
    sector3: [0.63, 1],
  },
  mugello: { sector1: [0, 0.34], sector2: [0.34, 0.68], sector3: [0.68, 1] },
  brno: { sector1: [0, 0.32], sector2: [0.32, 0.66], sector3: [0.66, 1] },
  assen: { sector1: [0, 0.28], sector2: [0.28, 0.62], sector3: [0.62, 1] },
  sachsenring: { sector1: [0, 0.27], sector2: [0.27, 0.6], sector3: [0.6, 1] },
  "motorland-aragon": {
    sector1: [0, 0.31],
    sector2: [0.31, 0.65],
    sector3: [0.65, 1],
  },
  misano: { sector1: [0, 0.3], sector2: [0.3, 0.64], sector3: [0.64, 1] },
  motegi: { sector1: [0, 0.33], sector2: [0.33, 0.67], sector3: [0.67, 1] },
  mandalika: { sector1: [0, 0.32], sector2: [0.32, 0.66], sector3: [0.66, 1] },
  "phillip-island": {
    sector1: [0, 0.35],
    sector2: [0.35, 0.7],
    sector3: [0.7, 1],
  },
  sepang: { sector1: [0, 0.31], sector2: [0.31, 0.65], sector3: [0.65, 1] },
  portimao: { sector1: [0, 0.29], sector2: [0.29, 0.63], sector3: [0.63, 1] },
  "ricardo-tormo": {
    sector1: [0, 0.3],
    sector2: [0.3, 0.64],
    sector3: [0.64, 1],
  },
};

export function getSectorBoundaries(circuitSlug: string): SectorBoundaries {
  return SECTOR_CONFIG[circuitSlug] ?? DEFAULT_SECTOR_BOUNDARIES;
}

export function getSectorRange(
  boundaries: SectorBoundaries,
  sector: 1 | 2 | 3
): readonly [number, number] {
  if (sector === 1) return boundaries.sector1;
  if (sector === 2) return boundaries.sector2;
  return boundaries.sector3;
}

/** Extract circuit slug from `/circuits/<sport>/<slug>.svg`. */
export function circuitSlugFromSvgUrl(url: string): string | null {
  const match = url.match(/\/circuits\/(?:f1|motogp)\/([^/]+)\.svg(?:\?|$)/i);
  return match?.[1] ?? null;
}
