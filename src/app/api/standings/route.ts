import { NextResponse } from "next/server";
import { fetchAllStandings } from "@/lib/standings";

export const dynamic = "force-dynamic";
export const revalidate = 1800; // 30 minutes

export async function GET() {
  try {
    const standings = await fetchAllStandings();
    return NextResponse.json(standings, {
      headers: {
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
      },
    });
  } catch (error) {
    console.error("[/api/standings] fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch standings" },
      { status: 500 }
    );
  }
}
