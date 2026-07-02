# PitWall Architecture

PitWall is a modular motorsport intelligence platform supporting Formula 1 and MotoGP. It combines race weekend data, deterministic analysis engines, and editorial-grade presentation into a single experience. This document describes how the codebase is organised internally, for engineers and future contributors.

## High-Level Architecture

```
Homepage
   ↓
Weekend Hub
   ↓
Shared Intelligence Layer
   ↓
┌──────────────────────┬──────────────────────┬────────────────────────┬──────────────────────────┐
│  Weekend Intelligence│  Story Engine         │  Strategy Engine        │  Driver Intelligence     │
│  Engine               │                       │                         │  Engine                  │
└──────────────────────┴──────────────────────┴────────────────────────┴──────────────────────────┘
   ↓
Shared Race Data (Schedule, Summaries, Standings)
```

Each intelligence engine consumes the same shared race data, exposes a small public API, and is renderer-agnostic. The UI resolves engines through a registry and never knows which provider produced a given result.

## Project Structure

```
src/
├── app/                         # Next.js app-directory routes
│   ├── (site)/                  #   Public site (hero, races, standings, live, motogp)
│   ├── admin/                   #   Founder / admin dashboard
│   └── api/                     #   REST/edge endpoints (f1, motogp, schedule, standings, live)
├── components/                  # React components
│   ├── weekend-hub/             #   Weekend Hub sections + engine panels
│   ├── weekend-summary/         #   Post-race results & summaries
│   ├── home/                    #   Homepage hero & hub boards
│   ├── live/                    #   Live timing & briefings
│   ├── motogp/                  #   MotoGP-specific UI
│   ├── brand/                   #   Branding / portraits
│   ├── mobile/                  #   Mobile chrome
│   ├── admin/                   #   Admin UI
│   └── ui.tsx                   #   Shared primitives (GlassCard, StatusPill, Skeleton, ...)
├── lib/                         # Framework-agnostic domain logic
│   ├── weekend-hub/            #   Hub types, timeline, state
│   │   ├── events/             #     Live Event Engine
│   │   ├── story/              #     Story Engine
│   │   └── strategy/          #     Strategy Engine
│   ├── intelligence/           #   Weekend Intelligence Engine
│   ├── driver-intelligence/    #   Driver Intelligence Engine
│   ├── race-summary/           #   Race summary loading & mapping
│   ├── cache/                  #   Cache TTLs and invalidation windows
│   ├── sport.ts                #   F1 / MotoGP routing helpers
│   ├── schedule.ts             #   F1 season schedule fetcher
│   └── motogp.ts               #   MotoGP season schedule provider
├── hooks/
└── middleware.ts                # Sport preference routing

data/                           # Local race summary overlays
├── f1/results/                 #   Per-weekend F1 summary JSON
└── motogp/results/             #   Per-weekend MotoGP summary JSON

public/                         # Static assets (brand, images)
docs/                          # Existing architecture notes (analytics, cache)
supabase/migrations/           # Database migrations
```

### Responsibilities

- **`src/app`** — routing, server components, and edge/REST endpoints. Pages compose engines and components; they own no domain logic.
- **`src/components`** — presentational React. Reusable primitives live in `ui.tsx`; section components live under their feature folder. Components never fetch filesystem data directly.
- **`src/lib`** — pure domain logic. Engines, registries, selectors, loaders, and data shaping all live here, importable by both server and client code as appropriate.
- **`data/`** — local race summary overlays merged with API data by the summary loader. Lets the site ship editorial weekend reports even when an API is unavailable.
- **`public/`** — static brand and image assets served as-is.
- **`docs/`** — long-form architecture notes that complement this file.

## Core Engines

### Weekend Intelligence Engine

- **Purpose** — surface the leading contenders before lights out by scoring the last three completed race weekends per competitor.
- **Inputs** — a sport (`f1` | `motogp`) and the list of completed weekend slugs.
- **Outputs** — `WeekendIntelligence`: ordered `IntelligenceEntry[]` (name, team, rawScore, percentage) whose percentages sum to `100`.
- **Public API** — `getWeekendIntelligence(sport, completedWeekendSlugs)` from `src/lib/intelligence`. Loading is resilient: weekends with no local result JSON are skipped until the lookback count is reached or the slug list is exhausted.

