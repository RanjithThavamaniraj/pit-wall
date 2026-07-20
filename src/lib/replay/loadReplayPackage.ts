import { promises as fs } from "node:fs";
import path from "node:path";
import type { Championship } from "@/lib/live";
import { buildPackage } from "./buildPackage";
import type { ReplayPackage } from "./types";

/**
 * Load a ReplayPackage from content storage.
 * Returns null when the package is missing, invalid, or sport/slug mismatched.
 * Never fabricates lap movement.
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
    const pkg = buildPackage(JSON.parse(raw) as unknown);
    if (!pkg) return null;
    // Reject cross-sport or misfiled content (e.g. F1 package under motogp/).
    if (pkg.sport !== sport || pkg.slug !== slug) return null;
    return pkg;
  } catch {
    return null;
  }
}
