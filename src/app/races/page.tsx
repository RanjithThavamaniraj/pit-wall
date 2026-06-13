import type { Metadata } from "next";
import { fetchSeasonSchedule } from "@/lib/schedule";
import { RaceCard } from "@/components/RaceCard";
import { Container } from "@/components/ui";

export const metadata: Metadata = {
  title: "Race Schedule",
  description:
    "Full Formula 1 season calendar with session times, countdowns, and race weekend details. All times shown in your local timezone.",
};

export const revalidate = 3600; // ISR — revalidate every hour

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
        </Container>
      </div>
    );
  }

  const pastRaces = schedule.races.filter((r) => r.isPast);
  const upcomingRaces = schedule.races.filter((r) => !r.isPast);
  const nextRace = upcomingRaces.find((r) => r.isNext);

  return (
    <>
      {/* ─── Page header ──────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden pb-12 pt-12 sm:pt-16">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(251,191,36,0.12),transparent_60%)]"
        />
        <Container>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-300">
            {schedule.season} season
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-white sm:text-6xl">
            Race calendar
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
        <section aria-labelledby="upcoming-heading" className="pb-10">
          <Container>
            <h2
              id="upcoming-heading"
              className="mb-5 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500"
            >
              Upcoming
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
          className="border-t border-white/10 pb-16 pt-10"
        >
          <Container>
            <h2
              id="past-heading"
              className="mb-5 text-xs font-semibold uppercase tracking-[0.28em] text-slate-600"
            >
              Completed — {pastRaces.length} round{pastRaces.length !== 1 ? "s" : ""}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[...pastRaces].reverse().map((race) => (
                <RaceCard key={race.slug} race={race} />
              ))}
            </div>
          </Container>
        </section>
      )}
    </>
  );
}
