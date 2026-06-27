import { NextResponse } from "next/server";
import { withApiAnalytics } from "@/lib/analytics/api-wrapper";
import { fetchSeasonSchedule } from "@/lib/schedule";
import { F1_CACHE } from "@/lib/cache/f1";

export const dynamic = "force-dynamic";
export const revalidate = 3600; // Keep in sync with F1_CACHE.SCHEDULE

export const GET = withApiAnalytics("/api/schedule", async function GET() {
  try {
    const schedule = await fetchSeasonSchedule("current");
    return NextResponse.json(schedule, {
      headers: {
        "Cache-Control": `public, s-maxage=${F1_CACHE.SCHEDULE_S_MAXAGE}, stale-while-revalidate=${F1_CACHE.SCHEDULE_STALE_WHILE_REVALIDATE}`,
      },
    });
  } catch (error) {
    console.error("[/api/schedule] fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch schedule" },
      { status: 500 }
    );
  }
});
