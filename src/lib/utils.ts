// ─── Date & Time ─────────────────────────────────────────────────────────────

/**
 * Format a UTC ISO string to the user's local timezone using the browser's
 * Intl API. Falls back to UTC on server renders.
 */
export function formatLocalTime(
  isoString: string,
  options: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  }
): string {
  if (!isoString) return "TBC";
  try {
    return new Intl.DateTimeFormat("en-US", options).format(
      new Date(isoString)
    );
  } catch {
    return isoString;
  }
}

/**
 * Format just the time portion in the user's local timezone.
 */
export function formatLocalTimeOnly(isoString: string): string {
  if (!isoString) return "TBC";
  try {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}

/** Compact countdown segments for dial / inline timers, e.g. ["11d", "14h", "12m"]. */
export function formatCountdownCompact(
  days: number,
  hours: number,
  minutes: number,
  seconds: number
): string[] {
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0 || days > 0) parts.push(`${hours}h`);
  parts.push(`${String(minutes).padStart(2, "0")}m`);
  if (days === 0 && hours < 8) {
    parts.push(`${String(seconds).padStart(2, "0")}s`);
  }
  return parts;
}

/** Compact clock label for dial pills, e.g. "5:00 PM". */
export function formatCompactTime(isoString: string): string {
  if (!isoString) return "TBC";
  try {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}

/**
 * Format a short date: "Sat 24 May"
 */
export function formatShortDate(isoString: string): string {
  if (!isoString) return "TBC";
  try {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}

/**
 * Format a race weekend date range: "23–25 May 2025"
 */
export function formatDateRange(startIso: string, endIso: string): string {
  if (!startIso || !endIso) return "TBC";
  try {
    const start = new Date(startIso);
    const end = new Date(endIso);
    const dayStart = start.getDate();
    const dayEnd = end.getDate();
    const month = new Intl.DateTimeFormat("en-US", { month: "short" }).format(
      end
    );
    const year = end.getFullYear();
    return `${dayStart}–${dayEnd} ${month} ${year}`;
  } catch {
    return startIso;
  }
}

// ─── Slugs ────────────────────────────────────────────────────────────────────

/**
 * Generate a URL-safe slug from a race name and round number.
 * e.g. "Monaco Grand Prix", round 8, year 2025 → "monaco-grand-prix-r8"
 */
export function generateRaceSlug(raceName: string, round: number): string {
  return (
    raceName
      .toLowerCase()
      .replace(/grand prix/gi, "gp")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-") + `-r${round}`
  );
}

/** Extract round number from a race slug suffix, e.g. `british-gp-r12` → 12. */
export function parseRoundFromSlug(slug: string): number | null {
  const match = slug.match(/-r(\d+)$/);
  if (!match) return null;
  const round = Number(match[1]);
  return Number.isFinite(round) && round > 0 ? round : null;
}

// ─── Session Status ───────────────────────────────────────────────────────────

export type SessionStatus = "upcoming" | "live" | "completed";

/**
 * Determine session status based on its UTC start time.
 * Session durations by type (approximate):
 *   race: 120 min, qualifying: 60 min, sprint: 45 min,
 *   sprint_qualifying: 45 min, fp1/fp2/fp3: 60 min
 */
const SESSION_DURATION_MINUTES: Record<string, number> = {
  race: 120,
  qualifying: 60,
  sprint: 45,
  sprint_qualifying: 45,
  fp1: 60,
  fp2: 60,
  fp3: 60,
  // MotoGP
  fp: 45,
  pr: 30,
  q1: 15,
  q2: 15,
  wup: 20,
  motogp_race: 45,
  motogp_sprint: 30,
};

export function getSessionStatus(
  sessionKey: string,
  dateUtc: string,
  now: number = Date.now()
): SessionStatus {
  if (!dateUtc) return "upcoming";
  const start = new Date(dateUtc).getTime();
  const durationMs =
    (SESSION_DURATION_MINUTES[sessionKey.toLowerCase()] ?? 60) * 60 * 1000;
  const end = start + durationMs;

  if (now < start) return "upcoming";
  if (now >= start && now <= end) return "live";
  return "completed";
}

/**
 * Given an array of session date strings, return the next upcoming one.
 */
export function getNextSessionDate(dates: string[]): string | null {
  const now = Date.now();
  const upcoming = dates
    .filter((d) => d && new Date(d).getTime() > now)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  return upcoming[0] ?? null;
}

// ─── Country Flags ────────────────────────────────────────────────────────────

/**
 * Convert a two-letter ISO 3166-1 alpha-2 country code to a flag emoji.
 * Works in all modern browsers and systems.
 */
export function countryCodeToFlag(code: string): string {
  if (!code || code.length !== 2) return "🏁";
  return [...code.toUpperCase()]
    .map((c) => String.fromCodePoint(c.charCodeAt(0) + 127397))
    .join("");
}

// ─── Numbers ──────────────────────────────────────────────────────────────────

/**
 * Format a points gap as "+N" or "Leader"
 */
export function formatGap(gap: number): string {
  if (gap === 0) return "Leader";
  return `−${gap.toFixed(0)} pts`;
}

/**
 * Format a race finish position: 1 → "1st", 2 → "2nd", etc.
 */
export function formatOrdinal(n: number): string {
  const suffixes = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
}
