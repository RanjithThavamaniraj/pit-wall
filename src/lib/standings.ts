import { getTeamColor } from "./teamColors";
import { F1_CACHE } from "@/lib/cache/f1";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DriverStanding = {
  position: number;
  driverCode: string;   // "VER"
  firstName: string;
  lastName: string;
  nationality: string;
  permanentNumber: string;
  constructorName: string;
  constructorColor: string;
  points: number;
  wins: number;
  gapToLeader: number; // points behind P1
};

export type ConstructorStanding = {
  position: number;
  name: string;
  nationality: string;
  color: string;
  points: number;
  wins: number;
  gapToLeader: number;
};

export type Standings = {
  season: string;
  round: string;
  drivers: DriverStanding[];
  constructors: ConstructorStanding[];
};

// ─── Jolpica response types ────────────────────────────────────────────────────

type JolpicaDriverStanding = {
  position: string;
  points: string;
  wins: string;
  Driver: {
    code: string;
    givenName: string;
    familyName: string;
    nationality: string;
    permanentNumber: string;
  };
  Constructors: Array<{ name: string }>;
};

type JolpicaConstructorStanding = {
  position: string;
  points: string;
  wins: string;
  Constructor: {
    name: string;
    nationality: string;
  };
};

// ─── Fetchers ─────────────────────────────────────────────────────────────────

const JOLPICA_BASE = "https://api.jolpi.ca/ergast/f1";

export async function fetchDriverStandings(): Promise<{
  season: string;
  round: string;
  drivers: DriverStanding[];
}> {
  const url = `${JOLPICA_BASE}/current/driverStandings.json`;
  const res = await fetch(url, {
    next: { revalidate: F1_CACHE.STANDINGS },
  });

  if (!res.ok) {
    throw new Error(`Jolpica driver standings fetch failed: ${res.status}`);
  }

  const json = await res.json();
  const standingsTable = json?.MRData?.StandingsTable;
  const list: JolpicaDriverStanding[] =
    standingsTable?.StandingsLists?.[0]?.DriverStandings ?? [];
  const season: string = standingsTable?.StandingsLists?.[0]?.season ?? "";
  const round: string = standingsTable?.StandingsLists?.[0]?.round ?? "0";

  const leaderPoints = parseFloat(list[0]?.points ?? "0");

  const drivers: DriverStanding[] = list.map((item) => {
    const pts = parseFloat(item.points);
    const constructorName = item.Constructors?.[0]?.name ?? "Unknown";
    return {
      position: parseInt(item.position),
      driverCode: item.Driver.code ?? item.Driver.familyName.slice(0, 3).toUpperCase(),
      firstName: item.Driver.givenName,
      lastName: item.Driver.familyName,
      nationality: item.Driver.nationality,
      permanentNumber: item.Driver.permanentNumber ?? "–",
      constructorName,
      constructorColor: getTeamColor(constructorName),
      points: pts,
      wins: parseInt(item.wins),
      gapToLeader: parseFloat((leaderPoints - pts).toFixed(1)),
    };
  });

  return { season, round, drivers };
}

export async function fetchConstructorStandings(): Promise<{
  season: string;
  round: string;
  constructors: ConstructorStanding[];
}> {
  const url = `${JOLPICA_BASE}/current/constructorStandings.json`;
  const res = await fetch(url, {
    next: { revalidate: F1_CACHE.STANDINGS },
  });

  if (!res.ok) {
    throw new Error(
      `Jolpica constructor standings fetch failed: ${res.status}`
    );
  }

  const json = await res.json();
  const standingsTable = json?.MRData?.StandingsTable;
  const list: JolpicaConstructorStanding[] =
    standingsTable?.StandingsLists?.[0]?.ConstructorStandings ?? [];
  const season: string = standingsTable?.StandingsLists?.[0]?.season ?? "";
  const round: string = standingsTable?.StandingsLists?.[0]?.round ?? "0";

  const leaderPoints = parseFloat(list[0]?.points ?? "0");

  const constructors: ConstructorStanding[] = list.map((item) => {
    const pts = parseFloat(item.points);
    return {
      position: parseInt(item.position),
      name: item.Constructor.name,
      nationality: item.Constructor.nationality,
      color: getTeamColor(item.Constructor.name),
      points: pts,
      wins: parseInt(item.wins),
      gapToLeader: parseFloat((leaderPoints - pts).toFixed(1)),
    };
  });

  return { season, round, constructors };
}

export async function fetchAllStandings(): Promise<Standings> {
  const [driverData, constructorData] = await Promise.all([
    fetchDriverStandings(),
    fetchConstructorStandings(),
  ]);

  return {
    season: driverData.season,
    round: driverData.round,
    drivers: driverData.drivers,
    constructors: constructorData.constructors,
  };
}
