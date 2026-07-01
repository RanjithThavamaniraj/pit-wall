import { GlassCard, StatusPill } from "@/components/ui";
import type { StrategyConfidence } from "@/lib/weekend-hub/strategy";

type Props = {
  title: string;
  detail: string;
  importance: StrategyConfidence;
  icon?: string;
  headingId?: string;
  className?: string;
};

const IMPORTANCE_TONE: Record<
  StrategyConfidence,
  "amber" | "neutral" | "blue"
> = {
  high: "amber",
  medium: "neutral",
  low: "blue",
};

const IMPORTANCE_LABEL: Record<StrategyConfidence, string> = {
  high: "Key insight",
  medium: "Watch",
  low: "Note",
};

export function StrategyCard({
  title,
  detail,
  importance,
  icon,
  headingId,
  className = "",
}: Props) {
  const tone = IMPORTANCE_TONE[importance];
  const isHigh = importance === "high";

  return (
    <GlassCard className={`relative overflow-hidden ${className}`}>
      {isHigh ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/40 to-transparent"
        />
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          {icon ? (
            <span
              aria-hidden="true"
              className={`flex size-7 shrink-0 items-center justify-center rounded-full border text-sm ${
                isHigh
                  ? "border-amber-300/30 bg-amber-300/10 text-amber-200"
                  : "border-white/15 bg-white/[0.04] text-slate-300"
              }`}
            >
              {icon}
            </span>
          ) : null}
          <h3
            id={headingId}
            className={`font-semibold tracking-[-0.01em] ${
              isHigh
                ? "text-lg text-white sm:text-xl"
                : "text-base text-white"
            }`}
          >
            {title}
          </h3>
        </div>
        <StatusPill tone={tone}>{IMPORTANCE_LABEL[importance]}</StatusPill>
      </div>

      <p
        className={`mt-4 whitespace-pre-line leading-7 ${
          isHigh
            ? "text-base text-slate-200 sm:text-[1.05rem] sm:leading-8"
            : "text-sm text-slate-300 sm:leading-7"
        }`}
      >
        {detail}
      </p>
    </GlassCard>
  );
}