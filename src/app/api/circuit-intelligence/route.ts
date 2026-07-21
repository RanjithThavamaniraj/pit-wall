import { NextResponse } from "next/server";
import type { RaceSummarySport } from "@/lib/race-summary/types";
import { fetchCircuitIntelligence } from "@/lib/circuit-intelligence/fetchCircuitIntelligence";

function parseSport(value: string | null): RaceSummarySport | null {
  if (value === "f1" || value === "motogp") return value;
  return null;
}

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sport = parseSport(searchParams.get("sport"));
  const weekendSlug = searchParams.get("weekendSlug") ?? "";

  if (!sport || !weekendSlug) {
    return NextResponse.json(
      { intelligence: null, reason: "missing_params" },
      { status: 400 }
    );
  }

  try {
    const intelligence = await fetchCircuitIntelligence({
      sport,
      weekendSlug,
    });
    return NextResponse.json(
      { intelligence },
      { headers: { "Cache-Control": "public, s-maxage=300" } }
    );
  } catch (error) {
    console.error("[circuit-intelligence] error:", error);
    return NextResponse.json(
      { intelligence: null, reason: "provider_error" },
      { status: 200 }
    );
  }
}

