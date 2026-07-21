import { promises as fs } from "node:fs";
import path from "node:path";
import type { Championship } from "@/lib/live";
import type { ReplayPackage } from "@/lib/replay/types";
import { validateReplayPackage } from "./validatePackage";
import type { WritePackageResult } from "./types";

export function replayPackagePath(
  sport: Championship,
  slug: string,
  rootDir = process.cwd()
): string {
  return path.join(rootDir, "data", "replays", sport, `${slug}.json`);
}

/**
 * Persist a validated ReplayPackage to data/replays/{sport}/{slug}.json.
 * Re-validates before write; never writes invalid content.
 */
export async function writeReplayPackage(
  pkg: ReplayPackage,
  options?: { rootDir?: string; pretty?: boolean }
): Promise<WritePackageResult> {
  const validation = validateReplayPackage(pkg);
  if (!validation.ok) {
    const detail = validation.issues
      .filter((i) => i.severity === "error")
      .map((i) => `${i.path}: ${i.message}`)
      .join("; ");
    throw new Error(`Refusing to write invalid ReplayPackage — ${detail}`);
  }

  const filePath = replayPackagePath(
    validation.package.sport,
    validation.package.slug,
    options?.rootDir
  );

  await fs.mkdir(path.dirname(filePath), { recursive: true });

  const pretty = options?.pretty !== false;
  const body = pretty
    ? `${JSON.stringify(validation.package, null, 2)}\n`
    : JSON.stringify(validation.package);

  await fs.writeFile(filePath, body, "utf8");

  return { path: filePath, package: validation.package };
}
