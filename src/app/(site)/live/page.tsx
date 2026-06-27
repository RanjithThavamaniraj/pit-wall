import type { Metadata } from "next";
import LiveTimingClient from "@/components/live/LiveTimingClient";
import { fetchSeasonSchedule, getPreviousRace } from "@/lib/schedule";
import type { RaceWeekend } from "@/lib/schedule";
import { fetchAllStandings } from "@/lib/standings";
import { getWeekendContext } from "@/lib/weekend";

export const metadata: Metadata = {
  title: "Live Timing",
  description:
    "Real-time Formula 1 session timing, positions, gaps, and race control messages.",
};

export const revalidate = 3600; // Keep in sync with F1_CACHE.SCHEDULE

export default async function LivePage() {
  let initialContext = null;
  let initialStandings = null;
  let previousRace: RaceWeekend | null = null;

  try {
    const [scheduleResult, standingsResult] = await Promise.allSettled([
      fetchSeasonSchedule("current"),
      fetchAllStandings(),
    ]);

    if (scheduleResult.status === "fulfilled") {
      initialContext = getWeekendContext(scheduleResult.value);
      previousRace = getPreviousRace(scheduleResult.value);
    }
    if (standingsResult.status === "fulfilled") {
      initialStandings = standingsResult.value;
    }
  } catch (error) {
    console.error("Failed to fetch schedule for live page empty state", error);
  }

  return (
    <LiveTimingClient
      initialContext={initialContext}
      initialStandings={initialStandings}
      previousRace={previousRace}
    />
  );
}
