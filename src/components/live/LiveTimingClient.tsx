"use client";

import { useEffect, useState, useRef } from "react";
import type { LiveTimingPayload } from "@/lib/timing";
import type { WeekendContext } from "@/lib/weekend";
import { Container } from "@/components/ui";
import { SessionStatusHeader } from "@/components/live/SessionStatusHeader";
import { TimingBoard } from "@/components/live/TimingBoard";
import { BriefingFeed } from "@/components/live/BriefingFeed";
import { UpcomingSessionView } from "@/components/live/UpcomingSessionView";
import { CompletedSessionView } from "@/components/live/CompletedSessionView";

export default function LiveTimingClient({ initialContext }: { initialContext: WeekendContext | null }) {
  const [data, setData] = useState<LiveTimingPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastUpdateRef = useRef<number>(0);

  // Derive the active context from either the latest payload or the initial prop
  const currentContext = data?.weekendContext || initialContext;
  const isLive = currentContext?.state === "LIVE";
  const isCompleted = currentContext?.state === "COMPLETED";
  const isUpcoming = currentContext?.state === "UPCOMING";

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const fetchTiming = async () => {
      try {
        const res = await fetch("/api/live/timing");
        if (!res.ok) {
          throw new Error("Failed to fetch live timing");
        }
        const payload: LiveTimingPayload = await res.json();
        
        const now = Date.now();
        if (now > lastUpdateRef.current) {
          setData(payload);
          setError(null);
          lastUpdateRef.current = now;
        }
      } catch (err) {
        console.error("Live timing error:", err);
        if (!data) setError("Unable to connect to live timing.");
      } finally {
        // Poll aggressively if live, slower otherwise just to check state changes
        const isCurrentlyLive = data?.weekendContext?.state === "LIVE" || (!data && isLive);
        timeoutId = setTimeout(fetchTiming, isCurrentlyLive ? 3000 : 15000);
      }
    };

    fetchTiming();

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLive]);

  // Fallback while initialContext loads on the client
  if (!currentContext) {
    return (
      <section className="relative isolate pt-6 pb-16 min-h-[80vh] flex items-center justify-center">
         <p className="text-slate-400 animate-pulse">Initializing weekend state...</p>
      </section>
    );
  }

  // NextSessionData format needed by BriefingFeed (which still uses it as a fallback)
  const nextSessionData = currentContext.nextSession ? {
    raceName: currentContext.currentWeekend.name,
    circuit: currentContext.currentWeekend.circuit,
    sessionName: currentContext.nextSession.label,
    dateUtc: currentContext.nextSession.dateUtc,
  } : null;

  return (
    <section className="relative isolate pt-6 pb-16 min-h-[80vh]">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(14,165,233,0.08),transparent_60%)]"
      />
      <Container>
        {/* Dynamic Header */}
        <div className="mb-6 flex items-baseline justify-between">
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {isUpcoming ? "Weekend Preview" : isLive ? "Live Timing" : "Session Results"}
          </h1>
          
          <div className="flex items-center gap-2">
            {isLive ? (
               <>
                 <span className="relative flex h-2 w-2">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                 </span>
                 <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400">Live</span>
               </>
            ) : isCompleted ? (
               <span className="text-xs font-semibold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                 <span className="h-2 w-2 rounded-full bg-slate-500"></span>
                 Completed
               </span>
            ) : (
               <span className="text-xs font-semibold uppercase tracking-widest text-amber-500 flex items-center gap-1.5">
                 <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                 Upcoming
               </span>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 mb-6">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* State-driven Views */}
        {isUpcoming ? (
          <UpcomingSessionView context={currentContext} />
        ) : isCompleted ? (
          <CompletedSessionView context={currentContext} timing={data?.timing || []} />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_400px]">
            {/* Main Timing Board Column */}
            <div className="flex flex-col gap-6 min-w-0">
              <SessionStatusHeader session={data?.session || null} />
              <TimingBoard timing={data?.timing || []} />
            </div>

            {/* Sidebar / Briefings Column */}
            <div className="hidden lg:block">
              <BriefingFeed 
                nextSessionData={nextSessionData} 
                isActiveSession={true}
              />
            </div>
          </div>
        )}
      </Container>
    </section>
  );
}
