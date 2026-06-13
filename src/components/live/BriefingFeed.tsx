import { useEffect, useState, useRef } from "react";
import type { BriefingItem } from "@/lib/briefings";
import { BriefingCard } from "./BriefingCard";
import { SessionCountdown } from "@/components/SessionCountdown";
import { GlassCard } from "@/components/ui";

type NextSessionData = {
  raceName: string;
  circuit: string;
  sessionName: string;
  dateUtc: string;
} | null;

type Props = {
  nextSessionData: NextSessionData;
  isActiveSession: boolean;
};

export function BriefingFeed({ nextSessionData, isActiveSession }: Props) {
  const [briefings, setBriefings] = useState<BriefingItem[]>([]);
  const [error, setError] = useState<boolean>(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const fetchBriefings = async () => {
      try {
        const res = await fetch("/api/live/briefings");
        if (!res.ok) throw new Error("Failed to fetch briefings");
        
        const data = await res.json();
        const now = Date.now();
        if (now > lastUpdateRef.current) {
          setBriefings(data.briefings || []);
          setError(false);
          lastUpdateRef.current = now;
        }
      } catch (err) {
        console.error("Briefings error:", err);
        setError(true);
      } finally {
        setIsInitialLoad(false);
        // Poll every 10 seconds (as requested, less frequent than timing data)
        timeoutId = setTimeout(fetchBriefings, 10000);
      }
    };

    fetchBriefings();

    return () => clearTimeout(timeoutId);
  }, []);

  // Empty State: No active session
  if (!isActiveSession && briefings.length === 0) {
    return (
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 h-full flex flex-col">
        <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400 mb-6">
          Race Briefings
        </h2>
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-950/40 rounded-3xl border border-white/5">
          <span className="text-4xl mb-4" aria-hidden="true">📡</span>
          <p className="text-lg font-semibold text-white mb-2">No active session</p>
          <p className="text-sm text-slate-400 mb-8 max-w-xs">
            Race Control messages and strategy insights will appear here once the session begins.
          </p>
          
          {nextSessionData && nextSessionData.dateUtc ? (
            <GlassCard className="w-full max-w-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300 mb-1">
                Next up
              </p>
              <p className="font-semibold text-white mb-4">{nextSessionData.sessionName}</p>
              <SessionCountdown 
                targetDate={nextSessionData.dateUtc} 
                sessionLabel={nextSessionData.sessionName}
                variant="full"
              />
            </GlassCard>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 h-full flex flex-col max-h-[800px]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
          Race Briefings
        </h2>
        <div className="flex items-center gap-2">
          {error ? (
            <span className="text-xs font-semibold uppercase text-red-400">Connection lost</span>
          ) : (
             <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-slate-500">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              Polling
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-4 custom-scrollbar pb-4">
        {isInitialLoad ? (
          <p className="text-center text-sm text-slate-500 mt-10 animate-pulse">Loading briefings...</p>
        ) : briefings.length === 0 ? (
           <p className="text-center text-sm text-slate-500 mt-10">Waiting for Race Control messages...</p>
        ) : (
          briefings.map((item) => (
            <BriefingCard key={item.id} item={item} />
          ))
        )}
      </div>
    </div>
  );
}
