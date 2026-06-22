import { NextResponse } from "next/server";
import {
  fetchMotoGpSchedule,
  fetchSessionResults,
  type MotoGpFinisher,
} from "@/lib/motogp";
import { getMotoGpWeekendContext } from "@/lib/motogp-weekend";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const schedule = await fetchMotoGpSchedule();
    const context = getMotoGpWeekendContext(schedule);

    if (!context) {
      return NextResponse.json({ context: null, results: [] });
    }

    const resultsSession =
      context.activeSession ??
      [...context.currentWeekend.sessions]
        .reverse()
        .find((session) => session.status === "completed");

    let results: MotoGpFinisher[] = [];
    if (resultsSession) {
      try {
        results = await fetchSessionResults(resultsSession.sessionId, 5);
      } catch {
        results = [];
      }
    }

    return NextResponse.json(
      { context, results },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("MotoGP weekend API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch MotoGP weekend data" },
      { status: 500 }
    );
  }
}
