import type { RaceSummarySport } from "@/lib/race-summary/types";
import type { CircuitIntelligence } from "./types";
import { fetchRaceBySlug } from "@/lib/schedule";
import { fetchMotoGpEventBySlug } from "@/lib/motogp";
import { getCircuitOutlinePath } from "@/lib/circuit-outline";

function safeJsonParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function pickLastNonGenericToken(name: string): string {
  const blacklist = new Set([
    "circuit",
    "autodrome",
    "autodromo",
    "autódromo",
    "resort",
    "track",
    "international",
    "gp",
    "grand",
    "prix",
    "world",
  ]);
  const tokens = name
    .split(/[\s/,&]+/g)
    .map((t) => t.trim())
    .filter(Boolean);
  const filtered = tokens.filter(
    (t) => !blacklist.has(t.toLowerCase())
  );
  return (filtered[filtered.length - 1] ?? tokens[tokens.length - 1] ?? name)
    .toString()
    .trim();
}

function escapeForOverpassRegex(token: string): string {
  // Overpass regex uses RE2-style strings embedded in XML/URLEncoded
  // form; escape the most common regex metacharacters.
  return token.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&");
}

async function nominatimGeocode(query: string): Promise<{
  lat: number;
  lon: number;
} | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
    query
  )}`;
  const res = await fetch(url, { headers: { "User-Agent": "pit-wall" } });
  if (!res.ok) return null;
  const txt = await res.text();
  const json = safeJsonParse<Array<{ lat: string; lon: string }>>(txt);
  const first = json?.[0];
  if (!first) return null;
  const lat = parseFloat(first.lat);
  const lon = parseFloat(first.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return { lat, lon };
}

async function overpassLongestNamedWayKm(params: {
  circuitName: string;
  locality: string;
  country: string;
}): Promise<number | null> {
  // For accuracy, we seed Overpass from Nominatim and then compute the
  // *longest* returned named way length.
  const seed = await nominatimGeocode(
    `${params.circuitName}, ${params.locality}, ${params.country}`
  );
  if (!seed) return null;

  const token = pickLastNonGenericToken(params.circuitName);
  const regex = escapeForOverpassRegex(token);

  // 10km radius is large enough for event naming variants but small enough
  // to avoid cross-city contamination.
  const query = `
    [out:json][timeout:25];
    (
      way["name"~"${regex}",i](around:10000,${seed.lat},${seed.lon});
      way["name:en"~"${regex}",i](around:10000,${seed.lat},${seed.lon});
    );
    out geom;
  `.trim();

  const url = "https://overpass-api.de/api/interpreter";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "pit-wall",
    },
    body: `data=${encodeURIComponent(query)}`,
  });
  if (!res.ok) return null;
  const txt = await res.text();
  const json = safeJsonParse<{
    elements?: Array<{
      type: string;
      geometry?: Array<{ lat: number; lon: number }>;
    }>;
  }>(txt);

  const elements = json?.elements ?? [];
  const toMeters = (a: { lat: number; lon: number }, b: {
    lat: number;
    lon: number;
  }) => {
    const R = 6371000;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lon - a.lon);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);
    const sinDLat = Math.sin(dLat / 2);
    const sinDLon = Math.sin(dLon / 2);
    const h =
      sinDLat * sinDLat +
      Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
    return 2 * R * Math.asin(Math.sqrt(h));
  };

  let bestMeters = 0;
  for (const el of elements) {
    if (el.type !== "way") continue;
    const geom = el.geometry;
    if (!geom || geom.length < 2) continue;
    let meters = 0;
    for (let i = 1; i < geom.length; i++) {
      meters += toMeters(geom[i - 1], geom[i]);
    }
    if (meters > bestMeters) bestMeters = meters;
  }

  if (!Number.isFinite(bestMeters) || bestMeters <= 0) return null;
  return bestMeters / 1000;
}

function getF1BacingerCircuitIdBySlug(slug: string): string | null {
  // Stable bridge between PitWall circuit slugs and the bacinger file ids.
  // (Identifiers only; no fabricated circuit metrics.)
  const map: Record<string, string> = {
    "albert-park": "au-1953",
    shanghai: "cn-2004",
    suzuka: "jp-1962",
    miami: "us-2022",
    "gilles-villeneuve": "ca-1978",
    monaco: "mc-1929",
    catalunya: "es-1991",
    "red-bull-ring": "at-1969",
    silverstone: "gb-1948",
    "spa-francorchamps": "be-1925",
    hungaroring: "hu-1986",
    zandvoort: "nl-1948",
    monza: "it-1922",
    madring: "es-2026",
    baku: "az-2016",
    "marina-bay": "sg-2008",
    cota: "us-2012",
    "hermanos-rodriguez": "mx-1962",
    interlagos: "br-1940",
    "las-vegas": "us-2023",
    losail: "qa-2004",
    "yas-marina": "ae-2009",
  };

  return map[slug] ?? null;
}

async function fetchF1BacingerLengthAndAltitudeKm(slug: string): Promise<{
  lengthKm?: number;
  altitudeM?: number;
} | null> {
  const bacingerId = getF1BacingerCircuitIdBySlug(slug);
  if (!bacingerId) return null;

  const url = `https://raw.githubusercontent.com/bacinger/f1-circuits/master/circuits/${bacingerId}.geojson`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = safeJsonParse<{
    features?: Array<{
      properties?: {
        length?: number;
        altitude?: number;
      };
    }>;
  }>(await res.text());

  const props = json?.features?.[0]?.properties;
  const length = props?.length;
  const altitude = props?.altitude;
  if (typeof length !== "number" && typeof altitude !== "number") return null;

  return {
    lengthKm: typeof length === "number" ? length / 1000 : undefined,
    altitudeM: typeof altitude === "number" ? altitude : undefined,
  };
}

