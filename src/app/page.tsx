import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { Suspense } from "react";
import { Container, GlassCard, SectionHeading, StatusPill, Skeleton } from "@/components/ui";
import { fetchSeasonSchedule, getNextRace, getCurrentRace } from "@/lib/schedule";
import { fetchDriverStandings } from "@/lib/standings";
import {
  fetchMotoGpSchedule,
  fetchMotoGpStandings,
  getCurrentMotoGpEvent,
  getNextMotoGpEvent,
} from "@/lib/motogp";
import { countryCodeToFlag } from "@/lib/utils";
import { SessionCountdown } from "@/components/SessionCountdown";
import { PitWallHeroLogo } from "@/components/brand/PitWallHeroLogo";
import { HomePageGate } from "@/components/HomePageGate";
import { isValidSport, SPORT_COOKIE_KEY, type Sport } from "@/lib/sport";

// ─── Next Race Widget ─────────────────────────────────────────────────────────

async function NextRaceWidget() {
  try {
    const schedule = await fetchSeasonSchedule("current");
    const race = getCurrentRace(schedule) ?? getNextRace(schedule);

    if (!race) {
      return (
        <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
          <p className="text-sm text-slate-400">Season schedule loading…</p>
        </div>
      );
    }

    const flag = countryCodeToFlag(race.countryCode);
    const liveSession = race.sessions.find((s) => s.status === "live");
    const nextSession = race.sessions.find((s) => s.status === "upcoming");
    const countdownSession = liveSession ?? nextSession;

    return (
      <GlassCard className="relative overflow-hidden p-5 sm:p-7">
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-amber-300/0 via-amber-300 to-amber-300/0" />
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.26em] text-slate-400">
              {race.isCurrent ? "Race weekend" : "Next race"}
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              <span className="mr-2" aria-hidden="true">{flag}</span>
              {race.name}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {race.circuit} · Round {race.round}
            </p>
          </div>
          {liveSession ? (
            <StatusPill tone="red">
              <span className="mr-1.5 inline-block size-1.5 animate-pulse rounded-full bg-red-400" />
              {liveSession.label} live
            </StatusPill>
          ) : (
            <StatusPill tone="green">Upcoming</StatusPill>
          )}
        </div>

        {countdownSession && countdownSession.dateUtc && (
          <div className="mt-6">
            <SessionCountdown
              targetDate={countdownSession.dateUtc}
              sessionLabel={countdownSession.label}
              variant="full"
            />
          </div>
        )}

        {/* Session list preview */}
        <div className="mt-6 space-y-2" role="list" aria-label="Upcoming sessions">
          {race.sessions
            .filter((s) => s.status !== "completed")
            .slice(0, 4)
            .map((session) => (
              <div
                key={session.key}
                role="listitem"
                className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-slate-950/40 px-4 py-2.5"
              >
                <p className="text-sm text-slate-300">{session.label}</p>
                <div className="flex items-center gap-2">
                  {session.status === "live" && (
                    <StatusPill tone="red">Live</StatusPill>
                  )}
                  {session.status === "upcoming" && session.dateUtc && (
                    <SessionCountdown
                      targetDate={session.dateUtc}
                      sessionLabel={session.label}
                      variant="inline"
                    />
                  )}
                </div>
              </div>
            ))}
        </div>

        <div className="mt-5">
          <Link
            href={`/races/${race.slug}`}
            className="text-sm font-semibold text-amber-300 hover:text-amber-200 transition"
          >
            Full weekend schedule →
          </Link>
        </div>
      </GlassCard>
    );
  } catch {
    return (
      <GlassCard>
        <p className="text-sm text-slate-500">
          Schedule temporarily unavailable.
        </p>
      </GlassCard>
    );
  }
}

// ─── Championship Metrics ─────────────────────────────────────────────────────

