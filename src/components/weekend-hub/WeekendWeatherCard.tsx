import { memo } from "react";
import { GlassCard } from "@/components/ui";
import type { WeekendWeather } from "@/lib/race-summary/types";

type Props = {
  weather?: WeekendWeather | null;
};

/**
 * Compact weather slot for the weekend hub.
 * Renders real values when provided; otherwise a reserved placeholder
 * so layout stays stable until weather providers are wired.
 */
function WeekendWeatherCardComponent({ weather }: Props) {
  const air = weather?.airTemp;
  const track = weather?.trackTemp;
  const conditions = weather?.conditions;
  const hasData = Boolean(air || track || conditions);

  return (
    <GlassCard className="!p-5 sm:!p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Weather
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            {hasData ? "Weekend conditions" : "Forecast reserved"}
          </p>
        </div>
      </div>

      {hasData ? (
        <dl className="mt-4 grid grid-cols-3 gap-3">
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
              Air
            </dt>
            <dd className="mt-1 text-sm font-semibold text-slate-200">
              {air ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
              Track
            </dt>
            <dd className="mt-1 text-sm font-semibold text-slate-200">
              {track ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
              Sky
            </dt>
            <dd className="mt-1 text-sm font-semibold text-slate-200">
              {conditions ?? "—"}
            </dd>
          </div>
        </dl>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-white/10 bg-slate-950/30 px-4 py-3">
          <p className="text-sm text-slate-500">
            Live circuit weather will appear here when available.
          </p>
        </div>
      )}
    </GlassCard>
  );
}

export const WeekendWeatherCard = memo(WeekendWeatherCardComponent);
