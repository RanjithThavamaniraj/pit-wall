import { mkdir, appendFile, readFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import {
  classifyDevice,
  classifyReferrer,
  classifyRouteBucket,
  classifySport,
} from "./classify";
import type { AnalyticsStore } from "./store";
import type {
  AnalyticsEvent,
  ApiMetricEvent,
  HeartbeatInput,
  PageviewInput,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data", "analytics");
const EVENTS_FILE = path.join(DATA_DIR, "events.jsonl");
const API_FILE = path.join(DATA_DIR, "api-metrics.jsonl");

async function ensureDir() {
  await mkdir(DATA_DIR, { recursive: true });
}

async function appendJsonLine(filePath: string, value: unknown) {
  await ensureDir();
  await appendFile(filePath, `${JSON.stringify(value)}\n`, "utf8");
}

function siteHost(): string | undefined {
  const raw = process.env.NEXT_PUBLIC_SITE_URL;
  if (!raw) return undefined;
  try {
    return new URL(raw).host;
  } catch {
    return undefined;
  }
}

function buildPageviewEvent(input: PageviewInput): AnalyticsEvent {
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

function buildHeartbeatEvent(input: HeartbeatInput): AnalyticsEvent {
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

async function readJsonLines<T>(filePath: string): Promise<T[]> {
  try {
    const raw = await readFile(filePath, "utf8");
    return raw
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as T);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

export class FileAnalyticsStore implements AnalyticsStore {
  async recordPageview(input: PageviewInput): Promise<void> {
    await appendJsonLine(EVENTS_FILE, buildPageviewEvent(input));
  }

  async recordHeartbeat(input: HeartbeatInput): Promise<void> {
    await appendJsonLine(EVENTS_FILE, buildHeartbeatEvent(input));
  }

  async recordApiMetric(metric: Omit<ApiMetricEvent, "id">): Promise<void> {
    await appendJsonLine(API_FILE, { id: randomUUID(), ...metric });
  }

  async readEvents(sinceMs: number): Promise<AnalyticsEvent[]> {
    const events = await readJsonLines<AnalyticsEvent>(EVENTS_FILE);
    return events.filter((e) => e.timestamp >= sinceMs);
  }

  async readApiMetrics(sinceMs: number): Promise<ApiMetricEvent[]> {
    const metrics = await readJsonLines<ApiMetricEvent>(API_FILE);
    return metrics.filter((m) => m.timestamp >= sinceMs);
  }
}

let singleton: FileAnalyticsStore | null = null;

export function getFileAnalyticsStore(): FileAnalyticsStore {
  if (!singleton) singleton = new FileAnalyticsStore();
  return singleton;
}
