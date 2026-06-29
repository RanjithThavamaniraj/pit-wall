import { getAnalyticsStore } from "./get-store";
import type { ApiMetricEvent, HeartbeatInput, PageviewInput } from "./types";

export async function ingestPageview(input: PageviewInput) {
  const store = getAnalyticsStore();
  await store.recordPageview(input);
}

export async function ingestHeartbeat(input: HeartbeatInput) {
  const store = getAnalyticsStore();
  await store.recordHeartbeat(input);
}

export async function ingestApiMetric(
  metric: Omit<ApiMetricEvent, "id">
) {
  const store = getAnalyticsStore();
  await store.recordApiMetric(metric);
}
export function enrichCollectBody(
  body: unknown,
  ids: { visitorId?: string; sessionId?: string }
): unknown {
  if (!body || typeof body !== "object") return body;
  const record = { ...(body as Record<string, unknown>) };
  if (typeof record.visitorId !== "string" && ids.visitorId) {
    record.visitorId = ids.visitorId;
  }
  if (typeof record.sessionId !== "string" && ids.sessionId) {
    record.sessionId = ids.sessionId;
  }
  return record;
}

export function parseCollectBody(
  body: unknown
): PageviewInput | HeartbeatInput | null {
  if (!body || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;
  const type = record.type;
  const pathname = typeof record.pathname === "string" ? record.pathname : "";
  const visitorId =
    typeof record.visitorId === "string" ? record.visitorId : "";
  const sessionId =
    typeof record.sessionId === "string" ? record.sessionId : "";

  if (!pathname || !visitorId || !sessionId) return null;

  const base = {
    pathname,
    visitorId,
    sessionId,
    timestamp:
      typeof record.timestamp === "number" ? record.timestamp : Date.now(),
    userAgent:
      typeof record.userAgent === "string" ? record.userAgent : undefined,
  };

  if (type === "pageview") {
    return {
      ...base,
      referrer:
        typeof record.referrer === "string" ? record.referrer : undefined,
    };
  }

  if (type === "heartbeat") {
    const durationMs =
      typeof record.durationMs === "number" ? record.durationMs : 0;
    return { ...base, durationMs };
  }

  return null;
}
