import type { Metadata } from "next";
import Link from "next/link";
import { fetchMotoGpSchedule } from "@/lib/motogp";
import { MotoGpRaceCard } from "@/components/motogp/MotoGpRaceCard";
import { CompletedWeekendGrid } from "@/components/weekend-summary";
import { motoGpEventToCardData } from "@/lib/race-summary/mappers";
import { Container } from "@/components/ui";

export const metadata: Metadata = {
  title: "Race Schedule",
  description:
    "Full MotoGP season calendar with session times, countdowns, and race weekend details. All times shown in your local timezone.",
};

export const revalidate = 3600; // Keep in sync with MOTOGP_CACHE.SCHEDULE

export default async function MotoGpRacesPage() {
  let schedule;
  try {
    schedule = await fetchMotoGpSchedule();
  } catch {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Container>
          <p className="text-center text-slate-400">
            Unable to load the MotoGP race schedule. Please try again shortly.
          </p>
          <div className="mt-6 flex justify-center">
            <Link href="/" className="text-sm font-semibold text-amber-300 hover:text-amber-200">
              Back to home
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  const pastRaces = schedule.races.filter((race) => race.isPast);
  const upcomingRaces = schedule.races.filter((race) => !race.isPast);
  const nextRace = upcomingRaces.find((race) => race.isNext);

  return (
    <>
      <section className="relative isolate overflow-hidden pt-10 pb-8 sm:pt-12 sm:pb-10">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(251,191,36,0.12),transparent_60%)]"
        />
        <Container>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-300">
            {schedule.season} season · MotoGP
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-white sm:text-6xl">
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

      {upcomingRaces.length > 0 && (
        <section aria-labelledby="motogp-upcoming-heading" className="pb-8">
          <Container wide>
            <h2
              id="motogp-upcoming-heading"
              className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500"
            >
              Upcoming
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {upcomingRaces.map((event) => (
                <MotoGpRaceCard key={event.id} event={event} />
              ))}
            </div>
          </Container>
        </section>
      )}

      {pastRaces.length > 0 && (
        <section
          aria-labelledby="motogp-past-heading"
          className="border-t border-white/10 pb-12 pt-8"
        >
          <Container wide>
            <h2
              id="motogp-past-heading"
              className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-slate-600"
            >
              Completed — {pastRaces.length} round
              {pastRaces.length !== 1 ? "s" : ""}
            </h2>
            <CompletedWeekendGrid
              sport="motogp"
              races={[...pastRaces].reverse().map(motoGpEventToCardData)}
            />
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
