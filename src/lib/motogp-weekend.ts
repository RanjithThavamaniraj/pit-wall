import type { MotoGpEvent, MotoGpSession } from "./motogp";

export type MotoGpWeekendState =
  | "UPCOMING"
  | "LIVE"
  | "BETWEEN_SESSIONS"
  | "COMPLETED";

export type MotoGpWeekendContext = {
  currentWeekend: MotoGpEvent;
  state: MotoGpWeekendState;
  activeSession: MotoGpSession | null;
  nextSession: MotoGpSession | null;
};

export function getMotoGpWeekendContext(
  schedule: { races: MotoGpEvent[] }
): MotoGpWeekendContext | null {
  const currentRace =
    schedule.races.find((race) => race.isCurrent) ??
    schedule.races.find((race) => race.isNext);

  if (!currentRace) return null;

  const sessions = [...currentRace.sessions].sort(
    (a, b) => new Date(a.dateUtc).getTime() - new Date(b.dateUtc).getTime()
  );

  const liveSession = sessions.find((session) => session.status === "live");
  const upcomingSessions = sessions.filter(
    (session) => session.status === "upcoming"
  );
  const nextSession = upcomingSessions[0] ?? null;
  const completedSessions = sessions.filter(
    (session) => session.status === "completed"
  );
  const lastCompletedSession =
    completedSessions.length > 0
      ? completedSessions[completedSessions.length - 1]
      : null;

  let state: MotoGpWeekendState = "UPCOMING";
  let activeSession: MotoGpSession | null = null;

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
