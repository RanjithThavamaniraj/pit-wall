"use client";

import Link from "next/link";
import { PitWallBrandLockup } from "@/components/brand/PitWallBrandLockup";
import { useSportPreference } from "@/hooks/useSportPreference";
import { SPORT_SUBTITLES } from "@/lib/sport";

export function SportAwareFooter() {
  const { activeSport } = useSportPreference();

  const attribution =
    activeSport === "motogp"
      ? "Data provided by PulseLive (MotoGP). Not affiliated with MotoGP."
      : "Data provided by OpenF1 & Jolpica (F1). Not affiliated with Formula 1.";

  return (
    <footer className="border-t border-white/10 py-8 lg:py-10">
      <div className="layout-shell flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="hidden md:block">
          <PitWallBrandLockup
            variant="footer"
            subtitle={SPORT_SUBTITLES[activeSport]}
            showSubtitle
          />
        </div>
        <div className="flex flex-col gap-3 text-sm text-slate-400 sm:items-end">
          <nav aria-label="Footer" className="flex items-center gap-4">
            <Link
              href="/about"
              className="text-slate-400 transition hover:text-white"
            >
              About
            </Link>
            <Link
              href="/privacy"
              className="text-slate-400 transition hover:text-white"
            >
              Privacy Policy
            </Link>
            <Link
              href="/disclaimer"
              className="text-slate-400 transition hover:text-white"
            >
              Disclaimer
            </Link>
            <Link
              href="/cookie-policy"
              className="text-slate-400 transition hover:text-white"
            >
              Cookie Policy
            </Link>
            <Link
              href="/terms"
              className="text-slate-400 transition hover:text-white"
            >
              Terms &amp; Conditions
            </Link>
          </nav>
          <p className="hidden md:block">
            © {new Date().getFullYear()} PitWall Apex.{" "}
            {SPORT_SUBTITLES[activeSport]} Weekend Hub.
          </p>
          <p className="text-xs md:text-sm">{attribution}</p>
        </div>
      </div>
    </footer>
  );
}
