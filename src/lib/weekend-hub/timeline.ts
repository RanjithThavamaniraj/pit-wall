import type {
  HubSession,
  StageStatus,
  TimelineStage,
  TimelineStageDef,
  WeekendHubData,
} from "./types";

function isPracticeKey(key: string): boolean {
  return /^fp\d+$/.test(key) || key === "pr";
}

function isQualifyingKey(key: string): boolean {
  return /^q\d+$/.test(key) || key === "qualifying";
}

function buildF1StageDefs(isSprintWeekend: boolean): TimelineStageDef[] {
  const stages: TimelineStageDef[] = [
    { id: "opens", label: "Weekend Opens", sessionKeys: [], virtual: true },
    { id: "fp1", label: "FP1", sessionKeys: ["fp1"] },
    { id: "fp2", label: "FP2", sessionKeys: ["fp2"] },
  ];

  if (isSprintWeekend) {
    stages.push(
      {
        id: "sprint_qualifying",
        label: "Sprint Qualifying",
        sessionKeys: ["sprint_qualifying"],
      },
      { id: "sprint", label: "Sprint", sessionKeys: ["sprint"] }
    );
  } else {
    stages.push({ id: "fp3", label: "FP3", sessionKeys: ["fp3"] });
  }

  stages.push(
    { id: "qualifying", label: "Qualifying", sessionKeys: ["qualifying"] },
    { id: "race", label: "Race", sessionKeys: ["race"] }
  );

  return stages;
}

function buildMotoGpStageDefs(sessions: HubSession[]): TimelineStageDef[] {
  const practiceSessions = sessions.filter((s) => isPracticeKey(s.key));
  const qualifyingKeys = sessions
    .filter((s) => isQualifyingKey(s.key))
    .map((s) => s.key);
  const hasSprint = sessions.some((s) => s.key === "sprint");

  const stages: TimelineStageDef[] = [
    { id: "opens", label: "Weekend Opens", sessionKeys: [], virtual: true },
  ];

  const practiceOne = practiceSessions[0];
  const practiceTwo = practiceSessions[1];

  stages.push({
    id: "practice-1",
    label: "Practice",
    sessionKeys: practiceOne ? [practiceOne.key] : [],
  });

  stages.push({
    id: "practice-2",
    label: "Practice",
    sessionKeys: practiceTwo ? [practiceTwo.key] : [],
  });

  stages.push({
    id: "qualifying",
    label: "Qualifying",
    sessionKeys: qualifyingKeys.length
      ? qualifyingKeys
      : ["q1", "q2", "qualifying"],
  });

  if (hasSprint) {
    stages.push({
      id: "sprint",
      label: "Sprint",
      sessionKeys: ["sprint"],
    });
  }

  stages.push({
    id: "race",
    label: "Race",
    sessionKeys: ["race"],
  });

  return stages;
}

function sessionStageStatus(sessions: HubSession[]): StageStatus {
  const matched = sessions;
  if (!matched.length) return "upcoming";
  if (matched.some((s) => s.status === "live")) return "current";
  if (matched.every((s) => s.status === "completed" || s.status === "cancelled")) {
    return matched.some((s) => s.status === "completed") ? "completed" : "upcoming";
  }
  if (
    matched.some((s) => s.status === "completed") &&
    matched.some((s) => s.status === "upcoming")
  ) {
    return "current";
  }
  return "upcoming";
}

function virtualOpensStatus(allSessions: HubSession[]): StageStatus {
  if (!allSessions.length) return "upcoming";
  const first = allSessions[0];
  if (first.status === "upcoming") {
    return allSessions.every((s) => s.status === "upcoming")
      ? "current"
      : "completed";
  }
  return "completed";
}

function resolveStageStatus(
  def: TimelineStageDef,
  allSessions: HubSession[]
): StageStatus {
  if (def.virtual) {
    return virtualOpensStatus(allSessions);
  }

  const matched = allSessions.filter((s) => def.sessionKeys.includes(s.key));
  return sessionStageStatus(matched);
}

/** Ensure exactly one stage is marked current when the weekend is active. */
function normalizeCurrentStage(stages: TimelineStage[]): TimelineStage[] {
  const currentIndices = stages
    .map((stage, index) => (stage.status === "current" ? index : -1))
    .filter((index) => index >= 0);

  if (currentIndices.length === 1) return stages;
  if (currentIndices.length === 0) {
    const firstUpcoming = stages.findIndex((s) => s.status === "upcoming");
    if (firstUpcoming === -1) return stages;
    return stages.map((stage, index) =>
      index === firstUpcoming ? { ...stage, status: "current" } : stage
    );
  }

  const keepIndex = currentIndices[0];
  return stages.map((stage, index) => {
    if (index === keepIndex) return stage;
    if (stage.status === "current") return { ...stage, status: "upcoming" };
    return stage;
  });
}

export function buildTimelineStages(data: WeekendHubData): TimelineStage[] {
  const defs =
    data.sport === "f1"
      ? buildF1StageDefs(data.isSprintWeekend)
      : buildMotoGpStageDefs(data.sessions);

  const stages = defs.map((def) => ({
    id: def.id,
    label: def.label,
    status: resolveStageStatus(def, data.sessions),
  }));

  if (data.isPast) {
    return stages.map((stage) => ({ ...stage, status: "completed" as const }));
  }

  if (data.isCancelled) {
    return stages;
  }

  return normalizeCurrentStage(stages);
}

/** Build stage definitions for a sport — exposed for future custom stages. */
export function getTimelineStageDefs(data: WeekendHubData): TimelineStageDef[] {
  return data.sport === "f1"
    ? buildF1StageDefs(data.isSprintWeekend)
    : buildMotoGpStageDefs(data.sessions);
}
