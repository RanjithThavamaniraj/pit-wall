import type { RaceWeekend, RaceSession, SeasonSchedule } from "./schedule";

export type WeekendState =
  | "UPCOMING"
  | "LIVE"
  | "BETWEEN_SESSIONS"
  | "COMPLETED";

export type WeekendContext = {
  currentWeekend: RaceWeekend;
  state: WeekendState;
  activeSession: RaceSession | null; // LIVE or recently COMPLETED session
  nextSession: RaceSession | null; // Next UPCOMING session
};

export function getWeekendContext(schedule: SeasonSchedule): WeekendContext | null {
  // 1. Find the current weekend, or the next upcoming one
  const currentRace = schedule.races.find((r) => r.isCurrent) ?? schedule.races.find((r) => r.isNext);

  if (!currentRace) return null;

  // 2. Sort sessions chronologically (Jolpica provides them unordered sometimes, but our buildSessions tries to order them)
  const sessions = [...currentRace.sessions].sort(
    (a, b) => new Date(a.dateUtc).getTime() - new Date(b.dateUtc).getTime()
  );

  // 3. Find states
  const liveSession = sessions.find((s) => s.status === "live");
  const upcomingSessions = sessions.filter((s) => s.status === "upcoming");
  const nextSession = upcomingSessions.length > 0 ? upcomingSessions[0] : null;
  const completedSessions = sessions.filter((s) => s.status === "completed");
  const lastCompletedSession =
    completedSessions.length > 0 ? completedSessions[completedSessions.length - 1] : null;

  // 4. Determine overarching WeekendState
  let state: WeekendState = "UPCOMING";
  let activeSession: RaceSession | null = null;

  if (liveSession) {
    state = "LIVE";
    activeSession = liveSession;
  } else if (nextSession) {
    if (lastCompletedSession) {
      state = "BETWEEN_SESSIONS";
      activeSession = lastCompletedSession;
    } else {
      state = "UPCOMING";
      activeSession = null;
    }
  } else {
    // All sessions are completed
    state = "COMPLETED";
    activeSession = lastCompletedSession;
  }

  return {
    currentWeekend: currentRace,
    state,
    activeSession,
    nextSession,
  };
}
