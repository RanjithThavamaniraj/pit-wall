"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { ANALYTICS_CACHE } from "@/lib/cache/analytics";

function isTrackedPath(path: string) {
  return !path.startsWith("/admin") && !path.startsWith("/api");
}

function sendPageview(pathname: string) {
  void fetch("/api/analytics/collect", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      type: "pageview",
      pathname,
      referrer: document.referrer || null,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
    }),
    keepalive: true,
  }).catch(() => {
    /* best-effort */
  });
}

export function AnalyticsBeacon() {
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  const visibleSinceRef = useRef(Date.now());
  const lastSentRef = useRef(0);
  const lastPageviewPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isTrackedPath(pathname)) return;
    if (lastPageviewPathRef.current === pathname) return;
    lastPageviewPathRef.current = pathname;
    sendPageview(pathname);
  }, [pathname]);

  useEffect(() => {
    pathnameRef.current = pathname;
    visibleSinceRef.current = Date.now();
    lastSentRef.current = 0;
  }, [pathname]);

  useEffect(() => {
    function flushHeartbeat() {
      const now = Date.now();
      const elapsed = now - visibleSinceRef.current;
      if (elapsed < 1000) return;

      const currentPath = pathnameRef.current;
      if (!isTrackedPath(currentPath)) {
        return;
      }

      visibleSinceRef.current = now;
      lastSentRef.current = now;

      void fetch("/api/analytics/heartbeat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          pathname: currentPath,
          durationMs: elapsed,
        }),
        keepalive: true,
      }).catch(() => {
        /* best-effort */
      });
    }

    const interval = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      const sinceLast = Date.now() - lastSentRef.current;
      if (
        sinceLast >=
        ANALYTICS_CACHE.HEARTBEAT_MS -
          ANALYTICS_CACHE.HEARTBEAT_FLUSH_TOLERANCE_MS
      )
        flushHeartbeat();
    }, ANALYTICS_CACHE.HEARTBEAT_MS);

    function onVisibilityChange() {
      if (document.visibilityState === "hidden") flushHeartbeat();
      if (document.visibilityState === "visible") {
        visibleSinceRef.current = Date.now();
      }
    }

    function onPageHide() {
      flushHeartbeat();
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onPageHide);
      flushHeartbeat();
    };
  }, []);

  return null;
}
