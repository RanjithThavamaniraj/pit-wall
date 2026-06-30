import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { fetchMotoGpEventBySlug, fetchMotoGpSchedule } from "@/lib/motogp";
import { countryCodeToFlag, formatLocalTime, formatLocalTimeOnly } from "@/lib/utils";
import { SessionCountdown } from "@/components/SessionCountdown";
import { Container, GlassCard, StatusPill } from "@/components/ui";

export async function generateStaticParams() {
  try {
    const schedule = await fetchMotoGpSchedule();
    return schedule.races.map((event) => ({ slug: event.slug }));
  } catch {
    return [];
  }
}

export const revalidate = 3600; // Keep in sync with MOTOGP_CACHE.SCHEDULE

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await fetchMotoGpEventBySlug(slug);
  if (!event) return { title: "Race not found" };
  const description = `${event.name} session schedule, times, and details. ${event.circuit}, ${event.locality}.`;
  return {
    title: event.name,
    description,
    openGraph: {
      title: event.name,
      description,
      type: "website",
    },
  };
}

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

export default async function MotoGpRaceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await fetchMotoGpEventBySlug(slug);

  if (!event) notFound();

  const flag = countryCodeToFlag(event.countryCode);
  const nextSession = event.sessions.find((s) => s.status === "upcoming");
  const liveSession = event.sessions.find((s) => s.status === "live");
  const countdownSession = liveSession ?? nextSession;
  const showLiveLink = event.isCurrent || Boolean(liveSession);

  return (
    <>
      <section className="relative isolate overflow-hidden pt-10 pb-8 sm:pt-12 sm:pb-10">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(251,191,36,0.10),transparent_55%)]"
        />
        <Container>
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-2 text-xs text-slate-500">
              <li>
                <Link
                  href="/motogp/races"
                  className="hover:text-slate-300 transition"
                >
                  Schedule
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-slate-400">{event.shortName}</li>
            </ol>
          </nav>

          <div className="flex items-start gap-5">
            <span className="text-5xl sm:text-6xl" aria-hidden="true">
              {flag}
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
                Round {event.round} · {event.season} · MotoGP
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
                {event.name}
              </h1>
              <p className="mt-2 text-base text-slate-400">
                {event.circuit}
                {event.locality ? ` · ${event.locality}` : ""}, {event.country}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            {event.isPast ? (
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
                href="/motogp/live"
                className="text-sm font-semibold text-amber-300 hover:text-amber-200 transition"
              >
                Go to weekend hub →
              </Link>
            )}
          </div>
        </Container>
      </section>

      <section className="pb-12" aria-labelledby="motogp-sessions-heading">
        <Container
          wide
          className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:items-start"
        >
          <GlassCard className="order-2 overflow-hidden p-0 lg:order-1">
            <div className="border-b border-white/10 px-5 py-4 sm:px-6">
              <h2
                id="motogp-sessions-heading"
                className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400"
              >
                Session schedule
              </h2>
              <p className="mt-0.5 text-xs text-slate-600">
                Times shown in your local timezone
              </p>
            </div>
            <ul role="list" className="divide-y divide-white/[0.06]">
              {event.sessions.map((session) => (
                <li
                  key={session.sessionId}
                  id={`session-${session.sessionId}`}
                  className={`scroll-mt-28 flex min-h-[4.75rem] items-center justify-between gap-4 px-5 py-4 sm:px-6 ${
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
                      <p className="mt-1.5 text-xs text-slate-600">Date TBC</p>
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

          {countdownSession && countdownSession.dateUtc && !event.isPast && (
            <div className="order-1 lg:order-2 lg:sticky lg:top-28">
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

          {event.isPast && (
            <GlassCard className="order-1 lg:order-2">
              {event.podium.length > 0 ? (
                <>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Race podium
                  </p>
                  <ol className="mt-4 space-y-3">
                    {event.podium.map((finisher) => (
                      <li
                        key={finisher.position}
                        className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-slate-950/40 px-4 py-3"
                      >
                        <div className="flex items-center gap-4">
                          <span className="font-mono text-sm text-amber-200">
                            P{finisher.position}
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-white">
                              {finisher.riderName}
                            </p>
                            <p className="text-xs text-slate-500">
                              #{finisher.riderNumber} · {finisher.teamName}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>
                </>
              ) : (
                <p className="text-sm text-slate-400">
                  This Grand Prix has concluded. Points from this round are
                  reflected in the championship standings.
                </p>
              )}
              <Link
                href="/motogp/standings"
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
