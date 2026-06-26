import { getAnalyticsStore } from "./get-store";
import { routeBucketLabel } from "./classify";
import type {
  AnalyticsEvent,
  ApiMetricEvent,
  DashboardSummary,
  DeviceBucket,
  ReferrerBucket,
  RouteBucket,
} from "./types";

const MS_DAY = 86_400_000;

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function dateKey(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10);
}

function uniqueCount(values: string[]): number {
  return new Set(values).size;
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function countBy<T extends string>(
  items: T[],
  order?: T[]
): { key: T; count: number }[] {
  const map = new Map<T, number>();
  for (const item of items) {
    map.set(item, (map.get(item) ?? 0) + 1);
  }
  const keys = order ?? [...map.keys()];
  return keys
    .filter((k) => map.has(k))
    .map((key) => ({ key, count: map.get(key) ?? 0 }));
}

function topPages(events: AnalyticsEvent[]) {
  const pageviews = events.filter((e) => e.type === "pageview");
  const byPath = new Map<string, { pageviews: number; visitors: Set<string> }>();

  for (const event of pageviews) {
    const row = byPath.get(event.pathname) ?? {
      pageviews: 0,
      visitors: new Set<string>(),
    };
    row.pageviews += 1;
    row.visitors.add(event.visitorId);
    byPath.set(event.pathname, row);
  }

  return [...byPath.entries()]
    .map(([pathname, row]) => ({
      pathname,
      pageviews: row.pageviews,
      uniqueVisitors: row.visitors.size,
    }))
    .sort((a, b) => b.pageviews - a.pageviews)
    .slice(0, 10);
}

function sessionDurations(events: AnalyticsEvent[]): number[] {
  const bySession = new Map<string, number>();
  for (const event of events) {
    if (event.type !== "heartbeat" || !event.durationMs) continue;
    bySession.set(
      event.sessionId,
      (bySession.get(event.sessionId) ?? 0) + event.durationMs
    );
  }
  return [...bySession.values()];
}

function liveEngagement(events: AnalyticsEvent[]) {
  const livePaths = new Set(["/live", "/motogp/live"]);
  const pageviews = events.filter(
    (e) => e.type === "pageview" && livePaths.has(e.pathname)
  );
  const heartbeats = events.filter(
    (e) => e.type === "heartbeat" && livePaths.has(e.pathname) && e.durationMs
  );

  return {
    livePageviews: pageviews.length,
    liveUniqueVisitors: uniqueCount(pageviews.map((e) => e.visitorId)),
    avgTimeOnLiveMs: avg(heartbeats.map((e) => e.durationMs ?? 0)),
  };
}

function apiHealth(metrics: ApiMetricEvent[]) {
  const totalRequests = metrics.length;
  const errors = metrics.filter((m) => m.status >= 500 || m.error);
  const byRoute = new Map<
    string,
    { totalMs: number; count: number; errors: number }
  >();

  for (const metric of metrics) {
    const row = byRoute.get(metric.route) ?? {
      totalMs: 0,
      count: 0,
      errors: 0,
    };
    row.totalMs += metric.durationMs;
    row.count += 1;
    if (metric.status >= 500 || metric.error) row.errors += 1;
    byRoute.set(metric.route, row);
  }

  const slowestRoutes = [...byRoute.entries()]
    .map(([route, row]) => ({
      route,
      avgMs: row.totalMs / row.count,
      count: row.count,
    }))
    .sort((a, b) => b.avgMs - a.avgMs)
    .slice(0, 5);

  const errorsByRoute = [...byRoute.entries()]
    .filter(([, row]) => row.errors > 0)
    .map(([route, row]) => ({ route, errors: row.errors }))
    .sort((a, b) => b.errors - a.errors)
    .slice(0, 5);

  return {
    totalRequests,
    errorRate: totalRequests ? errors.length / totalRequests : 0,
    avgLatencyMs: avg(metrics.map((m) => m.durationMs)),
    slowestRoutes,
    errorsByRoute,
  };
}

function dailyTrend(events: AnalyticsEvent[], days: number) {
  const pageviews = events.filter((e) => e.type === "pageview");
  const todayStart = startOfDay(Date.now());
  const rows: { date: string; pageviews: number; visitors: number }[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const dayStart = todayStart - i * MS_DAY;
    const dayEnd = dayStart + MS_DAY;
    const dayEvents = pageviews.filter(
      (e) => e.timestamp >= dayStart && e.timestamp < dayEnd
    );
    rows.push({
      date: dateKey(dayStart),
      pageviews: dayEvents.length,
      visitors: uniqueCount(dayEvents.map((e) => e.visitorId)),
    });
  }

  return rows;
}

function hourlyToday(events: AnalyticsEvent[]) {
  const todayStart = startOfDay(Date.now());
  const pageviews = events.filter(
    (e) => e.type === "pageview" && e.timestamp >= todayStart
  );
  const hours = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    pageviews: 0,
  }));

  for (const event of pageviews) {
    const hour = new Date(event.timestamp).getHours();
    hours[hour].pageviews += 1;
  }

  return hours;
}

