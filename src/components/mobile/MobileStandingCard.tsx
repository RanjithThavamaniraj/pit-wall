import type { ReactNode } from "react";

const POSITION_STYLES: Record<number, string> = {
  1: "text-amber-300",
  2: "text-slate-300",
  3: "text-amber-600",
};

type Props = {
  position: number;
  primary: ReactNode;
  secondary?: string;
  accent?: ReactNode;
  colorBar?: string;
  points: number;
  gapLabel?: string;
  wins?: number;
};

export function MobileStandingCard({
  position,
  primary,
  secondary,
  accent,
  colorBar,
  points,
  gapLabel,
  wins,
}: Props) {
  const positionColor = POSITION_STYLES[position] ?? "text-slate-500";

  return (
    <div className="mobile-standing-card">
      <span
        className={`w-8 shrink-0 font-mono text-sm font-semibold ${positionColor}`}
      >
        {String(position).padStart(2, "0")}
      </span>

      {colorBar ? (
        <span
          className="h-9 w-1 shrink-0 rounded-full"
          style={{ backgroundColor: colorBar }}
          aria-hidden="true"
        />
      ) : null}

      {accent ? <span className="shrink-0">{accent}</span> : null}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">{primary}</p>
        {secondary ? (
          <p className="truncate text-xs text-slate-500">{secondary}</p>
        ) : null}
        {(gapLabel || wins !== undefined) && (
          <div className="mobile-standing-card__meta">
            {gapLabel ? <span>{gapLabel}</span> : null}
            {wins !== undefined ? <span>{wins} wins</span> : null}
          </div>
        )}
      </div>

      <div className="mobile-standing-card__points">
        <span className="font-mono text-sm font-semibold text-white">
          {points}
        </span>
        <span className="ml-0.5 text-xs text-slate-600">pts</span>
      </div>
    </div>
  );
}
