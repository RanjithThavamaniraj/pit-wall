import { NextResponse } from "next/server";
import { fetchSeasonSchedule } from "@/lib/schedule";

export const dynamic = "force-dynamic";
export const revalidate = 3600; // 1 hour

export async function GET() {
  try {
    const schedule = await fetchSeasonSchedule("current");
    return NextResponse.json(schedule, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
      },
    });
  } catch (error) {
    console.error("[/api/schedule] fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch schedule" },
      { status: 500 }
    );
  }
}
