import type { RaceSummarySport } from "./types";

export type TeamBranding = {
  color: string;
  logoPath?: string;
  shortName: string;
};

export function slugifyPerson(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function slugifyTeam(team: string): string {
  return team
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function normalizeTeamKey(team: string): string {
  return team.toLowerCase().replace(/[^a-z0-9]/g, "");
}

const F1_TEAMS: Record<string, TeamBranding> = {
  mclaren: {
    color: "#FF8000",
    shortName: "McLaren",
    logoPath: "/images/f1/teams/mclaren.svg",
  },
  redbullracing: {
    color: "#3671C6",
    shortName: "Red Bull",
    logoPath: "/images/f1/teams/red-bull-racing.svg",
  },
  ferrari: {
    color: "#E8002D",
    shortName: "Ferrari",
    logoPath: "/images/f1/teams/ferrari.svg",
  },
  mercedes: {
    color: "#27F4D2",
    shortName: "Mercedes",
    logoPath: "/images/f1/teams/mercedes.svg",
  },
  astonmartin: {
    color: "#229971",
    shortName: "Aston Martin",
    logoPath: "/images/f1/teams/aston-martin.svg",
  },
  alpine: {
    color: "#FF87BC",
    shortName: "Alpine",
    logoPath: "/images/f1/teams/alpine.svg",
  },
  williams: {
    color: "#1868DB",
    shortName: "Williams",
    logoPath: "/images/f1/teams/williams.svg",
  },
  haas: {
    color: "#B6BABD",
    shortName: "Haas",
    logoPath: "/images/f1/teams/haas.svg",
  },
  racingbulls: {
    color: "#6692FF",
    shortName: "Racing Bulls",
    logoPath: "/images/f1/teams/racing-bulls.svg",
  },
  sauber: {
    color: "#52E252",
    shortName: "Sauber",
    logoPath: "/images/f1/teams/sauber.svg",
  },
};

const MOTOGP_MANUFACTURERS: Record<string, TeamBranding> = {
  ducati: {
    color: "#CC0000",
    shortName: "Ducati",
    logoPath: "/images/motogp/manufacturers/ducati.svg",
  },
  aprilia: {
    color: "#D01212",
    shortName: "Aprilia",
    logoPath: "/images/motogp/manufacturers/aprilia.svg",
  },
  ktm: {
    color: "#FF6600",
    shortName: "KTM",
    logoPath: "/images/motogp/manufacturers/ktm.svg",
  },
  yamaha: {
    color: "#0047AB",
    shortName: "Yamaha",
    logoPath: "/images/motogp/manufacturers/yamaha.svg",
  },
  honda: {
    color: "#E40521",
    shortName: "Honda",
    logoPath: "/images/motogp/manufacturers/honda.svg",
  },
};

const MOTOGP_TEAMS: Record<string, TeamBranding> = {
  ducatilenovoteam: {
    color: "#CC0000",
    shortName: "Ducati Lenovo",
    logoPath: "/images/motogp/teams/ducati-lenovo.svg",
  },
  aprilia: {
    color: "#D01212",
    shortName: "Aprilia",
    logoPath: "/images/motogp/teams/aprilia-racing.svg",
  },
  redbullgasgastech3: {
    color: "#FF6600",
    shortName: "Tech3",
    logoPath: "/images/motogp/teams/tech3.svg",
  },
};

export function getTeamBranding(
  team: string | undefined,
  sport: RaceSummarySport
): TeamBranding {
  if (!team) {
    return { color: "#64748b", shortName: "—" };
  }

  const key = normalizeTeamKey(team);
  const table =
    sport === "f1"
      ? F1_TEAMS
      : { ...MOTOGP_MANUFACTURERS, ...MOTOGP_TEAMS };

  for (const [brandKey, branding] of Object.entries(table)) {
    if (key.includes(brandKey) || brandKey.includes(key)) {
      return branding;
    }
  }

  if (sport === "motogp") {
    for (const [brandKey, branding] of Object.entries(MOTOGP_MANUFACTURERS)) {
      if (team.toLowerCase().includes(brandKey)) {
        return branding;
      }
    }
  }

  return {
    color: "#64748b",
    shortName: team.split(" ").slice(0, 2).join(" "),
    logoPath:
      sport === "f1"
        ? `/images/f1/teams/${slugifyTeam(team)}.svg`
        : `/images/motogp/manufacturers/${slugifyTeam(team)}.svg`,
  };
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}
