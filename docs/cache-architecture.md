# PitWall cache architecture

All cache durations live under `src/lib/cache/`. Values are grouped by domain. **Page-level** `export const revalidate` in App Router routes must remain numeric literals (Next.js build requirement); those literals are annotated with `// Keep in sync with …` comments pointing at the matching constant.

## Module layout

```
src/lib/cache/
  index.ts      — re-exports all modules
  motogp.ts     — PulseLive MotoGP fetch + in-memory TTLs
  f1.ts         — Jolpica F1 fetch + CDN header TTLs
  live.ts       — OpenF1 live data, CDN headers, client polling
  analytics.ts  — client heartbeat intervals
  admin.ts      — cookie max-age durations
```

---

## MotoGP (`MOTOGP_CACHE`)

| Constant | TTL | Controls | Used by |
|----------|-----|----------|---------|
| `STANDINGS` | 300s (5 min) | PulseLive championship standings fetch | `fetchMotoGpStandings()` in `src/lib/motogp.ts` |
| `SCHEDULE` | 3600s (1 h) | Events, per-event sessions, default `motogpFetch` | `fetchMotoGpSchedule()`, `fetchEventSessions()`, `motogpFetch()` default |
| `SCHEDULE_MEMORY_SEC` | 300s (5 min) | In-process schedule cache before re-fetching PulseLive | `fetchMotoGpSchedule()` memory guard |
| `HISTORY` | 3600s (1 h) | Session classification (top-3 podium history) | `fetchSessionClassification()` |
| `PROFILES` | 86400s (24 h) | Seasons list, category metadata (changes rarely) | `getCurrentSeasonId()`, `getSeasonCategories()` |
| `SESSION_RESULTS` | 300s (5 min) | Full session classification for live/results views | `fetchSessionResults()` |

**Derived:** `MOTOGP_SCHEDULE_MEMORY_MS` = `SCHEDULE_MEMORY_SEC × 1000`.

**Page ISR (literals, sync comments):**

| Page | Literal | Sync constant |
|------|---------|---------------|
| `/motogp/standings` | `300` | `MOTOGP_CACHE.STANDINGS` |
| `/motogp/live` | `300` | `MOTOGP_CACHE.SESSION_RESULTS` |
| `/motogp/races`, `/motogp/races/[slug]` | `3600` | `MOTOGP_CACHE.SCHEDULE` |

**Why these TTLs:** Standings and live session results change after each session; 5 minutes balances freshness vs API load. Schedule and history are stable within a race weekend. Season/category metadata is effectively static for the year.

---

## F1 (`F1_CACHE`)

| Constant | TTL | Controls | Used by |
|----------|-----|----------|---------|
| `SCHEDULE` | 3600s (1 h) | Jolpica season schedule fetch | `fetchSeasonSchedule()` in `src/lib/schedule.ts` |
| `STANDINGS` | 1800s (30 min) | Driver and constructor standings fetch | `fetchDriverStandings()`, `fetchConstructorStandings()` in `src/lib/standings.ts` |
| `EQUIVALENT_RACE` | 3600s (1 h) | Cross-sport slug resolution upstream data | `/api/equivalent-race` route segment config |
| `SCHEDULE_S_MAXAGE` | 3600s | CDN cache for `/api/schedule` JSON | `Cache-Control` on `/api/schedule` |
| `SCHEDULE_STALE_WHILE_REVALIDATE` | 7200s | SWR window for schedule API | `/api/schedule` |
| `STANDINGS_S_MAXAGE` | 1800s | CDN cache for `/api/standings` JSON | `/api/standings` |
| `STANDINGS_STALE_WHILE_REVALIDATE` | 3600s | SWR window for standings API | `/api/standings` |
| `EQUIVALENT_RACE_S_MAXAGE` | 3600s | CDN cache for equivalent-race API | `/api/equivalent-race` |
| `EQUIVALENT_RACE_STALE_WHILE_REVALIDATE` | 7200s | SWR window for equivalent-race API | `/api/equivalent-race` |

**Page ISR (literals):**

| Page | Literal | Sync constant |
|------|---------|---------------|
| `/standings` | `1800` | `F1_CACHE.STANDINGS` |
| `/races`, `/races/[slug]`, `/live` | `3600` | `F1_CACHE.SCHEDULE` |

**API route segment `revalidate` (literals):** `/api/standings` → `1800`, `/api/schedule` → `3600`, `/api/equivalent-race` → `3600`.

**Why:** F1 standings only change after race weekends; 30 minutes is sufficient. Schedule and race pages are hour-cached because session times are fixed once published. CDN `s-maxage` mirrors upstream fetch TTL; `stale-while-revalidate` allows edge to serve stale JSON while refreshing in the background.

---

## Live (`LIVE_CACHE`)

