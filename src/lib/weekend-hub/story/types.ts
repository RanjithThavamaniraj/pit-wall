import type { HubSession, HubSport, WeekendPhase } from "../types";
import type { LiveEvent } from "../events";
import type { RaceWeekendSummary } from "@/lib/race-summary/types";

export type StoryImportance = "primary" | "secondary" | "tertiary";

export type StorySection = {
  id: string;
  heading: string;
  content: string;
  importance: StoryImportance;
  icon?: string;
};

export type WeekendStory = {
  title: string;
  subtitle: string;
  phase: WeekendPhase;
  sport: HubSport;
  generatedAt: string;
  sections: StorySection[];
};

export type StoryContext = {
  sport: HubSport;
  weekendSlug: string;
  weekendName: string;
  phase: WeekendPhase;
  sessions: HubSession[];
  liveEvents?: LiveEvent[];
  summary?: RaceWeekendSummary | null;
  isSprintWeekend?: boolean;
};

export type StoryProvider = {
  id: string;
  label: string;
  generate(context: StoryContext): Promise<WeekendStory>;
};

export type StoryProviderStatus = "ready" | "stub";

export type StoryProviderRegistration = {
  provider: StoryProvider;
  status: StoryProviderStatus;
};