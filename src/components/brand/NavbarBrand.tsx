"use client";

import Image from "next/image";
import { useSportPreference } from "@/hooks/useSportPreference";

const NAV_SUBTITLES = {
  f1: "FORMULA 1",
  motogp: "MOTOGP",
} as const;

export function NavbarBrand() {
  const { activeSport, hydrated } = useSportPreference();
  const subtitle = NAV_SUBTITLES[activeSport];

  return (
    <span className="inline-flex items-center gap-2.5 sm:gap-3">
      <Image
        src="/brand/pitwall-p-mark.png"
        alt=""
        width={67}
        height={34}
        priority
        className="h-7 w-auto shrink-0 sm:h-8"
        aria-hidden="true"
      />

      {hydrated ? (
        <span className="hidden min-w-0 sm:block">
          <span className="block font-brand text-base font-bold leading-tight tracking-tight">
            <span className="text-[#F0B429]">PitWall</span>{" "}
            <span className="text-white">Apex</span>
          </span>
          <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">
            {subtitle}
          </span>
        </span>
      ) : (
        <span className="hidden min-w-0 sm:block">
          <span className="block font-brand text-base font-bold leading-tight tracking-tight">
            <span className="text-[#F0B429]">PitWall</span>{" "}
            <span className="text-white">Apex</span>
          </span>
          <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">
            FORMULA 1
          </span>
        </span>
      )}
    </span>
  );
}
