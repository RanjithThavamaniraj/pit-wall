import type { AdapterResult, BuildContext, ReplaySourceAdapter } from "../types";

/**
 * Future PulseLive / MotoGP historical adapter.
 * Intentionally does not fabricate packages from incomplete feeds.
 */
export const pulseLiveHistoricalAdapter: ReplaySourceAdapter = {
  id: "pulselive-historical",
  label: "PulseLive historical (future)",
  async build(_input: unknown, context: BuildContext): Promise<AdapterResult> {
    return {
      ok: false,
      reason: `PulseLive historical adapter is not implemented yet for ${context.sport}/${context.slug}. Provide a timeline or raw package instead.`,
    };
  },
};
