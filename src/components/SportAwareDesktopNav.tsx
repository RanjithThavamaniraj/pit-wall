"use client";

import Link from "next/link";
import { useSportPreference } from "@/hooks/useSportPreference";
import { getSportRoutes } from "@/lib/sport";
import { SportSwitcher } from "./SportSwitcher";

const navItems = [
  { key: "races" as const, label: "Schedule" },
  { key: "live" as const, label: "Live" },
  { key: "standings" as const, label: "Standings" },
];

export function SportAwareDesktopNav() {
  const { activeSport } = useSportPreference();
  const routes = getSportRoutes(activeSport);

  return (
    <div className="flex items-center gap-5">
      <SportSwitcher />
      <nav
        aria-label="Primary navigation"
        className="flex items-center gap-7"
      >
        {navItems.map((item) => (
          <Link
            key={item.key}
            href={routes[item.key]}
            className="text-sm font-medium text-slate-300 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
