"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useSportPreference } from "@/hooks/useSportPreference";
import { getSportRoutes, isNavRouteActive } from "@/lib/sport";

const tabs = [
  { key: "home" as const, label: "Home", icon: HomeIcon },
  { key: "races" as const, label: "Schedule", icon: CalendarIcon },
  { key: "live" as const, label: "Live", icon: LiveIcon },
  { key: "standings" as const, label: "Standings", icon: TrophyIcon },
];

export function BottomTabBar() {
  const pathname = usePathname();
  const { activeSport } = useSportPreference();
  const routes = getSportRoutes(activeSport);
  const [liveActive, setLiveActive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const checkLive = async () => {
      try {
        const res = await fetch("/api/sport-status");
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const isLive =
          activeSport === "motogp" ? data.motogpLive : data.f1Live;
        setLiveActive(Boolean(isLive));
      } catch {
        // Ignore polling errors.
      } finally {
        if (!cancelled) {
          timeoutId = setTimeout(checkLive, 60000);
        }
      }
    };

    checkLive();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [activeSport]);

  return (
    <nav
      aria-label="Primary navigation"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#07090f]/95 backdrop-blur-xl md:hidden"
    >
      <ul
        className="flex h-16 items-stretch justify-around px-1"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        role="list"
      >
        {tabs.map(({ key, label, icon: Icon }) => {
          const href = routes[key];
          const isActive = isNavRouteActive(pathname, href);
          const showLiveDot = key === "live" && liveActive;

          return (
            <li key={key} className="flex flex-1 items-center justify-center">
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`relative flex flex-col items-center justify-center gap-0.5 rounded-2xl px-2 py-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${
                  isActive ? "text-amber-300" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <span className="relative flex size-6 items-center justify-center">
                  <Icon />
                  {showLiveDot && (
                    <span
                      className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.8)]"
                      aria-hidden="true"
                    />
                  )}
                </span>
                <span className="text-[10px] font-medium leading-none">
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
      <path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
      <rect
        x="3"
        y="5"
        width="18"
        height="16"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M8 3v4M16 3v4M3 10h18" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function LiveIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
      <circle cx="12" cy="12" r="3" fill="currentColor" />
      <path
        d="M7.05 7.05a7 7 0 0 0 0 9.9M16.95 7.05a7 7 0 0 1 0 9.9M4.22 4.22a11 11 0 0 0 0 15.56M19.78 4.22a11 11 0 0 1 0 15.56"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
      <path
        d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4ZM5 6H3v1a3 3 0 0 0 3 3M19 6h2v1a3 3 0 0 1-3 3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
