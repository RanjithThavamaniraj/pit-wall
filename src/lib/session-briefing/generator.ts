import type { WeekendContext } from "@/lib/weekend";
import type { SeasonSchedule } from "@/lib/schedule";
import { getPreviousRace } from "@/lib/schedule";
import { fetchAllStandings } from "@/lib/standings";
import {
  getWeekendContext as buildIntelligenceContext,
  buildWeekendOutlook,
} from "@/lib/weekend-context";
import { getTopProfile } from "@/lib/driver-intelligence";
import { weekendHubFromF1, deriveWeekendPhase } from "@/lib/weekend-hub";
import { loadRaceWeekendSummary } from "@/lib/race-summary/loader";
import { formatOrdinal } from "@/lib/utils";
import {
  fetchLiveQualifyingClassification,
  fetchLiveSprintClassification,
} from "./live-results";
import { deriveBriefingPhase } from "./phase";
import type {
  BriefingPhase,
  SessionBriefing,
  SessionBriefingSection,
} from "./types";

function section(
  id: string,
  heading: string,
  body: string
): SessionBriefingSection {
  return { id, heading, body };
}

function now(): string {
  return new Date().toISOString();
}

async function buildBeforeFp1(
  context: WeekendContext,
  schedule: SeasonSchedule
): Promise<SessionBriefing> {
  const { currentWeekend } = context;
  const sections: SessionBriefingSection[] = [];

  try {
    const standings = await fetchAllStandings();
    const leader = standings.drivers[0];
    const p2 = standings.drivers[1];
    if (leader) {
      sections.push(
        section(
          "standings",
          "Championship standings",
          p2
            ? `${leader.firstName} ${leader.lastName} leads the World Drivers' Championship with ${leader.points} points, ${p2.gapToLeader} ahead of ${p2.firstName} ${p2.lastName}.`
            : `${leader.firstName} ${leader.lastName} leads the World Drivers' Championship with ${leader.points} points.`
        )
      );
    }
  } catch {
    // No verified standings available — omit rather than guess.
  }

  try {
    const previousRace = getPreviousRace(schedule);
    if (previousRace) {
      const summary = await loadRaceWeekendSummary("f1", previousRace.slug);
      const winner = summary?.raceResults?.[0];
      if (winner) {
        sections.push(
          section(
            "previous-race",
            "Previous race",
            `${winner.name} won the ${previousRace.name}.`
          )
        );
      }
    }
  } catch {
    // No verified previous-race result — omit.
  }

  try {
    const past = schedule.races.filter((r) => r.isPast).map((r) => r.slug);
    const hubData = weekendHubFromF1(currentWeekend);
    const intelligence = await buildIntelligenceContext({
      sport: "f1",
      weekendSlug: currentWeekend.slug,
      weekendName: currentWeekend.name,
      phase: deriveWeekendPhase(hubData),
      isSprintWeekend: hubData.isSprintWeekend,
      completedWeekendSlugs: past,
      sessions: hubData.sessions,
    });

    const outlook = buildWeekendOutlook(intelligence, hubData.sessions);
    if (outlook.hasSignal) {
      sections.push(
        section(
          "weekend-outlook",
          "Weekend Outlook",
          `${outlook.name}${outlook.team ? ` (${outlook.team})` : ""} enters the weekend as the Weekend Outlook favourite. ${outlook.reason}`
        )
      );
    }

    const drivers = intelligence.sources.driverIntelligence;
    const topProfile = drivers ? getTopProfile(drivers) : undefined;
    if (topProfile) {
      sections.push(
        section(
          "driver-intelligence",
          "Driver Intelligence",
          `${topProfile.name} carries the strongest recent-form rating into the weekend (momentum ${topProfile.ratings.momentum}/100).`
        )
      );
    }
  } catch {
    // No verified intelligence signal — omit.
  }

  return {
    phase: "before-fp1",
    title: "Weekend Briefing",
    statusLabel: "Weekend preview",
    sections,
    generatedAt: now(),
  };
}

