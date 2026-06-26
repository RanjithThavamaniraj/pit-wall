"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const HEARTBEAT_MS = 30_000;

export function AnalyticsBeacon() {
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  const visibleSinceRef = useRef(Date.now());
  const lastSentRef = useRef(0);

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
      if (
        currentPath.startsWith("/admin") ||
        currentPath.startsWith("/api")
      ) {
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
      if (sinceLast >= HEARTBEAT_MS - 500) flushHeartbeat();
    }, HEARTBEAT_MS);

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
