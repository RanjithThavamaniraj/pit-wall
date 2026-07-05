import type { WeekendContext } from "@/lib/weekend";
import type { SessionKey } from "@/lib/schedule";
import type { BriefingPhase } from "./types";

function phaseForSessionKey(
  key: SessionKey,
  isLive: boolean
): BriefingPhase | null {
  switch (key) {
    case "fp1":
    case "fp2":
    case "fp3":
      return isLive ? "practice-live" : "practice-done";
    case "sprint_qualifying":
      return isLive ? "sprint-qualifying-live" : "sprint-qualifying-done";
    case "qualifying":
      return isLive ? "qualifying-live" : "qualifying-done";
    case "sprint":
      return isLive ? "sprint-live" : "sprint-done";
    case "race":
      return isLive ? "race-live" : null;
    default:
      return null;
  }
}

/**
 * Derives which phase of the weekend the Session Briefing should describe.
 * Only ever reflects schedule/session status that's already known to be
 * true — never a guess about what's happening inside a session.
 */
export function deriveBriefingPhase(context: WeekendContext): BriefingPhase {
  const { state, activeSession } = context;

  if (state === "UPCOMING") return "before-fp1";

  if (state === "LIVE" && activeSession) {
    return phaseForSessionKey(activeSession.key, true) ?? "before-fp1";
  }

  if (state === "BETWEEN_SESSIONS" && activeSession) {
    return phaseForSessionKey(activeSession.key, false) ?? "before-fp1";
  }

  if (state === "COMPLETED") return "race-done";

  return "before-fp1";
}
