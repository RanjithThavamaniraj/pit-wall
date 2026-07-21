import type { RaceSummarySport } from "@/lib/race-summary/types";

export type LiveWeatherCondition =
  | "sunny"
  | "cloudy"
  | "overcast"
  | "light_rain"
  | "heavy_rain"
  | "mixed";

export type LiveWeather = {
  sport: RaceSummarySport;
  weekendSlug: string;
  updatedAt: string;

  airTempC?: number;
  humidityPct?: number;
  windSpeedKph?: number;
  windDirectionDeg?: number;

  rainProbabilityPct?: number;
  cloudCoverPct?: number;

  conditions?: LiveWeatherCondition;
  weatherTrend?: "rising" | "holding" | "falling";

  // Reserved extension slots.
  trackTempC?: number;
  trackCondition?: string;
};

