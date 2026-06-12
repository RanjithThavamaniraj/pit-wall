"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const tabs = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/races", label: "Schedule", icon: CalendarIcon },
  { href: "/live", label: "Live", icon: LiveIcon, isLive: true },
  { href: "/standings", label: "Standings", icon: TrophyIcon },
];

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary navigation"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#07090f]/95 backdrop-blur-xl md:hidden"
    >
      {/* Safe area padding for iPhone home indicator */}
      <ul
        className="flex h-16 items-stretch justify-around px-1"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        role="list"
      >
        {tabs.map(({ href, label, icon: Icon, isLive }) => {
          const isActive =
            href === "/"
              ? pathname === "/"
              : pathname === href || pathname.startsWith(href + "/");

          return (
            <li key={href} className="flex flex-1 items-center justify-center">
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`flex flex-col items-center justify-center gap-0.5 rounded-2xl px-2 py-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${
                  isActive ? "text-amber-300" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <span className="relative flex size-6 items-center justify-center">
                  <Icon />
                  {isLive && (
                    <span
                      className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.8)]"
                      aria-label="Live session indicator"
                    />
                  )}
                </span>
                <span
                  className={`text-[10px] font-semibold tracking-wide ${
                    isActive ? "text-amber-300" : ""
                  }`}
                >
                  {label}
                </span>
                {isActive && (
                  <span
                    className="absolute bottom-0 h-0.5 w-8 rounded-full bg-amber-300"
                    aria-hidden="true"
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// ─── Inline SVG Icons ──────────────────────────────────────────────────────────

function HomeIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function LiveIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M6.3 6.3a8 8 0 0 0 0 11.4M17.7 6.3a8 8 0 0 1 0 11.4" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 9H4a2 2 0 0 1-2-2V5h4" />
      <path d="M18 9h2a2 2 0 0 0 2-2V5h-4" />
      <path d="M12 17v4" />
      <path d="M8 21h8" />
      <path d="M6 3h12v8a6 6 0 0 1-12 0V3z" />
    </svg>
  );
}
