"use client";

import { StatusPill } from "@/components/ui";
import {
  replayStatusLabel,
  replayStatusTone,
  type ReplayUiStatus,
} from "@/lib/replay";

type Props = {
  status: ReplayUiStatus;
  detail?: string;
  className?: string;
};

export function ReplayStatus({ status, detail, className = "" }: Props) {
  return (
    <div
      className={`flex flex-wrap items-center gap-2.5 ${className}`}
      role="status"
      aria-live="polite"
    >
      <StatusPill tone={replayStatusTone(status)}>
        {status === "playing" ? (
          <>
            <span
              className="mr-1.5 inline-block size-1.5 animate-pulse rounded-full bg-emerald-400"
              aria-hidden="true"
            />
            {replayStatusLabel(status)}
          </>
        ) : (
          replayStatusLabel(status)
        )}
      </StatusPill>
      {detail ? (
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-slate-500">
          {detail}
        </p>
      ) : null}
    </div>
  );
}
