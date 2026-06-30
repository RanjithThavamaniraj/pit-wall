import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { fetchSeasonSchedule, fetchRaceBySlug } from "@/lib/schedule";
import { loadRaceWeekendSummary } from "@/lib/race-summary/loader";
import { countryCodeToFlag } from "@/lib/utils";
import { weekendHubFromF1 } from "@/lib/weekend-hub";
import { WeekendHub } from "@/components/weekend-hub";
import { Container, StatusPill } from "@/components/ui";

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function RaceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const race = await fetchRaceBySlug(slug);

  if (!race) notFound();

  const hubData = weekendHubFromF1(race);
  const summary = race.isPast
    ? await loadRaceWeekendSummary("f1", slug)
    : null;

  const flag = countryCodeToFlag(race.countryCode);
  const liveSession = race.sessions.find((s) => s.status === "live");
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

      <WeekendHub
        data={hubData}
        summary={summary}
        scheduleHeadingId="sessions-heading"
      />
    </>
  );
}
