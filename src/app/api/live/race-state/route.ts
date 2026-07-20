import { NextResponse } from "next/server";
import { withApiAnalytics } from "@/lib/analytics/api-wrapper";
import { LIVE_CACHE } from "@/lib/cache/live";
import { buildF1LiveRaceState } from "@/lib/live/f1/buildLiveRaceState";
import { buildMotoGpLiveRaceState } from "@/lib/live/motogp/buildLiveRaceState";
import type { Championship } from "@/lib/live/types";
import { isValidLiveRaceState } from "@/lib/live/validateState";

export const dynamic = "force-dynamic";

function parseSport(value: string | null): Championship | null {
  if (value === "f1" || value === "motogp") return value;
  return null;
}

function idleHeaders() {
  return {
    "Cache-Control": `public, s-maxage=${LIVE_CACHE.RACE_STATE_IDLE_S_MAXAGE}, stale-while-revalidate=10`,
  };
}

export const GET = withApiAnalytics(
  "/api/live/race-state",
  async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const sport = parseSport(searchParams.get("sport"));

    if (!sport) {
      return NextResponse.json(
        { error: "Query param sport=f1|motogp is required" },
        { status: 400 }
      );
    }

    try {
      const raw =
        sport === "f1"
          ? await buildF1LiveRaceState()
          : await buildMotoGpLiveRaceState();

      if (!raw || !isValidLiveRaceState(raw)) {
        return NextResponse.json(
          { state: null, reason: raw ? "invalid_payload" : "no_live_session" },
          { headers: idleHeaders() }
        );
      }

      return NextResponse.json(
        { state: raw },
        {
          headers: {
            "Cache-Control": `public, s-maxage=${LIVE_CACHE.RACE_STATE_LIVE_S_MAXAGE}, stale-while-revalidate=${LIVE_CACHE.TIMING_STALE_WHILE_REVALIDATE}`,
          },
        }
      );
    } catch (error) {
      console.error(`[race-state] ${sport} provider error:`, error);
      return NextResponse.json(
        { state: null, reason: "provider_error" },
        { status: 200, headers: idleHeaders() }
      );
    }
  }
);
