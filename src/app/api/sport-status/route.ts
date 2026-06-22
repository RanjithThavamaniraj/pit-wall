import { NextResponse } from "next/server";
import { fetchMotoGpSchedule } from "@/lib/motogp";
import { fetchSeasonSchedule } from "@/lib/schedule";
import { getMotoGpWeekendContext } from "@/lib/motogp-weekend";
import { getWeekendContext } from "@/lib/weekend";

export const dynamic = "force-dynamic";

export async function GET() {
  let f1Live = false;
  let motogpLive = false;

  const [f1Result, motogpResult] = await Promise.allSettled([
    fetchSeasonSchedule("current"),
    fetchMotoGpSchedule(),
  ]);

  if (f1Result.status === "fulfilled") {
    const context = getWeekendContext(f1Result.value);
    f1Live = context?.state === "LIVE";
  }

  if (motogpResult.status === "fulfilled") {
    const context = getMotoGpWeekendContext(motogpResult.value);
    motogpLive = context?.state === "LIVE";
  }

  return NextResponse.json(
    { f1Live, motogpLive },
    { headers: { "Cache-Control": "public, s-maxage=30" } }
  );
}
