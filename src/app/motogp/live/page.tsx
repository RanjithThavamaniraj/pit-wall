import type { Metadata } from "next";
import MotoGpLiveClient from "@/components/motogp/MotoGpLiveClient";
import {
  fetchMotoGpSchedule,
  fetchSessionResults,
  type MotoGpFinisher,
} from "@/lib/motogp";
import { getMotoGpWeekendContext } from "@/lib/motogp-weekend";

export const metadata: Metadata = {
  title: "Live Weekend Hub",
  description:
    "MotoGP race weekend tracker with session progression, countdowns, and latest results. Live timing is not available from the public API.",
};

export const revalidate = 300;

export default async function MotoGpLivePage() {
  let initialContext = null;
  let initialResults: MotoGpFinisher[] = [];

  try {
    const schedule = await fetchMotoGpSchedule();
    initialContext = getMotoGpWeekendContext(schedule);

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
  } catch (error) {
    console.error("Failed to fetch MotoGP weekend data", error);
  }

  return (
    <MotoGpLiveClient
      initialContext={initialContext}
      initialResults={initialResults}
    />
  );
}
