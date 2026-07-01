import type {
  HubSession,
  HubSport,
  WeekendPhase,
} from "../types";
import type { StoryContext, StorySection, WeekendStory } from "./types";

function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

function pick<T>(pool: readonly T[], seed: number, salt = 0): T {
  return pool[(seed + salt) % pool.length];
}

function weekendHash(context: StoryContext): number {
  return hashSeed(`${context.sport}:${context.weekendSlug}:${context.phase}`);
}

const F1_FRONT_RUNNERS = [
  "Verstappen",
  "Norris",
  "Leclerc",
  "Piastri",
  "Russell",
  "Hamilton",
  "Sainz",
  "Alonso",
];

const F1_TEAMS = [
  "Red Bull",
  "McLaren",
  "Ferrari",
  "Mercedes",
  "Aston Martin",
];

const MOTOGP_FRONT_RUNNERS = [
  "Bagnaia",
  "Martín",
  "Binder",
  "Marini",
  "Bastianini",
  "Viñales",
  "Di Giannantonio",
  "Oliveira",
];

const MOTOGP_TEAMS = [
  "Ducati Lenovo Team",
  "Pramac Racing",
  "KTM Factory Racing",
  "Mooney VR46",
  "Gresini Racing",
];

function driverForSport(
  sport: HubSport,
  seed: number,
  salt: number
): string {
  return sport === "motogp"
    ? pick(MOTOGP_FRONT_RUNNERS, seed, salt)
    : pick(F1_FRONT_RUNNERS, seed, salt);
}

function teamForSport(
  sport: HubSport,
  seed: number,
  salt: number
): string {
  return sport === "motogp"
    ? pick(MOTOGP_TEAMS, seed, salt)
    : pick(F1_TEAMS, seed, salt);
}

function competitorLabel(sport: HubSport): "driver" | "rider" {
  return sport === "motogp" ? "rider" : "driver";
}

function sessionCountByStatus(
  sessions: HubSession[]
): { live: number; upcoming: number; completed: number } {
  let live = 0;
  let upcoming = 0;
  let completed = 0;
  for (const session of sessions) {
    if (session.status === "live") live += 1;
    else if (session.status === "upcoming") upcoming += 1;
    else if (session.status === "completed") completed += 1;
  }
  return { live, upcoming, completed };
}

function nextSessionLabel(sessions: HubSession[]): string {
  return (
    sessions.find((s) => s.status === "upcoming")?.label ??
    sessions.find((s) => s.status === "live")?.label ??
    "the next session"
  );
}

function lastCompletedSessionLabel(sessions: HubSession[]): string | null {
  for (let i = sessions.length - 1; i >= 0; i--) {
    if (sessions[i].status === "completed") return sessions[i].label;
  }
  return null;
}

function weekendTitle(context: StoryContext): string {
  if (context.phase === "live") return `${context.weekendName}: Live`;
  if (context.phase === "completed") return `${context.weekendName} Recap`;
  if (context.phase === "cancelled") return `${context.weekendName}: Status`;
  return `${context.weekendName} Preview`;
}

function weekendSubtitle(
  context: StoryContext,
  seed: number
): string {
  const competitor = driverForSport(context.sport, seed, 0);
  const team = teamForSport(context.sport, seed, 1);
  if (context.phase === "upcoming") {
    return `${team} arrive with questions to answer, while ${competitor} shapes as the figure to beat.`;
  }
  if (context.phase === "live") {
    return `The story is unfolding — ${competitor} and ${team} are setting the early tone.`;
  }
  if (context.phase === "completed") {
    return `The chequered flag has fallen. ${competitor} and ${team} define the weekend's narrative.`;
  }
  return `Conditions have shifted around ${context.weekendName} and the weekend will not run as planned.`;
}

