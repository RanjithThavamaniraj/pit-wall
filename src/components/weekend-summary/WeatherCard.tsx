"use client";

import { memo } from "react";
import type { WeekendWeather } from "@/lib/race-summary/types";

type Props = {
  weather?: WeekendWeather;
};

function WeatherCardComponent({ weather }: Props) {
  if (!weather) {
    return null;
  }

  const items = [
    { label: "Air temp", value: weather.airTemp, icon: "🌡" },
    { label: "Track temp", value: weather.trackTemp, icon: "🏁" },
    { label: "Conditions", value: weather.conditions, icon: "🌤" },
  ].filter((item) => item.value);

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
      <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
        Weather
      </h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-white/[0.06] bg-slate-950/40 px-4 py-3"
          >
            <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-200">
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export const WeatherCard = memo(WeatherCardComponent);