### Story Engine

- **Purpose** — produce a deterministic, editorial race-weekend briefing from weekend context.
- **Inputs** — `StoryContext` (sport, slug, name, phase, sessions, optional summary and live events).
- **Outputs** — `WeekendStory` with phase-aware sections (upcoming / live / completed / cancelled).
- **Public API** — `getWeekendStory(context, providerId?)` from `src/lib/weekend-hub/story`. Generation is templated; no LLM is used.

### Strategy Engine

- **Purpose** — predict the most likely race shape, pit windows, tyre plan, weather, and race factors.
- **Inputs** — `StrategyContext` (sport, slug, name, phase, sessions, sprint flag).
- **Outputs** — `WeekendStrategy` with race strategy, optional F1 pit strategy, sport-aware tyre strategy, weather, race factors, and 3–5 watch-for items.
- **Public API** — `getWeekendStrategy(context, providerId?)` from `src/lib/weekend-hub/strategy`. The F1-only pit block is hidden gracefully for MotoGP.

### Driver Intelligence Engine

- **Purpose** — generate per-competitor ratings, recent form, weekend trend, strengths, weaknesses, and a confidence label.
- **Inputs** — `DriverIntelligenceContext` (sport, completed weekend slugs, optional driver name filter).
- **Outputs** — `DriverIntelligenceBundle` of `DriverIntelligenceProfile[]` sorted by momentum.
- **Public API** — `fetchDriverIntelligence(context)` (server-side resilient loader) plus `getDriverIntelligence(context, providerId?)` (registry-backed) from `src/lib/driver-intelligence`.

### Live Event Engine

- **Purpose** — a shared race-control and on-track event model, grouped by session, newest-first.
- **Inputs** — `LiveEventFeedInput` (sport, slug, phase, optional sessions).
- **Outputs** — `LiveEvent[]` carrying type, severity, session, sport, and optional metadata. Common types are shared by both sports; MotoGP-only types (`rider_crash`, `long_lap_penalty`, `ride_through`, `track_limits`, `pit_exit`) are Discriminated.
- **Public API** — `getLiveEvents(input)` from `src/lib/weekend-hub/events`. Ships a memoised mock store with a swap-in seam for a future live race-control source.

## Shared Patterns

- **Provider pattern** — each engine declares a `*Provider` interface and a deterministic `MOCK_*_PROVIDER`, plus stub registrations (`OpenAI`, `Gemini`, `Claude`, `GLM`) that throw until a live API is wired. Lets providers be swapped without touching the UI.
- **Registry pattern** — `get*` resolvers look up the active provider by id, defaulting to the mock. Registries are the single seam between providers and components.
- **Selectors** — pure helpers over an already-built bundle (`getProfileByName`, `getTopProfile`, `rankWatchFor`, `rainProbabilityPercent`, etc.). Selectable from the UI without recomputation.
- **Generators** — deterministic, hash-seeded builders that turn summary data into a populated output shape. No network, no randomness.
- **Mock providers** — ship in the codebase so the site renders end-to-end without external services and so future providers have a reference shape.
- **SSR-safe memoisation** — registries cache by `(provider, sport, slug, phase)` and share inflight promises across concurrent calls. Server components reuse the cache across rerenders; client components consume pre-resolved bundles to avoid duplicate fetching.
- **Caching** — long-lived API caches (schedule, standings) live under `src/lib/cache`; engine caches are in-process and cleared via `clear*Cache` helpers.
- **Deterministic scoring** — Weekend Intelligence and Driver Intelligence both use tunable weight tables and run purely from race summaries, so identical inputs always produce identical outputs.
- **Reusable React components** — `GlassCard`, `StatusPill`, `Skeleton`, and feature cards (`StoryCard`, `StrategyCard`, `DriverProfileCard`) are shared across engines and pages.

