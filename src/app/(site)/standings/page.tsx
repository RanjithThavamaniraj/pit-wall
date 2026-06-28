import type { Metadata } from "next";
import Link from "next/link";
import { fetchAllStandings } from "@/lib/standings";
import { StandingsTabs } from "@/components/StandingsTabs";
import { Container } from "@/components/ui";

export const metadata: Metadata = {
  title: "Championship Standings",
  description:
    "Live Formula 1 World Drivers' and Constructors' Championship standings. Updated after every race.",
};

export const revalidate = 300; // Keep in sync with F1_CACHE.STANDINGS

export default async function StandingsPage() {
  let standings;
  try {
    standings = await fetchAllStandings();
  } catch {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Container>
          <p className="text-center text-slate-400">
            Unable to load standings. Please try again shortly.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Link href="/" className="text-sm font-semibold text-amber-300 hover:text-amber-200">
              Back to home
            </Link>
            <Link href="/races" className="text-sm font-semibold text-slate-300 hover:text-white">
              View schedule
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  const leader = standings.drivers[0];
  const constructorLeader = standings.constructors[0];

  return (
    <>
      {/* ─── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden pt-10 pb-6 sm:pt-12 sm:pb-8">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(251,191,36,0.10),transparent_55%)]"
        />
        <Container>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-300">
            {standings.season} season
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-white sm:text-6xl">
            Championship
          </h1>
          <p className="mt-4 text-base text-slate-400">
            After Round {standings.round}
          </p>

          {/* Quick stats */}
          {leader && constructorLeader && (
            <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  WDC Leader
                </dt>
                <dd className="mt-2 text-lg font-semibold text-white">
                  <span className="font-mono text-amber-200">
                    {leader.driverCode}
                  </span>{" "}
                  {leader.lastName}
                </dd>
                <dd className="mt-0.5 text-sm text-slate-400">
                  {leader.points} pts
                </dd>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  P2 Gap
                </dt>
                <dd className="mt-2 text-lg font-semibold text-white">
                  {standings.drivers[1]
                    ? `−${standings.drivers[1].gapToLeader} pts`
                    : "—"}
                </dd>
                <dd className="mt-0.5 text-sm text-slate-400">
                  {standings.drivers[1]?.lastName ?? ""}
                </dd>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  WCC Leader
                </dt>
                <dd className="mt-2 text-lg font-semibold text-white">
                  {constructorLeader.name}
                </dd>
                <dd className="mt-0.5 text-sm text-slate-400">
                  {constructorLeader.points} pts
                </dd>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Races completed
                </dt>
                <dd className="mt-2 text-lg font-semibold text-white">
                  {standings.round}
                </dd>
                <dd className="mt-0.5 text-sm text-slate-400">
                  {standings.season} season
                </dd>
              </div>
            </dl>
          )}
        </Container>
      </section>

      {/* ─── Standings tables ──────────────────────────────────────────── */}
      <section className="pt-2 pb-12" aria-labelledby="standings-table-heading">
        <Container wide>
          <h2 id="standings-table-heading" className="sr-only">
            Standings tables
          </h2>
          <StandingsTabs
            drivers={standings.drivers}
            constructors={standings.constructors}
            season={standings.season}
            round={standings.round}
          />
        </Container>
      </section>
    </>
  );
}
