import { NextResponse } from "next/server";
import { OpenF1RaceControl } from "@/lib/timing";
import { translateRaceControlMessage, BriefingItem } from "@/lib/briefings";

const OPENF1_BASE = "https://api.openf1.org/v1";

export async function GET() {
  try {
    // 1. Fetch race control messages for the latest session
    const res = await fetch(`${OPENF1_BASE}/race_control?session_key=latest`, {
      next: { revalidate: 5 }, // Revalidate every 5 seconds
    });

    if (!res.ok) {
      throw new Error("Failed to fetch race control data");
    }

    const messages: OpenF1RaceControl[] = await res.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json({ briefings: [] });
    }

    // 2. Process and filter chronologically to build a clean state transition history
    const chronologicalBriefings: BriefingItem[] = messages
      .map(translateRaceControlMessage)
      .filter((item): item is BriefingItem => item !== null)
      // Remove exact duplicate IDs
      .filter((item, index, self) => index === self.findIndex((t) => t.id === item.id))
      // Sort ascending by timestamp (oldest first) to track state transition correctly
      .sort((a, b) => new Date(a.timestampUtc).getTime() - new Date(b.timestampUtc).getTime());

    const filteredBriefings: BriefingItem[] = [];
    let lastTrackState: "CLEAR" | "HAZARD" | "UNKNOWN" = "UNKNOWN";
    let lastExplanation = "";

    for (const item of chronologicalBriefings) {
      const isClearMsg = item.sourceEvent.toUpperCase().includes("CLEAR") || item.explanation.toUpperCase().includes("TRACK IS CLEAR");
      const isHazardMsg = 
        item.severity === "amber" || 
        item.severity === "red" ||
        item.sourceEvent.toUpperCase().includes("YELLOW") ||
        item.sourceEvent.toUpperCase().includes("RED") ||
        item.sourceEvent.toUpperCase().includes("SAFETY CAR") ||
        item.sourceEvent.toUpperCase().includes("VIRTUAL SAFETY CAR");

      // Suppress repeated "track clear" messages if the track state was already clear.
      // We only allow a "CLEAR" event to pass if the track was previously in a HAZARD state.
      if (item.category === "RACE_CONTROL" && isClearMsg) {
        if (lastTrackState === "CLEAR") {
          continue;
        }
        lastTrackState = "CLEAR";
      } else if (item.category === "RACE_CONTROL" && isHazardMsg) {
        lastTrackState = "HAZARD";
      }

      // Suppress back-to-back identical explanations of any category (e.g. repeated track limits messages)
      if (item.explanation === lastExplanation) {
        continue;
      }
      lastExplanation = item.explanation;

      filteredBriefings.push(item);
    }

    // Sort descending by timestamp (newest first) for the UI feed
    const briefings = [...filteredBriefings].reverse();

    return NextResponse.json(
      { briefings },
      {
        headers: {
          "Cache-Control": "public, s-maxage=5, stale-while-revalidate=10",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching briefings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
