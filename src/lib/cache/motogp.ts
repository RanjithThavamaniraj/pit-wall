/** PulseLive MotoGP fetch and in-memory cache durations (seconds). */
export const MOTOGP_CACHE = {
  STANDINGS: 300,
  SCHEDULE: 3600,
  SCHEDULE_MEMORY_SEC: 300,
  HISTORY: 3600,
  PROFILES: 86400,
  SESSION_RESULTS: 300,
} as const;

export const MOTOGP_SCHEDULE_MEMORY_MS =
  MOTOGP_CACHE.SCHEDULE_MEMORY_SEC * 1000;
