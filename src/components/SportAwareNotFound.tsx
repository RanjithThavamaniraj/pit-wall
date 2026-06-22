"use client";

import Link from "next/link";
import { useSportPreference } from "@/hooks/useSportPreference";
import { getSportRoutes } from "@/lib/sport";

export function SportAwareNotFound() {
  const { activeSport } = useSportPreference();
  const routes = getSportRoutes(activeSport);

  return (
    <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
      <Link
        href="/"
        className="rounded-full bg-amber-300 px-7 py-4 text-center text-base font-bold text-slate-950 shadow-xl shadow-amber-500/20 transition hover:bg-amber-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        Back to home
      </Link>
      <Link
        href={routes.races}
        className="rounded-full border border-white/15 px-7 py-4 text-center text-base font-semibold text-white transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
      >
        View race schedule
      </Link>
    </div>
  );
}
