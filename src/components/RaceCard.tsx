import Link from "next/link";
import type { RaceWeekend } from "@/lib/schedule";
import { countryCodeToFlag, formatDateRange, formatShortDate } from "@/lib/utils";
import { SessionCountdown } from "./SessionCountdown";
import { StatusPill } from "./ui";

type Props = {
  race: RaceWeekend;
};

export function RaceCard({ race }: Props) {
  const fp1 = race.sessions.find((s) => s.key === "fp1");
  const raceSession = race.sessions.find((s) => s.key === "race");
  const nextSession = race.sessions.find((s) => s.status === "upcoming");
  const liveSession = race.sessions.find((s) => s.status === "live");
  const flag = countryCodeToFlag(race.countryCode);
  const dateRange = formatDateRange(
    fp1?.dateUtc ?? "",
    raceSession?.dateUtc ?? ""
  );

  if (race.isPast) {
    return (
      <Link
        href={`/races/${race.slug}`}
        className="group block rounded-[2rem] border border-white/[0.06] bg-white/[0.03] p-5 transition hover:bg-white/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
        aria-label={`${race.name} — Round ${race.round}. Race completed.`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="text-2xl" aria-hidden="true">{flag}</span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">
                Round {race.round}
              </p>
              <h3 className="mt-0.5 text-sm font-semibold text-slate-400 group-hover:text-slate-300 transition">
                {race.shortName}
              </h3>
            </div>
          </div>
          <StatusPill tone="neutral">Completed</StatusPill>
        </div>
        <p className="mt-3 text-xs text-slate-600">{dateRange}</p>
      </Link>
    );
  }

  if (race.isNext || race.isCurrent) {
    const countdown = liveSession ?? nextSession;

    return (
      <Link
        href={`/races/${race.slug}`}
        className="group relative block overflow-hidden rounded-[2rem] border border-amber-300/20 bg-white/[0.06] p-6 shadow-2xl shadow-amber-500/10 backdrop-blur-xl transition hover:bg-white/[0.08] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
        aria-label={`${race.name} — Round ${race.round}. ${race.isCurrent ? "Race weekend is happening now." : "Next race."}`}
      >
        <div
          className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-amber-300/0 via-amber-300 to-amber-300/0"
          aria-hidden="true"
        />
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="text-3xl" aria-hidden="true">{flag}</span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">
                Round {race.round} · {race.isCurrent ? "This weekend" : "Next race"}
              </p>
              <h3 className="mt-1 text-lg font-semibold text-white">
                {race.name}
              </h3>
              <p className="text-sm text-slate-400">
                {race.circuit} · {race.locality}
              </p>
            </div>
          </div>
          {liveSession ? (
            <StatusPill tone="red">Live now</StatusPill>
          ) : (
            <StatusPill tone="green">Upcoming</StatusPill>
          )}
        </div>
        <p className="mt-3 text-xs text-slate-500">{dateRange}</p>
        {countdown && countdown.dateUtc && (
          <div className="mt-5">
            <SessionCountdown
              targetDate={countdown.dateUtc}
              sessionLabel={countdown.label}
              variant="full"
            />
          </div>
        )}
      </Link>
    );
  }

  // Future race (not next)
  return (
    <Link
      href={`/races/${race.slug}`}
      className="group block rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 transition hover:bg-white/[0.07] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
      aria-label={`${race.name} — Round ${race.round}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden="true">{flag}</span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Round {race.round}
            </p>
            <h3 className="mt-0.5 text-base font-semibold text-white group-hover:text-amber-100 transition">
              {race.shortName}
            </h3>
            <p className="text-xs text-slate-500">{race.circuit}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">
            {raceSession?.dateUtc ? formatShortDate(raceSession.dateUtc) : "TBC"}
          </p>
        </div>
      </div>
    </Link>
  );
}
