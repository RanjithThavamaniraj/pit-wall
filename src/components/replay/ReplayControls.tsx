"use client";

import type { ReactNode } from "react";
import type { ReplayControlsState, ReplayPlaybackSpeed } from "@/lib/replay";

const SPEEDS: ReplayPlaybackSpeed[] = [1, 2, 4];

type Props = {
  controls: ReplayControlsState;
  onPlay: () => void;
  onPause: () => void;
  onRestart: () => void;
  onPreviousLap: () => void;
  onNextLap: () => void;
  onSeekLap: (lap: number) => void;
  onSetSpeed: (speed: ReplayPlaybackSpeed) => void;
};

function ControlButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-9 min-w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] px-2.5 text-xs font-semibold tracking-wide text-slate-200 transition hover:border-amber-300/30 hover:bg-amber-300/10 hover:text-amber-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-white/10 disabled:hover:bg-white/[0.06] disabled:hover:text-slate-200"
    >
      {children}
    </button>
  );
}

export function ReplayControls({
  controls,
  onPlay,
  onPause,
  onRestart,
  onPreviousLap,
  onNextLap,
  onSeekLap,
  onSetSpeed,
}: Props) {
  const { playing, speed, lap, totalLaps, finished } = controls;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <ControlButton
          label={playing ? "Pause" : "Play"}
          onClick={playing ? onPause : onPlay}
        >
          {playing ? (
            <span aria-hidden="true" className="font-mono text-[0.7rem]">
              ❚❚
            </span>
          ) : (
            <span aria-hidden="true" className="font-mono text-[0.7rem]">
              ▶
            </span>
          )}
          <span className="ml-1.5 hidden sm:inline">
            {playing ? "Pause" : "Play"}
          </span>
        </ControlButton>

        <ControlButton label="Restart" onClick={onRestart}>
          <span aria-hidden="true" className="font-mono text-[0.7rem]">
            ↺
          </span>
          <span className="ml-1.5 hidden sm:inline">Restart</span>
        </ControlButton>

        <ControlButton
          label="Previous lap"
          onClick={onPreviousLap}
          disabled={controls.cursor <= 0}
        >
          <span aria-hidden="true" className="font-mono text-[0.7rem]">
            ‹
          </span>
          <span className="ml-1.5 hidden md:inline">Prev</span>
        </ControlButton>

        <ControlButton
          label="Next lap"
          onClick={onNextLap}
          disabled={finished || controls.cursor >= totalLaps}
        >
          <span aria-hidden="true" className="font-mono text-[0.7rem]">
            ›
          </span>
          <span className="ml-1.5 hidden md:inline">Next</span>
        </ControlButton>

        <div
          className="ml-auto flex items-center gap-1 rounded-xl border border-white/10 bg-black/20 p-1"
          role="group"
          aria-label="Playback speed"
        >
          {SPEEDS.map((value) => {
            const active = speed === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                onClick={() => onSetSpeed(value)}
                className={`rounded-lg px-2.5 py-1.5 font-mono text-[0.65rem] font-semibold tracking-[0.12em] transition ${
                  active
                    ? "bg-amber-300/15 text-amber-200"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {value}×
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-slate-500">
            Timeline
          </p>
          <p className="font-mono text-xs tracking-[0.14em] text-slate-300">
            Lap {lap}
            <span className="text-slate-500"> / {totalLaps}</span>
            {finished ? (
              <span className="ml-2 text-amber-300/80">Finished</span>
            ) : null}
          </p>
        </div>

        <input
          type="range"
          min={1}
          max={totalLaps}
          step={1}
          value={lap}
          aria-label="Replay lap timeline"
          aria-valuemin={1}
          aria-valuemax={totalLaps}
          aria-valuenow={lap}
          aria-valuetext={`Lap ${lap} of ${totalLaps}`}
          onChange={(event) => onSeekLap(Number(event.target.value))}
          className="replay-timeline h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-amber-300"
        />
      </div>
    </div>
  );
}
