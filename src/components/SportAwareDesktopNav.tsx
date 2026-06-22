"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSportPreference } from "@/hooks/useSportPreference";
import { getSportRoutes, isNavRouteActive } from "@/lib/sport";
import { SportSwitcher } from "./SportSwitcher";

const navItems = [
  { key: "races" as const, label: "Schedule" },
  { key: "live" as const, label: "Live" },
  { key: "standings" as const, label: "Standings" },
];

export function SportAwareDesktopNav() {
  const pathname = usePathname();
  const { activeSport } = useSportPreference();
  const routes = getSportRoutes(activeSport);

  return (
    <div className="flex items-center gap-5">
      <SportSwitcher />
      <nav
        aria-label="Primary navigation"
        className="flex items-center gap-7"
      >
        {navItems.map((item) => {
          const href = routes[item.key];
          const isActive = isNavRouteActive(pathname, href);

          return (
            <Link
              key={item.key}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={`text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${
                isActive
                  ? "text-amber-300"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
