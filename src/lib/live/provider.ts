import type { LiveRaceState } from "./types";

export type LiveProviderId = "mock" | "f1" | "motogp";

export type LiveRaceProvider = {
  id: LiveProviderId;
  /**
   * Subscribe to snapshot changes. Listeners receive `null` when the live
   * feed has no session / failed — required so auto-fallback can switch to mock.
   */
  subscribe: (listener: (state: LiveRaceState | null) => void) => () => void;
  /** Synchronous snapshot of the latest state, if available. */
  getSnapshot: () => LiveRaceState | null;
};
