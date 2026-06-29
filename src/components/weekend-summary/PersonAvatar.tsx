"use client";

import { memo, useState } from "react";
import Image from "next/image";
import type { RaceSummarySport } from "@/lib/race-summary/types";
import {
  getInitials,
  getTeamBranding,
  personImageBasePath,
  slugifyPerson,
} from "@/lib/race-summary/branding";

const IMAGE_EXTENSIONS = [".webp", ".png", ".jpg"] as const;

const SIZE_CLASSES = {
  sm: "h-9 w-9 text-[10px]",
  md: "h-14 w-14 text-sm",
  lg: "h-20 w-20 text-base",
  xl: "h-28 w-28 text-xl",
} as const;

type Props = {
  sport: RaceSummarySport;
  name: string;
  team?: string;
  imageSlug?: string;
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
};

function PersonAvatarComponent({
  sport,
  name,
  team,
  imageSlug,
  size = "md",
  className = "",
}: Props) {
  const [extensionIndex, setExtensionIndex] = useState(0);
  const branding = getTeamBranding(team, sport);
  const slug = imageSlug ?? slugifyPerson(name);
  const basePath = personImageBasePath(sport, slug);
  const extension = IMAGE_EXTENSIONS[extensionIndex];
  const src = extension ? `${basePath}${extension}` : null;
  const showFallback = !src || extensionIndex >= IMAGE_EXTENSIONS.length;

  return (
    <div
      className={`relative shrink-0 rounded-full ${SIZE_CLASSES[size]} ${className}`}
      style={{
        boxShadow: `0 0 0 2px ${branding.color}55, 0 0 24px ${branding.color}22`,
      }}
    >
      {!showFallback && src ? (
        <Image
          src={src}
          alt={name}
          fill
          sizes={
            size === "xl"
              ? "112px"
              : size === "lg"
                ? "80px"
                : size === "md"
                  ? "56px"
                  : "36px"
          }
          className="rounded-full object-cover object-top"
          loading="lazy"
          onError={() =>
            setExtensionIndex((current) => current + 1)
          }
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center rounded-full font-semibold text-white"
          style={{
            background: `linear-gradient(145deg, ${branding.color}88, ${branding.color}33)`,
          }}
          aria-hidden="true"
        >
          {getInitials(name)}
        </div>
      )}
    </div>
  );
}

export const PersonAvatar = memo(PersonAvatarComponent);
