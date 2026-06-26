import type {
  AnalyticsEvent,
  ApiMetricEvent,
  HeartbeatInput,
  PageviewInput,
} from "./types";

export interface AnalyticsStore {
  recordPageview(input: PageviewInput): Promise<void>;
  recordHeartbeat(input: HeartbeatInput): Promise<void>;
  recordApiMetric(metric: Omit<ApiMetricEvent, "id">): Promise<void>;
  readEvents(sinceMs: number): Promise<AnalyticsEvent[]>;
  readApiMetrics(sinceMs: number): Promise<ApiMetricEvent[]>;
}
