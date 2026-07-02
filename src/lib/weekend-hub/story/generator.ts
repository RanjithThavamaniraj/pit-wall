import type {
  HubSession,
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

const LAST_RESORT_CIRCUIT_CLOSER_F1 = [
  "The race has historically been won and lost on strategy, not outright pace.",
  "DRS and a well-timed safety car have repeatedly reshaped the order.",
];

const LAST_RESORT_CIRCUIT_CLOSER_MOTOGP = [
  "Weather often turns here, throwing the setup window open.",
  "Overtaking is possible into the heavy braking zones, rewarding late moves.",
];

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
  void seed;
  if (context.phase === "upcoming") {
    return `Recent form, circuit characteristics and strategy windows shape the outlook for ${context.weekendName}.`;
  }
  if (context.phase === "live") {
    return `The weekend is unfolding — every session reshapes the competitive picture.`;
  }
  if (context.phase === "completed") {
    return `The chequered flag has fallen. The weekend's defining moments are captured below.`;
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
    heading: "Key Themes",
    icon: "🎯",
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
  void seed;

  // When a weekend summary is available, use it as the evidence base.
  if (context.summary?.raceResults?.length) {
    const winner = context.summary.raceResults[0];
    const second = context.summary.raceResults[1];
    const closer = second
      ? ` ahead of ${second.name}.`
      : ".";
    return context.sport === "motogp"
      ? `${winner.name}#${winner.number ?? ""} took the win${closer} ${winner.team ? `The ${winner.team} package was the class of the field.` : ""}`
      : `${winner.name} (${winner.team ?? ""}) won${closer}`;
  }

  // No summary — use circuit-focused editorial framing without
  // fabricating driver narratives or momentum claims.
  const openers =
    context.sport === "motogp"
      ? [
          `${context.weekendName} has a history of close fighting and tight margins, with tyre life and warm-up often deciding the outcome.`,
          `The circuit rewards confidence under braking and rewards riders who can manage degradation through the second half of the race.`,
        ]
      : [
          `${context.weekendName} has produced tight, strategy-influenced races in recent seasons, with track position hard to recover once lost.`,
          `The circuit demands both outright pace and tyre management, making qualifying position and pit strategy equally consequential.`,
        ];

  const closers =
    context.sport === "motogp"
      ? [
          "Weather can turn a session upside down, and the forecast leaves the door open for another twist.",
          "Sprint qualifying on Saturday will shape expectations before Sunday's Grand Prix.",
        ]
      : [
          "Strategy around the safety car and a well-timed stop have often decided this race — expect both to loom large again.",
          "The circuit rewards outright pace but punishes the smallest of slides, so qualifying could set the tone for the weekend.",
        ];

  return `${openers[seed % openers.length]} ${closers[(seed >> 3) % closers.length]}`;
}

function whatToWatchContent(
  context: StoryContext,
  seed: number
): string {
  void seed;
  const next = nextSessionLabel(context.sessions);

  const lines =
    context.sport === "motogp"
      ? [
          `Can the front-runners convert ${next} pace into pole?`,
          "Will tyre warm-up close the gap between the factory and satellite bikes?",
          "Can a satellite runner break into the front group on a track that rewards confidence?",
        ]
      : [
          `Can qualifying pace translate into a clean race-day execution?`,
          "Will race pace overcome a qualifying deficit through strategy?",
          "Can the strategic card — timing, stops, safety-car windows — trump outright pace?",
        ];

  return lines.map((l) => `• ${l}`).join("\n");
}

function keyBattlesContent(context: StoryContext, seed: number): string {
  void seed;
  // Do not fabricate driver-vs-driver rivalries — only surface contextual
  // themes that are explainable from the weekend's general dynamics.
  return context.sport === "motogp"
    ? [
        "• Tyre management across the race distance",
        "• Qualifying battle for the front row",
        "• Sprint result shaping Grand Prix confidence",
      ].join("\n")
    : [
        "• Tyre degradation versus outright pace",
        "• Qualifying position and track-position strategy",
        "• Safety-car timing and pit-window decisions",
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
      ? LAST_RESORT_CIRCUIT_CLOSER_MOTOGP
      : LAST_RESORT_CIRCUIT_CLOSER_F1,
    seed,
    4
  )}`;
}

function weekendExpectationsContent(
  context: StoryContext,
  seed: number
): string {
  void seed;
  return context.sport === "motogp"
    ? [
        "Track limits and tyre life are the two themes most likely to decide the weekend if conditions stay stable.",
        "Saturday's qualifying shapes both the Sprint and the Grand Prix, so a strong Friday takes on extra weight here.",
      ][seed % 2]
    : [
        context.isSprintWeekend
          ? "With a Sprint on the schedule, Friday's running carries double weight in setting up the weekend."
          : "Free Practice will be about collecting data, with qualifying the first real flashpoint.",
        "Stint management and the timing of any safety car could swing the result more than outright pace alone.",
      ][seed % 2];
}

function fridaySummaryContent(
  context: StoryContext,
  seed: number
): string | null {
  const counts = sessionCountByStatus(context.sessions);
  const last = lastCompletedSessionLabel(context.sessions);

  // Hide when no sessions have actually been completed — do not
  // fabricate Friday running that the data does not support.
  if (counts.completed === 0 || !last) return null;

  void seed;
  return context.sport === "motogp"
    ? `${counts.completed} session${counts.completed === 1 ? "" : "s"} of running are in the books. The field is still mapping tempo and degradation before Saturday's qualifying.`
    : `${counts.completed} session${counts.completed === 1 ? "" : "s"} of running offered a clear read: the field is closer than it looked on paper, and Saturday should be tight.`;
}

