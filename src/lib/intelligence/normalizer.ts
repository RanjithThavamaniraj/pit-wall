import type {
  IntelligenceEntry,
  NormalizerConfig,
} from "./types";
import type { ScoredCompetitor } from "./scoring";
import { DEFAULT_SCORING_CONFIG } from "./scoring";

export const DEFAULT_NORMALIZER_CONFIG: NormalizerConfig = {
  minRawScoreToWithName: 1,
  othersLabel: DEFAULT_SCORING_CONFIG.othersLabel,
};

/**
 * Largest-remainder method: round each share to an integer while
 * guaranteeing the series totals exactly 100.
 */
function largestRemainderRound(rawShares: number[]): number[] {
  const total = rawShares.reduce((sum, v) => sum + v, 0);
  if (total <= 0) return rawShares.map(() => 0);

  const floored = rawShares.map((v) => Math.floor(v));
  const remaining = 100 - floored.reduce((sum, v) => sum + v, 0);

  if (remaining <= 0) return floored;

  const fractional = rawShares.map((v, i) => ({
    index: i,
    frac: v - Math.floor(v),
  }));
  fractional.sort((a, b) => b.frac - a.frac);

  const out = [...floored];
  for (let i = 0; i < remaining; i++) {
    out[fractional[i % fractional.length].index] += 1;
  }
  return out;
}

/**
 * Convert scored competitors into normalised percentages.
 *
 * - Top `topN` competitors by raw score are kept by name.
 * - Everyone else whose raw score is below `minRawScoreToWithName`
 *   is folded into a single "Others" bucket.
 * - Percentages always sum to 100.
 * - Ordering is preserved.
 */
export function normaliseScores(
  scored: ScoredCompetitor[],
  config: NormalizerConfig = DEFAULT_NORMALIZER_CONFIG,
  topN: number = DEFAULT_SCORING_CONFIG.topN
): IntelligenceEntry[] {
  if (scored.length === 0) return [];

  const totalRaw = scored.reduce((sum, s) => sum + Math.max(s.rawScore, 0), 0);
  const safeTotal = totalRaw > 0 ? totalRaw : 1;

  const keepCount = Math.min(topN, scored.length);
  const top = scored.slice(0, keepCount);
  const rest = scored.slice(keepCount);

  const namedShares = top.map((s) => (Math.max(s.rawScore, 0) / safeTotal) * 100);
  const othersRaw = rest.reduce((sum, s) => sum + Math.max(s.rawScore, 0), 0);
  const othersShare = (othersRaw / safeTotal) * 100;

  const shares = [...namedShares, othersShare];
  const rounded = largestRemainderRound(shares);

  const entries: IntelligenceEntry[] = top.map((s, i) => ({
    name: s.name,
    team: s.team,
    rawScore: s.rawScore,
    percentage: rounded[i],
  }));

  const othersPct = rounded[rounded.length - 1] ?? 0;
  if (othersPct > 0 || rest.length > 0) {
    entries.push({
      name: config.othersLabel,
      rawScore: othersRaw,
      percentage: othersPct,
    });
  }

  return entries;
}