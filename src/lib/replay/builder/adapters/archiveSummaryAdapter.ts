import type { AdapterResult, BuildContext, ReplaySourceAdapter } from "../types";

/**
 * Archive weekend summaries (podium / report JSON under data/{sport}/results)
 * do not contain lap-by-lap progress. This adapter explicitly refuses to
 * invent movement so production never ships fabricated replays.
 */
export const archiveSummaryAdapter: ReplaySourceAdapter = {
  id: "archive-summary",
  label: "Archive weekend summary (insufficient for replay)",
  async build(input: unknown, context: BuildContext): Promise<AdapterResult> {
    const hasLaps =
      typeof input === "object" &&
      input !== null &&
      "laps" in input &&
      Array.isArray((input as { laps?: unknown }).laps) &&
      ((input as { laps: unknown[] }).laps?.length ?? 0) > 0;

    if (!hasLaps) {
      return {
        ok: false,
        reason: `Archive summary for ${context.sport}/${context.slug} has no lap timeline — refusing to fabricate ReplayPackage samples`,
      };
    }

    return {
      ok: false,
      reason:
        "Archive summary adapter does not convert lap data; use the timeline adapter for lap-capable sources",
    };
  },
};