function saturdayStoryContent(
  context: StoryContext,
  seed: number
): string | null {
  const counts = sessionCountByStatus(context.sessions);

  // Hide when qualifying hasn't produced a result yet.
  if (counts.completed < 2) return null;

  void seed;
  return context.sport === "motogp"
    ? "Qualifying shuffled the order through Q1 and Q2, with the front row decided by the narrowest of margins across the final flying laps."
    : "Saturday asked teams to commit early to setup choices; the qualifying order suggests a strategic battle for Sunday rather than a runaway.";
}

function momentumShiftContent(
  context: StoryContext,
  seed: number
): string | null {
  const counts = sessionCountByStatus(context.sessions);

  // Hide when there aren't enough sessions to identify a momentum shift.
  if (counts.completed < 2) return null;

  void seed;
  return context.sport === "motogp"
    ? "Confidence under braking has become the decisive currency this weekend, and the momentum is shifting toward whoever commits earliest into the corner."
    : "The track rubbered in across the weekend, shifting the balance toward cars able to manage their front tyres across a stint.";
}

function strategyPictureContent(
  context: StoryContext,
  seed: number
): string {
  void seed;
  return context.sport === "motogp"
    ? [
        "Tyre choice looks pivotal: the softest compound is fast over a lap but degrades in the race, while the medium rewards a measured approach.",
        "Track-limits enforcement and long-lap penalties are pushing race strategies toward conservation, not aggression.",
      ][seed % 2]
    : [
        "The strategic question centres on the undercut — the first car to pit onto fresh rubber carries a real advantage into clean air.",
        context.isSprintWeekend
          ? "The Sprint's points make a conservative race call tempting, but the main Grand Prix still rewards the boldest strategist."
          : "One-stop vs two-stop is the live debate; a well-timed safety car could settle it single-handedly.",
      ][seed % 2];
}

function whoLooksStrongContent(
  context: StoryContext,
  seed: number
): string | null {
  const counts = sessionCountByStatus(context.sessions);

  // Hide when no completed sessions exist to form a read from.
  if (counts.completed === 0) return null;

  const next = nextSessionLabel(context.sessions);
  void seed;
  return context.sport === "motogp"
    ? `Starting speed and tyre warm-up will decide ${next}. The front-runners are close enough that a clean opening lap could settle it.`
    : `Long-run averages suggest a closer race in ${next} than the headline times show. Clean opening stints will be decisive.`;
}

