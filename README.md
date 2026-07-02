# PitWall

A modern motorsport intelligence platform for Formula 1 and MotoGP that combines race weekends, live event tracking, strategy analysis, and driver intelligence into a single experience.

## Features

PitWall organises each Grand Prix weekend into a single hub that moves
from preview to live action to recap, with deterministic intelligence
engines layered on top.

### Hero Features

- **Formula 1** — season calendar, race weekend hubs, championship standings, and live timing.
- **MotoGP** — season calendar, race weekend hubs, championship standings, and race results.
- **Weekend Intelligence** — a deterministic, recent-form model that surfaces the leading contenders before lights out.
- **Live Event Feed** — a reusable, session-grouped feed of race-control and on-track events.
- **Weekend Story** — an editorial race-weekend briefing generated deterministically from weekend context.
- **Strategy Centre** — a predicted race shape, pit windows, tyre plan, weather read, and race factors.
- **Driver Intelligence** — per-competitor ratings, recent form, weekend trend, strengths, and weaknesses.

### Screenshots

Screenshots are not bundled in the repository yet. Drop the following
files into `docs/screenshots/` (or a location of your choice) and update
the links when they become available.

| Section | Path placeholder |
| --- | --- |
| Homepage | `docs/screenshots/homepage.png` |
| Weekend Hub | `docs/screenshots/weekend-hub.png` |
| Driver Intelligence | `docs/screenshots/driver-intelligence.png` |
| Strategy Centre | `docs/screenshots/strategy-centre.png` |

## Tech Stack

- [Next.js](https://nextjs.org) (`app` directory, server components)
- [React](https://react.dev)
- [TypeScript](https://www.typescriptlang.org)
- [Tailwind CSS](https://tailwindcss.com) `v4`
- [framer-motion](https://www.framer.com/motion) for editorial transitions
- [Supabase](https://supabase.com) (`@supabase/supabase-js`) for persistence
- [ESLint](https://eslint.org) via `eslint-config-next`
- Deploy target: [Vercel](https://vercel.com)

## Project Structure

```
src/
├── app/                 # Next.js routes (site, admin, api)
├── components/          # UI components
│   ├── weekend-hub/    #   Weekend Hub sections + engine panels
│   ├── weekend-summary/#   Post-race results & summaries
│   ├── home/           #   Homepage boards
│   ├── live/           #   Live timing & briefings
│   └── motogp/         #   MotoGP-specific UI
├── lib/                # Domain logic (framework-agnostic)
│   ├── weekend-hub/    #   Story, Strategy, Live Events
│   ├── intelligence/   #   Weekend Intelligence engine
│   ├── driver-intelligence/ # Driver Intelligence engine
│   ├── race-summary/   #   Race summary loading & mapping
│   ├── cache/          #   Cache TTLs
│   └── sport.ts        #   F1 / MotoGP routing
├── hooks/
└── middleware.ts        # Sport preference routing
supabase/migrations/     # Database migrations
data/{f1,motogp}/results/ # Local race summary overlays
```

## Getting Started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Run a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run assets:check` | Verify driver/rider portrait assets |

## Architecture

PitWall is built around five deterministic intelligence engines.
Each engine is isolated from the UI and exposes a small public API
from its `index.ts`.

### Engines

- **Weekend Intelligence** (`src/lib/intelligence/`) — scores the
  last three completed race weekends per competitor using a tunable
  weight table (victory, podium, top-5, pole, sprint, momentum),
  then normalises scores into a percentage list that always sums to
  `100`. Supports resilient summary loading — weekends with no local
  result JSON are skipped.
- **Live Event Feed** (`src/lib/weekend-hub/events/`) — a shared
  event model covering common race-control types plus MotoGP-only
  types (`rider_crash`, `long_lap_penalty`, `ride_through`,
  `track_limits`, `pit_exit`). The feed groups events by session,
  sorts newest-first, and ships a memoised mock store with a
  swap-in seam for future real-time APIs.
- **Story Engine** (`src/lib/weekend-hub/story/`) — produces a
  phase-aware editorial briefing (upcoming / live / completed /
  cancelled) from weekend context, sessions, and race summaries.
  No LLM is used — generation is deterministic and templated.
- **Strategy Engine** (`src/lib/weekend-hub/strategy/`) — predicts
  the most likely race shape, pit windows, tyre plan (F1 compounds
  or MotoGP front/rear + risk), weather, and race factors. The
  F1-only pit block is hidden gracefully for MotoGP.
- **Driver Intelligence** (`src/lib/driver-intelligence/`) —
  generates per-competitor ratings (momentum, qualifying, race
  pace, consistency, overtaking, tyre management), recent form,
  weekend trend, strengths, weaknesses, and a confidence label.

### Provider / Registry

The Story, Strategy, and Driver Intelligence engines share the same
provider pattern:

```
Provider ─┐
          ├─ Registry (memoised, deduped, SSR-safe)
Stub      ┘        ↓
                getXXX(context, providerId?)
```

Each engine ships a `MOCK_*_PROVIDER` (deterministic, in-process)
plus stub registrations (`OpenAI`, `Gemini`, `Claude`, `GLM`) that
throw until a live API is wired. The UI resolves through the
registry, so swapping providers requires no presentation-layer
changes. Requests are cached by `(provider, sport, slug, phase)`
and concurrent calls for the same key share the inflight promise,
so SSR and re-renders avoid duplicate computation.

## Roadmap

PitWall is actively developed. A dedicated `ROADMAP.md` is not yet
published; in the meantime, the following directions are scoped but
not promised:

- **Real-time data** — wire the Live Event Feed to a live race-control
  source.
- **LLM providers** — replace the Story and Strategy stub providers
  with live OpenAI / Gemini / Claude / GLM integrations.
- **Additional factors** — extend the Driver Intelligence engine with
  practice pace, circuit history, and tyre-stint telemetry.
- **More weekend tools** — quali recommender, two-stop simulator,
  head-to-head comparator.

## Contributing

Contributions are welcome. Please open an issue first to discuss
significant changes.

1. Fork the repository.
2. Create a feature branch (`git checkout -b feat/<name>`).
3. Keep TypeScript and ESLint clean:
   ```bash
   npm run lint
   npm run build
   ```
4. Open a pull request describing what changed and why.

## License

No license file is currently published. All rights are reserved by the
repository owner until a license is added.