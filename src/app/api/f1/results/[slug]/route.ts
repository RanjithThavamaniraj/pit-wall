import { NextResponse } from "next/server";
import { loadRaceWeekendSummary } from "@/lib/race-summary/loader";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const summary = await loadRaceWeekendSummary("f1", slug);

  if (!summary) {
    return NextResponse.json(
      { error: "Summary not available for this round yet." },
      { status: 404 }
    );
  }

  return NextResponse.json(summary, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
