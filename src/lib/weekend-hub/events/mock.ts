import type {
  EventType,
  LiveEvent,
  LiveEventFeedInput,
  EventSeverity,
} from "./types";

type SequenceEntry = {
  type: EventType;
  title: string;
  description: string;
  severity: EventSeverity;
  meta?: Record<string, unknown>;
};

function iso(offsetMs: number, base: number = Date.now()): string {
  return new Date(base + offsetMs).toISOString();
}

function slugify(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function makeEvent(
  input: LiveEventFeedInput,
  index: number,
  sessionKey: string,
  type: EventType,
  title: string,
  description: string,
  severity: EventSeverity,
  offsetMs: number,
  metadata?: Record<string, unknown>
): LiveEvent {
  return {
    id: `${input.weekendSlug}:${sessionKey}:${type}:${index}`,
    timestamp: iso(offsetMs),
    type,
    title,
    description,
    severity,
    session: sessionKey,
    sport: input.sport,
    metadata,
  };
}

const COMMON_SEQUENCES: SequenceEntry[] = [
  {
    type: "session_start",
    title: "Session underway",
    description: "Lights out — the session is now live.",
    severity: "info",
  },
  {
    type: "green_flag",
    title: "Green flag",
    description: "Track is clear and marshals have waved green.",
    severity: "info",
  },
  {
    type: "fastest_lap",
    title: "Fastest lap",
    description: "A new fastest lap is recorded on the timing screens.",
    severity: "notice",
    meta: { lap: 1 },
  },
  {
    type: "pit_stop",
    title: "Pit stop",
    description: "A car peeled into the pit lane for service.",
    severity: "notice",
    meta: { stop: 1 },
  },
  {
    type: "tyre_change",
    title: "Tyre change",
    description: "Compound swap performed during the stop.",
    severity: "info",
    meta: { compound: "medium" },
  },
  {
    type: "yellow_flag",
    title: "Yellow flag",
    description: "Local yellows deployed in sector two.",
    severity: "warning",
    meta: { sector: 2 },
  },
  {
    type: "virtual_safety_car",
    title: "Virtual safety car",
    description: "VSC deployed to neutralise the field.",
    severity: "warning",
  },
  {
    type: "safety_car",
    title: "Safety car",
    description: "Full safety car deployed while marshals recover a car.",
    severity: "critical",
  },
  {
    type: "red_flag",
    title: "Red flag",
    description: "Session halted. Cars returning to the pits.",
    severity: "critical",
  },
  {
    type: "incident",
    title: "Incident noted",
    description: "Race control is reviewing an on-track incident.",
    severity: "warning",
  },
  {
    type: "retirement",
    title: "Retirement",
    description: "A competitor has stopped and retired from the session.",
    severity: "notice",
  },
  {
    type: "weather",
    title: "Weather update",
    description: "Rain intensity increasing around the circuit.",
    severity: "info",
    meta: { rain: "light" },
  },
  {
    type: "race_control",
    title: "Race control message",
    description: "FIA race control has issued a sporting directive.",
    severity: "notice",
  },
  {
    type: "session_end",
    title: "Session end",
    description: "Chequered flag — the session has concluded.",
    severity: "info",
  },
];

const MOTOGP_SEQUENCES: SequenceEntry[] = [
  {
    type: "rider_crash",
    title: "Rider down",
    description: "A rider has lost the front and gone down.",
    severity: "critical",
  },
  {
    type: "long_lap_penalty",
    title: "Long lap penalty",
    description: "Long lap penalty issued for a track-limits repeat.",
    severity: "warning",
    meta: { laps: 2 },
  },
  {
    type: "ride_through",
    title: "Ride through penalty",
    description: "Ride through penalty imposed for a jump start.",
    severity: "warning",
  },
  {
    type: "track_limits",
    title: "Track limits warning",
    description: "Rider recorded exceeding track limits.",
    severity: "notice",
    meta: { strike: 1 },
  },
  {
    type: "pit_exit",
    title: "Pit exit",
    description: "Rider released from pit lane onto the circuit.",
    severity: "info",
  },
];

function buildForSessions(
  input: LiveEventFeedInput,
  sessionPlan: { key: string; events: number; startOffsetMs: number }[]
): LiveEvent[] {
  const events: LiveEvent[] = [];
  const motogp = input.sport === "motogp";
  let index = 0;

  for (const plan of sessionPlan) {
    const pool = motogp
      ? [...COMMON_SEQUENCES, ...MOTOGP_SEQUENCES]
      : COMMON_SEQUENCES;

    const slice = pool.slice(0, Math.min(plan.events, pool.length));
    slice.forEach((entry, i) => {
      events.push(
        makeEvent(
          input,
          index++,
          plan.key,
          entry.type,
          entry.title,
          entry.description,
          entry.severity,
          plan.startOffsetMs + i * 47_000,
          entry.meta
        )
      );
    });
  }

  return sortEventsNewestFirstHelper(events);
}

function sortEventsNewestFirstHelper(events: LiveEvent[]): LiveEvent[] {
  return [...events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

function resolveSessions(
  input: LiveEventFeedInput
): { key: string; label: string }[] {
  if (input.sessions && input.sessions.length > 0) return input.sessions;
  return input.sport === "motogp"
    ? [
        { key: "p1", label: "Practice 1" },
        { key: "p2", label: "Practice 2" },
        { key: "qualifying", label: "Qualifying" },
        { key: "sprint", label: "Sprint" },
        { key: "race", label: "Race" },
      ]
    : [
        { key: "fp1", label: "Free Practice 1" },
        { key: "fp2", label: "Free Practice 2" },
        { key: "qualifying", label: "Qualifying" },
        { key: "race", label: "Race" },
      ];
}

export function buildMockEvents(input: LiveEventFeedInput): LiveEvent[] {
  if (input.phase === "cancelled") {
    return [
      makeEvent(
        input,
        0,
        "weekend",
        "race_control",
        "Event cancelled",
        "Race control has confirmed this event will not take place.",
        "critical",
        -3600_000
      ),
    ];
  }

  const sessions = resolveSessions(input);

  if (input.phase === "upcoming") {
    if (sessions.length === 0) return [];
    const first = sessions[0];
    return [
      makeEvent(
        input,
        0,
        first.key,
        "weather",
        "Forecast updated",
        "Latest forecast shows mixed conditions for the weekend ahead.",
        "info",
        -86_400_000 / 2,
        { condition: "mixed" }
      ),
    ];
  }

  const sessionPlan =
    input.phase === "live"
      ? [
          {
            key: sessions[0].key,
            events: 6,
            startOffsetMs: -6 * 60_000,
          },
        ]
      : sessions.slice(0, Math.min(4, sessions.length)).map((s, i) => ({
          key: s.key,
          events: 4,
          startOffsetMs: -(i + 1) * 30 * 60_000,
        }));

  return buildForSessions(input, sessionPlan);
}

export function buildMockEventKey(input: LiveEventFeedInput): string {
  return `${input.sport}:${slugify(input.weekendSlug)}:${input.phase}`;
}