const UPCOMING_SECTION_DEFS: {
  id: string;
  heading: string;
  icon: string;
  importance: StorySection["importance"];
}[] = [
  {
    id: "story-so-far",
    heading: "The Story So Far",
    icon: "📖",
    importance: "primary",
  },
  {
    id: "what-to-watch",
    heading: "What To Watch",
    icon: "🔍",
    importance: "secondary",
  },
  {
    id: "key-battles",
    heading: "Key Battles",
    icon: "⚔️",
    importance: "secondary",
  },
  {
    id: "circuit-spotlight",
    heading: "Circuit Spotlight",
    icon: "🗺",
    importance: "tertiary",
  },
  {
    id: "weekend-expectations",
    heading: "Weekend Expectations",
    icon: "🎯",
    importance: "tertiary",
  },
];

const LIVE_SECTION_DEFS: {
  id: string;
  heading: string;
  icon: string;
  importance: StorySection["importance"];
}[] = [
  {
    id: "friday-summary",
    heading: "Friday Summary",
    icon: "📅",
    importance: "primary",
  },
  {
    id: "saturday-story",
    heading: "Saturday Story",
    icon: "📰",
    importance: "secondary",
  },
  {
    id: "momentum-shift",
    heading: "Momentum Shift",
    icon: "📈",
    importance: "secondary",
  },
  {
    id: "strategy-picture",
    heading: "Strategy Picture",
    icon: "🧠",
    importance: "tertiary",
  },
  {
    id: "who-looks-strong",
    heading: "Who Looks Strong",
    icon: "💪",
    importance: "primary",
  },
];

const COMPLETED_SECTION_DEFS: {
  id: string;
  heading: string;
  icon: string;
  importance: StorySection["importance"];
}[] = [
  {
    id: "weekend-recap",
    heading: "Weekend Recap",
    icon: "🏁",
    importance: "primary",
  },
  {
    id: "turning-point",
    heading: "Turning Point",
    icon: "🌀",
    importance: "secondary",
  },
  {
    id: "strategy-review",
    heading: "Strategy Review",
    icon: "🧠",
    importance: "tertiary",
  },
  {
    id: "driver-of-the-weekend",
    heading: "Driver Of The Weekend",
    icon: "⭐",
    importance: "secondary",
  },
  {
    id: "championship-impact",
    heading: "Championship Impact",
    icon: "🏆",
    importance: "primary",
  },
];

const CANCELLED_SECTION_DEFS: {
  id: string;
  heading: string;
  icon: string;
  importance: StorySection["importance"];
}[] = [
  {
    id: "weekend-status",
    heading: "Weekend Status",
    icon: "⚠",
    importance: "primary",
  },
  {
    id: "why-the-weekend-changed",
    heading: "Why The Weekend Changed",
    icon: "🔎",
    importance: "primary",
  },
];

function storySoFarContent(context: StoryContext, seed: number): string {
  const a = driverForSport(context.sport, seed, 0);
  const b = driverForSport(context.sport, seed, 1);
  const tA = teamForSport(context.sport, seed, 0);
  const tB = teamForSport(context.sport, seed, 1);

  const openers =
    context.sport === "motogp"
      ? [
          `${a} arrives carrying momentum after a consistent run of podiums, while ${tB} continues to close the gap in the title race.`,
          `${tA} travel here quietly confident — ${a} has been the standout across the last three rounds and the factory squad is starting to respond.`,
          `Recent form places ${a} firmly in the conversation, but ${tB} have shown enough through practice running to believe they can close across a race distance.`,
        ]
      : [
          `${tA} arrive carrying momentum after two strong weekends, while ${tB} continue to close the gap in both championships.`,
          `${a} travels here as the form ${competitorLabel(context.sport)}, with ${tB} quietly confident that their race pace will translate.`,
          `The narrative this season has tightened — ${a} holds the initiative, but ${b} has been the closer of the challengers in recent rounds.`,
        ];

  const closers =
    context.sport === "motogp"
      ? [
          `${tA} traditionally go well here, making this one of the most unpredictable rounds of the season.`,
          `Tyre life and warm-up have decided this Grand Prix in the past — and both look set to shape the fight again.`,
          `The weather can turn a session upside down, and the forecast leaves the door open for another twist.`,
        ]
      : [
          `${tA} traditionally perform well here, making this one of the most unpredictable races of the season.`,
          `Strategy around the safety car and a well-timed stop have often decided this race — expect both to loom large again.`,
          `The circuit rewards outright pace but punishes the smallest of slides, so qualifying could set the tone for the weekend.`,
        ];

  return `${openers[seed % openers.length]} ${closers[(seed >> 3) % closers.length]}`;
}

