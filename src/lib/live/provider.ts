import type { LiveRaceState } from "./types";

export type LiveProviderId = "mock" | "f1" | "motogp";

export type LiveRaceProvider = {
  id: LiveProviderId;
  /** Subscribe to state updates. Returns an unsubscribe function. */
  subscribe: (listener: (state: LiveRaceState) => void) => () => void;
  /** Synchronous snapshot of the latest state, if available. */
  getSnapshot: () => LiveRaceState | null;
};
