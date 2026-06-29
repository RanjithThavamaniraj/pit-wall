export type RaceSummarySport = "f1" | "motogp";

export type StandingsMovement = "up" | "down" | "unchanged";

export type PodiumFinisher = {
  position: number;
  name: string;
  team?: string;
  number?: string | number;
  nationality?: string;
  countryCode?: string;
  imageSlug?: string;
};

export type ChampionshipRow = {
  position: number;
  name: string;
  team?: string;
  points: number;
  movement?: StandingsMovement;
  countryCode?: string;
  imageSlug?: string;
};

export type PredictionPick = {
  name: string;
  percentage: number;
};

export type CommunityPredictionSummary = {
  predictedWinner: string;
  actualWinner: string;
  accuracy: number;
  totalVotes?: number;
  topPicks?: PredictionPick[];
};

export type WeekendStat = {
  label: string;
  value: string;
  icon?: string;
  highlight?: boolean;
};

export type WeekendTimelineEntry = {
  label: string;
  completed: boolean;
  day?: string;
};

export type WeekendWeather = {
  airTemp?: string;
  trackTemp?: string;
  conditions?: string;
};

export type WeekendHighlight = {
  title: string;
  description: string;
  type?: string;
  videoUrl?: string;
};

export type RaceWeekendSummary = {
  sport: RaceSummarySport;
  slug: string;
  round: number;
  season: number;
  name: string;
  shortName: string;

  raceResults: PodiumFinisher[];
  sprintResults?: PodiumFinisher[];

  polePosition?: string;
  fastestLap?: string;
  sprintWinner?: string;

  driversChampionship?: ChampionshipRow[];
  constructorsChampionship?: ChampionshipRow[];
  teamsChampionship?: ChampionshipRow[];

  communityPrediction?: CommunityPredictionSummary;

  statistics: WeekendStat[];

  weekendReport?: string;
  timeline?: WeekendTimelineEntry[];
  weather?: WeekendWeather;
  highlights?: WeekendHighlight[];

  /** Reserved for future archive sections (gallery, quotes, telemetry, etc.) */
  extensions?: Record<string, unknown>;
};

export type CompletedRaceCardData = {
  slug: string;
  round: number;
  shortName: string;
  name: string;
  countryCode: string;
  dateRange: string;
  circuit?: string;
  podium?: PodiumFinisher[];
};