export async function fetchCircuitIntelligence(input: {
  sport: RaceSummarySport;
  weekendSlug: string;
}): Promise<CircuitIntelligence | null> {
  const { sport, weekendSlug } = input;

  if (sport === "f1") {
    const race = await fetchRaceBySlug(weekendSlug);
    if (!race) return null;

    const path = getCircuitOutlinePath("f1", {
      id: race.circuitId,
      name: race.circuit,
    });
    const slug = path ? path.split("/").pop()?.replace(/\.svg$/, "") : null;

    const f1Length = slug ? await fetchF1BacingerLengthAndAltitudeKm(slug) : null;

    return {
      sport,
      circuitName: race.circuit,
      country: race.country,
      metrics: [
        ...(f1Length?.lengthKm
          ? [
              {
                label: "Circuit length",
                value: `${f1Length.lengthKm.toFixed(3).replace(/0+$/, "").replace(/\.$/, "")} km`,
                icon: "🛣️",
              },
            ]
          : []),
        ...(typeof f1Length?.altitudeM === "number"
          ? [
              {
                label: "Elevation",
                value: `${Math.round(f1Length.altitudeM)} m`,
                icon: "⛰️",
              },
            ]
          : []),
      ],
      futureSlots: [
        { id: "track-evolution", label: "Track evolution" },
        { id: "weather-impact", label: "Weather impact" },
        { id: "tyre-strategy", label: "Tyre strategy" },
        { id: "pit-strategy", label: "Pit strategy" },
        { id: "overtaking-hotspots", label: "Overtaking hotspots" },
      ],
    };
  }

  // MotoGP
  const event = await fetchMotoGpEventBySlug(weekendSlug);
  if (!event) return null;

  const lengthKm = await overpassLongestNamedWayKm({
    circuitName: event.circuit,
    locality: event.locality ?? "",
    country: event.country,
  });

  return {
    sport,
    circuitName: event.circuit,
    country: event.country,
    metrics: [
      ...(lengthKm
        ? [
            {
              label: "Circuit length",
              value: `${lengthKm.toFixed(3).replace(/0+$/, "").replace(/\.$/, "")} km`,
              icon: "🛣️",
            },
          ]
        : []),
    ],
    futureSlots: [
      { id: "track-evolution", label: "Track evolution" },
      { id: "weather-impact", label: "Weather impact" },
      { id: "tyre-strategy", label: "Tyre strategy" },
      { id: "pit-strategy", label: "Pit strategy" },
      { id: "overtaking-hotspots", label: "Overtaking hotspots" },
    ],
  };
}

