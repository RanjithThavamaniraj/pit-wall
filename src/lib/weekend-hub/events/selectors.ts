import type { LiveEvent, EventSeverity } from "./types";

export function sortEventsNewestFirst(
  events: readonly LiveEvent[]
): LiveEvent[] {
  return [...events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export type SessionEventGroup = {
  key: string;
  label: string;
  events: LiveEvent[];
  latestTimestamp: string;
};

export function groupEventsBySession(
  events: readonly LiveEvent[],
  sessionLabels: Record<string, string> = {}
): SessionEventGroup[] {
  const byKey = new Map<string, LiveEvent[]>();
  for (const event of events) {
    const bucket = byKey.get(event.session) ?? [];
    bucket.push(event);
    byKey.set(event.session, bucket);
  }

  const groups: SessionEventGroup[] = [];
  for (const [key, bucket] of byKey) {
    const sorted = sortEventsNewestFirst(bucket);
    groups.push({
      key,
      label: sessionLabels[key] ?? key,
      events: sorted,
      latestTimestamp: sorted[0]?.timestamp ?? "",
    });
  }

  return groups.sort(
    (a, b) =>
      new Date(b.latestTimestamp).getTime() -
      new Date(a.latestTimestamp).getTime()
  );
}

export type EventTone = "green" | "amber" | "red" | "blue" | "neutral";

export function severityTone(severity: EventSeverity): EventTone {
  switch (severity) {
    case "info":
      return "blue";
    case "notice":
      return "neutral";
    case "warning":
      return "amber";
    case "critical":
      return "red";
  }
}

export function isRecentEvent(
  event: LiveEvent,
  withinMs: number,
  now: number = Date.now()
): boolean {
  return now - new Date(event.timestamp).getTime() <= withinMs;
}