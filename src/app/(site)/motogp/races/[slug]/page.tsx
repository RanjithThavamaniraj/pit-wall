import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { fetchMotoGpEventBySlug, fetchMotoGpSchedule } from "@/lib/motogp";
import { loadRaceWeekendSummary } from "@/lib/race-summary/loader";
import { countryCodeToFlag } from "@/lib/utils";
import { getCircuitOutlinePath } from "@/lib/circuit-outline";
import { loadReplayPackage } from "@/lib/replay/loadReplayPackage";
import { weekendHubFromMotoGp } from "@/lib/weekend-hub";
import { WeekendHub } from "@/components/weekend-hub";
import { RaceReplaySection } from "@/components/replay";
import { Container, StatusPill } from "@/components/ui";

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

export default async function MotoGpRaceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await fetchMotoGpEventBySlug(slug);

  if (!event) notFound();

  const hubData = weekendHubFromMotoGp(event);
  const summary = event.isPast
    ? await loadRaceWeekendSummary("motogp", slug)
    : null;
  const replayPackage = event.isPast
    ? await loadReplayPackage("motogp", slug)
    : null;
  const circuitSvgUrl = getCircuitOutlinePath("motogp", {
    id: event.circuitId,
    name: event.circuit,
  });

  const flag = countryCodeToFlag(event.countryCode);
  const liveSession = event.sessions.find((s) => s.status === "live");
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

      {event.isPast ? (
        <div className="pb-6">
          <Container wide>
            <RaceReplaySection
              sport="motogp"
              raceName={event.name}
              circuitName={event.circuit}
              circuitSvgUrl={circuitSvgUrl}
              pkg={replayPackage}
            />
          </Container>
        </div>
      ) : null}

      <WeekendHub
        data={hubData}
        summary={summary}
        motogpPodium={event.podium}
        scheduleHeadingId="motogp-sessions-heading"
      />
    </>
  );
}
