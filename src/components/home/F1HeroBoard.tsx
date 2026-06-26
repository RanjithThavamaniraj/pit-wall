import {
  PitWallHeroBoard,
  type HeroBoardSession,
} from "@/components/home/PitWallHeroBoard";
import { fetchSeasonSchedule, getCurrentRace, getNextRace } from "@/lib/schedule";
import type { SessionKey } from "@/lib/schedule";
import { fetchDriverStandings } from "@/lib/standings";
import { countryCodeToFlag } from "@/lib/utils";

const SESSION_SHORT: Partial<Record<SessionKey, string>> = {
  fp1: "FP1",
  fp2: "FP2",
  fp3: "FP3",
  sprint_qualifying: "SQ",
  sprint: "SPRINT",
  qualifying: "QUALI",
  race: "RACE",
};

function raceDisplayTitle(name: string): string {
  return name.replace(/\s+Grand Prix$/i, "").toUpperCase();
}

function mapSessions(
  sessions: Awaited<ReturnType<typeof fetchSeasonSchedule>>["races"][0]["sessions"]
): HeroBoardSession[] {
  return sessions.map((session) => ({
    id: session.key,
    shortLabel: SESSION_SHORT[session.key] ?? session.label.slice(0, 4).toUpperCase(),
    label: session.label,
    status: session.status,
    dateUtc: session.dateUtc || undefined,
  }));
}

export async function F1HeroBoard() {
  try {
    const [schedule, standings] = await Promise.all([
      fetchSeasonSchedule("current"),
      fetchDriverStandings(),
    ]);

    const race = getCurrentRace(schedule) ?? getNextRace(schedule);
    if (!race) {
      return null;
    }

    const liveSession = race.sessions.find((s) => s.status === "live");
    const nextSession = race.sessions.find((s) => s.status === "upcoming");
    const countdownSession = liveSession ?? nextSession;

    const leader = standings.drivers[0];
    const p2 = standings.drivers[1];

    const weekendLabel = liveSession
      ? liveSession.label
      : race.isCurrent
      ? "Race weekend"
      : "Next Grand Prix";

    return (
      <PitWallHeroBoard
        sport="f1"
        sportLabel="Formula 1"
        season={schedule.season}
        round={race.round}
        raceTitle={raceDisplayTitle(race.name)}
        circuit={race.circuit}
        locality={race.locality}
        flag={countryCodeToFlag(race.countryCode)}
        weekendLabel={weekendLabel}
        isLive={Boolean(liveSession)}
        sessions={mapSessions(race.sessions)}
        countdown={
          countdownSession?.dateUtc
            ? {
                dateUtc: countdownSession.dateUtc,
                label: countdownSession.label,
                isRace: countdownSession.key === "race",
              }
            : undefined
        }
        detailHref={`/races/${race.slug}`}
        scheduleHref="/races"
        liveHref="/live"
        championship={
          leader
            ? {
                titleLabel: "World Drivers' Championship",
                leaderCode: leader.driverCode,
                leaderName: leader.lastName,
                leaderTeam: leader.constructorName,
                leaderPoints: leader.points,
                leaderColor: leader.constructorColor,
                chaserName: p2?.lastName ?? "—",
                gapPoints: p2 ? `−${p2.gapToLeader} pts` : "—",
                round: Number(standings.round),
                standingsHref: "/standings",
              }
            : null
        }
      />
    );
  } catch {
    return null;
  }
}