function buildGracefulStatus(
  phase: BriefingPhase,
  sessionLabel: string,
  isLive: boolean
): SessionBriefing {
  const body = isLive
    ? `${sessionLabel} is currently underway. Official session results will be available once ${sessionLabel} concludes.`
    : `${sessionLabel} has concluded. PitWall does not track official classification for this session.`;

  return {
    phase,
    title: isLive ? `${sessionLabel} Underway` : `${sessionLabel} Complete`,
    statusLabel: isLive ? "Live" : "Session complete",
    sections: [section("status", "Current session", body)],
    generatedAt: now(),
  };
}

function buildRaceLiveStatus(): SessionBriefing {
  return {
    phase: "race-live",
    title: "Race in Progress",
    statusLabel: "Live",
    sections: [
      section(
        "status",
        "Current Session",
        "Race in progress. Official results will become available after the session concludes."
      ),
    ],
    generatedAt: now(),
  };
}

async function buildQualifyingDone(
  context: WeekendContext
): Promise<SessionBriefing> {
  const { currentWeekend } = context;
  const sections: SessionBriefingSection[] = [];

  try {
    const classification = await fetchLiveQualifyingClassification(
      currentWeekend.season,
      currentWeekend.round
    );

    if (classification && classification.length > 0) {
      const pole = classification.find((r) => r.position === 1);
      const frontRow = classification.filter((r) => r.position <= 2);

      if (pole) {
        sections.push(
          section(
            "pole",
            "Pole position",
            `${pole.name}${pole.team ? ` (${pole.team})` : ""} took pole position for the ${currentWeekend.name}.`
          )
        );
      }

      if (frontRow.length === 2) {
        sections.push(
          section(
            "front-row",
            "Front row",
            `${frontRow[0].name} starts alongside ${frontRow[1].name} on the front row.`
          )
        );
      }

      if (pole) {
        try {
          const standings = await fetchAllStandings();
          const poleStanding = standings.drivers.find(
            (d) => `${d.firstName} ${d.lastName}` === pole.name
          );
          if (poleStanding) {
            sections.push(
              section(
                "championship",
                "Championship context",
                poleStanding.position === 1
                  ? `${pole.name} starts from pole as the current championship leader with ${poleStanding.points} points.`
                  : `${pole.name} starts from pole, currently ${formatOrdinal(poleStanding.position)} in the championship with ${poleStanding.points} points, ${poleStanding.gapToLeader} behind the leader.`
              )
            );
          }
        } catch {
          // No verified standings context — omit.
        }
      }
    }
  } catch {
    // No verified qualifying classification — fall through to graceful status below.
  }

  if (sections.length === 0) {
    sections.push(
      section(
        "status",
        "Current session",
        "Qualifying has concluded. Official qualifying classification is not yet available."
      )
    );
  }

  return {
    phase: "qualifying-done",
    title: "Qualifying Result",
    statusLabel: "Session complete",
    sections,
    generatedAt: now(),
  };
}

async function buildSprintDone(
  context: WeekendContext
): Promise<SessionBriefing> {
  const { currentWeekend } = context;
  const sections: SessionBriefingSection[] = [];

  try {
    const results = await fetchLiveSprintClassification(
      currentWeekend.season,
      currentWeekend.round
    );

    if (results && results.length > 0) {
      const winner = results.find((r) => r.position === 1);
      if (winner) {
        sections.push(
          section(
            "sprint-winner",
            "Sprint winner",
            `${winner.name}${winner.team ? ` (${winner.team})` : ""} won the sprint at the ${currentWeekend.name}.`
          )
        );
      }

      const podium = results
        .filter((r) => r.position > 1 && r.position <= 3)
        .sort((a, b) => a.position - b.position);
      if (podium.length > 0) {
        sections.push(
          section(
            "sprint-podium",
            "Sprint podium",
            podium
              .map((r) => `${formatOrdinal(r.position)}: ${r.name}`)
              .join(" · ")
          )
        );
      }
    }
  } catch {
    // No verified sprint classification — fall through to graceful status below.
  }

  if (sections.length === 0) {
    sections.push(
      section(
        "status",
        "Current session",
        "The sprint has concluded. Official sprint classification is not yet available."
      )
    );
  }

  return {
    phase: "sprint-done",
    title: "Sprint Result",
    statusLabel: "Session complete",
    sections,
    generatedAt: now(),
  };
}

