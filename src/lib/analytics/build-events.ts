import { randomUUID } from "crypto";
import {
  classifyDevice,
  classifyReferrer,
  classifyRouteBucket,
  classifySport,
} from "./classify";
import type {
  AnalyticsEvent,
  ApiMetricEvent,
  HeartbeatInput,
  PageviewInput,
} from "./types";

function siteHost(): string | undefined {
  const raw = process.env.NEXT_PUBLIC_SITE_URL;
  if (!raw) return undefined;
  try {
    return new URL(raw).host;
  } catch {
    return undefined;
  }
}

export function buildPageviewEvent(input: PageviewInput): AnalyticsEvent {
  const timestamp = input.timestamp ?? Date.now();
  return {
    id: randomUUID(),
    type: "pageview",
    timestamp,
    visitorId: input.visitorId,
    sessionId: input.sessionId,
    pathname: input.pathname,
    sport: classifySport(input.pathname),
    routeBucket: classifyRouteBucket(input.pathname),
    referrerBucket: classifyReferrer(input.referrer, siteHost()),
    device: classifyDevice(input.userAgent),
    referrer: input.referrer ?? undefined,
    userAgent: input.userAgent ?? undefined,
  };
}

export function buildHeartbeatEvent(input: HeartbeatInput): AnalyticsEvent {
  const timestamp = input.timestamp ?? Date.now();
  return {
    id: randomUUID(),
    type: "heartbeat",
    timestamp,
    visitorId: input.visitorId,
    sessionId: input.sessionId,
    pathname: input.pathname,
    sport: classifySport(input.pathname),
    routeBucket: classifyRouteBucket(input.pathname),
    referrerBucket: "direct",
    device: classifyDevice(input.userAgent),
    durationMs: input.durationMs,
    userAgent: input.userAgent ?? undefined,
  };
}

export function buildApiMetricEvent(
  metric: Omit<ApiMetricEvent, "id">
): ApiMetricEvent {
  return { id: randomUUID(), ...metric };
}
