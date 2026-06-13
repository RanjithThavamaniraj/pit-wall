import type { WeekendContext } from "@/lib/weekend";
import { SessionCountdown } from "@/components/SessionCountdown";
import { GlassCard } from "@/components/ui";

export function UpcomingSessionView({ context }: { context: WeekendContext }) {
  const { currentWeekend, nextSession } = context;

  if (!nextSession) {
    return (
      <div className="flex justify-center items-center h-48 border border-white/10 bg-white/[0.04] rounded-[2rem]">
        <p className="text-sm text-slate-400">Waiting for schedule data...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-400">
          Upcoming Session
        </h2>
        <h3 className="text-3xl sm:text-4xl font-semibold text-white">
          {nextSession.label}
        </h3>
        <p className="text-slate-400">{currentWeekend.circuit}</p>
      </div>

      <GlassCard className="w-full max-w-md p-8 text-center">
        <SessionCountdown
          targetDate={nextSession.dateUtc}
          sessionLabel={nextSession.label}
          variant="full"
        />
      </GlassCard>

      <div className="w-full max-w-2xl mt-12">
        <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-6 text-center">
          Weekend Progression
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {currentWeekend.sessions.map((session) => (
            <div
              key={session.key}
              className={`p-4 rounded-xl border ${
                session.status === "completed"
                  ? "border-emerald-500/20 bg-emerald-500/10"
                  : session.status === "live"
                  ? "border-amber-500/30 bg-amber-500/10"
                  : session.key === nextSession.key
                  ? "border-sky-500/30 bg-sky-500/10"
                  : "border-white/5 bg-white/[0.02]"
              }`}
            >
              <p className="text-sm font-medium text-white mb-1">{session.label}</p>
              <p className="text-xs text-slate-400 uppercase tracking-widest">
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
