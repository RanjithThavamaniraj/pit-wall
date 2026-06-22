import type { ReactNode } from "react";
import { PitWallEmblem } from "./PitWallEmblem";
import { PitWallWordmark } from "./PitWallWordmark";

type Props = {
  variant?: "nav" | "footer";
  subtitle?: ReactNode;
  showWordmark?: boolean;
  showSubtitle?: boolean;
  hideWordmarkOnMobile?: boolean;
};

export function PitWallBrandLockup({
  variant = "nav",
  subtitle,
  showWordmark = true,
  showSubtitle = true,
  hideWordmarkOnMobile = false,
}: Props) {
  const isFooter = variant === "footer";
  const emblemSize = isFooter ? "sm" : "md";
  const wordmarkSize = isFooter ? "text-sm" : "text-base";
  const wordmarkVisibility = hideWordmarkOnMobile
    ? "hidden sm:block"
    : "block";

  return (
    <span className="inline-flex items-center gap-3">
      <PitWallEmblem size={emblemSize} priority={variant === "nav"} />
      {(showWordmark || (showSubtitle && subtitle)) && (
        <span className={`min-w-0 ${wordmarkVisibility}`}>
          {showWordmark && (
            <span className="block">
              <PitWallWordmark textClassName={wordmarkSize} />
            </span>
          )}
          {showSubtitle && subtitle ? (
            <span className="mt-0.5 block text-xs uppercase tracking-[0.22em] text-slate-400">
              {subtitle}
            </span>
          ) : null}
        </span>
      )}
    </span>
  );
}
