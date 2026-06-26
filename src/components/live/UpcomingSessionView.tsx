"use client";

import type { WeekendContext } from "@/lib/weekend";
import type { RaceWeekend } from "@/lib/schedule";
import type { Standings } from "@/lib/standings";
import { BriefingFeed } from "@/components/live/BriefingFeed";
import {
  ChampionshipSnapshot,
  LivePreviewExplainer,
  WeekendHero,
  WeekendPreviewGrid,
  NextSessionPanel,
  PreviousRoundCard,
  type SnapshotMetric,
} from "./WeekendPreviewShared";
import { countryCodeToFlag } from "@/lib/utils";

type Props = {
  context: WeekendContext;
  standings?: Standings | null;
  previousRace?: RaceWeekend | null;
};

function buildStandingsMetrics(
  standings: Standings | null | undefined
): SnapshotMetric[] {
  if (!standings) return [];

  const leader = standings.drivers[0];
  const p2 = standings.drivers[1];
  const constructorLeader = standings.constructors[0];

  if (!leader) return [];

  return [
    {
      label: "WDC leader",
      value: `${leader.driverCode} · ${leader.lastName}`,
      sub: `${leader.points} pts`,
    },
    {
      label: "P2 gap",
      value: p2 ? `−${p2.gapToLeader} pts` : "—",
      sub: p2?.lastName ?? "",
    },
    {
      label: "WCC leader",
      value: constructorLeader?.name ?? "—",
      sub: constructorLeader ? `${constructorLeader.points} pts` : "",
    },
    {
      label: "Rounds completed",
      value: standings.round,
      sub: `${standings.season} season`,
    },
  ];
}

export function UpcomingSessionView({
  context,
  standings,
  previousRace,
}: Props) {
  const { currentWeekend, nextSession } = context;
  const flag = countryCodeToFlag(currentWeekend.countryCode);
  const isSprintWeekend = currentWeekend.sessions.some(
    (s) => s.key === "sprint_qualifying" || s.key === "sprint"
  );

  if (!nextSession) {
    return (
      <div className="flex h-40 items-center justify-center rounded-[2rem] border border-white/10 bg-white/[0.04]">
        <p className="text-sm text-slate-400">Waiting for schedule data...</p>
      </div>
    );
  }

  const sessions = currentWeekend.sessions.map((session) => ({
    id: session.key,
    label: session.label,
    dateUtc: session.dateUtc,
    status: session.status,
  }));

  const metrics = buildStandingsMetrics(standings);

  const nextSessionData = {
    raceName: currentWeekend.name,
    circuit: currentWeekend.circuit,
    sessionName: nextSession.label,
    dateUtc: nextSession.dateUtc,
  };

  return (
    <div className="space-y-6">
      <WeekendHero
        flag={flag}
        eyebrow={`Round ${currentWeekend.round} · ${currentWeekend.season}${
          isSprintWeekend ? " · Sprint weekend" : ""
        }`}
        title={currentWeekend.name}
        subtitle={`${currentWeekend.circuit} · ${currentWeekend.locality}, ${currentWeekend.country}`}
        detailHref={`/races/${currentWeekend.slug}`}
      />

      <WeekendPreviewGrid
        sessions={sessions}
        nextSessionId={nextSession.key}
        sidebar={
          <>
            <NextSessionPanel
              sessionLabel={nextSession.label}
              circuit={currentWeekend.circuit}
              dateUtc={nextSession.dateUtc}
            />
            <div className="hidden lg:block">
              <LivePreviewExplainer sport="f1" />
            </div>
            <div className="hidden lg:block">
              <BriefingFeed
                nextSessionData={nextSessionData}
                isActiveSession={false}
              />
            </div>
          </>
        }
      />

      <div className="space-y-5 lg:hidden">
        <LivePreviewExplainer sport="f1" />
        <BriefingFeed
          nextSessionData={nextSessionData}
          isActiveSession={false}
        />
      </div>

      {previousRace && previousRace.round < currentWeekend.round && (
        <PreviousRoundCard
          round={previousRace.round}
          title={previousRace.name}
          subtitle={previousRace.circuit}
          href={`/races/${previousRace.slug}`}
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