function whatToWatchContent(
  context: StoryContext,
  seed: number
): string {
  const a = driverForSport(context.sport, seed, 0);
  const tA = teamForSport(context.sport, seed, 0);
  const tB = teamForSport(context.sport, seed, 1);

  const lines =
    context.sport === "motogp"
      ? [
          `Can ${a} convert ${nextSessionLabel(context.sessions)} pace into pole?`,
          `Will ${tB} close the race-distance gap to ${tA}?`,
          `Can the satellite runners break into the front group on a track that rewards confidence?`,
        ]
      : [
          `Can ${tA} maintain qualifying pace through to the race?`,
          `Will ${tB} convert race pace into victory?`,
          `Can ${a} challenge by playing the strategy card rather than chasing outright pace?`,
        ];

  return lines.map((l) => `• ${l}`).join("\n");
}

function keyBattlesContent(context: StoryContext, seed: number): string {
  const a = driverForSport(context.sport, seed, 0);
  const b = driverForSport(context.sport, seed, 1);
  const tA = teamForSport(context.sport, seed, 0);
  const tB = teamForSport(context.sport, seed, 1);

  return context.sport === "motogp"
    ? [
        `${a} vs ${b}`,
        `${tA} vs ${tB}`,
        `Tyre degradation versus outright race pace`,
      ].join("\n")
    : [
        `${a} vs ${b}`,
        `${tA} vs ${tB}`,
        `Tyre degradation versus outright pace`,
      ].join("\n");
}

function circuitSpotlightContent(
  context: StoryContext,
  seed: number
): string {
  const pool =
    context.sport === "motogp"
      ? [
          `${context.weekendName} mixes long straights with technical sections, so the bike has to do a bit of everything well across a lap.`,
          `Heavy braking points and quick changes of direction define the layout here — confidence under braking will decide the front row.`,
          `Track layout punishes overheating the front tyre, so warm-up and conservation matter as much as outright pace.`,
        ]
      : [
          `${context.weekendName} rewards high-speed commitment but demands precision through the slower sections.`,
          `The circuit is notorious for testing tyre temperatures and brake management across a stint.`,
          `A blend of fast sweeps and heavy braking zones gives this venue one of the most varied technical briefs on the calendar.`,
        ];

  return `${pool[seed % pool.length]} ${pick(
    context.sport === "motogp"
      ? [
          "Weather often turns here, throwing the setup window open.",
          "Overtaking is possible into the heavy braking zones, rewarding late moves.",
        ]
      : [
        "The race has historically been won and lost on strategy, not outright pace.",
        "DRS and a well-timed safety car have repeatedly reshaped the order.",
      ],
    seed,
    4
  )}`;
}

function weekendExpectationsContent(
  context: StoryContext,
  seed: number
): string {
  const a = driverForSport(context.sport, seed, 0);
  const tB = teamForSport(context.sport, seed, 1);

  return context.sport === "motogp"
    ? [
        `Expect ${a} to set the early benchmark, with ${tB} requiring a clean Saturday to displace them on the front row.`,
        `Track limits and tyre life are the two themes most likely to decide the weekend if conditions stay stable.`,
        "Saturday's qualifying shapes both the Sprint and the Grand Prix, so a strong Friday takes on extra weight here.",
      ][seed % 3]
    : [
        `Expect ${tB} to push hard on Saturday to break ${a}'s recent grip on pole.`,
        context.isSprintWeekend
          ? "With a Sprint on the schedule, Friday's running carries double weight in setting up the weekend."
          : `Free Practice will be about collecting data, with qualifying the first real flashpoint.`,
        "Stint management and the timing of any safety car could swing the result more than outright pace alone.",
      ][seed % 3];
}

