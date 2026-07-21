import type { AdapterResult, BuildContext, ReplaySourceAdapter } from "../types";

/**
 * Future OpenF1 historical adapter.
 * Intentionally does not fabricate packages from incomplete feeds.
 */
export const openF1HistoricalAdapter: ReplaySourceAdapter = {
  id: "openf1-historical",
  label: "OpenF1 historical (future)",
  async build(_input: unknown, context: BuildContext): Promise<AdapterResult> {
    return {
      ok: false,
      reason: `OpenF1 historical adapter is not implemented yet for ${context.sport}/${context.slug}. Provide a timeline or raw package instead.`,
    };
  },
};
