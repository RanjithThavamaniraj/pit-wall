import { OpenF1RaceControl } from "./timing";

export type BriefingCategory = "RACE_CONTROL" | "INCIDENT" | "STRATEGY" | "WEATHER" | "SESSION";
export type BriefingTone = "green" | "amber" | "red" | "blue" | "neutral";

export type BriefingItem = {
  id: string;
  timestampUtc: string;
  category: BriefingCategory;
  severity: BriefingTone;
  sourceEvent: string;
  explanation: string;
};

/**
 * Translation Engine: Converts raw FIA race control messages into fan-friendly briefings.
 *
 * Rules:
 * - Explanations may only restate what is explicitly present in the source event.
 * - No strategy predictions, penalty forecasts, assumed causes, or inferred consequences.
 * - FIA sporting regulation facts (e.g. DRS eligibility window, VSC delta rule) are
 *   permitted because they are fixed rules, not predictions about this specific race.
 * - If the source message contains a car number, driver name, or lap number, it must
 *   be extracted from the message text — never fabricated.
 */
export function translateRaceControlMessage(msg: OpenF1RaceControl): BriefingItem | null {
  const text = msg.message.toUpperCase();

  // ─── 1. Session Status ────────────────────────────────────────────────────

  if (msg.category === "SessionStatus") {
    if (text.includes("FINISHED")) {
      return {
        id: `${msg.date}-session-end`,
        timestampUtc: msg.date,
        category: "SESSION",
        severity: "neutral",
        sourceEvent: msg.message,
        // "Finished" is the exact status from the source. No inferred consequences.
        explanation: "Session status: Finished.",
      };
    }
    if (text.includes("ABORTED")) {
      return {
        id: `${msg.date}-session-aborted`,
        timestampUtc: msg.date,
        category: "SESSION",
        severity: "red",
        sourceEvent: msg.message,
        explanation: "Session status: Aborted.",
      };
    }
    if (text.includes("STARTED")) {
      return {
        id: `${msg.date}-session-started`,
        timestampUtc: msg.date,
        category: "SESSION",
        severity: "green",
        sourceEvent: msg.message,
        explanation: "Session status: Started.",
      };
    }
  }

  // ─── 2. Flags ─────────────────────────────────────────────────────────────

  if (msg.category === "Flag") {
    if (msg.flag === "RED") {
      return {
        id: `${msg.date}-red-flag`,
        timestampUtc: msg.date,
        category: "RACE_CONTROL",
        severity: "red",
        sourceEvent: msg.message,
        // Red flag = session suspended per FIA sporting regs. No assumed cause.
        explanation: "Red flag shown. The session has been suspended.",
      };
    }

    if (text.includes("SAFETY CAR DEPLOYED") || msg.flag === "SAFETY CAR") {
      return {
        id: `${msg.date}-sc`,
        timestampUtc: msg.date,
        category: "RACE_CONTROL",
        severity: "amber",
        sourceEvent: msg.message,
        // "Overtaking prohibited" is a fixed FIA SC regulation — not a prediction.
        explanation: "Safety Car deployed. Overtaking is prohibited.",
      };
    }

    if (text.includes("SAFETY CAR IN THIS LAP") || msg.flag === "SAFETY CAR IN THIS LAP") {
      return {
        id: `${msg.date}-sc-in`,
        timestampUtc: msg.date,
        category: "RACE_CONTROL",
        severity: "amber",
        sourceEvent: msg.message,
        explanation: "Safety Car is returning to the pit lane this lap.",
      };
    }

    if (text.includes("VIRTUAL SAFETY CAR ENDING") || msg.flag === "VIRTUAL SAFETY CAR ENDING") {
      return {
        id: `${msg.date}-vsc-ending`,
        timestampUtc: msg.date,
        category: "RACE_CONTROL",
        severity: "amber",
        sourceEvent: msg.message,
        explanation: "Virtual Safety Car period is ending.",
      };
    }

    if (text.includes("VIRTUAL SAFETY CAR") || msg.flag === "VIRTUAL SAFETY CAR") {
      return {
        id: `${msg.date}-vsc`,
        timestampUtc: msg.date,
        category: "RACE_CONTROL",
        severity: "amber",
        sourceEvent: msg.message,
        // VSC delta rule is a fixed FIA regulation, not inferred.
        explanation: "Virtual Safety Car deployed. Drivers must maintain a minimum lap delta. Overtaking is prohibited.",
      };
    }

    if (msg.flag === "CHEQUERED") {
      return {
        id: `${msg.date}-chequered`,
        timestampUtc: msg.date,
        category: "SESSION",
        severity: "neutral",
        sourceEvent: msg.message,
        explanation: "Chequered flag shown.",
      };
    }

    if (msg.flag === "CLEAR") {
      return {
        id: `${msg.date}-clear`,
        timestampUtc: msg.date,
        category: "RACE_CONTROL",
        severity: "green",
        sourceEvent: msg.message,
        explanation: "Track is clear.",
      };
    }

    if (msg.flag === "YELLOW") {
      // Sector yellows are very frequent and low-signal. Only surface them if
      // a sector or scope is identified in the message.
      const sectorMatch = text.match(/SECTOR\s*(\d+)/);
      if (sectorMatch) {
        return {
          id: `${msg.date}-yellow-sector-${sectorMatch[1]}`,
          timestampUtc: msg.date,
          category: "RACE_CONTROL",
          severity: "amber",
          sourceEvent: msg.message,
          explanation: `Yellow flag in Sector ${sectorMatch[1]}.`,
        };
      }
      // Generic yellow — surface but keep minimal
      return {
        id: `${msg.date}-yellow`,
        timestampUtc: msg.date,
        category: "RACE_CONTROL",
        severity: "amber",
        sourceEvent: msg.message,
        explanation: "Yellow flag shown.",
      };
    }

    if (msg.flag === "DOUBLE YELLOW") {
      return {
        id: `${msg.date}-double-yellow`,
        timestampUtc: msg.date,
        category: "RACE_CONTROL",
        severity: "amber",
        sourceEvent: msg.message,
        explanation: "Double yellow flag shown. Drivers must be prepared to stop.",
      };
    }
  }

  // ─── 3. DRS ───────────────────────────────────────────────────────────────

  if (text.includes("DRS ENABLED")) {
    return {
      id: `${msg.date}-drs-enabled`,
      timestampUtc: msg.date,
      category: "RACE_CONTROL",
      severity: "green",
      sourceEvent: msg.message,
      // DRS eligibility (within 1 second) is a fixed FIA regulation — not an inferred outcome.
      explanation: "DRS is enabled. Drivers within one second of the car ahead may use DRS in designated zones.",
    };
  }

  if (text.includes("DRS DISABLED")) {
    return {
      id: `${msg.date}-drs-disabled`,
      timestampUtc: msg.date,
      category: "RACE_CONTROL",
      severity: "amber",
      sourceEvent: msg.message,
      // No assumed reason — we don't know why it was disabled from this event alone.
      explanation: "DRS is disabled.",
    };
  }

  // ─── 4. Incidents & Investigations ───────────────────────────────────────

  if (text.includes("UNDER INVESTIGATION")) {
    // Extract car numbers directly from the message text.
    const carMatch = text.match(/CAR[S]?\s*([\d,\s&AND]+)/i);
    const cars = carMatch ? carMatch[1].trim() : null;

    // Extract the alleged offence if present
    const offenceMatch = msg.message.match(/\(([^)]+)\)/);
    const offence = offenceMatch ? offenceMatch[1] : null;

    const parts: string[] = [];
    if (cars) parts.push(`Car(s) ${cars} under investigation.`);
    else parts.push("Incident under investigation.");
    if (offence) parts.push(`Alleged infringement: ${offence}.`);

    return {
      id: `${msg.date}-investigation`,
      timestampUtc: msg.date,
      category: "INCIDENT",
      severity: "amber",
      sourceEvent: msg.message,
      explanation: parts.join(" "),
    };
  }

  if (text.includes("WILL BE INVESTIGATED")) {
    const carMatch = text.match(/CAR[S]?\s*([\d,\s&AND]+)/i);
    const cars = carMatch ? carMatch[1].trim() : null;

    const offenceMatch = msg.message.match(/\(([^)]+)\)/);
    const offence = offenceMatch ? offenceMatch[1] : null;

    const parts: string[] = [];
    if (cars) parts.push(`Incident involving car(s) ${cars} will be investigated.`);
    else parts.push("Incident will be investigated.");
    if (offence) parts.push(`Alleged infringement: ${offence}.`);

    return {
      id: `${msg.date}-will-investigate`,
      timestampUtc: msg.date,
      category: "INCIDENT",
      severity: "amber",
      sourceEvent: msg.message,
      explanation: parts.join(" "),
    };
  }

  if (text.includes("NO FURTHER ACTION") || text.includes("NO FURTHER INVESTIGATION")) {
    const carMatch = text.match(/CAR[S]?\s*([\d,\s&AND]+)/i);
    const cars = carMatch ? carMatch[1].trim() : null;
    const base = cars ? `Car(s) ${cars}:` : "Incident:";
    return {
      id: `${msg.date}-no-further-action`,
      timestampUtc: msg.date,
      category: "INCIDENT",
      severity: "green",
      sourceEvent: msg.message,
      explanation: `${base} No further action.`,
    };
  }

  if (text.includes("TIME PENALTY") || text.includes("DRIVE THROUGH") || text.includes("STOP AND GO") || text.includes("REPRIMAND") || text.includes("GRID PENALTY")) {
    // A penalty has already been issued — surfacing the exact penalty from the message.
    const penaltyMatch = msg.message.match(/(\d+\s*SECOND[S]?\s*TIME PENALTY|DRIVE[\s-]THROUGH|STOP[\s&]+GO|REPRIMAND|GRID PENALTY)/i);
    const penalty = penaltyMatch ? penaltyMatch[1] : "Penalty";
    const carMatch = text.match(/CAR\s*(\d+)/);
    const car = carMatch ? `Car ${carMatch[1]}` : "A driver";
    return {
      id: `${msg.date}-penalty`,
      timestampUtc: msg.date,
      category: "INCIDENT",
      severity: "red",
      sourceEvent: msg.message,
      explanation: `${car} has been issued: ${penalty}.`,
    };
  }

  if (text.includes("NOTED") && (text.includes("INCIDENT") || text.includes("CAR"))) {
    const carMatch = text.match(/CAR[S]?\s*([\d,\s&AND]+)/i);
    const cars = carMatch ? carMatch[1].trim() : null;
    const base = cars ? `Incident involving car(s) ${cars}:` : "Incident:";
    return {
      id: `${msg.date}-noted`,
      timestampUtc: msg.date,
      category: "INCIDENT",
      severity: "neutral",
      sourceEvent: msg.message,
      explanation: `${base} Noted by Race Control.`,
    };
  }

  // ─── 5. Track Limits (Lap Deletions) ─────────────────────────────────────

  if (text.includes("LAP DELETED") || (text.includes("TIME") && text.includes("DELETED"))) {
    const carMatch = text.match(/CAR\s*(\d+)/);
    const car = carMatch ? `Car ${carMatch[1]}` : "A car";
    const lapMatch = text.match(/LAP\s*(\d+)/);
    const lap = lapMatch ? `, lap ${lapMatch[1]}` : "";
    return {
      id: `${msg.date}-lap-deleted-${carMatch?.[1] ?? "unknown"}`,
      timestampUtc: msg.date,
      category: "INCIDENT",
      severity: "amber",
      sourceEvent: msg.message,
      // No penalty prediction. Just what happened.
      explanation: `${car}: lap time deleted${lap} for exceeding track limits.`,
    };
  }

  // ─── 6. Weather & Track Conditions ───────────────────────────────────────

  if (text.includes("SLIPPERY") || text.includes("LOW GRIP")) {
    return {
      id: `${msg.date}-weather-grip`,
      timestampUtc: msg.date,
      category: "WEATHER",
      severity: "amber",
      sourceEvent: msg.message,
      // Reporting what Race Control stated. No inferred driving consequences.
      explanation: "Race Control has reported slippery / low-grip conditions on track.",
    };
  }

  if (text.includes("DEBRIS")) {
    const sectorMatch = text.match(/SECTOR\s*(\d+)/);
    const location = sectorMatch ? ` in Sector ${sectorMatch[1]}` : "";
    return {
      id: `${msg.date}-debris`,
      timestampUtc: msg.date,
      category: "RACE_CONTROL",
      severity: "amber",
      sourceEvent: msg.message,
      explanation: `Debris on track${location}.`,
    };
  }

  // ─── 7. Pit Lane Status ───────────────────────────────────────────────────

  if (text.includes("PIT LANE CLOSED")) {
    return {
      id: `${msg.date}-pit-closed`,
      timestampUtc: msg.date,
      category: "RACE_CONTROL",
      severity: "red",
      sourceEvent: msg.message,
      // No assumed exception rules.
      explanation: "Pit lane closed.",
    };
  }

  if (text.includes("PIT LANE OPEN")) {
    return {
      id: `${msg.date}-pit-open`,
      timestampUtc: msg.date,
      category: "RACE_CONTROL",
      severity: "green",
      sourceEvent: msg.message,
      explanation: "Pit lane open.",
    };
  }

  // ─── 8. Medical / Safety ─────────────────────────────────────────────────

  if (text.includes("MEDICAL CAR")) {
    return {
      id: `${msg.date}-medical`,
      timestampUtc: msg.date,
      category: "RACE_CONTROL",
      severity: "red",
      sourceEvent: msg.message,
      explanation: "Medical car deployed.",
    };
  }

  // ─── Filter: unmatched messages suppressed ────────────────────────────────
  return null;
}