async function buildRaceDone(
  context: WeekendContext,
  schedule: SeasonSchedule
): Promise<SessionBriefing> {
  const { currentWeekend } = context;
  const sections: SessionBriefingSection[] = [];

  try {
    const summary = await loadRaceWeekendSummary("f1", currentWeekend.slug);
    if (summary) {
      const winner = summary.raceResults?.[0];
      if (winner) {
        sections.push(
          section(
            "winner",
            "Race winner",
            `${winner.name}${winner.team ? ` (${winner.team})` : ""} won the ${currentWeekend.name}.`
          )
        );
      }

      const podium = summary.raceResults?.slice(0, 3) ?? [];
      if (podium.length === 3) {
        sections.push(
          section(
            "podium",
            "Podium",
            podium
              .map((p, i) => `${formatOrdinal(i + 1)}: ${p.name}`)
              .join(" · ")
          )
        );
      }

      const leader = summary.driversChampionship?.[0];
      if (leader) {
        sections.push(
          section(
            "championship",
            "Championship movement",
            `${leader.name} leads the championship with ${leader.points} points after Round ${currentWeekend.round}.`
          )
        );
      }
    }
  } catch {
    // No verified race summary — omit.
  }

  try {
    const past = schedule.races.filter((r) => r.isPast).map((r) => r.slug);
    const hubData = weekendHubFromF1(currentWeekend);
    const intelligence = await buildIntelligenceContext({
      sport: "f1",
      weekendSlug: currentWeekend.slug,
      weekendName: currentWeekend.name,
      phase: deriveWeekendPhase(hubData),
      isSprintWeekend: hubData.isSprintWeekend,
      completedWeekendSlugs: past,
      sessions: hubData.sessions,
    });

    const outlook = buildWeekendOutlook(intelligence, hubData.sessions);
    if (outlook.hasSignal) {
      sections.push(
        section(
          "weekend-outlook",
          "Weekend Outlook",
          `${outlook.name} carries the strongest recent form into the next round.`
        )
      );
    }

    const drivers = intelligence.sources.driverIntelligence;
    const topProfile = drivers ? getTopProfile(drivers) : undefined;
    if (topProfile) {
      sections.push(
        section(
          "driver-intelligence",
          "Driver Intelligence",
          `${topProfile.name}'s momentum rating now sits at ${topProfile.ratings.momentum}/100 heading into the next round.`
        )
      );
    }
  } catch {
    // No verified intelligence signal — omit.
  }

  if (sections.length === 0) {
    sections.push(
      section(
        "status",
        "Current session",
        "The race has concluded. Official results are not yet available."
      )
    );
  }

  return {
    phase: "race-done",
    title: "Race Summary",
    statusLabel: "Race complete",
    sections,
    generatedAt: now(),
  };
}

function fallbackBriefing(): SessionBriefing {
  return {
    phase: "before-fp1",
    title: "Weekend Briefing",
    statusLabel: "Weekend preview",
    sections: [],
    generatedAt: now(),
  };
}

/**
 * Builds the phase-aware Session Briefing for the current F1 weekend.
 *
 * Every section is either (a) sourced directly from verified calendar,
 * standings, results, or intelligence-engine data, or (b) a plain factual
 * statement of session status. Nothing here simulates live commentary,
 * incidents, pace, or strategy — when verified data isn't available yet,
 * the briefing says so instead of guessing.
 */
export async function buildSessionBriefing(
  context: WeekendContext,
  schedule: SeasonSchedule
): Promise<SessionBriefing> {
  try {
    const phase = deriveBriefingPhase(context);
    const activeLabel =
      context.activeSession?.label ?? context.nextSession?.label ?? "Session";

    switch (phase) {
      case "before-fp1":
        return await buildBeforeFp1(context, schedule);
      case "practice-live":
      case "sprint-qualifying-live":
      case "qualifying-live":
      case "sprint-live":
        return buildGracefulStatus(phase, activeLabel, true);
      case "practice-done":
      case "sprint-qualifying-done":
        return buildGracefulStatus(phase, activeLabel, false);
      case "race-live":
        return buildRaceLiveStatus();
      case "qualifying-done":
        return await buildQualifyingDone(context);
      case "sprint-done":
        return await buildSprintDone(context);
      case "race-done":
        return await buildRaceDone(context, schedule);
      default:
        return fallbackBriefing();
    }
  } catch {
    return fallbackBriefing();
  }
}
