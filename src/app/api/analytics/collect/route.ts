import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, VISITOR_COOKIE } from "@/lib/admin/constants";
import {
  enrichCollectBody,
  ingestHeartbeat,
  ingestPageview,
  parseCollectBody,
} from "@/lib/analytics/ingest";

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

  const cookieStore = await cookies();
  const enriched = enrichCollectBody(body, {
    visitorId: cookieStore.get(VISITOR_COOKIE)?.value,
    sessionId: cookieStore.get(SESSION_COOKIE)?.value,
  });

  const parsed = parseCollectBody(enriched);
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
