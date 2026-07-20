import { GlassCard } from "@/components/ui";
import type { HubSession } from "@/lib/weekend-hub";
import type { SessionResultHighlight } from "@/lib/weekend-hub/session-results";
import { highlightForSession } from "@/lib/weekend-hub/session-results";
import { WeekendSessionRow } from "./WeekendSessionRow";

type Props = {
  sessions: HubSession[];
  headingId: string;
  /** Optional per-session result highlights (completed sessions only). */
  resultHighlights?: Map<string, SessionResultHighlight>;
};

export function WeekendScheduleSection({
  sessions,
  headingId,
  resultHighlights,
}: Props) {
  return (
    <GlassCard className="overflow-hidden !p-0">
      <div className="border-b border-white/10 px-5 py-4 sm:px-6">
        <h2
          id={headingId}
          className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400"
        >
          Weekend schedule
        </h2>
        <p className="mt-0.5 text-xs text-slate-600">
          Times shown in your local timezone
        </p>
      </div>
      <ul role="list" className="divide-y divide-white/[0.06]">
        {sessions.map((session) => (
          <WeekendSessionRow
            key={session.id}
            session={session}
            results={
              resultHighlights
                ? highlightForSession(resultHighlights, session.key)
                : undefined
            }
          />
        ))}
      </ul>
    </GlassCard>
  );
}
