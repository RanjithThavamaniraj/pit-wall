import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, VISITOR_COOKIE } from "@/lib/admin/constants";
import { ingestHeartbeat } from "@/lib/analytics/ingest";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { pathname?: string; durationMs?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const pathname = body.pathname?.trim();
  const durationMs = body.durationMs;
  if (!pathname || typeof durationMs !== "number" || durationMs < 0) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const visitorId = cookieStore.get(VISITOR_COOKIE)?.value;
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!visitorId || !sessionId) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  await ingestHeartbeat({
    pathname,
    visitorId,
    sessionId,
    durationMs,
    userAgent: request.headers.get("user-agent"),
  });

  return NextResponse.json({ ok: true });
}
