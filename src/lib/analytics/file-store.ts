import { mkdir, appendFile, readFile } from "fs/promises";
import path from "path";
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
    await appendJsonLine(API_FILE, buildApiMetricEvent(metric));
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
