import { getSupabaseAdminClient } from "./supabase-client";
import {
  buildApiMetricEvent,
  buildHeartbeatEvent,
  buildPageviewEvent,
} from "./build-events";
import type { AnalyticsStore } from "./store";
import type {
  AnalyticsEvent,
  ApiMetricEvent,
  HeartbeatInput,
  PageviewInput,
} from "./types";

type EventRow = {
  id: string;
  type: "pageview" | "heartbeat";
  timestamp_ms: number;
  visitor_id: string;
  session_id: string;
  pathname: string;
  sport: AnalyticsEvent["sport"];
  route_bucket: AnalyticsEvent["routeBucket"];
  referrer_bucket: AnalyticsEvent["referrerBucket"];
  device: AnalyticsEvent["device"];
  referrer: string | null;
  user_agent: string | null;
  duration_ms: number | null;
};

type ApiMetricRow = {
  id: string;
  timestamp_ms: number;
  route: string;
  method: string;
  status: number;
  duration_ms: number;
  error: string | null;
};

function rowToEvent(row: EventRow): AnalyticsEvent {
  return {
    id: row.id,
    type: row.type,
    timestamp: row.timestamp_ms,
    visitorId: row.visitor_id,
    sessionId: row.session_id,
    pathname: row.pathname,
    sport: row.sport,
    routeBucket: row.route_bucket,
    referrerBucket: row.referrer_bucket,
    device: row.device,
    referrer: row.referrer ?? undefined,
    userAgent: row.user_agent ?? undefined,
    durationMs: row.duration_ms ?? undefined,
  };
}

function rowToApiMetric(row: ApiMetricRow): ApiMetricEvent {
  return {
    id: row.id,
    timestamp: row.timestamp_ms,
    route: row.route,
    method: row.method,
    status: row.status,
    durationMs: row.duration_ms,
    error: row.error ?? undefined,
  };
}

function eventToRow(event: AnalyticsEvent): EventRow {
  return {
    id: event.id,
    type: event.type === "heartbeat" ? "heartbeat" : "pageview",
    timestamp_ms: event.timestamp,
    visitor_id: event.visitorId,
    session_id: event.sessionId,
    pathname: event.pathname,
    sport: event.sport,
    route_bucket: event.routeBucket,
    referrer_bucket: event.referrerBucket,
    device: event.device,
    referrer: event.referrer ?? null,
    user_agent: event.userAgent ?? null,
    duration_ms: event.durationMs ?? null,
  };
}

export class SupabaseAnalyticsStore implements AnalyticsStore {
  private get client() {
    return getSupabaseAdminClient();
  }

  private async touchSession(
    event: AnalyticsEvent,
    kind: "pageview" | "heartbeat"
  ): Promise<void> {
    const { data: existing, error: readError } = await this.client
      .from("analytics_sessions")
      .select("first_seen_ms, last_seen_ms, pageview_count, total_duration_ms")
      .eq("session_id", event.sessionId)
      .maybeSingle();

    if (readError) throw readError;

    const durationDelta = event.durationMs ?? 0;

    if (!existing) {
      const { error } = await this.client.from("analytics_sessions").insert({
        session_id: event.sessionId,
        visitor_id: event.visitorId,
        first_seen_ms: event.timestamp,
        last_seen_ms: event.timestamp,
        pageview_count: kind === "pageview" ? 1 : 0,
        total_duration_ms: durationDelta,
        last_pathname: event.pathname,
      });
      if (error) throw error;
      return;
    }

    const { error } = await this.client
      .from("analytics_sessions")
      .update({
        visitor_id: event.visitorId,
        last_seen_ms: Math.max(existing.last_seen_ms, event.timestamp),
        pageview_count:
          existing.pageview_count + (kind === "pageview" ? 1 : 0),
        total_duration_ms: existing.total_duration_ms + durationDelta,
        last_pathname: event.pathname,
      })
      .eq("session_id", event.sessionId);

    if (error) throw error;
  }

  async recordPageview(input: PageviewInput): Promise<void> {
    const event = buildPageviewEvent(input);
    const { error } = await this.client
      .from("analytics_events")
      .insert(eventToRow(event));
    if (error) throw error;
    await this.touchSession(event, "pageview");
  }

  async recordHeartbeat(input: HeartbeatInput): Promise<void> {
    const event = buildHeartbeatEvent(input);
    const { error } = await this.client
      .from("analytics_events")
      .insert(eventToRow(event));
    if (error) throw error;
    await this.touchSession(event, "heartbeat");
  }

  async recordApiMetric(metric: Omit<ApiMetricEvent, "id">): Promise<void> {
    const row = buildApiMetricEvent(metric);
    const { error } = await this.client.from("analytics_api_metrics").insert({
      id: row.id,
      timestamp_ms: row.timestamp,
      route: row.route,
      method: row.method,
      status: row.status,
      duration_ms: row.durationMs,
      error: row.error ?? null,
    });
    if (error) throw error;
  }

  async readEvents(sinceMs: number): Promise<AnalyticsEvent[]> {
    const { data, error } = await this.client
      .from("analytics_events")
      .select("*")
      .gte("timestamp_ms", sinceMs)
      .order("timestamp_ms", { ascending: true });

    if (error) throw error;
    return (data as EventRow[]).map(rowToEvent);
  }

  async readApiMetrics(sinceMs: number): Promise<ApiMetricEvent[]> {
    const { data, error } = await this.client
      .from("analytics_api_metrics")
      .select("*")
      .gte("timestamp_ms", sinceMs)
      .order("timestamp_ms", { ascending: true });

    if (error) throw error;
    return (data as ApiMetricRow[]).map(rowToApiMetric);
  }
}

let singleton: SupabaseAnalyticsStore | null = null;

export function getSupabaseAnalyticsStore(): SupabaseAnalyticsStore {
  if (!singleton) singleton = new SupabaseAnalyticsStore();
  return singleton;
}