async function ChampionshipMetrics() {
  try {
    const { drivers, round } = await fetchDriverStandings();
    const leader = drivers[0];
    const p2 = drivers[1];

    if (!leader) return null;

    const metrics = [
      {
        label: "Championship leader",
        value: `${leader.driverCode} · ${leader.lastName}`,
        sub: `${leader.points} pts`,
      },
      {
        label: "Gap to P2",
        value: p2 ? `−${p2.gapToLeader} pts` : "—",
        sub: p2 ? p2.lastName : "",
      },
      {
        label: "Round completed",
        value: String(round),
        sub: `${leader.constructorName}`,
      },
    ];

    return (
      <dl className="mt-12 grid gap-4 sm:grid-cols-3">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-3xl border border-white/10 bg-white/[0.05] p-5"
          >
            <dt className="text-sm text-slate-400">{m.label}</dt>
            <dd className="mt-2 text-lg font-semibold text-white leading-tight">
              {m.value}
            </dd>
            <dd className="mt-1 text-xs text-amber-200">{m.sub}</dd>
          </div>
        ))}
      </dl>
    );
  } catch {
    return null;
  }
}

// ─── Header ───────────────────────────────────────────────────────────────────

function NextRaceWidgetSkeleton() {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/30">
      <Skeleton className="h-4 w-24 mb-4" />
      <Skeleton className="h-8 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2 mb-6" />
      <Skeleton className="h-20 w-full mb-4" />
      <Skeleton className="h-10 w-full mb-2" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section id="top" className="relative isolate overflow-hidden pb-14 pt-12 sm:pb-16 sm:pt-16">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(251,191,36,0.22),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(14,165,233,0.18),transparent_30%),linear-gradient(135deg,#07090f_0%,#0f172a_48%,#050507_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-0 -z-10 h-[38rem] w-[38rem] -translate-x-1/2 rounded-full border border-white/10 bg-white/[0.03] blur-3xl"
      />
      <Container className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
        <div>
          <PitWallHeroLogo className="mb-4" />
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-slate-200">
            <span className="size-2 rounded-full bg-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.6)]" />
            Motorsport Weekend Hub · Formula 1
          </div>
          <h1 className="mt-5 max-w-5xl text-4xl font-semibold tracking-[-0.06em] text-white sm:text-6xl lg:text-7xl">
            Your command centre for every racing weekend.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
            Session schedules in your timezone. Live championship standings.
            Race strategy and timing intelligence — built for F1 fans who want
            more than the broadcast.
          </p>
          <div className="mt-9 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/races"
              className="rounded-full bg-amber-300 px-7 py-4 text-center text-base font-bold text-slate-950 shadow-xl shadow-amber-500/20 transition hover:bg-amber-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              View race schedule
            </Link>
            <Link
              href="/standings"
              className="rounded-full border border-white/15 px-7 py-4 text-center text-base font-semibold text-white transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            >
              Championship standings
            </Link>
          </div>

          {/* Live championship metrics */}
          <Suspense
            fallback={
              <dl className="mt-12 grid gap-4 sm:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 rounded-3xl" />
                ))}
              </dl>
            }
          >
            <ChampionshipMetrics />
          </Suspense>
        </div>

        {/* Live next-race widget */}
        <Suspense fallback={<NextRaceWidgetSkeleton />}>
          <NextRaceWidget />
        </Suspense>
      </Container>
    </section>
  );
}

// ─── Feature Grid ──────────────────────────────────────────────────────────────

