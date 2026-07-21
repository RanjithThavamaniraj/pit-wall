import type { LiveWeatherCondition, LiveWeather } from "./types";

type TomorrowRealtimeResponse = {
  data?: {
    values?: Partial<Record<string, unknown>>;
    timelines?: never;
  };
};

function parseNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function weatherCodeToCondition(code: number | undefined): LiveWeatherCondition | undefined {
  // Tomorrow.io weatherCode is a coarse code. We map conservatively and
  // only output a condition when we have confidence.
  if (typeof code !== "number" || !Number.isFinite(code)) return undefined;

  // These thresholds align with common Tomorrow.io mappings:
  // 1000 sunny/clear, 1100 partly cloudy, 1200 mostly cloudy,
  // 4000-6000 light/moderate/heavy precipitation.
  if (code === 1000) return "sunny";
  if (code === 1100) return "mixed";
  if (code === 1200) return "cloudy";
  if (code >= 3000 && code < 4000) return "overcast";
  if (code >= 4000 && code < 5000) return "light_rain";
  if (code >= 5000) return "heavy_rain";
  return undefined;
}

export async function fetchTomorrowIoLiveWeather(input: {
  lat: number;
  lon: number;
  apiKey: string;
  sport: LiveWeather["sport"];
  weekendSlug: string;
}): Promise<LiveWeather | null> {
  const { lat, lon, apiKey, sport, weekendSlug } = input;

  const url =
    `https://api.tomorrow.io/v4/weather/realtime?location=${lat},${lon}` +
    `&apikey=${encodeURIComponent(apiKey)}` +
    `&units=metric` +
    `&fields=temperature,humidity,windSpeed,windDirection,precipitationProbability,cloudCover,weatherCode`;

  const res = await fetch(url, { headers: { "User-Agent": "pit-wall" } });
  if (!res.ok) return null;

  const json = (await res.json()) as TomorrowRealtimeResponse;
  const values = json?.data?.values ?? {};

  const updatedAt = new Date().toISOString();

  const airTempC = parseNumber(values["temperature"]);
  const humidityPct = parseNumber(values["humidity"]);
  const windSpeedKph = parseNumber(values["windSpeed"]);
  const windDirectionDeg = parseNumber(values["windDirection"]);
  const rainProbabilityPct = parseNumber(values["precipitationProbability"]);
  const cloudCoverPct = parseNumber(values["cloudCover"]);
  const weatherCode = parseNumber(values["weatherCode"]);
  const conditions = weatherCodeToCondition(weatherCode);

  // Return null only if we got nothing that is meaningful.
  const hasAny =
    airTempC !== undefined ||
    humidityPct !== undefined ||
    windSpeedKph !== undefined ||
    windDirectionDeg !== undefined ||
    rainProbabilityPct !== undefined ||
    cloudCoverPct !== undefined ||
    conditions !== undefined;

  if (!hasAny) return null;

  return {
    sport,
    weekendSlug,
    updatedAt,
    airTempC,
    humidityPct,
    windSpeedKph,
    windDirectionDeg,
    rainProbabilityPct,
    cloudCoverPct,
    conditions,
  };
}

