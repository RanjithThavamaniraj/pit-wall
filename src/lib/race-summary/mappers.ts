import type { RaceWeekend } from "@/lib/schedule";
import type { MotoGpEvent } from "@/lib/motogp";
import type { CompletedRaceCardData } from "@/lib/race-summary/types";
import { formatDateRange } from "@/lib/utils";

export function f1WeekendToCardData(race: RaceWeekend): CompletedRaceCardData {
  const fp1 = race.sessions.find((session) => session.key === "fp1");
  const raceSession = race.sessions.find((session) => session.key === "race");

  return {
    slug: race.slug,
    round: race.round,
    shortName: race.shortName,
    name: race.name,
    countryCode: race.countryCode,
    dateRange: formatDateRange(
      fp1?.dateUtc ?? "",
      raceSession?.dateUtc ?? ""
    ),
    circuit: race.circuit,
  };
}

export function motoGpEventToCardData(event: MotoGpEvent): CompletedRaceCardData {
  const firstSession = event.sessions[0];
  const raceSession = event.sessions.find((session) => session.key === "race");

  return {
    slug: event.slug,
    round: event.round,
    shortName: event.shortName,
    name: event.name,
    countryCode: event.countryCode,
    dateRange: formatDateRange(
      firstSession?.dateUtc ?? event.dateStart,
      raceSession?.dateUtc ?? event.dateEnd
    ),
    circuit: event.circuit,
    podium: event.podium.map((finisher) => ({
      position: finisher.position,
      name: finisher.riderName,
      number: finisher.riderNumber,
      team: finisher.teamName,
    })),
  };
}
