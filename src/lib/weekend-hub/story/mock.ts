import type { HubSession, HubSport, WeekendPhase } from "../types";
import type { RaceWeekendSummary } from "@/lib/race-summary/types";
import type { LiveEvent } from "../events";
import type { StoryContext, WeekendStory } from "./types";
import { buildWeekendStory } from "./generator";

function sessionsFor(
  sport: HubSport,
  phase: WeekendPhase,
  sprint: boolean
): HubSession[] {
  const base =
    sport === "motogp"
      ? [
          { key: "p1", label: "Practice 1" },
          { key: "p2", label: "Practice 2" },
          { key: "qualifying", label: "Qualifying" },
          ...(sprint ? [{ key: "sprint", label: "Sprint" }] : []),
          { key: "race", label: "Race" },
        ]
      : [
          { key: "fp1", label: "Free Practice 1" },
          { key: "fp2", label: "Free Practice 2" },
          ...(sprint
            ? [
                { key: "sprint_qualifying", label: "Sprint Qualifying" },
                { key: "sprint", label: "Sprint" },
              ]
            : [{ key: "fp3", label: "Free Practice 3" }]),
          { key: "qualifying", label: "Qualifying" },
          { key: "race", label: "Race" },
        ];

  const now = Date.now();
  const baseStatus: HubSession["status"] =
    phase === "completed"
      ? "completed"
      : phase === "live"
      ? "upcoming"
      : "upcoming";

  return base.map((s, index) => {
    let status: HubSession["status"] = baseStatus;
    if (phase === "live" && index === 0) {
      status = "live";
    }
    return {
      id: s.key,
      key: s.key,
      label: s.label,
      dateUtc: new Date(now + (index + 1) * 36 * 60 * 60 * 1000).toISOString(),
      status,
    };
  });
}

function summaryFor(
  sport: HubSport,
  slug: string,
  name: string
): RaceWeekendSummary {
  const f1winner = {
    position: 1,
    name: "Lando Norris",
    team: "McLaren",
    number: 4,
  };
  const f1second = {
    position: 2,
    name: "Max Verstappen",
    team: "Red Bull",
    number: 1,
  };
  const f1third = {
    position: 3,
    name: "Charles Leclerc",
    team: "Ferrari",
    number: 16,
  };
  const motogpWinner = {
    position: 1,
    name: "Francesco Bagnaia",
    team: "Ducati Lenovo Team",
    number: 1,
  };
  const motogpSecond = {
    position: 2,
    name: "Jorge Martín",
    team: "Pramac Racing",
    number: 89,
  };
  const motogpThird = {
    position: 3,
    name: "Brad Binder",
    team: "KTM Factory Racing",
    number: 33,
  };

  const raceResults = sport === "motogp"
    ? [motogpWinner, motogpSecond, motogpThird]
    : [f1winner, f1second, f1third];

  const driversChampionship = sport === "motogp"
    ? [
        { position: 1, name: "Francesco Bagnaia", points: 342 },
        { position: 2, name: "Jorge Martín", points: 328 },
      ]
    : [
        { position: 1, name: "Lando Norris", points: 311 },
        { position: 2, name: "Max Verstappen", points: 297 },
      ];

  return {
    sport,
    slug,
    round: 9,
    season: new Date().getFullYear(),
    name,
    shortName: name.split(" ").slice(0, 2).join(" "),
    raceResults,
    polePosition: sport === "motogp" ? "Francesco Bagnaia" : "Lando Norris",
    fastestLap: sport === "motogp" ? "Brad Binder" : "Lando Norris",
    driversChampionship,
    constructorsChampionship: sport === "motogp" ? undefined : [
      { position: 1, name: "McLaren", points: 412 },
      { position: 2, name: "Red Bull", points: 389 },
    ],
    statistics: [
      { label: "Attendance", value: "120,000", icon: "👥", highlight: false },
    ],
  };
}

export function buildMockStoryContext(
  sport: HubSport,
  slug: string,
  name: string,
  phase: WeekendPhase,
  options: {
    sprint?: boolean;
    liveEvents?: LiveEvent[];
    summary?: RaceWeekendSummary | null;
  } = {}
): StoryContext {
  const sprint = options.sprint ?? (sport === "f1" ? true : true);
  return {
    sport,
    weekendSlug: slug,
    weekendName: name,
    phase,
    sessions: sessionsFor(sport, phase, sprint),
    liveEvents: options.liveEvents,
    summary: options.summary ?? null,
    isSprintWeekend: sprint,
  };
}

export function buildMockWeekendStory(
  sport: HubSport,
  slug: string,
  name: string,
  phase: WeekendPhase
): WeekendStory {
  const summaryNeeded = phase === "completed";
  const context = buildMockStoryContext(sport, slug, name, phase, {
    summary: summaryNeeded ? summaryFor(sport, slug, name) : null,
  });
  return buildWeekendStory(context);
}