function fridaySummaryContent(
  context: StoryContext,
  seed: number
): string {
  const a = driverForSport(context.sport, seed, 0);
  const tA = teamForSport(context.sport, seed, 0);
  const counts = sessionCountByStatus(context.sessions);
  const last = lastCompletedSessionLabel(context.sessions);

  return context.sport === "motogp"
    ? [
        `${a} topped the early running with a clean programme across both ${last ?? "opening"} sessions, building a base Sunday's Grand Prix will lean on.`,
        `${tA} hovered near the top of the timesheets without overcommitting; the sense is that there is more to come on Saturday.`,
      ][seed % 2]
    : [
        `Friday painted a familiar picture — ${a} looked comfortable straight away, while ${tA} methodically worked through long-run data.`,
        `${counts.completed} session${counts.completed === 1 ? "" : "s"} of running offered a clear read: the field is closer than it looked on paper, and Saturday should be tight.`,
      ][seed % 2];
}

function saturdayStoryContent(
  context: StoryContext,
  seed: number
): string {
  const a = driverForSport(context.sport, seed, 0);
  const b = driverForSport(context.sport, seed, 1);
  const tB = teamForSport(context.sport, seed, 1);

  return context.sport === "motogp"
    ? [
        `Qualifying delivered on its billing — ${a} took the fight to ${b} for pole, with ${tB} forced to charge from the second row on Sunday.`,
        `The order shuffled through Q1 and Q2, but ${a} held their nerve when the track was at its best to stamp authority on the front row.`,
      ][seed % 2]
    : [
        `The headline from Saturday: ${a} out-qualified ${b} by the narrowest of margins, setting up a strategic battle for Sunday.`,
        `Saturday asked teams to commit early to setup choices; ${tB} leaned into race pace over single-lap performance and could yet profit.`,
      ][seed % 2];
}

function momentumShiftContent(
  context: StoryContext,
  seed: number
): string {
  const a = driverForSport(context.sport, seed, 0);
  const tB = teamForSport(context.sport, seed, 1);

  return context.sport === "motogp"
    ? [
        `The pendulum swung slightly across the most recent sessions — ${a} looked most settled, but ${tB} closed the gap in race trim.`,
        `Confidence under braking has become the decisive currency this weekend, and the momentum has shifted toward whoever commits earliest into the corner.`,
      ][seed % 2]
    : [
        `Momentum flickered between ${a} and ${tB} across Saturday; long-run averages suggest a closer race than the headline times show.`,
        "The track rubbered in across the weekend, shifting the balance toward cars able to manage their front tyres across a stint.",
      ][seed % 2];
}

function strategyPictureContent(
  context: StoryContext,
  seed: number
): string {
  const tA = teamForSport(context.sport, seed, 0);

  return context.sport === "motogp"
    ? [
        `Tyre choice looks pivotal: the softest compound is fast over a lap but degrades in the race, while the medium rewards ${tA}'s measured approach.`,
        `Track-limits enforcement and long-lap penalties are pushing race strategies toward conservation, not aggression.`,
      ][seed % 2]
    : [
        `The strategic question centres on the undercut — ${tA} may try to pit first and force the issue into clean air.`,
        context.isSprintWeekend
          ? "The Sprint's points make a conservative race call tempting, but the main Grand Prix still rewards the boldest strategist."
          : "One-stop vs two-stop is the live debate; a well-timed safety car could settle it single-handedly.",
      ][seed % 2];
}

