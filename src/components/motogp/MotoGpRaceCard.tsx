import Link from "next/link";
import type { MotoGpEvent } from "@/lib/motogp";
import { countryCodeToFlag, formatDateRange } from "@/lib/utils";
import { SessionCountdown } from "@/components/SessionCountdown";
import { StatusPill } from "@/components/ui";

type Props = {
  event: MotoGpEvent;
};

function PodiumSummary({ event }: { event: MotoGpEvent }) {
  if (!event.podium.length) return null;

  return (
    <div className="mt-4 space-y-1.5 border-t border-white/[0.06] pt-4">
      {event.podium.map((finisher) => (
        <div
          key={finisher.position}
          className="flex items-center justify-between text-xs"
        >
          <span className="font-mono text-slate-500">
            P{finisher.position}
          </span>
          <span className="flex-1 px-3 text-slate-300">
            <span className="font-mono text-amber-200/80">
              #{finisher.riderNumber}
            </span>{" "}
            {finisher.riderName}
          </span>
        </div>
      ))}
    </div>
  );
}

function SessionPreview({ event }: { event: MotoGpEvent }) {
  return (
    <div className="mt-4 space-y-2">
      {event.sessions.slice(0, 4).map((session) => (
        <div
          key={session.sessionId}
          className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-slate-950/40 px-3 py-2"
        >
          <p className="text-xs text-slate-400">{session.label}</p>
          <div className="flex items-center gap-2">
            {session.status === "live" && <StatusPill tone="red">Live</StatusPill>}
            {session.status === "completed" && (
              <StatusPill tone="neutral">Done</StatusPill>
            )}
            {session.status === "upcoming" && session.dateUtc && (
              <SessionCountdown
                targetDate={session.dateUtc}
                sessionLabel={session.label}
                variant="inline"
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function MotoGpRaceCard({ event }: Props) {
  const flag = countryCodeToFlag(event.countryCode);
  const firstSession = event.sessions[0];
  const raceSession = event.sessions.find((session) => session.key === "race");
  const nextSession = event.sessions.find((session) => session.status === "upcoming");
  const liveSession = event.sessions.find((session) => session.status === "live");
  const countdown = liveSession ?? nextSession;
  const dateRange = formatDateRange(
    firstSession?.dateUtc ?? event.dateStart,
    raceSession?.dateUtc ?? event.dateEnd
  );
  const href = `/motogp/races/${event.slug}`;

  if (event.isPast) {
    return (
      <Link
        href={href}
        className="group block rounded-[2rem] border border-white/[0.06] bg-white/[0.03] p-5 transition hover:bg-white/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
        aria-label={`${event.name} — Round ${event.round}. Race completed.`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="text-2xl" aria-hidden="true">
              {flag}
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">
                Round {event.round}
              </p>
              <h3 className="mt-0.5 text-sm font-semibold text-slate-400 group-hover:text-slate-300 transition">
                {event.shortName}
              </h3>
            </div>
          </div>
          <StatusPill tone="neutral">Completed</StatusPill>
        </div>
        <p className="mt-3 text-xs text-slate-600">{dateRange}</p>
        <p className="mt-1 text-xs text-slate-600">{event.circuit}</p>
        <PodiumSummary event={event} />
      </Link>
    );
  }

  if (event.isNext || event.isCurrent) {
    return (
      <Link
        href={href}
        className="group relative block overflow-hidden rounded-[2rem] border border-amber-300/20 bg-white/[0.06] p-6 shadow-2xl shadow-amber-500/10 backdrop-blur-xl transition hover:bg-white/[0.08] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
        aria-label={`${event.name} — Round ${event.round}. ${
          event.isCurrent ? "Race weekend is happening now." : "Next race."
        }`}
      >
        <div
          className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-amber-300/0 via-amber-300 to-amber-300/0"
          aria-hidden="true"
        />
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="text-3xl" aria-hidden="true">
              {flag}
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">
                Round {event.round} ·{" "}
                {event.isCurrent ? "This weekend" : "Next race"}
              </p>
              <h3 className="mt-1 text-lg font-semibold text-white">
                {event.name}
              </h3>
              <p className="text-sm text-slate-400">
                {event.circuit}
                {event.locality ? ` · ${event.locality}` : ""}
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
        {countdown?.dateUtc && (
          <div className="mt-5">
            <SessionCountdown
              targetDate={countdown.dateUtc}
              sessionLabel={countdown.label}
              variant="full"
            />
          </div>
        )}
        <SessionPreview event={event} />
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="group block rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 transition hover:bg-white/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
      aria-label={`${event.name} — Round ${event.round}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden="true">
            {flag}
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Round {event.round}
            </p>
            <h3 className="mt-0.5 text-base font-semibold text-white group-hover:text-amber-100 transition">
              {event.shortName}
            </h3>
            <p className="text-xs text-slate-500">{event.circuit}</p>
          </div>
        </div>
        <p className="text-xs text-slate-500">{dateRange}</p>
      </div>
      <SessionPreview event={event} />
    </Link>
  );
}
