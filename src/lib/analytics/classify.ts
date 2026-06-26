import type { Sport } from "@/lib/sport";
import { sportFromPathname } from "@/lib/sport";
import type {
  DeviceBucket,
  ReferrerBucket,
  RouteBucket,
} from "./types";

const RACE_DETAIL = /^\/(?:motogp\/)?races\/[^/]+$/;

export function classifyRouteBucket(pathname: string): RouteBucket {
  if (pathname === "/") return "home";
  if (pathname === "/live") return "live";
  if (pathname === "/races") return "races";
  if (RACE_DETAIL.test(pathname) && !pathname.startsWith("/motogp")) {
    return "race_detail";
  }
  if (pathname === "/standings") return "standings";
  if (pathname === "/motogp") return "motogp_home";
  if (pathname === "/motogp/live") return "motogp_live";
  if (pathname === "/motogp/races") return "motogp_races";
  if (pathname.startsWith("/motogp/races/")) return "motogp_race_detail";
  if (pathname === "/motogp/standings") return "motogp_standings";
  return "other";
}

export function classifySport(pathname: string): Sport {
  return sportFromPathname(pathname);
}

export function classifyDevice(userAgent: string | null | undefined): DeviceBucket {
  if (!userAgent) return "unknown";
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet|playbook|silk|(android(?!.*mobile))/.test(ua)) {
    return "tablet";
  }
  if (/mobi|iphone|ipod|android.*mobile|windows phone/.test(ua)) {
    return "mobile";
  }
  if (/windows|macintosh|linux|cros/.test(ua)) return "desktop";
  return "unknown";
}

export function classifyReferrer(
  referrer: string | null | undefined,
  siteHost?: string
): ReferrerBucket {
  if (!referrer || referrer.trim() === "") return "direct";

  try {
    const url = new URL(referrer);
    if (siteHost && url.host === siteHost) return "internal";

    const host = url.hostname.toLowerCase();
    if (
      host.includes("google.") ||
      host.includes("bing.") ||
      host.includes("duckduckgo.") ||
      host.includes("yahoo.")
    ) {
      return "search";
    }
    if (
      host.includes("twitter.") ||
      host.includes("x.com") ||
      host.includes("facebook.") ||
      host.includes("instagram.") ||
      host.includes("reddit.") ||
      host.includes("linkedin.") ||
      host.includes("tiktok.")
    ) {
      return "social";
    }
    return "other";
  } catch {
    return "other";
  }
}

export function routeBucketLabel(bucket: RouteBucket): string {
  const labels: Record<RouteBucket, string> = {
    home: "Home",
    live: "Live timing",
    races: "Race calendar",
    race_detail: "Race detail",
    standings: "Standings",
    motogp_home: "MotoGP home",
    motogp_live: "MotoGP live",
    motogp_races: "MotoGP calendar",
    motogp_race_detail: "MotoGP race detail",
    motogp_standings: "MotoGP standings",
    other: "Other",
  };
  return labels[bucket];
}
