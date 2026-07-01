import { GlassCard, StatusPill } from "@/components/ui";
import type { StoryImportance } from "@/lib/weekend-hub/story";

type Props = {
  title: string;
  content: string;
  importance: StoryImportance;
  icon?: string;
  callout?: string;
  headingId?: string;
  className?: string;
};

const IMPORTANCE_TONE: Record<
  StoryImportance,
  "amber" | "neutral" | "blue"
> = {
  primary: "amber",
  secondary: "neutral",
  tertiary: "blue",
};

const IMPORTANCE_LABEL: Record<StoryImportance, string> = {
  primary: "Key story",
  secondary: "Feature",
  tertiary: "Note",
};

export function StoryCard({
  title,
  content,
  importance,
  icon,
  callout,
  headingId,
  className = "",
}: Props) {
  const tone = IMPORTANCE_TONE[importance];
  const isPrimary = importance === "primary";

  return (
    <GlassCard
      className={`relative overflow-hidden ${className}`}
    >
      {isPrimary ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/40 to-transparent"
        />
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          {icon ? (
            <span
              aria-hidden="true"
              className={`flex size-7 shrink-0 items-center justify-center rounded-full border ${
                isPrimary
                  ? "border-amber-300/30 bg-amber-300/10 text-amber-200"
                  : "border-white/15 bg-white/[0.04] text-slate-300"
              } text-sm`}
            >
              {icon}
            </span>
          ) : null}
          <h3
            id={headingId}
            className={`font-semibold tracking-[-0.01em] ${
              isPrimary
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
          isPrimary
            ? "text-base text-slate-200 sm:text-[1.05rem] sm:leading-8"
            : "text-sm text-slate-300 sm:leading-7"
        }`}
      >
        {content}
      </p>

      {callout ? (
        <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-200/80">
            Editor&apos;s callout
          </p>
          <p className="mt-1.5 text-sm leading-6 text-amber-100/90">
            {callout}
          </p>
        </div>
      ) : null}
    </GlassCard>
  );
}