### OpenF1 upstream fetch (`next.revalidate`, seconds)

| Constant | TTL | Controls |
|----------|-----|----------|
| `OPENF1_SESSION` | 10s | Latest session metadata |
| `OPENF1_DRIVERS` | 3600s | Driver roster for session |
| `OPENF1_WEATHER` | 30s | Track/air temperature |
| `OPENF1_RACE_CONTROL` | 10s | Flag and session-status messages |
| `OPENF1_LAPS` | 3600s | Lap table for practice/quali results |
| `OPENF1_POSITION` | 2s | Live positions during race |
| `OPENF1_INTERVALS` | 2s | Live gaps during race |
| `OPENF1_BRIEFINGS` | 5s | Race-control feed for briefing cards |

Used by `/api/live/timing` and `/api/live/briefings`.

### CDN response headers (seconds)

| Constant | TTL | When |
|----------|-----|------|
| `TIMING_UPCOMING_S_MAXAGE` | 10s | No active OpenF1 session |
| `TIMING_LIVE_S_MAXAGE` | 2s | Weekend state is `LIVE` |
| `TIMING_COMPLETED_S_MAXAGE` | 60s | Between sessions or completed |
| `TIMING_DEFAULT_S_MAXAGE` | 10s | Fallback timing response |
| `TIMING_STALE_WHILE_REVALIDATE` | 10s | All timing JSON responses |
| `BRIEFINGS_S_MAXAGE` | 5s | Briefings API |
| `BRIEFINGS_STALE_WHILE_REVALIDATE` | 10s | Briefings API |
| `SPORT_STATUS_S_MAXAGE` | 30s | `/api/sport-status` (tab-bar live indicator) |

### Client polling (milliseconds)

| Constant | Interval | Component |
|----------|----------|-----------|
| `F1_TIMING_LIVE_POLL_MS` | 3000 | `LiveTimingClient` when session is live |
| `F1_TIMING_IDLE_POLL_MS` | 15000 | `LiveTimingClient` otherwise / on error |
| `F1_BRIEFINGS_POLL_MS` | 10000 | `BriefingFeed` |
| `MOTOGP_LIVE_POLL_MS` | 30000 | `MotoGpLiveClient` when live |
| `MOTOGP_IDLE_POLL_MS` | 60000 | `MotoGpLiveClient` otherwise |
| `SPORT_STATUS_POLL_MS` | 60000 | `BottomTabBar` live-dot poll |

**Why:** Live race data needs sub-10s upstream refresh; driver roster and laps are stable within a session. Client polls are slightly slower than CDN TTL to avoid hammering APIs while keeping the UI responsive.

`/api/motogp/weekend` uses `Cache-Control: no-store` (not centralized — intentionally uncached).

---

## Analytics (`ANALYTICS_CACHE`)

| Constant | TTL | Controls | Used by |
|----------|-----|----------|---------|
| `HEARTBEAT_MS` | 30000ms | Interval between analytics heartbeats | `AnalyticsBeacon` |
| `HEARTBEAT_FLUSH_TOLERANCE_MS` | 500ms | Early-flush window before interval fires | `AnalyticsBeacon` |

**Why:** 30s heartbeats give reasonable engagement granularity without excessive `/api/analytics/heartbeat` traffic.

---

## Admin & cookies (`ADMIN_CACHE`)

| Constant | TTL | Controls | Used by |
|----------|-----|----------|---------|
| `ADMIN_SESSION_MAX_AGE_SECONDS` | 43200s (12 h) | Signed admin session cookie + token expiry | `/api/admin/login`, `createAdminSessionToken()` |
| `VISITOR_MAX_AGE_SECONDS` | 31536000s (1 y) | Persistent visitor ID cookie | `middleware.ts` analytics cookies |
| `SESSION_MAX_AGE_SECONDS` | 1800s (30 min) | Analytics session cookie (idle window) | `middleware.ts` |
| `SPORT_PREFERENCE_MAX_AGE_SECONDS` | 31536000s (1 y) | F1/MotoGP sport preference cookie | `setSportCookie()` in `src/lib/sport.ts` |

Cookie **names** remain in `src/lib/admin/constants.ts` (not TTLs).

---

## Import conventions

```ts
import { MOTOGP_CACHE } from "@/lib/cache/motogp";
import { F1_CACHE } from "@/lib/cache/f1";
import { LIVE_CACHE } from "@/lib/cache/live";
import { ANALYTICS_CACHE } from "@/lib/cache/analytics";
import { ADMIN_CACHE } from "@/lib/cache/admin";

// or barrel:
import { MOTOGP_CACHE, F1_CACHE } from "@/lib/cache";
```

**Do not** use cache constants for `export const revalidate` in pages or route handlers — use a numeric literal plus a sync comment.
