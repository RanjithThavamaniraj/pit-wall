import { NextResponse } from "next/server";
import { withApiAnalytics } from "@/lib/analytics/api-wrapper";
import { fetchAllStandings } from "@/lib/standings";
import { F1_CACHE } from "@/lib/cache/f1";

export const dynamic = "force-dynamic";
export const revalidate = 1800; // Keep in sync with F1_CACHE.STANDINGS

export const GET = withApiAnalytics("/api/standings", async function GET() {
  try {
    const standings = await fetchAllStandings();
    return NextResponse.json(standings, {
      headers: {
        "Cache-Control": `public, s-maxage=${F1_CACHE.STANDINGS_S_MAXAGE}, stale-while-revalidate=${F1_CACHE.STANDINGS_STALE_WHILE_REVALIDATE}`,
      },
    });
  } catch (error) {
    console.error("[/api/standings] fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch standings" },
      { status: 500 }
    );
  }
});
