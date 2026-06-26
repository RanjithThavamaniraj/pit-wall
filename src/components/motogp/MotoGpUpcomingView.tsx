import type { MotoGpEvent } from "@/lib/motogp";
import type { MotoGpWeekendContext } from "@/lib/motogp-weekend";
import type { MotoGpStandings } from "@/lib/motogp";
import {
  ChampionshipSnapshot,
  LivePreviewExplainer,
  WeekendHero,
  WeekendPreviewGrid,
  NextSessionPanel,
  PreviousRoundCard,
  type SnapshotMetric,
} from "@/components/live/WeekendPreviewShared";
import { countryCodeToFlag } from "@/lib/utils";

type Props = {
  context: MotoGpWeekendContext;
  standings?: MotoGpStandings | null;
  previousEvent?: MotoGpEvent | null;
};

function buildStandingsMetrics(
  standings: MotoGpStandings | null | undefined
): SnapshotMetric[] {
  if (!standings) return [];

  const leader = standings.riders[0];
  const p2 = standings.riders[1];
  const teamLeader = standings.teams[0];

  if (!leader) return [];

  return [
    {
      label: "Championship leader",
      value: `#${leader.riderNumber} · ${leader.riderName}`,
      sub: `${leader.points} pts`,
    },
    {
      label: "Gap to P2",
      value: p2 ? `−${p2.gapToLeader} pts` : "—",
      sub: p2?.riderName ?? "",
    },
    {
      label: "Team leader",
      value: teamLeader?.name ?? "—",
      sub: teamLeader ? `${teamLeader.points} pts` : "",
    },
    {
      label: "Rounds completed",
      value: String(standings.round),
      sub: `${standings.season} season`,
    },
  ];
}

export function MotoGpUpcomingView({
  context,
  standings,
  previousEvent,
}: Props) {
  const { currentWeekend, nextSession } = context;
  const flag = countryCodeToFlag(currentWeekend.countryCode);

  if (!nextSession) {
    return (
      <div className="flex h-40 items-center justify-center rounded-[2rem] border border-white/10 bg-white/[0.04]">
        <p className="text-sm text-slate-400">Waiting for schedule data...</p>
      </div>
    );
  }

  const sessions = currentWeekend.sessions.map((session) => ({
    id: session.sessionId,
    label: session.label,
    dateUtc: session.dateUtc,
    status: session.status,
  }));

  const metrics = buildStandingsMetrics(standings);

  const motogpFootnote = (
    <p className="text-xs leading-6 text-slate-500">
      Live timing is not available from the public MotoGP API. Session results
      and progression update here throughout the weekend.
    </p>
  );

  return (
    <div className="space-y-6">
      <WeekendHero
        flag={flag}
        eyebrow={`Round ${currentWeekend.round} · ${currentWeekend.season} · MotoGP`}
        title={currentWeekend.name}
        subtitle={`${currentWeekend.circuit}${
          currentWeekend.locality ? ` · ${currentWeekend.locality}` : ""
        }, ${currentWeekend.country}`}
        detailHref={`/motogp/races/${currentWeekend.slug}`}
      />

      <WeekendPreviewGrid
        sessions={sessions}
        nextSessionId={nextSession.sessionId}
        sidebar={
          <>
            <NextSessionPanel
              sessionLabel={nextSession.label}
              circuit={currentWeekend.circuit}
              dateUtc={nextSession.dateUtc}
              footnote={motogpFootnote}
            />
            <div className="hidden lg:block">
              <LivePreviewExplainer sport="motogp" />
            </div>
          </>
        }
      />

      <div className="lg:hidden">
        <LivePreviewExplainer sport="motogp" />
      </div>

      {previousEvent && previousEvent.round < currentWeekend.round && (
        <PreviousRoundCard
          round={previousEvent.round}
          title={previousEvent.name}
          subtitle={previousEvent.circuit}
          href={`/motogp/races/${previousEvent.slug}`}
          podium={previousEvent.podium.map((finisher) => ({
            position: finisher.position,
            name: finisher.riderName,
            detail: `#${finisher.riderNumber}`,
          }))}
        />
      )}

      {metrics.length > 0 && (
        <section aria-label="Championship snapshot">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
            Championship snapshot
          </h2>
          <ChampionshipSnapshot metrics={metrics} />
        </section>
      )}
    </div>
  );
}
