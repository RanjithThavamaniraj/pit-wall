import { assembleFromTimeline } from "./assemble";
import type { ReplaySourceAdapter } from "./types";
import {
  type BuildContext,
  type BuildReplayPackageResult,
} from "./types";
import { validateReplayPackage } from "./validatePackage";

/**
 * Orchestrate: adapter → assemble → validate.
 * Does not write files — call `writeReplayPackage` separately.
 */
export async function buildReplayPackage(
  adapter: ReplaySourceAdapter,
  input: unknown,
  context: BuildContext
): Promise<BuildReplayPackageResult> {
  const adapted = await adapter.build(input, context);

  if (!adapted.ok) {
    return {
      ok: false,
      adapterId: adapter.id,
      reason: adapted.reason,
      issues: adapted.issues ?? [
        {
          path: "adapter",
          message: adapted.reason,
          severity: "error",
        },
      ],
    };
  }

  let timeline = adapted.timeline;

  // Enforce request context — adapters must not cross sports/slugs.
  if (timeline.sport !== context.sport || timeline.slug !== context.slug) {
    return {
      ok: false,
      adapterId: adapter.id,
      reason: "adapter timeline sport/slug does not match build context",
      issues: [
        {
          path: "timeline",
          message: `expected ${context.sport}/${context.slug}, got ${timeline.sport}/${timeline.slug}`,
          severity: "error",
        },
      ],
    };
  }

  if (context.sessionKind && timeline.sessionKind !== context.sessionKind) {
    timeline = { ...timeline, sessionKind: context.sessionKind };
  }

  if (context.circuitSvgUrl && !timeline.circuitSvgUrl) {
    timeline = { ...timeline, circuitSvgUrl: context.circuitSvgUrl };
  }

  const assembled = assembleFromTimeline(timeline);
  const validation = validateReplayPackage(assembled);

  if (!validation.ok) {
    return {
      ok: false,
      adapterId: adapter.id,
      reason: "assembled package failed validation",
      issues: validation.issues,
    };
  }

  return {
    ok: true,
    adapterId: adapter.id,
    package: validation.package,
    warnings: validation.warnings,
  };
}
