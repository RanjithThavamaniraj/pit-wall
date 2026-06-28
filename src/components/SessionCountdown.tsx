"use client";

import { useCountdown } from "@/hooks/useCountdown";
import { formatCountdownCompact } from "@/lib/utils";

type Props = {
  targetDate: string; // ISO UTC string
  sessionLabel: string;
  /** "full" shows days/hours/min/sec blocks. "inline" shows compact "3h 42m". "hero" is open typography. */
  variant?: "full" | "inline" | "hero";
};

/**
 * Full countdown — used as the hero element for the next race.
 */
function FullCountdown({ targetDate, sessionLabel }: Props) {
  const { days, hours, minutes, seconds, isExpired } = useCountdown(targetDate);

  if (isExpired) {
    return (
      <div
        role="timer"
        aria-label={`${sessionLabel} is now live`}
        className="inline-flex items-center gap-2 rounded-full border border-red-400/30 bg-red-400/10 px-4 py-2"
      >
        <span className="size-2 animate-pulse rounded-full bg-red-400 shadow-[0_0_12px_rgba(248,113,113,0.8)]" />
        <span className="text-sm font-semibold text-red-300">
          {sessionLabel} is live
        </span>
      </div>
    );
  }

  const units = [
    { value: days, label: "days", show: days > 0 },
    { value: hours, label: "hrs", show: days < 7 },
    { value: minutes, label: "min", show: days < 1 || days < 7 },
    { value: seconds, label: "sec", show: days === 0 && hours < 3 },
  ].filter((u) => u.show);

  return (
    <div
      role="timer"
      aria-label={`${sessionLabel} starts in ${days} days ${hours} hours ${minutes} minutes`}
    >
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
        {sessionLabel} starts in
      </p>
      <div className="flex items-end gap-3">
        {units.map(({ value, label }) => (
          <div key={label} className="text-center">
            <div className="min-w-[3rem] rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2 text-center font-mono text-3xl font-semibold text-white tabular-nums sm:text-4xl">
              {String(value).padStart(2, "0")}
            </div>
            <p className="mt-1.5 text-xs uppercase tracking-widest text-slate-500">
              {label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Hero countdown — open typography without tile boxes.
 */
function HeroCountdown({ targetDate, sessionLabel }: Props) {
  const { days, hours, minutes, seconds, isExpired } = useCountdown(targetDate);

  if (isExpired) {
    return (
      <div role="timer" aria-label={`${sessionLabel} is now live`}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-red-400">
          {sessionLabel}
        </p>
        <p className="mt-2 flex items-center gap-2 text-lg font-semibold text-red-300">
          <span className="size-2 animate-pulse rounded-full bg-red-400" />
          Session live
        </p>
      </div>
    );
  }

  const units = [
    { value: days, label: "days", show: days > 0 },
    { value: hours, label: "hrs", show: days < 7 },
    { value: minutes, label: "min", show: days < 1 || days < 7 },
    { value: seconds, label: "sec", show: days === 0 && hours < 3 },
  ].filter((u) => u.show);

  return (
    <div
      role="timer"
      aria-label={`${sessionLabel} starts in ${days} days ${hours} hours ${minutes} minutes`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
        {sessionLabel} starts in
      </p>
      <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        {units.map(({ value, label }, index) => (
          <span key={label} className="inline-flex items-baseline gap-1">
            {index > 0 && (
              <span className="mr-2 text-slate-600" aria-hidden="true">
                :
              </span>
            )}
            <span className="font-mono text-3xl font-semibold tabular-nums text-white sm:text-4xl">
              {String(value).padStart(2, "0")}
            </span>
            <span className="text-xs uppercase tracking-widest text-slate-500">
              {label}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Inline countdown — compact "in 3h 42m" format for session rows.
 */
function InlineCountdown({ targetDate, sessionLabel }: Props) {
  const { days, hours, minutes, isExpired } = useCountdown(targetDate);

  if (isExpired) {
    return (
      <span
        role="timer"
        aria-label={`${sessionLabel} is live`}
        className="inline-flex items-center gap-1.5 rounded-full border border-red-400/30 bg-red-400/10 px-2.5 py-1 text-xs font-semibold text-red-300"
      >
        <span className="size-1.5 animate-pulse rounded-full bg-red-400" />
        Live
      </span>
    );
  }

  const parts = formatCountdownCompact(days, hours, minutes, 0);

  return (
    <span
      role="timer"
      aria-label={`${sessionLabel} in ${parts.join(" ")}`}
      className="font-mono text-xs text-amber-200"
    >
      {parts.join(" ")}
    </span>
  );
}

export function SessionCountdown(props: Props) {
  if (props.variant === "inline") return <InlineCountdown {...props} />;
  if (props.variant === "hero") return <HeroCountdown {...props} />;
  return <FullCountdown {...props} />;
}
