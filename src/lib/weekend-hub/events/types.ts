import type { HubSport, WeekendPhase } from "../types";

export type { WeekendPhase };

export type CommonEventType =
  | "session_start"
  | "session_end"
  | "green_flag"
  | "yellow_flag"
  | "red_flag"
  | "safety_car"
  | "virtual_safety_car"
  | "pit_stop"
  | "tyre_change"
  | "fastest_lap"
  | "retirement"
  | "incident"
  | "weather"
  | "race_control";

export type MotoGpEventType =
  | "rider_crash"
  | "long_lap_penalty"
  | "ride_through"
  | "track_limits"
  | "pit_exit";

export type EventType = CommonEventType | MotoGpEventType;

export type EventSeverity = "info" | "notice" | "warning" | "critical";

export type EventMetadata = Record<string, unknown>;

export type LiveEvent<TMetadata extends EventMetadata = EventMetadata> = {
  id: string;
  timestamp: string;
  type: EventType;
  title: string;
  description: string;
  severity: EventSeverity;
  session: string;
  sport: HubSport;
  metadata?: TMetadata;
};

export type LiveEventFeedInput = {
  sport: HubSport;
  weekendSlug: string;
  phase: WeekendPhase;
  sessions?: { key: string; label: string }[];
};

export const COMMON_EVENT_TYPES: readonly CommonEventType[] = [
  "session_start",
  "session_end",
  "green_flag",
  "yellow_flag",
  "red_flag",
  "safety_car",
  "virtual_safety_car",
  "pit_stop",
  "tyre_change",
  "fastest_lap",
  "retirement",
  "incident",
  "weather",
  "race_control",
];

export const MOTOGP_EVENT_TYPES: readonly MotoGpEventType[] = [
  "rider_crash",
  "long_lap_penalty",
  "ride_through",
  "track_limits",
  "pit_exit",
];

export function isMotoGpEventType(type: EventType): type is MotoGpEventType {
  return (MOTOGP_EVENT_TYPES as readonly string[]).includes(type);
}

export function isMotoGpEvent(event: LiveEvent): boolean {
  return isMotoGpEventType(event.type);
}

export function eventTypesForSport(sport: HubSport): readonly EventType[] {
  return sport === "motogp"
    ? [...COMMON_EVENT_TYPES, ...MOTOGP_EVENT_TYPES]
    : COMMON_EVENT_TYPES;
}