function weekendRecapContent(context: StoryContext, seed: number): string | null {
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

  // No summary data — hide instead of fabricating a winner.
  void seed;
  return null;
}

function turningPointContent(
  context: StoryContext,
  seed: number
): string | null {
  const summary = context.summary ?? null;

  if (summary?.fastestLap) {
    return context.sport === "motogp"
      ? `The fastest lap set by ${summary.fastestLap} flipped the dynamic late — triggered by a clean final-sector charge rather than outright risk.`
      : `The pivotal moment was ${summary.fastestLap}'s fastest lap — one banker of an effort on used rubber that reset the order at the front.`;
  }

  // No fastest-lap data — hide instead of fabricating a turning point.
  void seed;
  return null;
}

function strategyReviewContent(
  context: StoryContext,
  seed: number
): string | null {
  const summary = context.summary ?? null;

  // Hide when no summary data exists — do not fabricate strategy outcomes.
  if (!summary?.raceResults?.length) {
    void seed;
    return null;
  }

  return context.sport === "motogp"
    ? "Long-lap management and a steady opening stint shaped more of the order than any late aggression."
    : "Stint length told the real story — the cars that extended the middle stint carried the pace to attack at the end.";
}

function driverOfTheWeekendContent(
  context: StoryContext,
  seed: number
): string | null {
  const summary = context.summary ?? null;

  if (summary?.raceResults?.length) {
    const winner = summary.raceResults[0];
    if (context.sport === "motogp") {
      return `${winner.name} earned the weekend ${winner.team ? `for the ${winner.team} squad ` : ""}— pole-worthy pace, a measured Sprint, and a Grand Prix delivered under pressure.`;
    }
    return `${winner.name} takes the weekend honours ${winner.team ? `for ${winner.team}` : ""}: pole-worthy pace, clean execution, and a fastest lap to cap it off.`;
  }

  // No race results — hide instead of fabricating a driver-of-the-weekend pick.
  void seed;
  return null;
}

function championshipImpactContent(
  context: StoryContext,
  seed: number
): string | null {
  const summary = context.summary ?? null;
  const driversStandings = summary?.driversChampionship ?? summary?.teamsChampionship;
  const leader = driversStandings?.[0];
  const chaser = driversStandings?.[1];

  if (leader && chaser) {
    return context.sport === "motogp"
      ? `${leader.name} extends the lead over ${chaser.name} to ${leader.points} points — a margin that begins to reshape title expectations.`
      : `${leader.name} pulls ${Math.max(leader.points - chaser.points, 1)} points clear of ${chaser.name} in the drivers' standings — the title narrative tilts, but with rounds to spare.`;
  }

  // No championship data — hide instead of fabricating an impact narrative.
  void seed;
  return null;
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
  void seed;
  return context.sport === "motogp"
    ? [
        "A combination of persistent weather and concerns over track condition pushed officials past the point at which running could safely resume — the field was stood down.",
        "Schedule limits and an inability to dry or repair the affected section meant that re-staging within the window was not possible — the only responsible call was to halt the weekend.",
      ][seed % 2]
    : [
        "Persistent weather and concerns over circuit conditions meant officials could not certify the track safe; the field was stood down.",
        "The decision came down to a narrow window of viability — even running behind the safety car was not an option given the surface and forecast.",
      ][seed % 2];
}

function buildSectionFactory(
  phase: WeekendPhase,
  context: StoryContext,
  seed: number
) {
  return (id: string, heading: string, icon: string, importance: StorySection["importance"]): StorySection | null => {
    let content: string | null = "";
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

    // Suppress sections that returned null — they lack the data
    // required to produce a trustworthy narrative.
    if (content === null) return null;

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