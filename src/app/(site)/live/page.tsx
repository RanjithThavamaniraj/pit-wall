import type { Metadata } from "next";
import LiveTimingClient from "@/components/live/LiveTimingClient";
import { fetchSeasonSchedule } from "@/lib/schedule";
import { getWeekendContext } from "@/lib/weekend";
import { buildSessionBriefing } from "@/lib/session-briefing";
import type { SessionBriefing } from "@/lib/session-briefing";

export const metadata: Metadata = {
  title: "Live Timing",
  description:
    "Real-time Formula 1 session timing, positions, gaps, and session briefings.",
};

export const revalidate = 300; // Keep in sync with F1_CACHE.STANDINGS (standings + live race flags)

export default async function LivePage() {
  let initialContext = null;
  let initialBriefing: SessionBriefing | null = null;

  try {
    const schedule = await fetchSeasonSchedule("current");
    initialContext = getWeekendContext(schedule);
    if (initialContext) {
      initialBriefing = await buildSessionBriefing(initialContext, schedule);
    }
  } catch (error) {
    console.error("Failed to fetch schedule for live page empty state", error);
  }

  return (
    <LiveTimingClient
      initialContext={initialContext}
      initialBriefing={initialBriefing}
    />
  );
}
