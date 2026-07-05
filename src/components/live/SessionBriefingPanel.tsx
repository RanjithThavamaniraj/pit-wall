import type { SessionBriefing } from "@/lib/session-briefing";
import { SessionCountdown } from "@/components/SessionCountdown";
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
  statusLabel?: string;
  circuit?: string;
};

function StatusBar({
  statusLabel,
  circuit,
  nextSessionData,
}: {
  statusLabel: string;
  circuit: string;
  nextSessionData?: NextSessionData;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-white/10 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2.5">
        <span
          className="h-1.5 w-1.5 rounded-full bg-slate-500"
          aria-hidden="true"
        />
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          {statusLabel}
        </span>
        {circuit && (
          <>
            <span className="text-white/15">·</span>
            <span className="text-sm text-slate-300">{circuit}</span>
          </>
        )}
      </div>

      {nextSessionData && (
        <div className="flex items-baseline gap-2.5">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Next: {nextSessionData.sessionName}
          </span>
          <SessionCountdown
            targetDate={nextSessionData.dateUtc}
            sessionLabel={nextSessionData.sessionName}
            variant="inline"
          />
        </div>
      )}
    </div>
  );
}

export function SessionBriefingPanel({
  briefing,
  nextSessionData,
  statusLabel,
  circuit,
}: Props) {
  if (!briefing || briefing.sections.length === 0) {
    return (
      <div className="flex h-full max-h-[800px] flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.03]">
        {statusLabel && (
          <StatusBar
            statusLabel={statusLabel}
            circuit={circuit ?? ""}
            nextSessionData={nextSessionData}
          />
        )}
        <div className="flex flex-1 flex-col p-6">
          <h2 className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Session Briefing
          </h2>
          <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-white/5 bg-slate-950/30 p-6 text-center">
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
      </div>
    );
  }

  return (
    <div className="flex h-full max-h-[800px] flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.03]">
      {statusLabel && (
        <StatusBar
          statusLabel={statusLabel}
          circuit={circuit ?? ""}
          nextSessionData={nextSessionData}
        />
      )}

      <div className="flex items-center justify-between gap-2 px-6 pt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Session Briefing
        </p>
        <StatusPill tone="neutral">{briefing.statusLabel}</StatusPill>
      </div>

      <p className="px-6 pb-1 pt-3 text-lg font-semibold text-white">
        {briefing.title}
      </p>

      <div className="custom-scrollbar flex-1 overflow-y-auto px-6 pb-6">
        <div className="divide-y divide-white/[0.06]">
          {briefing.sections.map((sec) => (
            <div key={sec.id} className="py-4 first:pt-3 last:pb-0">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {sec.heading}
              </p>
              <p className="text-sm leading-relaxed text-slate-200">
                {sec.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
