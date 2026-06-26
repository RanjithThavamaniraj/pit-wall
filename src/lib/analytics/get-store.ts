import type { AnalyticsStore } from "./store";
import { getFileAnalyticsStore } from "./file-store";

export function getAnalyticsStore(): AnalyticsStore {
  const mode = process.env.ANALYTICS_STORE ?? "file";
  if (mode === "file") {
    return getFileAnalyticsStore();
  }
  throw new Error(
    `Unsupported ANALYTICS_STORE="${mode}". Only "file" is implemented.`
  );
}
