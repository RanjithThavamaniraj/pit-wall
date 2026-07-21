"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { GlassCard } from "@/components/ui";
import type { WeekendWeather } from "@/lib/race-summary/types";
import type { LiveWeather } from "@/lib/weather/types";
import { useLiveWeather } from "@/lib/weather/weatherProvider";
import type { RaceSummarySport } from "@/lib/race-summary/types";

type Props = {
  weather?: WeekendWeather | null;
  sport: RaceSummarySport;
  weekendSlug: string;
  isPast: boolean;
};

/**
 * Compact weather slot for the weekend hub.
 *
 * For completed weekends we render the already-resolved summary weather.
 * For live/upcoming weekends we render real provider-backed live weather.
 */
function formatProbPct(value: number | undefined): number | undefined {
  if (value === undefined) return undefined;
  // Tomorrow.io often returns probabilities either as 0..1 or 0..100.
  if (value >= 0 && value <= 1) return Math.round(value * 100);
  if (value >= 0 && value <= 100) return Math.round(value);
  return Math.round(value);
}

function iconForCondition(condition?: LiveWeather["conditions"]): string | null {
  switch (condition) {
    case "sunny":
      return "☀";
    case "cloudy":
      return "☁";
    case "overcast":
      return "🌫";
    case "light_rain":
      return "🌧";
    case "heavy_rain":
      return "⛈";
    case "mixed":
      return "🌦";
    default:
      return null;
  }
}

function WeekendWeatherCardComponent({
  weather,
  sport,
  weekendSlug,
  isPast,
}: Props) {
  const liveWeather = useLiveWeather(sport, weekendSlug);

  const active = isPast ? weather ?? null : liveWeather;

  const [trend, setTrend] = useState<"rising" | "holding" | "falling" | undefined>(
    undefined
  );
  const prevAirTempRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!active || "airTempC" in active === false) return;
    const airTempC = (active as LiveWeather).airTempC;
    if (typeof airTempC !== "number") return;
    const prev = prevAirTempRef.current;
    prevAirTempRef.current = airTempC;
    if (prev === undefined) {
      setTrend(undefined);
      return;
    }

    const diff = airTempC - prev;
    // Derived from real successive samples; keep thresholds conservative
    // to avoid noisy flicker.
    if (Math.abs(diff) < 0.3) setTrend("holding");
    else if (diff > 0) setTrend("rising");
    else setTrend("falling");
  }, [active]);

  const items = useMemo(() => {
    if (!active) return [];

    // Historical summary mode (completed weekend).
    if ("airTemp" in active) {
      const air = (active as WeekendWeather).airTemp;
      const track = (active as WeekendWeather).trackTemp;
      const conditions = (active as WeekendWeather).conditions;
      return [
        { label: "Air", value: air, icon: "🌡" },
        { label: "Track", value: track, icon: "🏁" },
        { label: "Sky", value: conditions, icon: "🌤" },
      ].filter((x) => x.value);
    }

    // Live provider mode.
    const live = active as LiveWeather;
    const airTemp = typeof live.airTempC === "number" ? `${Math.round(live.airTempC)}°C` : undefined;
    const humidity = typeof live.humidityPct === "number" ? `${Math.round(live.humidityPct)}%` : undefined;
    const windSpeed = typeof live.windSpeedKph === "number" ? `${Math.round(live.windSpeedKph)} km/h` : undefined;
    const cloudCover =
      typeof live.cloudCoverPct === "number"
        ? `${Math.round(live.cloudCoverPct)}%`
        : undefined;
    const rainProb = typeof live.rainProbabilityPct === "number" ? `${formatProbPct(live.rainProbabilityPct)}%` : undefined;

    const conditionIcon = iconForCondition(live.conditions);

    const skyLabel = conditionIcon
      ? `${conditionIcon} ${
          typeof live.conditions === "string"
            ? live.conditions.replaceAll("_", " ")
            : ""
        }`
      : live.conditions
        ? live.conditions
            .replaceAll("_", " ")
            .replace(/\b\w/g, (m) => m.toUpperCase())
        : undefined;

    const skyValue = skyLabel ?? (rainProb ? `☔ ${rainProb} rain` : cloudCover ? `☁ ${cloudCover} clouds` : undefined);

    return [
      { label: "Air", value: airTemp, icon: "🌡" },
      { label: "Humidity", value: humidity, icon: "💧" },
      { label: "Wind", value: windSpeed, icon: "💨" },
      { label: "Rain", value: rainProb, icon: "🌧" },
      { label: "Clouds", value: cloudCover, icon: "☁" },
      { label: "Sky", value: skyValue, icon: skyLabel ? conditionIcon ?? "🌤" : "🌤" },
    ].filter((x) => x.value);
  }, [active]);

  if (!active || items.length === 0) {
    return (
      <GlassCard className="!p-5 sm:!p-6" aria-label="Weather">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Weather
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              Weather data is currently unavailable.
            </p>
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="!p-5 sm:!p-6" aria-label="Weather">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Weather
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            {isPast
              ? "Weekend conditions"
              : liveWeather?.updatedAt
              ? `Updated ${new Date(liveWeather.updatedAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}`
              : "Live weather"}
          </p>
        </div>
        {!isPast && trend ? (
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200">
            {trend === "rising" ? "↗ Rising" : trend === "falling" ? "↘ Falling" : "→ Holding"}
          </span>
        ) : null}
      </div>

      <dl
        className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3"
        aria-live={isPast ? "off" : "polite"}
        aria-atomic="true"
      >
        {items.map((item) => (
          <div key={item.label}>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
              <span aria-hidden="true" className="mr-2">
                {item.icon}
              </span>
              {item.label}
            </dt>
            <dd className="mt-1 text-sm font-semibold text-slate-200">{item.value}</dd>
          </div>
        ))}
      </dl>
    </GlassCard>
  );
}

export const WeekendWeatherCard = memo(WeekendWeatherCardComponent);
