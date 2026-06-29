"use client";

import { memo } from "react";
import type { WeekendHighlight } from "@/lib/race-summary/types";

type Props = {
  highlights?: WeekendHighlight[];
};

const TYPE_ICONS: Record<string, string> = {
  overtake: "🏎",
  driver: "⭐",
  moment: "⚡",
  default: "🎬",
};

function HighlightsComponent({ highlights }: Props) {
  if (!highlights?.length) {
    return null;
  }

  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
          Highlights
        </h3>
        <span className="text-[10px] uppercase tracking-[0.16em] text-slate-600">
          Video embeds coming soon
        </span>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {highlights.map((highlight) => (
          <article
            key={highlight.title}
            className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-slate-950/40 p-4"
          >
            <div
              className="mb-3 flex h-24 items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/[0.02] text-2xl text-slate-600 transition group-hover:border-white/20 group-hover:text-slate-500"
              aria-hidden="true"
            >
              {TYPE_ICONS[highlight.type ?? "default"] ?? TYPE_ICONS.default}
            </div>
            <h4 className="text-sm font-semibold text-white">
              {highlight.title}
            </h4>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              {highlight.description}
            </p>
            {highlight.videoUrl ? (
              <p className="mt-2 truncate text-[10px] text-amber-300/60">
                {highlight.videoUrl}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

export const Highlights = memo(HighlightsComponent);
