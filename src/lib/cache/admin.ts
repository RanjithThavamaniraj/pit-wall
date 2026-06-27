/** Admin session and analytics cookie max-age durations (seconds). */
export const ADMIN_CACHE = {
  ADMIN_SESSION_MAX_AGE_SECONDS: 60 * 60 * 12,
  VISITOR_MAX_AGE_SECONDS: 60 * 60 * 24 * 365,
  SESSION_MAX_AGE_SECONDS: 60 * 30,
  SPORT_PREFERENCE_MAX_AGE_SECONDS: 60 * 60 * 24 * 365,
} as const;
