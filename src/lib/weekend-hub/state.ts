import type {
  HubSession,
  WeekendHubData,
  WeekendPhase,
} from "./types";

export function getLiveSession(
  sessions: HubSession[]
): HubSession | undefined {
  return sessions.find((s) => s.status === "live");
}

export function getNextSession(
  sessions: HubSession[]
): HubSession | undefined {
  return sessions.find((s) => s.status === "upcoming");
}

export function deriveWeekendPhase(data: WeekendHubData): WeekendPhase {
  if (data.isCancelled) return "cancelled";
  if (data.isPast) return "completed";
  if (getLiveSession(data.sessions)) return "live";
  if (data.isCurrent) return "live";
  return "upcoming";
}

export function getFocusSession(
  data: WeekendHubData
): HubSession | undefined {
  return getLiveSession(data.sessions) ?? getNextSession(data.sessions);
}

export function phaseLabel(phase: WeekendPhase): string {
  switch (phase) {
    case "upcoming":
      return "Upcoming";
    case "live":
      return "Live";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
  }
}

export function phaseTone(
  phase: WeekendPhase
): "green" | "red" | "neutral" | "amber" {
  switch (phase) {
    case "upcoming":
      return "green";
    case "live":
      return "red";
    case "completed":
      return "neutral";
    case "cancelled":
      return "amber";
  }
}
