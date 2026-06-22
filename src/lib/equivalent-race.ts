import { fetchMotoGpEventBySlug, fetchMotoGpSchedule } from "@/lib/motogp";
import { fetchRaceBySlug, fetchSeasonSchedule } from "@/lib/schedule";
import type { Sport } from "@/lib/sport";
import { parseRoundFromSlug } from "@/lib/utils";

export async function getEquivalentRaceSlug(
  fromSport: Sport,
  slug: string
): Promise<string | null> {
  const round = parseRoundFromSlug(slug);
  if (!round) return null;

  if (fromSport === "f1") {
    const sourceRace = await fetchRaceBySlug(slug);
    if (!sourceRace || sourceRace.round !== round) return null;

    const schedule = await fetchMotoGpSchedule();
    return schedule.races.find((event) => event.round === round)?.slug ?? null;
  }

  const sourceEvent = await fetchMotoGpEventBySlug(slug);
  if (!sourceEvent || sourceEvent.round !== round) return null;

  const schedule = await fetchSeasonSchedule("current");
  return schedule.races.find((race) => race.round === round)?.slug ?? null;
}
