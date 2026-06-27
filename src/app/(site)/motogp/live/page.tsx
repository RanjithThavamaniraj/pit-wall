import type { Metadata } from "next";
import MotoGpLiveClient from "@/components/motogp/MotoGpLiveClient";
import {
  fetchMotoGpSchedule,
  fetchMotoGpStandings,
  fetchSessionResults,
  getPreviousMotoGpEvent,
  type MotoGpEvent,
  type MotoGpFinisher,
} from "@/lib/motogp";
import { getMotoGpWeekendContext } from "@/lib/motogp-weekend";

export const metadata: Metadata = {
  title: "Live Weekend Hub",
  description:
    "MotoGP race weekend tracker with session progression, countdowns, and latest results. Live timing is not available from the public API.",
};

export const revalidate = 300; // Keep in sync with MOTOGP_CACHE.SESSION_RESULTS

export default async function MotoGpLivePage() {
  let initialContext = null;
  let initialResults: MotoGpFinisher[] = [];
  let initialStandings = null;
  let previousEvent: MotoGpEvent | null = null;

  try {
    const [scheduleResult, standingsResult] = await Promise.allSettled([
      fetchMotoGpSchedule(),
      fetchMotoGpStandings("MotoGP™"),
    ]);

    if (scheduleResult.status === "fulfilled") {
      initialContext = getMotoGpWeekendContext(scheduleResult.value);
      previousEvent = getPreviousMotoGpEvent(scheduleResult.value) ?? null;

      if (initialContext) {
        const resultsSession =
          initialContext.activeSession ??
          [...initialContext.currentWeekend.sessions]
            .reverse()
            .find((session) => session.status === "completed");

        if (resultsSession) {
          initialResults = await fetchSessionResults(resultsSession.sessionId, 5);
        }
      }
    }

    if (standingsResult.status === "fulfilled") {
      initialStandings = standingsResult.value;
    }
  } catch (error) {
    console.error("Failed to fetch MotoGP weekend data", error);
  }

  return (
    <MotoGpLiveClient
      initialContext={initialContext}
      initialResults={initialResults}
      initialStandings={initialStandings}
      previousEvent={previousEvent}
    />
  );
}