function weekendContextLabel(): { label: string; note: string } {
  const now = new Date();
  const day = now.getUTCDay();
  const hour = now.getUTCHours();
  const isRaceWeekend =
    (day === 5 && hour >= 12) || day === 6 || (day === 0 && hour < 20);

  if (isRaceWeekend) {
    return {
      label: "Race weekend window",
      note: "Expect elevated live and race-detail traffic. Compare hourly chart against prior weekdays.",
    };
  }

  return {
    label: "Off-weekend baseline",
    note: "Traffic should skew toward home, calendar, and standings. Live share rises on session days.",
  };
}

export async function getDashboardSummary(
  rangeDays = 14
): Promise<DashboardSummary> {
  const store = getAnalyticsStore();
  const sinceMs = Date.now() - rangeDays * MS_DAY;
  const [events, apiMetrics] = await Promise.all([
    store.readEvents(sinceMs),
    store.readApiMetrics(sinceMs),
  ]);

  const pageviews = events.filter((e) => e.type === "pageview");
  const todayStart = startOfDay(Date.now());
  const todayPageviews = pageviews.filter((e) => e.timestamp >= todayStart);

  const routeBuckets = countBy<RouteBucket>(
    pageviews.map((e) => e.routeBucket),
    [
      "home",
      "live",
      "races",
      "race_detail",
      "standings",
      "motogp_home",
      "motogp_live",
      "motogp_races",
      "motogp_race_detail",
      "motogp_standings",
      "other",
    ]
  ).map(({ key, count }) => ({
    bucket: key,
    pageviews: count,
    label: routeBucketLabel(key),
  }));

  const sportSplit = (["f1", "motogp"] as const).map((sport) => {
    const sportViews = pageviews.filter((e) => e.sport === sport);
    return {
      sport,
      pageviews: sportViews.length,
      visitors: uniqueCount(sportViews.map((e) => e.visitorId)),
    };
  });

  const livePaths = new Set(["/live", "/motogp/live"]);
  const raceDetailBuckets = new Set<RouteBucket>([
    "race_detail",
    "motogp_race_detail",
  ]);

  return {
    generatedAt: Date.now(),
    rangeDays,
    totals: {
      pageviews: pageviews.length,
      uniqueVisitors: uniqueCount(pageviews.map((e) => e.visitorId)),
      sessions: uniqueCount(pageviews.map((e) => e.sessionId)),
      avgSessionDurationMs: avg(sessionDurations(events)),
      livePageviews: pageviews.filter((e) => livePaths.has(e.pathname)).length,
      raceDetailViews: pageviews.filter((e) =>
        raceDetailBuckets.has(e.routeBucket)
      ).length,
    },
    today: {
      pageviews: todayPageviews.length,
      uniqueVisitors: uniqueCount(todayPageviews.map((e) => e.visitorId)),
      sessions: uniqueCount(todayPageviews.map((e) => e.sessionId)),
    },
    sportSplit,
    routeBuckets: routeBuckets.map(({ bucket, pageviews: pv }) => ({
      bucket,
      pageviews: pv,
    })),
    referrers: countBy<ReferrerBucket>(
      pageviews.map((e) => e.referrerBucket),
      ["direct", "search", "social", "internal", "other"]
    ).map(({ key, count }) => ({ bucket: key, count })),
    devices: countBy<DeviceBucket>(
      pageviews.map((e) => e.device),
      ["mobile", "desktop", "tablet", "unknown"]
    ).map(({ key, count }) => ({ device: key, count })),
    topPages: topPages(events),
    hourlyToday: hourlyToday(events),
    dailyTrend: dailyTrend(events, Math.min(rangeDays, 14)),
    apiHealth: apiHealth(apiMetrics),
    liveEngagement: liveEngagement(events),
    weekendContext: weekendContextLabel(),
    predictions: {
      status: "placeholder",
      message:
        "Community predictions will appear here after the predictions feature ships.",
    },
  };
}