function whoLooksStrongContent(
  context: StoryContext,
  seed: number
): string {
  const a = driverForSport(context.sport, seed, 0);
  const tB = teamForSport(context.sport, seed, 1);
  const next = nextSessionLabel(context.sessions);

  return context.sport === "motogp"
    ? [
        `${a} carries the most convincing case across both qualifying and race simulations, but ${tB} remain within range if the conditions shift.`,
        `Starting speed and tyre warm-up will decide ${next}; right now ${a} has the edge, with ${tB} having to find time on Sunday morning.`,
      ][seed % 2]
    : [
        `${a} looks the most complete package across the weekend so far — quick over a lap and gentle on the tyres.`,
        `${tB} have the pace to challenge in ${next}, but need a clean opening stint to live with the early leaders.`,
      ][seed % 2];
}

function weekendRecapContent(context: StoryContext, seed: number): string {
  const summary = context.summary ?? null;

  if (summary?.raceResults?.length) {
    const winner = summary.raceResults[0];
    const second = summary.raceResults[1];
    const third = summary.raceResults[2];

    const podiumLine =
      second && third
        ? `from ${second.name} and ${third.name}.`
        : second
        ? `from ${second.name}.`
        : ".";

    return context.sport === "motogp"
      ? `${winner.name} (#${winner.number ?? ""}) converted pole into victory under controlled pressure ${podiumLine} ${winner.team ? `The ${winner.team} machine was the class of the field.` : ""}`
      : `${winner.name} (${winner.team ?? ""}) won ${context.weekendName}, leading home ${podiumLine}`;
  }

  const a = driverForSport(context.sport, seed, 0);
  const tA = teamForSport(context.sport, seed, 0);

  return context.sport === "motogp"
    ? [
        `${a} converted the weekend's strongest all-round form into the headline result, with ${tA} consolidating their championship push.`,
        "Sunday played out on the cleaner side of the racing spectrum — a measured drive to the flag rather than a dramatic late pass.",
      ][seed % 2]
    : [
        `${a} converted the weekend's pace into a controlled victory, while ${tA} quietly banked a generous haul of championship points.`,
        "For all the pre-weekend intrigue, the race was decided by execution — clean stops, a tidy opening stint, and a calm finale.",
      ][seed % 2];
}

function turningPointContent(
  context: StoryContext,
  seed: number
): string {
  const summary = context.summary ?? null;

  if (summary?.fastestLap) {
    return context.sport === "motogp"
      ? [
          `The fastest lap of ${summary.fastestLap} flipped the dynamic late — triggered by a clean final-sector charge rather than outright risk.`,
          `A late flying effort from ${summary.fastestLap} changed the complexion of the run to the flag, forcing pursuers to chase an answer.`,
        ][seed % 2]
      : [
          `The pivotal moment was ${summary.fastestLap}'s fastest lap — one banker of an effort on used rubber that reset the order at the front.`,
          "A safety car restart inside the final third swung the race; the leader nailed the getaway and the challengers never recovered.",
        ][seed % 2];
  }

  const a = driverForSport(context.sport, seed, 0);

  return context.sport === "motogp"
    ? [
        `The decisive shift came on the exit of the long second corner — ${a} found drive nobody else could, and the race pivoted from there.`,
        "Track limits hunts added up at exactly the wrong moment, promoting a rethink of attack lines in the closing laps.",
      ][seed % 2]
    : [
        `The undercut proved decisive — ${a} stopped first, banked clean air, and rewrote the order before the leaders emerged.`,
        "A textbook restart after the safety car period handed the lead back to the car that had been quietly preparing for it.",
      ][seed % 2];
}

