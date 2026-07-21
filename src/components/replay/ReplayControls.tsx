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
  onSetSpeed: (speed: ReplayPlaybackSpeed) => void;
};

function ControlButton({
  label,
  onClick,
  disabled,
  active,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-xl border px-3 text-xs font-semibold tracking-wide transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300/70 disabled:cursor-not-allowed disabled:opacity-40 sm:h-10 ${
        active
          ? "border-amber-300/40 bg-amber-300/15 text-amber-100"
          : "border-white/10 bg-white/[0.06] text-slate-200 hover:border-amber-300/30 hover:bg-amber-300/10 hover:text-amber-100 disabled:hover:border-white/10 disabled:hover:bg-white/[0.06] disabled:hover:text-slate-200"
      }`}
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
  onSetSpeed,
}: Props) {
  const { playing, speed, finished } = controls;

  return (
    <div
      className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2"
      role="toolbar"
      aria-label="Replay playback controls"
    >
      <div className="flex flex-wrap items-center gap-2">
        <ControlButton
          label={playing ? "Pause replay" : "Play replay"}
          onClick={playing ? onPause : onPlay}
          active={playing}
        >
          {playing ? (
            <span aria-hidden="true" className="font-mono text-[0.75rem]">
              ❚❚
            </span>
          ) : (
            <span aria-hidden="true" className="font-mono text-[0.75rem]">
              ▶
            </span>
          )}
          <span className="hidden sm:inline">
            {playing ? "Pause" : "Play"}
          </span>
        </ControlButton>

        <ControlButton label="Restart replay" onClick={onRestart}>
          <span aria-hidden="true" className="font-mono text-[0.75rem]">
            ↺
          </span>
          <span className="hidden sm:inline">Restart</span>
        </ControlButton>

        <ControlButton
          label="Previous lap"
          onClick={onPreviousLap}
          disabled={controls.cursor <= 0}
        >
          <span aria-hidden="true" className="font-mono text-[0.85rem]">
            ‹
          </span>
          <span className="hidden md:inline">Prev</span>
        </ControlButton>

        <ControlButton
          label="Next lap"
          onClick={onNextLap}
          disabled={finished || controls.cursor >= controls.totalLaps}
        >
          <span aria-hidden="true" className="font-mono text-[0.85rem]">
            ›
          </span>
          <span className="hidden md:inline">Next</span>
        </ControlButton>
      </div>

      <div
        className="flex items-center gap-1 rounded-xl border border-white/10 bg-black/25 p-1 sm:ml-auto"
        role="group"
        aria-label="Playback speed"
      >
        {SPEEDS.map((value) => {
          const active = speed === value;
          return (
            <button
              key={value}
              type="button"
              aria-label={`Playback speed ${value} times`}
              aria-pressed={active}
              onClick={() => onSetSpeed(value)}
              className={`min-h-9 min-w-11 rounded-lg px-2.5 py-1.5 font-mono text-[0.7rem] font-semibold tracking-[0.12em] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300/70 ${
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
  );
}
