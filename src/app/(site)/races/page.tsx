import type { Metadata } from "next";
import Link from "next/link";
import { fetchSeasonSchedule } from "@/lib/schedule";
import { RaceCard } from "@/components/RaceCard";
import { CompletedWeekendGrid } from "@/components/weekend-summary";
import { f1WeekendToCardData } from "@/lib/race-summary/mappers";
import { loadRaceWeekendSummary } from "@/lib/race-summary/loader";
import { Container } from "@/components/ui";

export const metadata: Metadata = {
  title: "Race Schedule",
  description:
    "Full Formula 1 season calendar with session times, countdowns, and race weekend details. All times shown in your local timezone.",
};

export const revalidate = 300; // Keep in sync with F1_CACHE.STANDINGS (live race flags; schedule fetch stays 3600s)

export default async function RacesPage() {
  let schedule;
  try {
    schedule = await fetchSeasonSchedule("current");
  } catch {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Container>
          <p className="text-center text-slate-400">
            Unable to load the race schedule. Please try again shortly.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Link href="/" className="text-sm font-semibold text-amber-300 hover:text-amber-200">
              Back to home
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  const pastRaces = schedule.races.filter((r) => r.isPast);
  const upcomingRaces = schedule.races.filter((r) => !r.isPast);
  const nextRace = upcomingRaces.find((r) => r.isNext);

  const completedRaceCards = await Promise.all(
    [...pastRaces].reverse().map(async (race) => {
      const card = f1WeekendToCardData(race);
      const summary = await loadRaceWeekendSummary("f1", race.slug);
      if (summary?.raceResults?.length) {
        card.podium = summary.raceResults;
      }
      return card;
    })
  );

  return (
    <>
      {/* ─── Page header ──────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden pt-10 pb-8 sm:pt-12 sm:pb-10">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(251,191,36,0.12),transparent_60%)]"
        />
        <Container>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-300">
            {schedule.season} season
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl lg:text-6xl">
            Race schedule
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-400">
            {schedule.totalRaces} rounds. All session times shown in your local
            timezone.{" "}
            {nextRace ? (
              <span className="text-amber-200">
                Next up: {nextRace.shortName}.
              </span>
            ) : null}
          </p>
        </Container>
      </section>

      {/* ─── Upcoming races ────────────────────────────────────────────── */}
      {upcomingRaces.length > 0 && (
        <section aria-labelledby="upcoming-heading" className="pb-8">
          <Container wide>
            <h2
              id="upcoming-heading"
              className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500"
            >
              Upcoming
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {upcomingRaces.map((race) => (
                <RaceCard key={race.slug} race={race} />
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* ─── Past races ───────────────────────────────────────────────── */}
      {pastRaces.length > 0 && (
        <section
          aria-labelledby="past-heading"
          className="border-t border-white/10 pb-12 pt-8"
        >
          <Container wide>
            <h2
              id="past-heading"
              className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-slate-600"
            >
              Completed — {pastRaces.length} round{pastRaces.length !== 1 ? "s" : ""}
            </h2>
            <CompletedWeekendGrid sport="f1" races={completedRaceCards} />
          </Container>
        </section>
      )}
      {upcomingRaces.length === 0 && pastRaces.length === 0 && (
        <section className="pb-12">
          <Container>
            <p className="text-center text-slate-400">
              No races found for this season yet.
            </p>
            <div className="mt-6 flex justify-center">
              <Link href="/" className="text-sm font-semibold text-amber-300 hover:text-amber-200">
                Back to home
              </Link>
            </div>
          </Container>
        </section>
      )}
    </>
  );
}
