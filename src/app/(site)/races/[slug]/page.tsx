import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { fetchSeasonSchedule, fetchRaceBySlug } from "@/lib/schedule";
import { countryCodeToFlag, formatLocalTime, formatLocalTimeOnly } from "@/lib/utils";
import { SessionCountdown } from "@/components/SessionCountdown";
import { Container, GlassCard, StatusPill } from "@/components/ui";

// ─── Static params — pre-generate all 24 race pages at build time ─────────────

export async function generateStaticParams() {
  try {
    const schedule = await fetchSeasonSchedule("current");
    return schedule.races.map((race) => ({ slug: race.slug }));
  } catch {
    return [];
  }
}

export const revalidate = 300; // Keep in sync with F1_CACHE.STANDINGS (live race flags; schedule fetch stays 3600s)

// ─── Dynamic metadata ─────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const race = await fetchRaceBySlug(slug);
  if (!race) return { title: "Race not found" };
  const description = `${race.name} session schedule, times, and details. ${race.circuit}, ${race.locality}.`;
  return {
    title: race.name,
    description,
    openGraph: {
      title: race.name,
      description,
      type: "website",
    },
  };
}

// ─── Session status tone mapping ──────────────────────────────────────────────

function sessionTone(status: "upcoming" | "live" | "completed") {
  if (status === "live") return "red" as const;
  if (status === "completed") return "neutral" as const;
  return "green" as const;
}

function sessionStatusLabel(status: "upcoming" | "live" | "completed") {
  if (status === "live") return "Live";
  if (status === "completed") return "Done";
  return "Upcoming";
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function RaceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const race = await fetchRaceBySlug(slug);

  if (!race) notFound();

  const flag = countryCodeToFlag(race.countryCode);
  const nextSession = race.sessions.find((s) => s.status === "upcoming");
  const liveSession = race.sessions.find((s) => s.status === "live");
  const countdownSession = liveSession ?? nextSession;
  const isSprintWeekend = race.sessions.some(
    (s) => s.key === "sprint_qualifying" || s.key === "sprint"
  );
  const showLiveLink = race.isCurrent || Boolean(liveSession);

  return (
    <>
      {/* ─── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden pt-10 pb-8 sm:pt-12 sm:pb-10">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(251,191,36,0.10),transparent_55%)]"
        />
        <Container>
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-2 text-xs text-slate-500">
              <li>
                <Link href="/races" className="hover:text-slate-300 transition">
                  Schedule
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-slate-400">{race.shortName}</li>
            </ol>
          </nav>

          <div className="flex items-start gap-5">
            <span className="text-5xl sm:text-6xl" aria-hidden="true">
              {flag}
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
                Round {race.round} · {race.season}
                {isSprintWeekend ? " · Sprint weekend" : ""}
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
                {race.name}
              </h1>
              <p className="mt-2 text-base text-slate-400">
                {race.circuit} · {race.locality}, {race.country}
              </p>
            </div>
          </div>

          {/* Status pill */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {race.isPast ? (
              <StatusPill tone="neutral">Race completed</StatusPill>
            ) : liveSession ? (
              <StatusPill tone="red">
                <span className="mr-1.5 inline-block size-1.5 animate-pulse rounded-full bg-red-400" />
                {liveSession.label} is live
              </StatusPill>
            ) : (
              <StatusPill tone="green">Upcoming</StatusPill>
            )}
            {showLiveLink && (
              <Link
                href="/live"
                className="text-sm font-semibold text-amber-300 hover:text-amber-200 transition"
              >
                Go to live timing →
              </Link>
            )}
          </div>
        </Container>
      </section>

      {/* ─── Countdown + sessions ──────────────────────────────────────── */}
      <section className="pb-12" aria-labelledby="sessions-heading">
        <Container wide className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:items-start">
          {/* Session list */}
          <GlassCard className="p-0 overflow-hidden">
            <div className="border-b border-white/10 px-6 py-4">
              <h2
                id="sessions-heading"
                className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400"
              >
                Session schedule
              </h2>
              <p className="mt-0.5 text-xs text-slate-600">
                Times shown in your local timezone
              </p>
            </div>
            <ul role="list" className="divide-y divide-white/[0.06]">
              {race.sessions.map((session) => (
                <li
                  key={session.key}
                  id={`session-${session.key}`}
                  className={`scroll-mt-28 flex items-center justify-between gap-4 px-6 py-4 ${
                    session.status === "live"
                      ? "bg-red-400/[0.06]"
                      : session.status === "completed"
                      ? "opacity-50"
                      : ""
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5">
                      <StatusPill tone={sessionTone(session.status)}>
                        {sessionStatusLabel(session.status)}
                      </StatusPill>
                      <p className="text-sm font-semibold text-white">
                        {session.label}
                      </p>
                    </div>
                    {session.dateUtc ? (
                      <p
                        className="mt-1.5 text-xs text-slate-500"
                        suppressHydrationWarning
                      >
                        {formatLocalTime(session.dateUtc)}
                      </p>
                    ) : (
                      <p className="mt-1.5 text-xs text-slate-600">
                        Date TBC
                      </p>
                    )}
                  </div>
                  {session.status === "upcoming" && session.dateUtc && (
                    <SessionCountdown
                      targetDate={session.dateUtc}
                      sessionLabel={session.label}
                      variant="inline"
                    />
                  )}
                </li>
              ))}
            </ul>
          </GlassCard>

          {/* Countdown widget */}
          {countdownSession && countdownSession.dateUtc && !race.isPast && (
            <div className="lg:sticky lg:top-28">
              <GlassCard>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Next session
                </p>
                <p className="mt-1 text-lg font-semibold text-white">
                  {countdownSession.label}
                </p>
                <p
                  className="mt-0.5 text-xs text-slate-500"
                  suppressHydrationWarning
                >
                  {formatLocalTimeOnly(countdownSession.dateUtc)}
                </p>
                <div className="mt-6">
                  <SessionCountdown
                    targetDate={countdownSession.dateUtc}
                    sessionLabel={countdownSession.label}
                    variant="full"
                  />
                </div>
              </GlassCard>
            </div>
          )}

          {race.isPast && (
            <GlassCard>
              <p className="text-sm text-slate-400">
                This race has concluded. Points from this round are reflected in
                the championship standings.
              </p>
              <Link
                href="/standings"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-amber-300 hover:text-amber-200 transition"
              >
                View championship standings →
              </Link>
            </GlassCard>
          )}
        </Container>
      </section>
    </>
  );
}
