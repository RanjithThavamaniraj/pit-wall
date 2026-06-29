import { readFile } from "fs/promises";
import path from "path";
import type { RaceSummarySport, RaceWeekendSummary } from "./types";

const DATA_ROOT = path.join(process.cwd(), "data");

function summaryPath(sport: RaceSummarySport, slug: string): string {
  return path.join(DATA_ROOT, sport, "results", `${slug}.json`);
}

export async function loadRaceWeekendSummary(
  sport: RaceSummarySport,
  slug: string
): Promise<RaceWeekendSummary | null> {
  try {
    const raw = await readFile(summaryPath(sport, slug), "utf8");
    const parsed = JSON.parse(raw) as RaceWeekendSummary;
    if (parsed.sport !== sport || parsed.slug !== slug) {
      return { ...parsed, sport, slug };
    }
    return parsed;
  } catch {
    return null;
  }
}
