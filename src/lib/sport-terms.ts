import type { Championship } from "@/lib/live";

/** Shared F1 / MotoGP terminology — one config, no duplicated UIs. */
export type SportTerms = {
  sport: Championship;
  sportLabel: string;
  competitor: string;
  competitorPlural: string;
  competitorTitle: string;
  teamOrManufacturer: string;
  vehicleAhead: string;
  pitLabel: string | null;
};

export function getSportTerms(sport: Championship): SportTerms {
  if (sport === "motogp") {
    return {
      sport: "motogp",
      sportLabel: "MotoGP",
      competitor: "rider",
      competitorPlural: "riders",
      competitorTitle: "Rider",
      teamOrManufacturer: "Manufacturer",
      vehicleAhead: "bike ahead",
      pitLabel: null,
    };
  }

  return {
    sport: "f1",
    sportLabel: "Formula 1",
    competitor: "driver",
    competitorPlural: "drivers",
    competitorTitle: "Driver",
    teamOrManufacturer: "Team",
    vehicleAhead: "car ahead",
    pitLabel: "Pit",
  };
}