function strategyReviewContent(
  context: StoryContext,
  seed: number
): string {
  const tA = teamForSport(context.sport, seed, 0);

  return context.sport === "motogp"
    ? [
        `${tA} leaned on the medium rear for tyre life, while rivals chased outright pace with the soft — the delta only emerged across the final laps.`,
        "Long-lap management and a steady opening stint shaped more of the order than any late aggression.",
      ][seed % 2]
    : [
        `${tA} committed early to a two-stop and were rewarded when the virtual safety car aligned with their plan.`,
        "Stint length told the real story — the cars that extended the middle stint carried the pace to attack at the end.",
      ][seed % 2];
}

function driverOfTheWeekendContent(
  context: StoryContext,
  seed: number
): string {
  const summary = context.summary ?? null;

  if (summary?.raceResults?.length) {
    const winner = summary.raceResults[0];
    if (context.sport === "motogp") {
      return `${winner.name} earned the weekend ${winner.team ? `for the ${winner.team} squad ` : ""}— pole-worthy pace, a measured Sprint, and a Grand Prix delivered under pressure.`;
    }
    return `${winner.name} takes the weekend honours ${winner.team ? `for ${winner.team}` : ""}: pole-worthy pace, clean execution, and a fastest lap to cap it off.`;
  }

  const a = driverForSport(context.sport, seed, 0);

  return context.sport === "motogp"
    ? [
        `${a} earns the weekend honours on the strength of consistent running across every session, not just the race.`,
        "The standout of the weekend combined qualifying pace with race-day composure.",
      ][seed % 2]
    : [
        `${a} emerged as the weekend's standout — fast on Saturday, measured on Sunday, and decisive at the moment that mattered.`,
        "Driver of the weekend went to the one competitor who matched single-lap pace with race execution.",
      ][seed % 2];
}

function championshipImpactContent(
  context: StoryContext,
  seed: number
): string {
  const summary = context.summary ?? null;
  const driversStandings = summary?.driversChampionship ?? summary?.teamsChampionship;
  const leader = driversStandings?.[0];
  const chaser = driversStandings?.[1];

  if (leader && chaser) {
    return context.sport === "motogp"
      ? [
          `${leader.name} extends the lead over ${chaser.name} to ${leader.points} points — a margin that begins to reshape title expectations.`,
          `The title picture tightens subtly: ${leader.name} now sits ${Math.max(leader.points - chaser.points, 1)} clear of ${chaser.name} with the next round already in focus.`,
        ][seed % 2]
      : [
          `${leader.name} pulls ${Math.max(leader.points - chaser.points, 1)} points clear of ${chaser.name} in the drivers' standings — the title narrative tilts, but with rounds to spare.`,
          `${leader.name} consolidates top spot; ${chaser.name} stays within striking distance but needs a result soon.`,
        ][seed % 2];
  }

  const tA = teamForSport(context.sport, seed, 0);

  return context.sport === "motogp"
    ? [
        `Championship arithmetic shifts modestly this round; ${tA} banks more than enough to hold their position near the front of the table.`,
        "No decisive swing in the title fight, but the points banked here will matter when the calendar tightens.",
      ][seed % 2]
    : [
        `${tA} bank healthy points and consolidate their place in the constructors' fight — the real shake-up will come on a cleaner weekend.`,
        "Championship order barely shifted, but the momentum accumulating behind the lead group is.",
      ][seed % 2];
}

function weekendStatusContent(
  context: StoryContext,
  seed: number
): string {
  return context.sport === "motogp"
    ? [
        `${context.weekendName} will not run as scheduled. Race direction confirmed the cancellation following an inability to guarantee safe conditions for the field.`,
        `The Grand Prix has been called off — the circuit and paddock remain in place, but the on-track programme cannot continue this weekend.`,
      ][seed % 2]
    : [
        `${context.weekendName} has been cancelled. The FIA confirmed the decision after conditions made it impossible to run the remaining sessions safely.`,
        `The race will not go ahead. Organisers stressed the decision was taken reluctantly and on safety grounds alone.`,
      ][seed % 2];
}