function FeatureGrid({ sport }: { sport: Sport }) {
  const routes =
    sport === "motogp"
      ? {
          briefing: "/motogp/live",
          pulse: "/#strategy",
          championship: "/motogp/standings",
        }
      : {
          briefing: "/live",
          pulse: "/#strategy",
          championship: "/standings",
        };

  const companionCards = [
    {
      eyebrow: "RACE BRIEFING",
      title: "Know the story before the race.",
      description:
        "Follow live session updates, race control messages, and weekend progression as each session runs.",
      href: routes.briefing,
      cta: sport === "motogp" ? "Open weekend hub" : "Open live timing",
    },
    {
      eyebrow: "COMMUNITY PULSE",
      title: "See who fans are backing.",
      description:
        sport === "motogp"
          ? "Preview how community race-win favourites could look once predictions launch."
          : "Preview how community race-win favourites could look once predictions launch.",
      href: routes.pulse,
      cta: "View prediction preview",
    },
    {
      eyebrow: "CHAMPIONSHIP BATTLE",
      title: "Track the title fight.",
      description:
        sport === "motogp"
          ? "MotoGP, Moto2, and Moto3 standings updated after every round."
          : "Live drivers' and constructors' standings updated after every round.",
      href: routes.championship,
      cta: "View standings",
    },
  ];

  return (
    <section id="features" className="py-14 sm:py-20">
      <Container>
        <SectionHeading
          eyebrow="MOTORSPORT WEEKEND HUB"
          title="Everything you need before lights out."
          description="Schedules, live hubs, and championship standings — with more community features on the way."
        />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {companionCards.map((card) => (
            <Link key={card.title} href={card.href} className="group block">
              <GlassCard className="h-full transition hover:-translate-y-1 hover:bg-white/[0.08]">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-200">
                  {card.eyebrow}
                </p>
                <h3 className="mt-5 text-2xl font-semibold text-white group-hover:text-amber-100 transition">
                  {card.title}
                </h3>
                <p className="mt-4 leading-7 text-slate-300">
                  {card.description}
                </p>
                <p className="mt-5 text-sm font-semibold text-amber-300 group-hover:text-amber-200">
                  {card.cta} →
                </p>
              </GlassCard>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}

// ─── Strategy Section (preserved, honest) ─────────────────────────────────────

function StrategySection() {
  const predictions = [
    { name: "Hamilton", percentage: 32 },
    { name: "Verstappen", percentage: 24 },
    { name: "Antonelli", percentage: 18 },
    { name: "Piastri", percentage: 12 },
    { name: "Norris", percentage: 8 },
    { name: "Russell", percentage: 4 },
    { name: "Others", percentage: 2 },
  ];

  return (
    <section id="strategy" className="border-y border-white/10 bg-white/[0.03] py-14 sm:py-20">
      <Container className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <SectionHeading
          eyebrow="COMMUNITY PREDICTIONS"
          title="Community predictions are coming soon."
          description="Preview of how race-win favourites could look once the community feature launches."
        />
        <GlassCard>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            Preview · not live data
          </p>
          <div className="space-y-4">
            {predictions.map((pred) => (
              <div key={pred.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-200">{pred.name}</span>
                  <span className="font-bold text-amber-300">{pred.percentage}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-950/60 border border-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300"
                    style={{ width: `${pred.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </Container>
    </section>
  );
}

// ─── CTA ──────────────────────────────────────────────────────────────────────

function CTA() {
  return (
    <section className="pb-14 sm:pb-16">
      <Container>
        <div className="overflow-hidden rounded-[2.5rem] border border-amber-200/20 bg-amber-300 p-8 text-slate-950 shadow-2xl shadow-amber-500/20 sm:p-12 lg:p-16">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.3em]">
                Season {new Date().getFullYear()}
              </p>
              <h2 className="mt-4 max-w-3xl text-4xl font-black tracking-[-0.05em] sm:text-6xl">
                Bring PitWall Apex to your sofa.
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-800">
                Session schedules in your timezone. Live championship standings.
                Race control intelligence. Strategy explainers. Everything an
                F1 fan needs for every race weekend.
              </p>
            </div>
            <Link
              href="/races"
              className="rounded-full bg-slate-950 px-8 py-4 text-center text-base font-bold text-white transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-4 focus-visible:ring-offset-amber-300"
            >
              View race schedule
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}

// ─── MotoGP Home ──────────────────────────────────────────────────────────────

async function MotoGpNextRaceWidget() {
  try {
    const schedule = await fetchMotoGpSchedule();
    const event = getCurrentMotoGpEvent(schedule) ?? getNextMotoGpEvent(schedule);

    if (!event) {
      return (
        <GlassCard>
          <p className="text-sm text-slate-500">Season schedule loading…</p>
        </GlassCard>
      );
    }

    const flag = countryCodeToFlag(event.countryCode);
    const liveSession = event.sessions.find((session) => session.status === "live");
    const nextSession = event.sessions.find((session) => session.status === "upcoming");
    const countdownSession = liveSession ?? nextSession;

    return (
      <GlassCard className="relative overflow-hidden p-5 sm:p-7">
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-amber-300/0 via-amber-300 to-amber-300/0" />
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.26em] text-slate-400">
              {event.isCurrent ? "Race weekend" : "Next Grand Prix"}
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              <span className="mr-2" aria-hidden="true">{flag}</span>
              {event.name}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {event.circuit} · Round {event.round}
            </p>
          </div>
          {liveSession ? (
            <StatusPill tone="red">
              <span className="mr-1.5 inline-block size-1.5 animate-pulse rounded-full bg-red-400" />
              {liveSession.label} live
            </StatusPill>
          ) : (
            <StatusPill tone="green">Upcoming</StatusPill>
          )}
        </div>

        {countdownSession?.dateUtc && (
          <div className="mt-6">
            <SessionCountdown
              targetDate={countdownSession.dateUtc}
              sessionLabel={countdownSession.label}
              variant="full"
            />
          </div>
        )}

        <div className="mt-6 space-y-2" role="list" aria-label="Upcoming sessions">
          {event.sessions
            .filter((session) => session.status !== "completed")
            .slice(0, 4)
            .map((session) => (
              <div
                key={session.sessionId}
                role="listitem"
                className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-slate-950/40 px-4 py-2.5"
              >
                <p className="text-sm text-slate-300">{session.label}</p>
                <div className="flex items-center gap-2">
                  {session.status === "live" && <StatusPill tone="red">Live</StatusPill>}
                  {session.status === "upcoming" && session.dateUtc && (
                    <SessionCountdown
                      targetDate={session.dateUtc}
                      sessionLabel={session.label}
                      variant="inline"
                    />
                  )}
                </div>
              </div>
            ))}
        </div>

        <div className="mt-5">
          <Link
            href={`/motogp/races/${event.slug}`}
            className="text-sm font-semibold text-amber-300 hover:text-amber-200 transition"
          >
            Full weekend schedule →
          </Link>
        </div>
      </GlassCard>
    );
  } catch {
    return (
      <GlassCard>
        <p className="text-sm text-slate-500">Schedule temporarily unavailable.</p>
      </GlassCard>
    );
  }
}

async function MotoGpChampionshipMetrics() {
  try {
    const { riders, round } = await fetchMotoGpStandings("MotoGP™");
    const leader = riders[0];
    const p2 = riders[1];

    if (!leader) return null;

    const metrics = [
      {
        label: "Championship leader",
        value: `#${leader.riderNumber} · ${leader.riderName}`,
        sub: `${leader.points} pts`,
      },
      {
        label: "Gap to P2",
        value: p2 ? `−${p2.gapToLeader} pts` : "—",
        sub: p2 ? p2.riderName : "",
      },
      {
        label: "Round completed",
        value: String(round),
        sub: leader.teamName,
      },
    ];

    return (
      <dl className="mt-12 grid gap-4 sm:grid-cols-3">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-3xl border border-white/10 bg-white/[0.05] p-5"
          >
            <dt className="text-sm text-slate-400">{metric.label}</dt>
            <dd className="mt-2 text-lg font-semibold text-white leading-tight">
              {metric.value}
            </dd>
            <dd className="mt-1 text-xs text-amber-200">{metric.sub}</dd>
          </div>
        ))}
      </dl>
    );
  } catch {
    return null;
  }
}

function MotoGpHero() {
  return (
    <section id="top" className="relative isolate overflow-hidden pb-14 pt-12 sm:pb-16 sm:pt-16">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(251,191,36,0.22),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(14,165,233,0.18),transparent_30%),linear-gradient(135deg,#07090f_0%,#0f172a_48%,#050507_100%)]"
      />
      <Container className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
        <div>
          <PitWallHeroLogo className="mb-4" />
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-slate-200">
            <span className="size-2 rounded-full bg-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.6)]" />
            Motorsport Weekend Hub · MotoGP
          </div>
          <h1 className="mt-5 max-w-5xl text-4xl font-semibold tracking-[-0.06em] text-white sm:text-6xl lg:text-7xl">
            Your command centre for every MotoGP weekend.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
            Session schedules in your timezone. Championship standings across
            MotoGP, Moto2, and Moto3. Weekend intelligence built for fans who
            want more than the broadcast.
          </p>
          <div className="mt-9 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/motogp/races"
              className="rounded-full bg-amber-300 px-7 py-4 text-center text-base font-bold text-slate-950 shadow-xl shadow-amber-500/20 transition hover:bg-amber-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              View race calendar
            </Link>
            <Link
              href="/motogp/standings"
              className="rounded-full border border-white/15 px-7 py-4 text-center text-base font-semibold text-white transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            >
              Championship standings
            </Link>
          </div>
          <Suspense
            fallback={
              <dl className="mt-12 grid gap-4 sm:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 rounded-3xl" />
                ))}
              </dl>
            }
          >
            <MotoGpChampionshipMetrics />
          </Suspense>
        </div>
        <Suspense fallback={<NextRaceWidgetSkeleton />}>
          <MotoGpNextRaceWidget />
        </Suspense>
      </Container>
    </section>
  );
}

function MotoGpStrategySection() {
  const predictions = [
    { name: "Bagnaia", percentage: 34 },
    { name: "Márquez", percentage: 26 },
    { name: "Bezzecchi", percentage: 18 },
    { name: "Martin", percentage: 12 },
    { name: "Acosta", percentage: 6 },
    { name: "Di Giannantonio", percentage: 3 },
    { name: "Others", percentage: 1 },
  ];

  return (
    <section id="strategy" className="border-y border-white/10 bg-white/[0.03] py-14 sm:py-20">
      <Container className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <SectionHeading
          eyebrow="COMMUNITY PREDICTIONS"
          title="Community predictions are coming soon."
          description="Preview of how race-win favourites could look once the community feature launches."
        />
        <GlassCard>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            Preview · not live data
          </p>
          <div className="space-y-4">
            {predictions.map((pred) => (
              <div key={pred.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-200">{pred.name}</span>
                  <span className="font-bold text-amber-300">{pred.percentage}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full border border-white/5 bg-slate-950/60">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300"
                    style={{ width: `${pred.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </Container>
    </section>
  );
}

function MotoGpCTA() {
  return (
    <section className="pb-14 sm:pb-16">
      <Container>
        <div className="overflow-hidden rounded-[2.5rem] border border-amber-200/20 bg-amber-300 p-8 text-slate-950 shadow-2xl shadow-amber-500/20 sm:p-12 lg:p-16">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.3em]">
                Season {new Date().getFullYear()}
              </p>
              <h2 className="mt-4 max-w-3xl text-4xl font-black tracking-[-0.05em] sm:text-6xl">
                Bring PitWall Apex to race day.
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-800">
                Session schedules in your timezone. Championship standings across
                all classes. Weekend progression and results. Everything a
                MotoGP fan needs for every Grand Prix.
              </p>
            </div>
            <Link
              href="/motogp/races"
              className="rounded-full bg-slate-950 px-8 py-4 text-center text-base font-bold text-white transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-4 focus-visible:ring-offset-amber-300"
            >
              View race calendar
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}

function F1Home() {
  return (
    <>
      <Hero />
      <StrategySection />
      <FeatureGrid sport="f1" />
      <CTA />
    </>
  );
}

function MotoGpHome() {
  return (
    <>
      <MotoGpHero />
      <MotoGpStrategySection />
      <FeatureGrid sport="motogp" />
      <MotoGpCTA />
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const sportCookie = cookieStore.get(SPORT_COOKIE_KEY)?.value ?? null;
  const sport: Sport = isValidSport(sportCookie) ? sportCookie : "f1";

  if (sport === "motogp") {
    return {
      title: "MotoGP Weekend Hub",
      description:
        "MotoGP session schedules, weekend hubs, and championship standings from PitWall Apex.",
      openGraph: {
        title: "MotoGP Weekend Hub | PitWall Apex",
        description:
          "MotoGP session schedules, weekend hubs, and championship standings from PitWall Apex.",
        type: "website",
      },
    };
  }

  return {
    title: "Formula 1 Weekend Hub",
    description:
      "Live timing, session schedules, and F1 championship standings from PitWall Apex.",
    openGraph: {
      title: "Formula 1 Weekend Hub | PitWall Apex",
      description:
        "Live timing, session schedules, and F1 championship standings from PitWall Apex.",
    },
  };
}

export default async function Home() {
  const cookieStore = await cookies();
  const sportCookie = cookieStore.get(SPORT_COOKIE_KEY)?.value ?? null;
  const serverSport: Sport | null = isValidSport(sportCookie) ? sportCookie : null;

  return (
    <HomePageGate
      serverSport={serverSport}
      f1={<F1Home />}
      motogp={<MotoGpHome />}
    />
  );
}
