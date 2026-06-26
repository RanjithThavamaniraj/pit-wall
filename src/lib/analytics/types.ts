import type { Sport } from "@/lib/sport";

export type AnalyticsEventType = "pageview" | "heartbeat" | "api";

export type DeviceBucket = "mobile" | "tablet" | "desktop" | "unknown";

export type ReferrerBucket =
  | "direct"
  | "search"
  | "social"
  | "internal"
  | "other";

export type RouteBucket =
  | "home"
  | "live"
  | "races"
  | "race_detail"
  | "standings"
  | "motogp_home"
  | "motogp_live"
  | "motogp_races"
  | "motogp_race_detail"
  | "motogp_standings"
  | "other";

export interface AnalyticsEvent {
  id: string;
  type: AnalyticsEventType;
  timestamp: number;
  visitorId: string;
  sessionId: string;
  pathname: string;
  sport: Sport;
  routeBucket: RouteBucket;
  referrerBucket: ReferrerBucket;
  device: DeviceBucket;
  referrer?: string;
  userAgent?: string;
  durationMs?: number;
}

export interface ApiMetricEvent {
  id: string;
  timestamp: number;
  route: string;
  method: string;
  status: number;
  durationMs: number;
  error?: string;
}

export interface PageviewInput {
  pathname: string;
  visitorId: string;
  sessionId: string;
  timestamp?: number;
  referrer?: string | null;
  userAgent?: string | null;
}

export interface HeartbeatInput {
  pathname: string;
  visitorId: string;
  sessionId: string;
  durationMs: number;
  timestamp?: number;
  userAgent?: string | null;
}

export interface DashboardSummary {
  generatedAt: number;
  rangeDays: number;
  totals: {
    pageviews: number;
    uniqueVisitors: number;
    sessions: number;
    avgSessionDurationMs: number;
    livePageviews: number;
    raceDetailViews: number;
  };
  today: {
    pageviews: number;
    uniqueVisitors: number;
    sessions: number;
  };
  sportSplit: { sport: Sport; pageviews: number; visitors: number }[];
  routeBuckets: { bucket: RouteBucket; pageviews: number }[];
  referrers: { bucket: ReferrerBucket; count: number }[];
  devices: { device: DeviceBucket; count: number }[];
  topPages: { pathname: string; pageviews: number; uniqueVisitors: number }[];
  hourlyToday: { hour: number; pageviews: number }[];
  dailyTrend: { date: string; pageviews: number; visitors: number }[];
  apiHealth: {
    totalRequests: number;
    errorRate: number;
    avgLatencyMs: number;
    slowestRoutes: { route: string; avgMs: number; count: number }[];
    errorsByRoute: { route: string; errors: number }[];
  };
  liveEngagement: {
    livePageviews: number;
    liveUniqueVisitors: number;
    avgTimeOnLiveMs: number;
  };
  weekendContext: {
    label: string;
    note: string;
  };
  predictions: {
    status: "placeholder";
    message: string;
  };
}