function whyTheWeekendChangedContent(
  context: StoryContext,
  seed: number
): string {
  const tA = teamForSport(context.sport, seed, 0);

  return context.sport === "motogp"
    ? [
        `A combination of persistent weather and concerns over track condition pushed officials past the point at which running could safely resume — ${tA} and the rest of the field were stood down.`,
        `Schedule limits and an inability to dry or repair the affected section meant that re-staging within the window was not possible — the only responsible call was to halt the weekend.`,
      ][seed % 2]
    : [
        `Persistent weather and concerns over circuit conditions meant officials could not certify the track safe; ${tA} joined the rest of the field in standing down.`,
        `The decision came down to a narrow window of viability — even running behind the safety car was not an option given the surface and forecast.`,
      ][seed % 2];
}

function buildSectionFactory(
  phase: WeekendPhase,
  context: StoryContext,
  seed: number
) {
  return (id: string, heading: string, icon: string, importance: StorySection["importance"]): StorySection | null => {
    let content = "";
    switch (phase) {
      case "upcoming":
        switch (id) {
          case "story-so-far":
            content = storySoFarContent(context, seed);
            break;
          case "what-to-watch":
            content = whatToWatchContent(context, seed);
            break;
          case "key-battles":
            content = keyBattlesContent(context, seed);
            break;
          case "circuit-spotlight":
            content = circuitSpotlightContent(context, seed);
            break;
          case "weekend-expectations":
            content = weekendExpectationsContent(context, seed);
            break;
          default:
            return null;
        }
        break;
      case "live":
        switch (id) {
          case "friday-summary":
            content = fridaySummaryContent(context, seed);
            break;
          case "saturday-story":
            content = saturdayStoryContent(context, seed);
            break;
          case "momentum-shift":
            content = momentumShiftContent(context, seed);
            break;
          case "strategy-picture":
            content = strategyPictureContent(context, seed);
            break;
          case "who-looks-strong":
            content = whoLooksStrongContent(context, seed);
            break;
          default:
            return null;
        }
        break;
      case "completed":
        switch (id) {
          case "weekend-recap":
            content = weekendRecapContent(context, seed);
            break;
          case "turning-point":
            content = turningPointContent(context, seed);
            break;
          case "strategy-review":
            content = strategyReviewContent(context, seed);
            break;
          case "driver-of-the-weekend":
            content = driverOfTheWeekendContent(context, seed);
            break;
          case "championship-impact":
            content = championshipImpactContent(context, seed);
            break;
          default:
            return null;
        }
        break;
      case "cancelled":
        switch (id) {
          case "weekend-status":
            content = weekendStatusContent(context, seed);
            break;
          case "why-the-weekend-changed":
            content = whyTheWeekendChangedContent(context, seed);
            break;
          default:
            return null;
        }
        break;
    }

    return {
      id,
      heading,
      content,
      importance,
      icon,
    };
  };
}

export function buildStorySections(
  context: StoryContext
): StorySection[] {
  const seed = weekendHash(context);
  const factory = buildSectionFactory(context.phase, context, seed);

  const defs =
    context.phase === "upcoming"
      ? UPCOMING_SECTION_DEFS
      : context.phase === "live"
      ? LIVE_SECTION_DEFS
      : context.phase === "completed"
      ? COMPLETED_SECTION_DEFS
      : CANCELLED_SECTION_DEFS;

  const sections: StorySection[] = [];
  for (const def of defs) {
    const section = factory(def.id, def.heading, def.icon, def.importance);
    if (section) sections.push(section);
  }
  return sections;
}

export function buildWeekendStory(
  context: StoryContext
): WeekendStory {
  const seed = weekendHash(context);
  const sections = buildStorySections(context);

  return {
    title: weekendTitle(context),
    subtitle: weekendSubtitle(context, seed),
    phase: context.phase,
    sport: context.sport,
    generatedAt: new Date().toISOString(),
    sections,
  };
}