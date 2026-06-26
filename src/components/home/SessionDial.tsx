"use client";

import Link from "next/link";
import { useMemo, type CSSProperties } from "react";
import { useCountdown } from "@/hooks/useCountdown";
import { formatCompactTime } from "@/lib/utils";
import type { HeroBoardSession } from "@/components/home/PitWallHeroBoard";

type SessionDialProps = {
  sessions: HeroBoardSession[];
  detailHref: string;
  liveHref: string;
  countdown?: { dateUtc: string; label: string; isRace?: boolean };
};

function countdownLabel(label: string, isRace?: boolean, live?: boolean) {
  if (live) return "On track";
  if (isRace) return "Lights out";
  if (/qualif/i.test(label)) return "Qualifying";
  if (/sprint/i.test(label)) return "Sprint";
  if (/practice|fp/i.test(label)) return "Session";
  return "Starts";
}

function sessionHref(
  session: HeroBoardSession,
  detailHref: string,
  liveHref: string
): string {
  if (session.status === "live") return liveHref;
  return `${detailHref}#session-${session.id}`;
}

function sessionAngle(
  session: HeroBoardSession,
  index: number,
  total: number,
  minTime: number,
  maxTime: number
): number {
  if (session.dateUtc) {
    const t = new Date(session.dateUtc).getTime();
    if (maxTime > minTime) {
      return -90 + ((t - minTime) / (maxTime - minTime)) * 360;
    }
  }
  if (total <= 1) return -90;
  return -90 + (index / (total - 1)) * 360;
}

function DialCenter({
  targetDate,
  sessionLabel,
  isRace,
}: {
  targetDate: string;
  sessionLabel: string;
  isRace?: boolean;
}) {
  const { days, hours, minutes, seconds, isExpired } = useCountdown(targetDate);
  const live = isExpired;

  const parts = [
    { value: days, show: days > 0 },
    { value: hours, show: days < 7 },
    { value: minutes, show: true },
    { value: seconds, show: days === 0 && hours < 8 },
  ].filter((p) => p.show);

  return (
    <div className="hero-dial-center" role="timer">
      <p className="hero-dial-center-eyebrow">
        {countdownLabel(sessionLabel, isRace, live)}
      </p>
      {live ? (
        <p className="hero-dial-center-live">Live</p>
      ) : (
        <p className="hero-dial-center-time" suppressHydrationWarning>
          {parts.map((part, i) => (
            <span key={i}>
              {i > 0 && <span className="hero-dial-center-sep">:</span>}
              {String(part.value).padStart(2, "0")}
            </span>
          ))}
        </p>
      )}
      <p className="hero-dial-center-session">{sessionLabel}</p>
    </div>
  );
}

export function SessionDial({
  sessions,
  detailHref,
  liveHref,
  countdown,
}: SessionDialProps) {
  const timedSessions = sessions.filter((s) => s.dateUtc);
  const minTime = timedSessions.length
    ? Math.min(...timedSessions.map((s) => new Date(s.dateUtc!).getTime()))
    : 0;
  const maxTime = timedSessions.length
    ? Math.max(...timedSessions.map((s) => new Date(s.dateUtc!).getTime()))
    : 0;

  const nextIndex = sessions.findIndex(
    (s) => s.status === "live" || s.status === "upcoming"
  );

  const progressSweep = useMemo(() => {
    if (sessions.length === 0) return 0;
    const done = sessions.filter((s) => s.status === "completed").length;
    const live = sessions.some((s) => s.status === "live") ? 0.5 : 0;
    return ((done + live) / sessions.length) * 360;
  }, [sessions]);

  const completedCount = sessions.filter((s) => s.status === "completed").length;

  return (
    <div className="hero-dial" aria-label="Weekend session times">
      <div className="hero-dial-header">
        <p className="hero-dial-title">Weekend schedule</p>
        <p className="hero-dial-progress">
          {completedCount} of {sessions.length} complete
        </p>
      </div>

      <div className="hero-dial-stage">
        <svg
          className="hero-dial-svg"
          viewBox="0 0 240 240"
          aria-hidden="true"
        >
          <circle
            cx="120"
            cy="120"
            r="98"
            className="hero-dial-svg-track hero-dial-svg-track--outer"
          />
          <circle
            cx="120"
            cy="120"
            r="82"
            className="hero-dial-svg-track hero-dial-svg-track--mid"
          />
          <circle
            cx="120"
            cy="120"
            r="64"
            className="hero-dial-svg-track hero-dial-svg-track--inner"
          />
          {progressSweep > 0 && (
            <circle
              cx="120"
              cy="120"
              r="90"
              className="hero-dial-svg-progress"
              strokeDasharray={`${(progressSweep / 360) * 565.5} 565.5`}
              transform="rotate(-90 120 120)"
            />
          )}
        </svg>

        {countdown?.dateUtc && (
          <DialCenter
            targetDate={countdown.dateUtc}
            sessionLabel={countdown.label}
            isRace={countdown.isRace}
          />
        )}

        {sessions.map((session, index) => {
          const angle = sessionAngle(session, index, sessions.length, minTime, maxTime);
          const isLive = session.status === "live";
          const isNext = index === nextIndex && session.status === "upcoming";
          const isDone = session.status === "completed";
          const timeLabel = session.dateUtc
            ? formatCompactTime(session.dateUtc)
            : "TBC";

          return (
            <Link
              key={session.id}
              href={sessionHref(session, detailHref, liveHref)}
              className={`hero-dial-pill ${
                isLive
                  ? "hero-dial-pill--live"
                  : isNext
                  ? "hero-dial-pill--next"
                  : isDone
                  ? "hero-dial-pill--done"
                  : ""
              }`}
              style={
                {
                  "--dial-angle": `${angle}deg`,
                } as CSSProperties
              }
              aria-label={`${session.label}, ${timeLabel}`}
            >
              <span className="hero-dial-pill-time" suppressHydrationWarning>
                {timeLabel}
              </span>
              <span className="hero-dial-pill-label">{session.shortLabel}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
