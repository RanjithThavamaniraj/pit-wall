import type { CSSProperties } from "react";
import { GlassCard } from "@/components/ui";
import type { StageStatus, TimelineStage } from "@/lib/weekend-hub";

type Props = {
  stages: TimelineStage[];
};

function StageIcon({ status }: { status: StageStatus }) {
  if (status === "completed") {
    return (
      <span
        className="flex size-5 shrink-0 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-400/15 text-[10px] font-bold text-emerald-300"
        aria-hidden="true"
      >
        ✓
      </span>
    );
  }

  if (status === "current") {
    return (
      <span
        className="relative flex size-5 shrink-0 items-center justify-center"
        aria-hidden="true"
      >
        <span className="absolute inset-0 animate-pulse rounded-full bg-amber-400/25" />
        <span className="relative size-2.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.7)]" />
      </span>
    );
  }

  return (
    <span
      className="flex size-5 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.04]"
      aria-hidden="true"
    >
      <span className="size-1.5 rounded-full bg-slate-600" />
    </span>
  );
}

function stageAriaLabel(stage: TimelineStage): string {
  if (stage.status === "completed") return `${stage.label}, completed`;
  if (stage.status === "current") return `${stage.label}, current`;
  return `${stage.label}, upcoming`;
}

export function WeekendStageTimeline({ stages }: Props) {
  return (
    <GlassCard className="!p-4 sm:!p-5">
      <h2 className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
        Weekend timeline
      </h2>

      <div className="mt-4 -mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ol
          className="flex min-w-max items-start gap-0 md:min-w-0 md:grid md:grid-cols-[repeat(var(--stage-count),minmax(0,1fr))] md:gap-2"
          style={{ "--stage-count": stages.length } as CSSProperties}
          aria-label="Race weekend stages"
        >
          {stages.map((stage, index) => {
            const isCurrent = stage.status === "current";
            const isCompleted = stage.status === "completed";

            return (
              <li
                key={stage.id}
                className="relative flex w-[5.5rem] shrink-0 flex-col items-center px-1 text-center sm:w-[6.25rem] md:w-auto md:min-w-0 md:px-0"
                aria-label={stageAriaLabel(stage)}
              >
                {index > 0 ? (
                  <span
                    aria-hidden="true"
                    className={`absolute top-2.5 right-[calc(50%+0.75rem)] hidden h-px w-[calc(100%-1.5rem)] md:block ${
                      isCompleted || isCurrent
                        ? "bg-amber-400/35"
                        : "bg-white/10"
                    }`}
                    style={{ transform: "translateX(-50%)" }}
                  />
                ) : null}

                <StageIcon status={stage.status} />

                <p
                  className={`mt-2 line-clamp-2 text-[10px] font-semibold uppercase leading-tight tracking-[0.12em] sm:text-[11px] ${
                    isCurrent
                      ? "text-amber-200"
                      : isCompleted
                      ? "text-slate-400"
                      : "text-slate-600"
                  }`}
                >
                  {stage.label}
                </p>
              </li>
            );
          })}
        </ol>
      </div>
    </GlassCard>
  );
}
