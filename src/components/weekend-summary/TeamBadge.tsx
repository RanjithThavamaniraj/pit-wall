"use client";

import { memo, useState } from "react";
import Image from "next/image";
import type { RaceSummarySport } from "@/lib/race-summary/types";
import { getTeamBranding } from "@/lib/race-summary/branding";

type Props = {
  sport: RaceSummarySport;
  team?: string;
  size?: "sm" | "md";
};

function TeamBadgeComponent({ sport, team, size = "sm" }: Props) {
  const branding = getTeamBranding(team, sport);
  const [imageFailed, setImageFailed] = useState(false);
  const dimension = size === "sm" ? 22 : 30;

  return (
    <div
      className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-slate-950/60"
      style={{
        width: dimension,
        height: dimension,
        boxShadow: `inset 3px 0 0 ${branding.color}`,
      }}
    >
      {branding.logoPath && !imageFailed ? (
        <Image
          src={branding.logoPath}
          alt={branding.shortName}
          width={dimension - 6}
          height={dimension - 6}
          className="object-contain"
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span
          className="text-[9px] font-bold text-white"
          style={{ color: branding.color }}
          aria-hidden="true"
        >
          {branding.shortName.slice(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  );
}

export const TeamBadge = memo(TeamBadgeComponent);
