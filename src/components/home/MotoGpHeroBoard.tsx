import {
  PitWallHeroBoard,
  type HeroBoardSession,
} from "@/components/home/PitWallHeroBoard";
import {
  fetchMotoGpSchedule,
  fetchMotoGpStandings,
  getCurrentMotoGpEvent,
  getNextMotoGpEvent,
  type MotoGpSession,
} from "@/lib/motogp";
import { countryCodeToFlag } from "@/lib/utils";

function raceDisplayTitle(name: string): string {
  return name
    .replace(/^Grand Prix of\s+/i, "")
    .replace(/\s+Grand Prix$/i, "")
    .toUpperCase();
}

function sessionShortLabel(session: MotoGpSession): string {
  const label = session.label.trim();
  if (label.length <= 6) return label.toUpperCase();
  const words = label.split(/\s+/);
  if (words.length > 1) {
    return words
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 5);
  }
  return label.slice(0, 5).toUpperCase();
}

function mapSessions(sessions: MotoGpSession[]): HeroBoardSession[] {
  return sessions.map((session) => ({
    id: session.sessionId,
    shortLabel: sessionShortLabel(session),
    label: session.label,
    status: session.status,
    dateUtc: session.dateUtc || undefined,
  }));
}

export async function MotoGpHeroBoard() {
  try {
    const [schedule, standings] = await Promise.all([
      fetchMotoGpSchedule(),
      fetchMotoGpStandings("MotoGP™"),
    ]);

    const event =
      getCurrentMotoGpEvent(schedule) ?? getNextMotoGpEvent(schedule);
    if (!event) {
      return null;
    }

    const liveSession = event.sessions.find((s) => s.status === "live");
    const nextSession = event.sessions.find((s) => s.status === "upcoming");
    const countdownSession = liveSession ?? nextSession;

    const leader = standings.riders[0];
    const p2 = standings.riders[1];

    const weekendLabel = liveSession
      ? liveSession.label
      : event.isCurrent
      ? "Race weekend"
      : "Next Grand Prix";

    const isRaceCountdown =
      countdownSession?.label.toLowerCase().includes("race") ?? false;

    return (
      <PitWallHeroBoard
        sport="motogp"
        sportLabel="MotoGP"
        season={schedule.season}
        round={event.round}
        raceTitle={raceDisplayTitle(event.name)}
        circuit={event.circuit}
        locality={event.locality}
        country={event.country}
        flag={countryCodeToFlag(event.countryCode)}
        weekendLabel={weekendLabel}
        isLive={Boolean(liveSession)}
        sessions={mapSessions(event.sessions)}
        countdown={
          countdownSession?.dateUtc
            ? {
                dateUtc: countdownSession.dateUtc,
                label: countdownSession.label,
                isRace: isRaceCountdown,
              }
            : undefined
        }
        detailHref={`/motogp/races/${event.slug}`}
        liveHref="/motogp/live"
        championship={
          leader
            ? {
                titleLabel: "MotoGP Championship",
                leaderCode: `#${leader.riderNumber}`,
                leaderName: leader.riderName,
                leaderTeam: leader.teamName,
                leaderPoints: leader.points,
                chaserName: p2?.riderName ?? "—",
                gapPoints: p2 ? `−${p2.gapToLeader} pts` : "—",
                round: standings.round,
              }
            : null
        }
      />
    );
  } catch {
    return null;
  }
}
