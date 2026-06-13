import type { SessionStatus } from "@/lib/timing";
import { GlassCard, StatusPill } from "@/components/ui";

export function SessionStatusHeader({ session }: { session: SessionStatus | null }) {
  if (!session) {
    return (
      <GlassCard className="p-4 sm:p-6 mb-6 flex justify-center items-center h-24">
        <p className="text-sm text-slate-400 animate-pulse">Loading live session...</p>
      </GlassCard>
    );
  }

  const getFlagTone = (flag: SessionStatus["flag"]) => {
    switch (flag) {
      case "GREEN":       return "green";
      case "YELLOW":      return "amber";
      case "DOUBLE_YELLOW": return "amber";
      case "RED":         return "red";
      case "CHEQUERED":  return "neutral";
      case "SAFETY_CAR": return "amber";
      case "VSC":        return "amber";
      case "FINISHED":   return "neutral";
      default:           return "neutral";
    }
  };

  const getFlagLabel = (flag: SessionStatus["flag"]) => {
    switch (flag) {
      case "DOUBLE_YELLOW": return "DOUBLE YELLOW";
      case "SAFETY_CAR":    return "SAFETY CAR";
      case "VSC":           return "VIRTUAL SC";
      case "FINISHED":      return "FINISHED";
      default:              return flag;
    }
  };

  return (
    <GlassCard className="p-4 sm:p-6 mb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-xl font-semibold text-white">{session.sessionName}</h2>
            <StatusPill tone={getFlagTone(session.flag)}>
              {session.flag === "GREEN" ? (
                <span className="mr-1.5 inline-block size-1.5 animate-pulse rounded-full bg-emerald-400" />
              ) : null}
              {getFlagLabel(session.flag)}
            </StatusPill>
          </div>
          <p className="text-sm text-slate-400">{session.circuitShortName}</p>
        </div>
        
        <div className="flex gap-4 sm:gap-6 text-sm">
          <div className="flex flex-col">
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Track</span>
            <span className="font-mono text-white mt-1">{session.trackTemp ? `${session.trackTemp.toFixed(1)}°C` : "N/A"}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Air</span>
            <span className="font-mono text-white mt-1">{session.airTemp ? `${session.airTemp.toFixed(1)}°C` : "N/A"}</span>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
