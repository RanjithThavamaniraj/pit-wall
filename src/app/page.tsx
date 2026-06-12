import Link from "next/link";
import { Suspense } from "react";
import { Container, GlassCard, SectionHeading, StatusPill, Skeleton } from "@/components/ui";
import { features } from "@/lib/data";
import { fetchSeasonSchedule, getNextRace, getCurrentRace } from "@/lib/schedule";
import { fetchDriverStandings } from "@/lib/standings";
import { countryCodeToFlag, formatShortDate } from "@/lib/utils";
import { SessionCountdown } from "@/components/SessionCountdown";

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
    const raceSession = race.sessions.find((s) => s.key === "race");

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
    <section id="top" className="relative isolate overflow-hidden pb-20 pt-16 sm:pb-28 sm:pt-24">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(251,191,36,0.22),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(14,165,233,0.18),transparent_30%),linear-gradient(135deg,#07090f_0%,#0f172a_48%,#050507_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-0 -z-10 h-[38rem] w-[38rem] -translate-x-1/2 rounded-full border border-white/10 bg-white/[0.03] blur-3xl"
      />
      <Container className="grid items-center gap-12 lg:grid-cols-[1fr_0.86fr]">
        <div>
          {/* Honest badge — no fake "Live" claim */}
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-slate-200">
            <span className="size-2 rounded-full bg-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.6)]" />
            Your F1 race weekend companion
          </div>
          <h1 className="mt-8 max-w-5xl text-4xl font-semibold tracking-[-0.06em] text-white sm:text-6xl lg:text-7xl">
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

function FeatureGrid() {
  return (
    <section id="features" className="py-20 sm:py-28">
      <Container>
        <SectionHeading
          eyebrow="Built for the decisive lap"
          title="Everything a race strategist sees, redesigned for fans."
          description="Pit Wall gives context to every call: what changed, why it matters, and how it reshapes the race before the broadcast catches up."
        />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {features.map((feature) => (
            <GlassCard
              key={feature.title}
              className="transition hover:-translate-y-1 hover:bg-white/[0.08]"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-200">
                {feature.eyebrow}
              </p>
              <h3 className="mt-5 text-2xl font-semibold text-white">
                {feature.title}
              </h3>
              <p className="mt-4 leading-7 text-slate-300">
                {feature.description}
              </p>
            </GlassCard>
          ))}
        </div>
      </Container>
    </section>
  );
}

// ─── Strategy Section (preserved, honest) ─────────────────────────────────────

function StrategySection() {
  const stints = [
    { compound: "Medium", laps: "Optimal first stint", status: "Modelled" },
    { compound: "Hard", laps: "Long run capability", status: "Modelled" },
    { compound: "Soft", laps: "Qualifying / attack", status: "Modelled" },
  ];

  return (
    <section id="strategy" className="border-y border-white/10 bg-white/[0.03] py-20 sm:py-28">
      <Container className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <SectionHeading
          eyebrow="Strategy layer — coming soon"
          title="Know the next move before the radio message."
          description="Live tyre degradation models, undercut windows, and safety car probability — combined into confident, readable race strategy intelligence. Launching with live timing."
        />
        <GlassCard>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-2xl font-semibold text-white">
                Tyre strategy model
              </h3>
              <p className="mt-2 text-slate-400">Optimal plan per stint.</p>
            </div>
            <StatusPill tone="amber">In development</StatusPill>
          </div>
          <div className="mt-8 grid gap-4">
            {stints.map((stint) => (
              <div
                key={stint.compound}
                className="rounded-3xl border border-white/10 bg-slate-950/60 p-5"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-white">
                      {stint.compound}
                    </p>
                    <p className="text-sm text-slate-400">{stint.laps}</p>
                  </div>
                  <StatusPill tone="neutral">{stint.status}</StatusPill>
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
    <section className="pb-20 sm:pb-28">
      <Container>
        <div className="overflow-hidden rounded-[2.5rem] border border-amber-200/20 bg-amber-300 p-8 text-slate-950 shadow-2xl shadow-amber-500/20 sm:p-12 lg:p-16">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.3em]">
                Season {new Date().getFullYear()}
              </p>
              <h2 className="mt-4 max-w-3xl text-4xl font-black tracking-[-0.05em] sm:text-6xl">
                Bring the pit wall to your sofa.
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <>
      <Hero />
      <FeatureGrid />
      <StrategySection />
      <CTA />
    </>
  );
}
