import type { WeekendContext } from "@/lib/weekend";
import { SessionCountdown } from "@/components/SessionCountdown";
import { GlassCard } from "@/components/ui";

export function UpcomingSessionView({ context }: { context: WeekendContext }) {
  const { currentWeekend, nextSession } = context;

  if (!nextSession) {
    return (
      <div className="flex h-40 items-center justify-center rounded-[2rem] border border-white/10 bg-white/[0.04]">
        <p className="text-sm text-slate-400">Waiting for schedule data...</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
      <div className="space-y-5">
        <div className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-400">
            Upcoming Session
          </h2>
          <h3 className="text-3xl font-semibold text-white sm:text-4xl">
            {nextSession.label}
          </h3>
          <p className="text-slate-400">{currentWeekend.circuit}</p>
        </div>

        <GlassCard className="p-6 text-center sm:p-8">
          <SessionCountdown
            targetDate={nextSession.dateUtc}
            sessionLabel={nextSession.label}
            variant="full"
          />
        </GlassCard>
      </div>

      <div>
        <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
          Weekend Progression
        </h4>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {currentWeekend.sessions.map((session) => (
            <div
              key={session.key}
              className={`rounded-xl border p-4 ${
                session.status === "completed"
                  ? "border-emerald-500/20 bg-emerald-500/10"
                  : session.status === "live"
                  ? "border-amber-500/30 bg-amber-500/10"
                  : session.key === nextSession.key
                  ? "border-sky-500/30 bg-sky-500/10"
                  : "border-white/5 bg-white/[0.02]"
              }`}
            >
              <p className="mb-1 text-sm font-medium text-white">
                {session.label}
              </p>
              <p className="text-xs uppercase tracking-widest text-slate-400">
                {session.status === "completed"
                  ? "Completed"
                  : session.status === "live"
                  ? "Live Now"
                  : "Upcoming"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
