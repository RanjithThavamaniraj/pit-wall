import { buildPackage } from "@/lib/replay/buildPackage";
import type {
  ReplayBookmark,
  ReplayEvent,
  ReplayPackage,
  ReplaySample,
} from "@/lib/replay/types";
import { compareByCursor, sampleCursor } from "./cursor";
import {
  REPLAY_SCHEMA_VERSION,
  type ValidationIssue,
  type ValidationResult,
} from "./types";

function error(path: string, message: string): ValidationIssue {
  return { path, message, severity: "error" };
}

function warning(path: string, message: string): ValidationIssue {
  return { path, message, severity: "warning" };
}

function isSortedByCursor(
  items: Array<{ lap: number; t?: number }>
): boolean {
  for (let i = 1; i < items.length; i += 1) {
    const prev = items[i - 1];
    const curr = items[i];
    if (!prev || !curr) continue;
    if (compareByCursor(prev, curr) > 0) return false;
  }
  return true;
}

function validateSample(
  sample: ReplaySample,
  index: number,
  totalLaps: number,
  issues: ValidationIssue[]
) {
  const path = `samples[${index}]`;

  if (sample.lap < 1 || sample.lap > totalLaps) {
    issues.push(
      error(path, `lap ${sample.lap} is outside 1..${totalLaps}`)
    );
  }

  if (sample.t !== undefined && (sample.t < 0 || sample.t >= 1)) {
    issues.push(error(`${path}.t`, "must be in [0, 1)"));
  }

  if (!sample.drivers.length) {
    issues.push(error(`${path}.drivers`, "must include at least one driver"));
    return;
  }

  const positions = new Set<number>();
  const codes = new Set<string>();

  for (let i = 0; i < sample.drivers.length; i += 1) {
    const driver = sample.drivers[i];
    if (!driver) continue;
    const dPath = `${path}.drivers[${i}]`;

    if (positions.has(driver.position)) {
      issues.push(error(dPath, `duplicate position P${driver.position}`));
    }
    positions.add(driver.position);

    if (codes.has(driver.code)) {
      issues.push(error(dPath, `duplicate driver code ${driver.code}`));
    }
    codes.add(driver.code);

    if (driver.progress < 0 || driver.progress > 1) {
      issues.push(error(`${dPath}.progress`, "must be in [0, 1]"));
    }
  }

  if (!positions.has(1) || !positions.has(2) || !positions.has(3)) {
    issues.push(
      error(
        `${path}.drivers`,
        "must include P1, P2, and P3 (current TrackMap contract)"
      )
    );
  }
}

function validateEvent(
  event: ReplayEvent,
  index: number,
  totalLaps: number,
  issues: ValidationIssue[]
) {
  const path = `events[${index}]`;
  if (event.lap < 1 || event.lap > totalLaps + 1) {
    issues.push(
      error(path, `lap ${event.lap} is outside expected race range`)
    );
  }
  if (event.t !== undefined && (event.t < 0 || event.t >= 1)) {
    issues.push(error(`${path}.t`, "must be in [0, 1)"));
  }
}

function validateBookmark(
  bookmark: ReplayBookmark,
  index: number,
  totalLaps: number,
  issues: ValidationIssue[]
) {
  const path = `bookmarks[${index}]`;
  if (bookmark.lap < 1 || bookmark.lap > totalLaps) {
    issues.push(
      error(path, `lap ${bookmark.lap} is outside 1..${totalLaps}`)
    );
  }
  if (bookmark.t !== undefined && (bookmark.t < 0 || bookmark.t >= 1)) {
    issues.push(error(`${path}.t`, "must be in [0, 1)"));
  }
  if (!bookmark.label.trim()) {
    issues.push(error(`${path}.label`, "must be non-empty"));
  }
}

/**
 * Strict semantic validation for ReplayPackage content.
 * Structural parsing is reused via `buildPackage` when validating unknown JSON.
 */
