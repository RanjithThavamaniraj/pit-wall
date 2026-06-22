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

export function getEquivalentRoute(pathname: string, targetSport: Sport): string {
  const currentSport = sportFromPathname(pathname);
  if (currentSport === targetSport) return pathname;

  if (pathname.startsWith("/races/")) {
    return targetSport === "motogp"
      ? pathname.replace("/races/", "/motogp/races/")
      : pathname;
  }

  if (pathname.startsWith("/motogp/races/")) {
    return targetSport === "f1"
      ? pathname.replace("/motogp/races/", "/races/")
      : pathname;
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
  document.cookie = `${SPORT_COOKIE_KEY}=${sport};path=/;max-age=31536000;SameSite=Lax`;
}

export function isValidSport(value: string | null): value is Sport {
  return value === "f1" || value === "motogp";
}
