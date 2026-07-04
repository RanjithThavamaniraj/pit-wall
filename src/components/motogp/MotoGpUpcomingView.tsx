import type { MotoGpWeekendContext } from "@/lib/motogp-weekend";
import { WeekendHero, NextSessionPanel } from "@/components/live/WeekendPreviewShared";
import { countryCodeToFlag } from "@/lib/utils";

type Props = {
  context: MotoGpWeekendContext;
};

export function MotoGpUpcomingView({ context }: Props) {
  const { currentWeekend, nextSession } = context;
  const flag = countryCodeToFlag(currentWeekend.countryCode);

  if (!nextSession) {
    return (
      <div className="flex h-40 items-center justify-center rounded-[2rem] border border-white/10 bg-white/[0.04]">
        <p className="text-sm text-slate-400">Waiting for schedule data...</p>
      </div>
    );
  }

  const motogpFootnote = (
    <p className="text-xs leading-6 text-slate-500">
      Live timing is not available from the public MotoGP API. Session results
      and progression update here throughout the weekend.
    </p>
  );

  return (
    <div className="space-y-6">
      <WeekendHero
        flag={flag}
        eyebrow={`Round ${currentWeekend.round} · ${currentWeekend.season} · MotoGP`}
        title={currentWeekend.name}
        subtitle={`${currentWeekend.circuit}${
          currentWeekend.locality ? ` · ${currentWeekend.locality}` : ""
        }, ${currentWeekend.country}`}
        detailHref={`/motogp/races/${currentWeekend.slug}`}
      />

      <div className="mx-auto max-w-md">
        <NextSessionPanel
          sessionLabel={nextSession.label}
          circuit={currentWeekend.circuit}
          dateUtc={nextSession.dateUtc}
          footnote={motogpFootnote}
        />
      </div>
    </div>
  );
}
