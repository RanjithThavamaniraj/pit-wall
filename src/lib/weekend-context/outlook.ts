import type { HubSession } from "@/lib/weekend-hub/types";
import type {
  WeekendContext,
  WeekendContextSport,
  WeekendFavourite,
} from "./types";

/**
 * The two `WeekendFavourite` bases that trace back to real completed-weekend
 * results (Weekend Intelligence's recent-form scoring, Driver Intelligence's
 * momentum rating). The other bases only exist because the Strategy/Story
 * engines' hash-seeded editorial text produced *something* — never real
 * per-competitor data — so they are treated as "no signal" here.
 */
const REAL_FAVOURITE_BASES = new Set(["weekend-intelligence", "momentum"]);

/**
 * `weekendTrend` ids that are derived purely from real finishing positions
 * (see `buildWeekendTrend` in the Driver Intelligence generator). The other
 * trend ids ride partly on a deterministic-but-arbitrary hash salt used to
 * fill in qualifying/overtaking ratings when no real data exists for them,
 * so they are excluded from "Key Watch" to keep every line traceable to
 * actual results.
 */
const SAFE_TREND_IDS = new Set([
  "improving",
  "recovering-after-dnf",
  "consistent-top-five",
]);

export type WeekendOutlookContender = {
  /** 1-based rank within the outlook list. */
  rank: number;
  name: string;
  team?: string;
  /**
   * Normalised share of the recent-form pool (0–100), same value the
   * intelligence engine already publishes — not a quality grade.
   */
  formShare: number;
};

export type OutlookInsightSlot = {
  id: string;
  label: string;
  /** Present when the metric is available; otherwise reserved for future data. */
  value: string | null;
};

export type WeekendOutlookView =
  | {
      hasSignal: true;
      sport: WeekendContextSport;
      phaseLine: string;
      /** Always 1 for the named leader when hasSignal. */
      rank: number;
      name: string;
      team?: string;
      /** Form-pool share (or momentum when that is the basis) — existing confidence. */
      formShare: number;
      basis: WeekendFavourite["basis"];
      leadershipLabel: string;
      shareLabel: string;
      /** Stable contextual explanation — not a new metric. */
      contextLine: string;
      reason: string;
      topContenders: WeekendOutlookContender[];
      /** Recent trend lines from existing Driver Intelligence signals. */
      recentTrend: string[];
      /**
       * Future-ready insight slots (momentum, consistency, etc.).
       * Values stay null until engines publish them into the outlook view.
       */
      insightSlots: OutlookInsightSlot[];
      keyWatch: string[];
    }
  | {
      hasSignal: false;
      phaseLine: string;
      message: string;
    };

function leadershipCopy(
  sport: WeekendContextSport,
  basis: WeekendFavourite["basis"]
): { leadershipLabel: string; shareLabel: string; contextLine: string } {
  if (basis === "momentum") {
    return {
      leadershipLabel: "Leading Momentum",
      shareLabel: "Momentum rating",
      contextLine:
        "Leads Driver Intelligence momentum based on recent finishing deltas across completed weekends.",
    };
  }
  const competitor = sport === "motogp" ? "rider" : "driver";
  return {
    leadershipLabel: "#1 Recent Form",
    shareLabel: `${competitor === "rider" ? "Rider" : "Driver"} form share`,
    contextLine:
      "Leads recent form based on the previous completed race weekends.",
  };
}

/**
 * Frame the weekend's stage from real session status only. No data source
 * in this codebase carries practice/qualifying/sprint classifications for a
 * still-in-progress weekend, so the wording describes *where the weekend
 * stands*, not a fabricated live read of who's fastest in that session.
 */
