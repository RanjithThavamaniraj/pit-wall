import type { HubSession } from "@/lib/weekend-hub/types";
import type { WeekendContext } from "./types";

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
  name: string;
  team?: string;
};

export type WeekendOutlookView =
  | {
      hasSignal: true;
      phaseLine: string;
      stars: number;
      name: string;
      team?: string;
      reason: string;
      topContenders: WeekendOutlookContender[];
      keyWatch: string[];
    }
  | {
      hasSignal: false;
      phaseLine: string;
      message: string;
    };

function confidenceToStars(confidence: number): number {
  if (confidence >= 80) return 5;
  if (confidence >= 65) return 4;
  if (confidence >= 50) return 3;
  if (confidence >= 35) return 2;
  return 1;
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

  return {
    hasSignal: true,
    phaseLine: line,
    stars: confidenceToStars(context.favourite.confidence),
    name: context.favourite.name,
    team: context.favourite.team,
    reason: context.favourite.reason,
    topContenders: top.map((c) => ({ name: c.name, team: c.team })),
    keyWatch: buildKeyWatch(context, excludeNames),
  };
}
