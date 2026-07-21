import { NextResponse } from "next/server";
import { withApiAnalytics } from "@/lib/analytics/api-wrapper";
import type { RaceSummarySport } from "@/lib/race-summary/types";
import { getWeekendCoordinates } from "@/lib/weather/getWeekendCoordinates";
import { fetchTomorrowIoLiveWeather } from "@/lib/weather/tomorrowIo";

function parseSport(value: string | null): RaceSummarySport | null {
  if (value === "f1" || value === "motogp") return value;
  return null;
}

export const dynamic = "force-dynamic";

export const GET = withApiAnalytics("/api/live/weather", async function GET(
  request: Request,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _context: { params: Promise<Record<string, string>> }
) {
  const { searchParams } = new URL(request.url);
  const sport = parseSport(searchParams.get("sport"));
  const weekendSlug = searchParams.get("weekendSlug") ?? "";

  if (!sport || !weekendSlug) {
    return NextResponse.json(
      { weather: null, reason: "missing_params" },
      { status: 400 }
    );
  }

  const apiKey = process.env.TOMORROW_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { weather: null, reason: "missing_provider_key" },
      { status: 200 }
    );
  }

  try {
    const coords = await getWeekendCoordinates({ sport, weekendSlug });
    if (!coords) {
      return NextResponse.json(
        { weather: null, reason: "no_coordinates" },
        { status: 200 }
      );
    }

    const weather = await fetchTomorrowIoLiveWeather({
      lat: coords.lat,
      lon: coords.lon,
      apiKey,
      sport,
      weekendSlug,
    });

    return NextResponse.json(
      { weather },
      {
        headers: {
          // Keep upstream provider calls bounded; client also throttles.
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
        },
      }
    );
  } catch (error) {
    console.error("[live-weather] error:", error);
    return NextResponse.json(
      { weather: null, reason: "provider_error" },
      { status: 200 }
    );
  }
});

