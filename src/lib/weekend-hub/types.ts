import type { RaceSummarySport } from "@/lib/race-summary/types";
import type { SessionStatus } from "@/lib/utils";

export type HubSport = RaceSummarySport;

/** Session lifecycle on the weekend hub (extends schedule status with cancelled). */
export type HubSessionStatus = SessionStatus | "cancelled";

export type HubSession = {
  id: string;
  key: string;
  label: string;
  dateUtc: string;
  status: HubSessionStatus;
};

export type WeekendPhase = "upcoming" | "live" | "completed" | "cancelled";

export type StageStatus = "upcoming" | "current" | "completed";

export type TimelineStage = {
  id: string;
  label: string;
  status: StageStatus;
};

export type WeekendHubData = {
  sport: HubSport;
  slug: string;
  name: string;
  isPast: boolean;
  isCurrent: boolean;
  isSprintWeekend: boolean;
  isCancelled: boolean;
  sessions: HubSession[];
  liveLinkHref?: string;
  liveLinkLabel?: string;
  standingsHref: string;
};

export type TimelineStageDef = {
  id: string;
  label: string;
  sessionKeys: string[];
  /** Virtual stages (e.g. Weekend Opens) are not tied to a session key. */
  virtual?: boolean;
};
