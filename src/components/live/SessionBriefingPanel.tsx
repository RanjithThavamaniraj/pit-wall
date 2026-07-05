import type { SessionBriefing } from "@/lib/session-briefing";
import { StatusPill } from "@/components/ui";

type NextSessionData = {
  raceName: string;
  circuit: string;
  sessionName: string;
  dateUtc: string;
} | null;

type Props = {
  briefing: SessionBriefing | null;
  nextSessionData?: NextSessionData;
};

export function SessionBriefingPanel({ briefing, nextSessionData }: Props) {
  if (!briefing || briefing.sections.length === 0) {
    return (
      <div className="flex h-full flex-col rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
        <h2 className="mb-6 text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
          Session Briefing
        </h2>
        <div className="flex flex-1 flex-col items-center justify-center rounded-3xl border border-white/5 bg-slate-950/40 p-6 text-center">
          <p className="mb-2 text-lg font-semibold text-white">
            Briefing unavailable
          </p>
          <p className="max-w-xs text-sm text-slate-400">
            {nextSessionData
              ? `Verified weekend data will appear here before ${nextSessionData.sessionName}.`
              : "Verified weekend data will appear here once available."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex max-h-[800px] h-full flex-col rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
      <div className="mb-6 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
          Session Briefing
        </h2>
        <StatusPill tone="neutral">{briefing.statusLabel}</StatusPill>
      </div>

      <div className="custom-scrollbar -mr-2 flex-1 space-y-4 overflow-y-auto pr-2 pb-4">
        <p className="text-lg font-semibold text-white">{briefing.title}</p>
        {briefing.sections.map((sec) => (
          <div
            key={sec.id}
            className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
          >
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              {sec.heading}
            </p>
            <p className="text-sm leading-relaxed text-slate-200">
              {sec.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