function phaseLine(context: WeekendContext, sessions: HubSession[]): string {
  if (context.phase === "cancelled") {
    return "This weekend will not go ahead —";
  }
  if (context.phase === "completed") {
    return "Race complete — form heading into the next round";
  }

  const liveSession = sessions.find((s) => s.status === "live");
  if (liveSession?.key === "race") {
    return "Race underway — current form and momentum";
  }

  const completedKeys = new Set(
    sessions.filter((s) => s.status === "completed").map((s) => s.key)
  );
  if (completedKeys.has("qualifying")) {
    return "Qualifying done — heading into the race on recent form";
  }
  if (
    context.isSprintWeekend &&
    (completedKeys.has("sprint") || liveSession?.key === "sprint")
  ) {
    return "Sprint in the books — form heading into qualifying";
  }
  if (completedKeys.size > 0 || liveSession) {
    return "Practice underway — recent form still leads the picture";
  }
  return "Before FP1 — arriving on recent form";
}

function buildKeyWatch(
  context: WeekendContext,
  excludeNames: Set<string>
): string[] {
  const profiles = context.sources.driverIntelligence?.profiles ?? [];
  return profiles
    .filter(
      (p) => !excludeNames.has(p.name) && SAFE_TREND_IDS.has(p.weekendTrend.id)
    )
    .slice(0, 2)
    .map((p) => `${p.name} — ${p.weekendTrend.label.toLowerCase()}.`);
}

/**
 * Convert the shared Weekend Context into the concise "Weekend Outlook"
 * view. Only the parts of the context traceable to real completed-weekend
 * results (Weekend Intelligence / Driver Intelligence) are surfaced — the
 * Strategy and Story engines' hash-seeded editorial text is intentionally
 * left out, since it isn't backed by real per-weekend data.
 *
 * No star rating: form share is shown as the normalised pool percentage
 * it actually is, not remapped onto a 1–5 quality scale.
 */
export function buildWeekendOutlook(
  context: WeekendContext,
  sessions: HubSession[]
): WeekendOutlookView {
  const line = phaseLine(context, sessions);
  const hasRealFavourite =
    REAL_FAVOURITE_BASES.has(context.favourite.basis) &&
    context.topContenders.length > 0;

  if (!hasRealFavourite) {
    return {
      hasSignal: false,
      phaseLine: line,
      message:
        "Not enough completed-weekend data yet to project an outlook. Check back as the season builds up recent form.",
    };
  }

  const top = context.topContenders.slice(0, 3);
  const excludeNames = new Set(top.map((c) => c.name));
  const { leadershipLabel, shareLabel, contextLine } = leadershipCopy(
    context.sport,
    context.favourite.basis
  );
  const recentTrend = buildKeyWatch(context, excludeNames);

  const leaderProfile = context.sources.driverIntelligence?.profiles.find(
    (p) => p.name === context.favourite.name
  );

  const insightSlots: OutlookInsightSlot[] = [
    {
      id: "momentum",
      label: "Momentum",
      value:
        leaderProfile != null
          ? `${leaderProfile.ratings.momentum}`
          : null,
    },
    {
      id: "consistency",
      label: "Consistency",
      value:
        leaderProfile != null
          ? `${leaderProfile.ratings.consistency}`
          : null,
    },
    {
      id: "qualifying",
      label: "Qualifying form",
      value:
        leaderProfile != null
          ? `${leaderProfile.ratings.qualifying}`
          : null,
    },
    {
      id: "race-pace",
      label: "Race pace",
      value:
        leaderProfile != null
          ? `${leaderProfile.ratings.racePace}`
          : null,
    },
    {
      id: "wet-weather",
      label: "Wet-weather strength",
      value: null,
    },
  ];

  return {
    hasSignal: true,
    sport: context.sport,
    phaseLine: line,
    rank: 1,
    name: context.favourite.name,
    team: context.favourite.team,
    formShare: context.favourite.confidence,
    basis: context.favourite.basis,
    leadershipLabel,
    shareLabel,
    contextLine,
    reason: context.favourite.reason,
    topContenders: top.map((c, index) => ({
      rank: index + 1,
      name: c.name,
      team: c.team,
      formShare: c.percentage,
    })),
    recentTrend,
    insightSlots,
    keyWatch: recentTrend,
  };
}
