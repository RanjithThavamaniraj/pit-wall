import { NextResponse } from "next/server";
import { withApiAnalytics } from "@/lib/analytics/api-wrapper";
import { getEquivalentRaceSlug } from "@/lib/equivalent-race";
import { isValidSport } from "@/lib/sport";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export const GET = withApiAnalytics("/api/equivalent-race", async function GET(
  request: Request
) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const slug = searchParams.get("slug");

  if (!isValidSport(from) || !slug) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  try {
    const equivalentSlug = await getEquivalentRaceSlug(from, slug);
    if (!equivalentSlug) {
      return NextResponse.json({ slug: null }, { status: 404 });
    }

    return NextResponse.json(
      { slug: equivalentSlug },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
        },
      }
    );
  } catch (error) {
    console.error("[/api/equivalent-race] fetch error:", error);
    return NextResponse.json(
      { error: "Failed to resolve equivalent race" },
      { status: 500 }
    );
  }
});
