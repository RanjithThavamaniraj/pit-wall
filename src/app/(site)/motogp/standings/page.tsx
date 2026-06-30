import type { Metadata } from "next";
import Link from "next/link";
import {
  fetchMotoGpStandings,
  MAIN_CATEGORIES,
  type MotoGpCategoryName,
} from "@/lib/motogp";
import { MotoGpStandingsTabs } from "@/components/motogp/MotoGpStandingsTabs";
import { Container } from "@/components/ui";

export const metadata: Metadata = {
  title: "Championship Standings",
  description:
    "Live MotoGP, Moto2, and Moto3 championship standings. Updated after every race.",
};

export const revalidate = 300; // Keep in sync with MOTOGP_CACHE.STANDINGS

export default async function MotoGpStandingsPage() {
  let standingsByCategory;
  let season = new Date().getFullYear();
  let round = 0;

  try {
    const results = await Promise.all(
      MAIN_CATEGORIES.map(async (category) => {
        const standings = await fetchMotoGpStandings(category);
        return [category, standings] as const;
      })
    );

    standingsByCategory = Object.fromEntries(
      results.map(([category, standings]) => [
        category,
        { riders: standings.riders, teams: standings.teams },
      ])
    ) as Record<
      MotoGpCategoryName,
      { riders: typeof results[0][1]["riders"]; teams: typeof results[0][1]["teams"] }
    >;

    season = results[0][1].season;
    round = results[0][1].round;
  } catch {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Container>
          <p className="text-center text-slate-400">
            Unable to load MotoGP standings. Please try again shortly.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Link href="/" className="text-sm font-semibold text-amber-300 hover:text-amber-200">
              Back to home
            </Link>
            <Link href="/motogp/races" className="text-sm font-semibold text-slate-300 hover:text-white">
              View schedule
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  const motoGpLeader = standingsByCategory["MotoGP™"].riders[0];
  const motoGpP2 = standingsByCategory["MotoGP™"].riders[1];
  const teamLeader = standingsByCategory["MotoGP™"].teams[0];

  return (
    <>
      <section className="relative isolate overflow-hidden pt-10 pb-6 sm:pt-12 sm:pb-8">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(251,191,36,0.10),transparent_55%)]"
        />
        <Container>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-300">
            {season} season · MotoGP
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl lg:text-6xl">
            Championship
          </h1>
          <p className="mt-4 text-base text-slate-400">After Round {round}</p>

          {motoGpLeader && teamLeader && (
            <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Championship leader
                </dt>
                <dd className="mt-2 text-lg font-semibold text-white">
                  <span className="font-mono text-amber-200">
                    #{motoGpLeader.riderNumber}
                  </span>{" "}
                  {motoGpLeader.riderName}
                </dd>
                <dd className="mt-0.5 text-sm text-slate-400">
                  {motoGpLeader.points} pts
                </dd>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  P2 Gap
                </dt>
                <dd className="mt-2 text-lg font-semibold text-white">
                  {motoGpP2 ? `−${motoGpP2.gapToLeader} pts` : "—"}
                </dd>
                <dd className="mt-0.5 text-sm text-slate-400">
                  {motoGpP2?.riderName ?? ""}
                </dd>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Teams leader
                </dt>
                <dd className="mt-2 text-lg font-semibold text-white">
                  {teamLeader.name}
                </dd>
                <dd className="mt-0.5 text-sm text-slate-400">
                  {teamLeader.points} pts
                </dd>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Races completed
                </dt>
                <dd className="mt-2 text-lg font-semibold text-white">
                  {round}
                </dd>
                <dd className="mt-0.5 text-sm text-slate-400">
                  {season} season
                </dd>
              </div>
            </dl>
          )}
        </Container>
      </section>

      <section className="pt-2 pb-12" aria-labelledby="motogp-standings-table-heading">
        <Container wide>
          <h2 id="motogp-standings-table-heading" className="sr-only">
            MotoGP standings tables
          </h2>
          <MotoGpStandingsTabs
            standingsByCategory={standingsByCategory}
            season={season}
            round={round}
          />
        </Container>
      </section>
    </>
  );
}
