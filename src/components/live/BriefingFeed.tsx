"use client";

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
  const requestIdRef = useRef(0);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    let cancelled = false;

    const fetchBriefings = async () => {
      const requestId = ++requestIdRef.current;

      try {
        const res = await fetch("/api/live/briefings");
        if (!res.ok) throw new Error("Failed to fetch briefings");

        const data = await res.json();
        if (cancelled || requestId !== requestIdRef.current) return;

        setBriefings(data.briefings || []);
        setError(false);
      } catch (err) {
        console.error("Briefings error:", err);
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) {
          setIsInitialLoad(false);
          timeoutId = setTimeout(fetchBriefings, 10000);
        }
      }
    };

    fetchBriefings();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, []);

  if (!isActiveSession && briefings.length === 0) {
    return (
      <div className="flex h-full flex-col rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
        <h2 className="mb-6 text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
          Race Briefings
        </h2>
        <div className="flex flex-1 flex-col items-center justify-center rounded-3xl border border-white/5 bg-slate-950/40 p-6 text-center">
          <p className="mb-2 text-lg font-semibold text-white">
            No active session
          </p>
          <p className="mb-8 max-w-xs text-sm text-slate-400">
            Race Control messages and strategy insights will appear here once the
            session begins.
          </p>

          {nextSessionData?.dateUtc ? (
            <GlassCard className="w-full max-w-sm">
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">
                Next up
              </p>
              <p className="mb-4 font-semibold text-white">
                {nextSessionData.sessionName}
              </p>
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
    <div className="flex max-h-[800px] h-full flex-col rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
          Race Briefings
        </h2>
        <div className="flex items-center gap-2">
          {error ? (
            <span className="text-xs font-semibold uppercase text-red-400">
              Connection lost
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-slate-500">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              </span>
              Polling
            </span>
          )}
        </div>
      </div>

      <div className="custom-scrollbar -mr-2 flex-1 space-y-4 overflow-y-auto pr-2 pb-4">
        {isInitialLoad ? (
          <p className="mt-10 animate-pulse text-center text-sm text-slate-500">
            Loading briefings...
          </p>
        ) : briefings.length === 0 ? (
          <p className="mt-10 text-center text-sm text-slate-500">
            Waiting for Race Control messages...
          </p>
        ) : (
          briefings.map((item) => <BriefingCard key={item.id} item={item} />)
        )}
      </div>
    </div>
  );
}