export function validateReplayPackage(
  value: ReplayPackage | unknown
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  const pkg =
    value &&
    typeof value === "object" &&
    "version" in value &&
    "samples" in value &&
    Array.isArray((value as ReplayPackage).samples)
      ? (value as ReplayPackage)
      : buildPackage(value);

  if (!pkg) {
    return {
      ok: false,
      issues: [
        error(
          "$",
          "package failed structural parse (schemaVersion / required fields)"
        ),
      ],
    };
  }

  // schemaVersion
  if (pkg.version !== REPLAY_SCHEMA_VERSION) {
    issues.push(
      error(
        "version",
        `unsupported schemaVersion ${pkg.version}; expected ${REPLAY_SCHEMA_VERSION}`
      )
    );
  }

  if (pkg.sport !== "f1" && pkg.sport !== "motogp") {
    issues.push(error("sport", `invalid sport "${String(pkg.sport)}"`));
  }

  if (!pkg.slug?.trim()) {
    issues.push(error("slug", "required metadata: slug"));
  }

  if (!pkg.sessionKind) {
    issues.push(error("sessionKind", "required metadata: sessionKind"));
  }

  if (!Number.isFinite(pkg.totalLaps) || pkg.totalLaps < 1) {
    issues.push(error("totalLaps", "required metadata: totalLaps >= 1"));
  }

  if (!pkg.samples.length) {
    issues.push(error("samples", "at least one sample is required"));
  }

  if (!isSortedByCursor(pkg.samples)) {
    issues.push(error("samples", "must be ordered by lap, then t"));
  }

  for (let i = 0; i < pkg.samples.length; i += 1) {
    const sample = pkg.samples[i];
    if (sample) validateSample(sample, i, pkg.totalLaps, issues);
  }

  // Detect duplicate sample cursors
  const sampleCursors = new Set<number>();
  for (let i = 0; i < pkg.samples.length; i += 1) {
    const sample = pkg.samples[i];
    if (!sample) continue;
    const cursor = sampleCursor(sample);
    if (sampleCursors.has(cursor)) {
      issues.push(
        error(`samples[${i}]`, `duplicate sample cursor at lap=${sample.lap}`)
      );
    }
    sampleCursors.add(cursor);
  }

  if (!isSortedByCursor(pkg.events)) {
    issues.push(error("events", "must be ordered by lap, then t"));
  }

  const eventIds = new Set<string>();
  for (let i = 0; i < pkg.events.length; i += 1) {
    const event = pkg.events[i];
    if (!event) continue;
    validateEvent(event, i, pkg.totalLaps, issues);
    if (eventIds.has(event.id)) {
      issues.push(error(`events[${i}].id`, `duplicate event id "${event.id}"`));
    }
    eventIds.add(event.id);
  }

  if (!isSortedByCursor(pkg.bookmarks)) {
    issues.push(error("bookmarks", "must be ordered by lap, then t"));
  }

  const bookmarkIds = new Set<string>();
  for (let i = 0; i < pkg.bookmarks.length; i += 1) {
    const bookmark = pkg.bookmarks[i];
    if (!bookmark) continue;
    validateBookmark(bookmark, i, pkg.totalLaps, issues);
    if (bookmarkIds.has(bookmark.id)) {
      issues.push(
        error(`bookmarks[${i}].id`, `duplicate bookmark id "${bookmark.id}"`)
      );
    }
    bookmarkIds.add(bookmark.id);
  }

  const firstSample = pkg.samples[0];
  if (firstSample && firstSample.lap !== 1) {
    warnings.push(
      warning(
        "samples",
        "first sample is not lap 1; scrubber may jump at start"
      )
    );
  }

  const hasFinishBookmark = pkg.bookmarks.some((b) => b.kind === "finish");
  const hasFinishEvent = pkg.events.some((e) => e.type === "finish");
  if (!hasFinishBookmark && !hasFinishEvent) {
    warnings.push(
      warning("bookmarks", "no finish bookmark/event — recommended for UX")
    );
  }

  if (issues.some((issue) => issue.severity === "error")) {
    return { ok: false, issues: [...issues, ...warnings] };
  }

  return { ok: true, package: pkg, warnings };
}
