import type { WeekendContext } from "@/lib/weekend";
import type { TimingRowData } from "@/lib/timing";
import { SessionCountdown } from "@/components/SessionCountdown";
import { GlassCard } from "@/components/ui";

type Props = {
  context: WeekendContext;
  timing: TimingRowData[];
  betweenSessions?: boolean;
};

export function CompletedSessionView({
  context,
  timing,
  betweenSessions = false,
}: Props) {
  const { currentWeekend, activeSession, nextSession } = context;

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-3 py-2 text-center lg:text-left">
        <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
          {betweenSessions ? "Between Sessions" : "Session Completed"}
        </h2>
        <h3 className="text-3xl font-semibold text-white sm:text-4xl">
          {activeSession?.label || "Session"}
        </h3>
        <p className="text-slate-400">{currentWeekend.circuit}</p>
      </div>

      {timing.length >= 3 && (
        <div className="mx-auto grid w-full max-w-4xl grid-cols-3 gap-4">
          {[timing[1], timing[0], timing[2]].map((driver, idx) => (
            <GlassCard
              key={driver.driverNumber}
              className={`p-4 flex flex-col items-center text-center ${
                idx === 1
                  ? "border-amber-400/30 bg-amber-400/5 lg:scale-110 z-10"
                  : "opacity-90"
              }`}
            >
              <span className="text-2xl font-bold text-white mb-1">
                {idx === 1 ? "P1" : idx === 0 ? "P2" : "P3"}
              </span>
              <span className="font-mono text-amber-200 text-sm mb-2">{driver.driverCode}</span>
              <div
                className="h-1 w-8 rounded-full mb-2"
                style={{ backgroundColor: driver.teamColor }}
              />
              <span className="text-xs text-slate-400 font-mono">
                {idx === 1
                  ? driver.intervalToLeader
                  : driver.intervalToNext || driver.intervalToLeader}
              </span>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Full Classification */}
      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] mt-4">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <h4 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-300">
            Final Classification
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="py-3 pl-4 sm:pl-5 pr-2 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">Pos</th>
                <th className="py-3 pr-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">Driver</th>
                <th className="py-3 pr-4 text-right text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">Gap</th>
              </tr>
            </thead>
            <tbody>
              {timing.map((row) => (
                <tr key={row.driverNumber} className="border-b border-white/[0.05] hover:bg-white/[0.04]">
                  <td className="py-3 pl-4 sm:pl-5 pr-2">
                    <span className="font-mono text-sm font-semibold text-slate-300">
                      {String(row.position).padStart(2, "0")}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      <span className="h-6 w-1 rounded-full" style={{ backgroundColor: row.teamColor }} />
                      <div>
                        <span className="font-mono text-amber-200 mr-2 text-sm">{row.driverCode}</span>
                        <span className="text-sm text-white hidden sm:inline">{row.firstName} {row.lastName}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <span className="font-mono text-sm text-slate-300">{row.intervalToLeader || "-"}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Next Session Panel */}
      {nextSession && (
        <GlassCard className="mx-auto w-full max-w-2xl p-6 text-center lg:mx-0 lg:text-left">
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
            Coming Up Next
          </h4>
          <h3 className="mb-5 text-2xl font-semibold text-white">{nextSession.label}</h3>
          <SessionCountdown
            targetDate={nextSession.dateUtc}
            sessionLabel={nextSession.label}
            variant="full"
          />
        </GlassCard>
      )}
    </div>
  );
}
