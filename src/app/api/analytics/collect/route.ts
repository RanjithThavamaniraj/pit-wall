import { NextResponse } from "next/server";
import { ingestHeartbeat, ingestPageview, parseCollectBody } from "@/lib/analytics/ingest";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const isInternal = request.headers.get("x-analytics-internal") === "1";

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parseCollectBody(body);
  if (!parsed) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if ("durationMs" in parsed) {
    await ingestHeartbeat(parsed);
  } else {
    await ingestPageview(parsed);
  }

  return NextResponse.json({ ok: true, internal: isInternal });
}
