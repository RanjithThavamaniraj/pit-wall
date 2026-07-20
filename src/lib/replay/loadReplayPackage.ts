import { promises as fs } from "node:fs";
import path from "node:path";
import type { Championship } from "@/lib/live";
import { buildPackage } from "./buildPackage";
import type { ReplayPackage } from "./types";

/**
 * Load a ReplayPackage from content storage.
 * Returns null when the package is missing or invalid — never fabricates data.
 */
export async function loadReplayPackage(
  sport: Championship,
  slug: string
): Promise<ReplayPackage | null> {
  const filePath = path.join(
    process.cwd(),
    "data",
    "replays",
    sport,
    `${slug}.json`
  );

  try {
    const raw = await fs.readFile(filePath, "utf8");
    return buildPackage(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}