## Weekend Hub

`WeekendHub` composes the full weekend experience in a single server component, in this rendering order:

1. **Weekend Status** — phase pill, focus session, countdown
2. **Weekend Timeline** — stage strip
3. **Current / Next Session** card
4. **Weekend Schedule** — local-time session list
5. **Live Event Feed** — session-grouped events
6. **Weekend Story** — editorial briefing cards
7. **Strategy Centre** — overview, tyres, pit, weather, factors, watch-for
8. **Driver Intelligence** — driver profile grid sorted by momentum
9. **Archive Sections** — Predictions, Results, Weekend Summary

Each section is a self-contained component; `WeekendHub` passes only the already-resolved data each one needs. Spacing and the cinematic dark design language are owned by the parent `Container`.

## Data Flow

```
Race Data
   ↓
Summary Loader (loadRaceWeekendSummary)
   ↓
Engine (Generator)
   ↓
Selector
   ↓
Registry (memoised)
   ↓
Server Component
   ↓
Page
```

Concretely:

- `fetchSeasonSchedule` / `fetchMotoGpSchedule` produce completed weekend slugs.
- The summary loader merges API results with local `data/<sport>/results/<slug>.json` overlays.
- Engines turn summaries into bundles via their generator.
- Selectors shape bundles for the UI (ranking, percentages, top-N, etc.).
- Registries memoise by context key and share inflight promises.
- Server components resolve bundles and pass plain serialisable data into presentational client components.

## Server vs Client

- **Server Components** own data fetching. `WeekendHub`, the homepage, and race pages are async server components that resolve engines and pass the resulting JSON-serialisable bundles down. This keeps `fs/promises`, external API clients, and heavy computation off the client bundle.
- **Client Components** own interaction only. Components that need interactivity (live polling, regenerate buttons, countdowns) are marked `"use client"` and consume already-resolved props.
- **SSR** — pages prerender at build or request time. Time-based surfaces (`generatedAt`, countdowns) use `suppressHydrationWarning` where stamps would otherwise mismatch.
- **Memoisation** — engine registries dedupe concurrent requests and cache resolved bundles for the lifetime of the process. Repeat server renders reuse the cache; explicit `regenerate*`/`clear*Cache` helpers invalidate it.
- **Why server-side** — heavy deterministic scoring, filesystem reads, and schedule fetches happen server-side so the client JS budget stays small and initial paint stays fast.

## Design Principles

- **Single responsibility** — engines score, registries cache, components present.
- **Reusable engines** — every intelligence engine is shared by the homepage and Weekend Hub via the same public API.
- **Deterministic logic** — identical inputs produce identical outputs; no hidden randomness in production paths.
- **Shared UI components** — `GlassCard`, `StatusPill`, `Skeleton`, and feature cards are reused across engines.
- **Formula 1 and MotoGP parity** — sport-aware types and helpers keep both sports on a shared platform without leaking sport-specific shape into components.
- **Performance first** — SSR, memoisation, and resilient loading keep the experience fast and stable even with partial local data.
- **Maintainability** — pure domain logic in `src/lib` is decoupled from React, so engines can be tested and evolved without rendering.
- **Scalability** — new engines, providers, and factors slot into the existing registry pattern without restructuring.

## Future Architecture

The current architecture is intentionally shaped to absorb additional engines without restructuring:

- **Team Intelligence** — a new `src/lib/team-intelligence/` engine can reuse the same provider/registry pattern and consume the same weekend summaries.
- **Circuit Intelligence** — a circuit-scoring engine can plug in as another provider behind the same shared intelligence layer.
- **Live Race Centre** — a live provider behind the existing registry seam can replace the mock live store without touching Live Event Feed components.
- **Shared Intelligence Context** — a single `WeekendContext` object can be threaded through Story, Strategy, and Driver engines to eliminate conflicting insights and unify the briefing.
- **Personalisation** — user preferences and notifications can be layered in above the engines without changing their public APIs.

Each addition slots behind the existing registry seam, so presentation components and pages remain stable.