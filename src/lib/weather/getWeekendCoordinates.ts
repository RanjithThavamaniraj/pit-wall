import type { RaceSummarySport } from "@/lib/race-summary/types";
import { fetchRaceBySlug } from "@/lib/schedule";
import { fetchMotoGpEventBySlug } from "@/lib/motogp";

function safeParseNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

async function nominatimCoordinates(query: string): Promise<
  { lat: number; lon: number } | null
> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
    query
  )}`;
  const res = await fetch(url, { headers: { "User-Agent": "pit-wall" } });
  if (!res.ok) return null;
  const json = (await res.json()) as Array<{
    lat?: string;
    lon?: string;
  }>;
  const first = json?.[0];
  const lat = safeParseNumber(first?.lat);
  const lon = safeParseNumber(first?.lon);
  if (lat === undefined || lon === undefined) return null;
  return { lat, lon };
}

async function getF1CircuitCoordinates(circuitId: string): Promise<
  { lat: number; lon: number } | null
> {
  if (!circuitId) return null;
  const url = `https://ergast.com/api/f1/circuits/${encodeURIComponent(
    circuitId
  )}.json`;
  const res = await fetch(url, { headers: { "User-Agent": "pit-wall" } });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    MRData?: {
      CircuitTable?: {
        Circuits?: Array<{
          Location?: { lat?: string; long?: string };
        }>;
      };
    };
  };
  const circuit = json?.MRData?.CircuitTable?.Circuits?.[0];
  const lat = safeParseNumber(circuit?.Location?.lat);
  const lon = safeParseNumber(circuit?.Location?.long);
  if (lat === undefined || lon === undefined) return null;
  return { lat, lon };
}

export async function getWeekendCoordinates(input: {
  sport: RaceSummarySport;
  weekendSlug: string;
}): Promise<{ lat: number; lon: number } | null> {
  const { sport, weekendSlug } = input;

  if (sport === "f1") {
    const race = await fetchRaceBySlug(weekendSlug);
    if (!race) return null;
    return getF1CircuitCoordinates(race.circuitId);
  }

  const event = await fetchMotoGpEventBySlug(weekendSlug);
  if (!event) return null;

  // Nominatim is not perfect, so we keep it conservative: use only the
  // circuit/place name and country.
  const query = [
    event.circuit,
    event.locality ?? undefined,
    event.country,
  ]
    .filter(Boolean)
    .join(", ");

  return nominatimCoordinates(query);
}

