import { NextResponse } from "next/server";
import { ingestApiMetric } from "@/lib/analytics/ingest";

type RouteContext = {
  params: Promise<Record<string, string>>;
};

type RouteHandler = (
  request: Request,
  context: RouteContext
) => Promise<Response> | Response;

export function withApiAnalytics(
  route: string,
  handler: RouteHandler
): RouteHandler {
  return async (request, context) => {
    const started = Date.now();
    let status = 500;
    let errorMessage: string | undefined;

    try {
      const response = await handler(request, context);
      status = response.status;
      return response;
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : "Unknown error";
      throw error;
    } finally {
      const durationMs = Date.now() - started;
      void ingestApiMetric({
        timestamp: Date.now(),
        route,
        method: request.method,
        status,
        durationMs,
        error: errorMessage,
      }).catch(() => {
        /* best-effort */
      });
    }
  };
}

export function jsonWithCache(
  data: unknown,
  init?: { status?: number; cacheControl?: string }
) {
  return NextResponse.json(data, {
    status: init?.status ?? 200,
    headers: init?.cacheControl
      ? { "Cache-Control": init.cacheControl }
      : undefined,
  });
}
