import type { MotoGpEvent } from "@/lib/motogp";
import type { RaceWeekend } from "@/lib/schedule";
import type { WeekendHubData } from "./types";

function isSprintWeekendFromSessions(
  sessions: { key: string }[]
): boolean {
  return sessions.some(
    (s) => s.key === "sprint" || s.key === "sprint_qualifying"
  );
}

export function weekendHubFromF1(race: RaceWeekend): WeekendHubData {
  const isSprintWeekend = isSprintWeekendFromSessions(race.sessions);
  const liveSession = race.sessions.find((s) => s.status === "live");

  return {
    sport: "f1",
    slug: race.slug,
    name: race.name,
    isPast: race.isPast,
    isCurrent: race.isCurrent,
    isSprintWeekend,
    isCancelled: false,
    sessions: race.sessions.map((session) => ({
      id: session.key,
      key: session.key,
      label: session.label,
      dateUtc: session.dateUtc,
      status: session.status,
    })),
    liveLinkHref:
      race.isCurrent || liveSession ? "/live" : undefined,
    liveLinkLabel: "Go to live timing →",
    standingsHref: "/standings",
  };
}

export function weekendHubFromMotoGp(event: MotoGpEvent): WeekendHubData {
  const isSprintWeekend = event.sessions.some((s) => s.key === "sprint");
  const liveSession = event.sessions.find((s) => s.status === "live");
  const isCancelled =
    event.eventStatus === "CANCELLED" || event.eventStatus === "Cancelled";

  return {
    sport: "motogp",
    slug: event.slug,
    name: event.name,
    isPast: event.isPast,
    isCurrent: event.isCurrent,
    isSprintWeekend,
    isCancelled,
    sessions: event.sessions.map((session) => ({
      id: session.sessionId,
      key: session.key,
      label: session.label,
      dateUtc: session.dateUtc,
      status: session.status,
    })),
    liveLinkHref:
      event.isCurrent || liveSession ? "/motogp/live" : undefined,
    liveLinkLabel: "Go to weekend hub →",
    standingsHref: "/motogp/standings",
  };
}
