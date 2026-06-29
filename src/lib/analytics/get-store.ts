import type { AnalyticsStore } from "./store";
import { getFileAnalyticsStore } from "./file-store";
import { getSupabaseAnalyticsStore } from "./supabase-store";

export type AnalyticsStoreBackend = "file" | "supabase";

export function resolveAnalyticsStoreBackend(): AnalyticsStoreBackend {
  const override = process.env.ANALYTICS_STORE?.trim().toLowerCase();
  if (override === "file") return "file";
  if (override === "supabase") return "supabase";
  return process.env.NODE_ENV === "production" ? "supabase" : "file";
}

export function getAnalyticsStore(): AnalyticsStore {
  const backend = resolveAnalyticsStoreBackend();
  if (backend === "file") {
    return getFileAnalyticsStore();
  }
  return getSupabaseAnalyticsStore();
}
