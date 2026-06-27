import { ADMIN_CACHE } from "@/lib/cache/admin";

export type Sport = "f1" | "motogp";

export const SPORT_STORAGE_KEY = "pitwall-sport";
export const SPORT_COOKIE_KEY = "pitwall-sport";

export const SPORT_LABELS: Record<Sport, string> = {
  f1: "F1",
  motogp: "MotoGP",
};

export const SPORT_SUBTITLES: Record<Sport, string> = {
  f1: "Formula 1",
  motogp: "MotoGP",
};

const F1_TO_MOTOGP: Record<string, string> = {
  "/": "/",
  "/races": "/motogp/races",
  "/standings": "/motogp/standings",
  "/live": "/motogp/live",
};

const MOTOGP_TO_F1: Record<string, string> = {
  "/": "/",
  "/motogp/races": "/races",
  "/motogp/standings": "/standings",
  "/motogp/live": "/live",
};

export function sportFromPathname(pathname: string): Sport {
  return pathname.startsWith("/motogp") ? "motogp" : "f1";
}

export function getSportBasePath(sport: Sport): string {
  return sport === "motogp" ? "/motogp" : "";
}

export function getSportRoutes(sport: Sport) {
  const base = getSportBasePath(sport);
  return {
    home: "/",
    races: `${base}/races`.replace("//", "/"),
    standings: `${base}/standings`.replace("//", "/"),
    live: `${base}/live`.replace("//", "/"),
  };
}

const RACE_DETAIL_PATTERN = /^\/(?:motogp\/)?races\/[^/]+$/;

export function isRaceDetailPath(pathname: string): boolean {
  return RACE_DETAIL_PATTERN.test(pathname);
}

export function isNavRouteActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getEquivalentRoute(pathname: string, targetSport: Sport): string {
  const currentSport = sportFromPathname(pathname);
  if (currentSport === targetSport) return pathname;

  if (isRaceDetailPath(pathname)) {
    return targetSport === "motogp" ? "/motogp/races" : "/races";
  }

  if (targetSport === "motogp") {
    if (pathname.startsWith("/motogp")) return pathname;
    return F1_TO_MOTOGP[pathname] ?? "/motogp/races";
  }

  if (pathname.startsWith("/motogp")) {
    return MOTOGP_TO_F1[pathname] ?? "/races";
  }
  return pathname;
}

export function setSportCookie(sport: Sport) {
  if (typeof document === "undefined") return;
  document.cookie = `${SPORT_COOKIE_KEY}=${sport};path=/;max-age=${ADMIN_CACHE.SPORT_PREFERENCE_MAX_AGE_SECONDS};SameSite=Lax`;
}

export function isValidSport(value: string | null): value is Sport {
  return value === "f1" || value === "motogp";
}
