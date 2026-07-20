import type { MotoGpEvent } from "@/lib/motogp";
import type { RaceWeekend } from "@/lib/schedule";
import type { HubSession, HubSessionStatus, WeekendHubData } from "./types";

function isSprintWeekendFromSessions(
  sessions: { key: string }[]
): boolean {
  return sessions.some(
    (s) => s.key === "sprint" || s.key === "sprint_qualifying"
  );
}

function mapSessionStatus(
  status: HubSessionStatus,
  weekendCancelled: boolean
): HubSessionStatus {
  if (weekendCancelled && status === "upcoming") return "cancelled";
  return status;
}

export function weekendHubFromF1(race: RaceWeekend): WeekendHubData {
  const isSprintWeekend = isSprintWeekendFromSessions(race.sessions);
  const liveSession = race.sessions.find((s) => s.status === "live");
  const isCancelled = false;

  const sessions: HubSession[] = race.sessions.map((session) => ({
    id: session.key,
    key: session.key,
    label: session.label,
    dateUtc: session.dateUtc,
    status: mapSessionStatus(session.status, isCancelled),
  }));

  return {
    sport: "f1",
    slug: race.slug,
    name: race.name,
    isPast: race.isPast,
    isCurrent: race.isCurrent,
    isSprintWeekend,
    isCancelled,
    sessions,
    liveLinkHref: race.isCurrent || liveSession ? "/live" : undefined,
    liveLinkLabel: "Go to live timing →",
    standingsHref: "/standings",
  };
}

export function weekendHubFromMotoGp(event: MotoGpEvent): WeekendHubData {
  const isSprintWeekend = event.sessions.some((s) => s.key === "sprint");
  const liveSession = event.sessions.find((s) => s.status === "live");
  const isCancelled =
    event.eventStatus === "CANCELLED" || event.eventStatus === "Cancelled";

  const sessions: HubSession[] = event.sessions.map((session) => ({
    id: session.sessionId,
    key: session.key,
    label: session.label,
    dateUtc: session.dateUtc,
    status: mapSessionStatus(session.status, isCancelled),
  }));

  return {
    sport: "motogp",
    slug: event.slug,
    name: event.name,
    isPast: event.isPast,
    isCurrent: event.isCurrent,
    isSprintWeekend,
    isCancelled,
    sessions,
    liveLinkHref:
      event.isCurrent || liveSession ? "/motogp/live" : undefined,
    liveLinkLabel: "Go to weekend hub →",
    standingsHref: "/motogp/standings",
  };
}
