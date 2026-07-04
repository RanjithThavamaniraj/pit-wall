"use client";

import type { WeekendContext } from "@/lib/weekend";
import { BriefingFeed } from "@/components/live/BriefingFeed";
import { WeekendHero, NextSessionPanel } from "./WeekendPreviewShared";
import { countryCodeToFlag } from "@/lib/utils";

type Props = {
  context: WeekendContext;
};

export function UpcomingSessionView({ context }: Props) {
  const { currentWeekend, nextSession } = context;
  const flag = countryCodeToFlag(currentWeekend.countryCode);
  const isSprintWeekend = currentWeekend.sessions.some(
    (s) => s.key === "sprint_qualifying" || s.key === "sprint"
  );

  if (!nextSession) {
    return (
      <div className="flex h-40 items-center justify-center rounded-[2rem] border border-white/10 bg-white/[0.04]">
        <p className="text-sm text-slate-400">Waiting for schedule data...</p>
      </div>
    );
  }

  const nextSessionData = {
    raceName: currentWeekend.name,
    circuit: currentWeekend.circuit,
    sessionName: nextSession.label,
    dateUtc: nextSession.dateUtc,
  };

  return (
    <div className="space-y-6">
      <WeekendHero
        flag={flag}
        eyebrow={`Round ${currentWeekend.round} · ${currentWeekend.season}${
          isSprintWeekend ? " · Sprint weekend" : ""
        }`}
        title={currentWeekend.name}
        subtitle={`${currentWeekend.circuit} · ${currentWeekend.locality}, ${currentWeekend.country}`}
        detailHref={`/races/${currentWeekend.slug}`}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(300px,360px)] lg:items-start">
        <NextSessionPanel
          sessionLabel={nextSession.label}
          circuit={currentWeekend.circuit}
          dateUtc={nextSession.dateUtc}
        />
        <BriefingFeed nextSessionData={nextSessionData} isActiveSession={false} />
      </div>
    </div>
  );
}
