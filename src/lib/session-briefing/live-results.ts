import { F1_CACHE } from "@/lib/cache/f1";
import { slugifyPerson } from "@/lib/race-summary/branding";
import type { PodiumFinisher } from "@/lib/race-summary/types";

const JOLPICA_BASE = "https://api.jolpi.ca/ergast/f1";

type JolpicaDriver = {
  givenName: string;
  familyName: string;
  nationality: string;
  permanentNumber?: string;
};

type JolpicaConstructor = {
  name: string;
};

type JolpicaQualifyingResult = {
  position: string;
  Driver: JolpicaDriver;
  Constructor: JolpicaConstructor;
};

type JolpicaSprintResult = {
  position: string;
  Driver: JolpicaDriver;
  Constructor: JolpicaConstructor;
};

async function jolpicaFetch<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${JOLPICA_BASE}/${path}`, {
      next: { revalidate: F1_CACHE.STANDINGS },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function driverName(driver: JolpicaDriver): string {
  return `${driver.givenName} ${driver.familyName}`.trim();
}

function toFinisher(
  position: string,
  driver: JolpicaDriver,
  constructor: JolpicaConstructor
): PodiumFinisher {
  const name = driverName(driver);
  return {
    position: parseInt(position, 10),
    name,
    team: constructor.name,
    imageSlug: slugifyPerson(name),
  };
}

/**
 * Fetches official qualifying classification for the current (possibly
 * still-in-progress) round directly from Jolpica — unlike
 * `buildF1RaceWeekendSummary`, this does not require the weekend to be
 * fully in the past. Returns `null` when no classification is published
 * yet, so callers can degrade gracefully instead of guessing.
 */
export async function fetchLiveQualifyingClassification(
  season: number,
  round: number
): Promise<PodiumFinisher[] | null> {
  const json = await jolpicaFetch<{
    MRData?: {
      RaceTable?: {
        Races?: Array<{ QualifyingResults?: JolpicaQualifyingResult[] }>;
      };
    };
  }>(`${season}/${round}/qualifying.json`);

  const results = json?.MRData?.RaceTable?.Races?.[0]?.QualifyingResults;
  if (!results || results.length === 0) return null;

  return results.map((r) => toFinisher(r.position, r.Driver, r.Constructor));
}

/**
 * Fetches official sprint classification for the current round directly
 * from Jolpica. Returns `null` when not yet published.
 */
export async function fetchLiveSprintClassification(
  season: number,
  round: number
): Promise<PodiumFinisher[] | null> {
  const json = await jolpicaFetch<{
    MRData?: {
      RaceTable?: {
        Races?: Array<{ SprintResults?: JolpicaSprintResult[] }>;
      };
    };
  }>(`${season}/${round}/sprint.json`);

  const results = json?.MRData?.RaceTable?.Races?.[0]?.SprintResults;
  if (!results || results.length === 0) return null;

  return results.map((r) => toFinisher(r.position, r.Driver, r.Constructor));
}
