import { SessionCountdown } from "@/components/SessionCountdown";
import { GlassCard, StatusPill } from "@/components/ui";
import type { HubSession } from "@/lib/weekend-hub";
import { formatLocalTime } from "@/lib/utils";

type Props = {
  sessions: HubSession[];
  headingId: string;
};

function sessionTone(status: HubSession["status"]) {
  if (status === "live") return "red" as const;
  if (status === "completed") return "neutral" as const;
  return "green" as const;
}

function sessionStatusLabel(status: HubSession["status"]) {
  if (status === "live") return "Live";
  if (status === "completed") return "Done";
  return "Upcoming";
}

export function WeekendScheduleSection({ sessions, headingId }: Props) {
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
          <li
            key={session.id}
            id={`session-${session.id}`}
            className={`scroll-mt-28 flex min-h-[4.75rem] items-center justify-between gap-4 px-5 py-4 sm:px-6 ${
              session.status === "live"
                ? "bg-red-400/[0.06]"
                : session.status === "completed"
                ? "opacity-50"
                : ""
            }`}
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <StatusPill tone={sessionTone(session.status)}>
                  {sessionStatusLabel(session.status)}
                </StatusPill>
                <p className="text-sm font-semibold text-white">
                  {session.label}
                </p>
              </div>
              {session.dateUtc ? (
                <p
                  className="mt-1.5 text-xs text-slate-500"
                  suppressHydrationWarning
                >
                  {formatLocalTime(session.dateUtc)}
                </p>
              ) : (
                <p className="mt-1.5 text-xs text-slate-600">Date TBC</p>
              )}
            </div>
            {session.status === "upcoming" && session.dateUtc ? (
              <SessionCountdown
                targetDate={session.dateUtc}
                sessionLabel={session.label}
                variant="inline"
              />
            ) : null}
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}
