import { readFile } from "fs/promises";
import path from "path";
import type { RaceSummarySport, RaceWeekendSummary } from "./types";
import { buildF1RaceWeekendSummary } from "./f1-builder";

const DATA_ROOT = path.join(process.cwd(), "data");

function summaryPath(sport: RaceSummarySport, slug: string): string {
  return path.join(DATA_ROOT, sport, "results", `${slug}.json`);
}

async function loadSummaryFile(
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

function mergeF1Summary(
  api: RaceWeekendSummary,
  overlay: RaceWeekendSummary
): RaceWeekendSummary {
  return {
    ...api,
    weekendReport: overlay.weekendReport ?? api.weekendReport,
    communityPrediction: overlay.communityPrediction ?? api.communityPrediction,
    highlights: overlay.highlights?.length ? overlay.highlights : api.highlights,
    weather: overlay.weather ?? api.weather,
    timeline: overlay.timeline?.length ? overlay.timeline : api.timeline,
  };
}

export async function loadRaceWeekendSummary(
  sport: RaceSummarySport,
  slug: string
): Promise<RaceWeekendSummary | null> {
  const fromFile = await loadSummaryFile(sport, slug);

  if (sport === "f1") {
    const fromApi = await buildF1RaceWeekendSummary(slug);
    if (fromApi && fromFile) {
      return mergeF1Summary(fromApi, fromFile);
    }
    return fromApi ?? fromFile;
  }

  return fromFile;
}
