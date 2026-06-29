import { NextResponse, type NextRequest } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  SESSION_COOKIE,
  VISITOR_COOKIE,
} from "@/lib/admin/constants";
import { ADMIN_CACHE } from "@/lib/cache/admin";
import { verifyAdminSessionTokenEdge } from "@/lib/admin/session-edge";

const ADMIN_PUBLIC_PATHS = ["/admin/login"];

function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

function shouldSkipAnalytics(pathname: string): boolean {
  return (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/admin") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  );
}

function ensureAnalyticsCookies(
  request: NextRequest,
  response: NextResponse
): void {
  let visitorId = request.cookies.get(VISITOR_COOKIE)?.value;
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    response.cookies.set(VISITOR_COOKIE, visitorId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: ADMIN_CACHE.VISITOR_MAX_AGE_SECONDS,
    });
  }

  let sessionId = request.cookies.get(SESSION_COOKIE)?.value;
  if (!sessionId) {
    sessionId = crypto.randomUUID();
  }
  response.cookies.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_CACHE.SESSION_MAX_AGE_SECONDS,
  });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isAdminPath(pathname)) {
    const isPublicAdmin = ADMIN_PUBLIC_PATHS.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`)
    );

    if (!isPublicAdmin) {
      const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
      const session = await verifyAdminSessionTokenEdge(token);
      if (!session) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = "/admin/login";
        loginUrl.searchParams.set("next", pathname);
        return NextResponse.redirect(loginUrl);
      }
    } else {
      const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
      if (await verifyAdminSessionTokenEdge(token)) {
        const adminUrl = request.nextUrl.clone();
        adminUrl.pathname = "/admin";
        adminUrl.search = "";
        return NextResponse.redirect(adminUrl);
      }
    }

    const response = NextResponse.next();
    response.headers.set("x-robots-tag", "noindex, nofollow");
    return response;
  }

  const response = NextResponse.next();

  if (!shouldSkipAnalytics(pathname)) {
    ensureAnalyticsCookies(request, response);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
