import type { MetadataRoute } from "next";
import { fetchMotoGpSchedule } from "@/lib/motogp";
import { fetchSeasonSchedule } from "@/lib/schedule";
import { SITE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = [
    "",
    "/races",
    "/live",
    "/standings",
    "/motogp/races",
    "/motogp/live",
    "/motogp/standings",
  ];

  const racePaths: string[] = [];

  try {
    const f1Schedule = await fetchSeasonSchedule("current");
    racePaths.push(...f1Schedule.races.map((race) => `/races/${race.slug}`));
  } catch {
    // Omit F1 race pages if schedule fetch fails.
  }

  try {
    const motogpSchedule = await fetchMotoGpSchedule();
    racePaths.push(
      ...motogpSchedule.races.map((event) => `/motogp/races/${event.slug}`)
    );
  } catch {
    // Omit MotoGP race pages if schedule fetch fails.
  }

  const lastModified = new Date();

  return [...staticPaths, ...racePaths].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
  }));
}
