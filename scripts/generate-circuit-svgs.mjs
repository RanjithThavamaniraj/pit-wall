#!/usr/bin/env node
// Generates real circuit-outline SVGs from real geographic data.
// Source A: bacinger/f1-circuits GeoJSON (MIT)
// Source B: OpenStreetMap Overpass API (ODbL)
//
// ABSOLUTE RULE: never invent, hand-draw, or approximate circuit path data.
// Every path must come from one of the two sources below. If a circuit
// cannot be fetched/assembled, SKIP it (write no file) and report it.

import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PUBLIC_F1 = path.join(ROOT, "public", "circuits", "f1");
const PUBLIC_MOTOGP = path.join(ROOT, "public", "circuits", "motogp");

// Disk cache for raw Overpass responses — Overpass rate-limits aggressively,
// so reruns during development should reuse cached JSON instead of re-fetching.
const OSM_CACHE_DIR =
  process.env.OSM_CACHE_DIR ?? path.join(ROOT, ".osm-cache");

const UA = "pit-wall-circuit-generator/1.0 (+https://github.com/)";

// ---------------------------------------------------------------------------
// Source A: F1 circuits (bacinger/f1-circuits GeoJSON, MIT)
// ---------------------------------------------------------------------------
// Map of geojson-id -> { slug, expectedNameRegex, folders }
// folders: which public/circuits/<folder> dirs this should be written to.
const F1_SOURCE = [
  { id: "au-1953", slug: "albert-park", name: /Albert Park/i, folders: ["f1"] },
  { id: "cn-2004", slug: "shanghai", name: /Shanghai/i, folders: ["f1"] },
  { id: "jp-1962", slug: "suzuka", name: /Suzuka/i, folders: ["f1"] },
  { id: "us-2022", slug: "miami", name: /Miami/i, folders: ["f1"] },
  { id: "ca-1978", slug: "gilles-villeneuve", name: /Gilles[\s-]Villeneuve/i, folders: ["f1"] },
  { id: "mc-1929", slug: "monaco", name: /Monaco/i, folders: ["f1"] },
  { id: "es-1991", slug: "catalunya", name: /Catalunya|Barcelona/i, folders: ["f1", "motogp"] },
  { id: "at-1969", slug: "red-bull-ring", name: /Red Bull Ring/i, folders: ["f1", "motogp"] },
  { id: "gb-1948", slug: "silverstone", name: /Silverstone/i, folders: ["f1", "motogp"] },
  { id: "be-1925", slug: "spa-francorchamps", name: /Spa/i, folders: ["f1"] },
  { id: "hu-1986", slug: "hungaroring", name: /Hungaroring/i, folders: ["f1"] },
  { id: "nl-1948", slug: "zandvoort", name: /Zandvoort/i, folders: ["f1"] },
  { id: "it-1922", slug: "monza", name: /Monza/i, folders: ["f1"] },
  { id: "es-2026", slug: "madring", name: /Madring|Madrid/i, folders: ["f1"] },
  { id: "az-2016", slug: "baku", name: /Baku/i, folders: ["f1"] },
  { id: "sg-2008", slug: "marina-bay", name: /Marina Bay/i, folders: ["f1"] },
  { id: "us-2012", slug: "cota", name: /Americas/i, folders: ["f1", "motogp"] },
  { id: "mx-1962", slug: "hermanos-rodriguez", name: /Hermanos Rodr/i, folders: ["f1"] },
  { id: "br-1940", slug: "interlagos", name: /Interlagos|Carlos Pace/i, folders: ["f1"] },
  { id: "us-2023", slug: "las-vegas", name: /Las Vegas/i, folders: ["f1"] },
  { id: "qa-2004", slug: "losail", name: /Losail/i, folders: ["f1", "motogp"] },
  { id: "ae-2009", slug: "yas-marina", name: /Yas Marina/i, folders: ["f1"] },
  { id: "my-1999", slug: "sepang", name: /Sepang/i, folders: ["f1", "motogp"] },
  { id: "pt-2008", slug: "portimao", name: /Portim|Algarve/i, folders: ["f1", "motogp"] },
];

// ---------------------------------------------------------------------------
// Source B: MotoGP-only circuits via OSM Overpass
// ---------------------------------------------------------------------------
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

// expectedKm is the official published lap length — used to select the right
// loop when OSM contains multiple closed rings (e.g. Buriram has both the
// real 4.55km track and a coarse 5.89km outer perimeter under the same name).
const OSM_SOURCE = [
  { slug: "buriram", lat: 14.96, lon: 103.09, name: /Chang/i, expectedKm: 4.554 },
  { slug: "goiania", lat: -16.72, lon: -49.19, name: /Ayrton Senna/i, expectedKm: 3.835 },
  { slug: "jerez", lat: 36.71, lon: -6.03, name: /Jerez|Nieto/i, expectedKm: 4.423 },
  { slug: "le-mans-bugatti", lat: 47.95, lon: 0.21, name: /Bugatti/i, expectedKm: 4.185 },
  { slug: "mugello", lat: 43.997, lon: 11.372, name: /Mugello/i, expectedKm: 5.245 },
  { slug: "balaton-park", lat: 47.08, lon: 18.17, name: /Balaton/i, expectedKm: 4.115, nationwideIso: "HU" },
  { slug: "brno", lat: 49.2, lon: 16.44, name: /Masaryk|Brno/i, expectedKm: 5.403 },
  { slug: "assen", lat: 52.96, lon: 6.52, name: /Assen/i, expectedKm: 4.542 },
  { slug: "sachsenring", lat: 50.79, lon: 12.69, name: /Sachsenring/i, expectedKm: 3.671 },
  { slug: "motorland-aragon", lat: 41.08, lon: -0.2, name: /MotorLand|Motorland|Arag/i, expectedKm: 5.077 },
  { slug: "misano", lat: 43.96, lon: 12.68, name: /Misano|Simoncelli/i, expectedKm: 4.226 },
  { slug: "motegi", lat: 36.53, lon: 140.23, name: /Motegi|もてぎ/i, expectedKm: 4.801 },
  { slug: "mandalika", lat: -8.9, lon: 116.3, name: /Mandalika/i, expectedKm: 4.301 },
  { slug: "phillip-island", lat: -38.5, lon: 145.23, name: /Phillip Island/i, expectedKm: 4.448 },
  { slug: "ricardo-tormo", lat: 39.49, lon: -0.63, name: /Ricardo Tormo|Cheste/i, expectedKm: 4.005 },
];

const F1_2026_SLUGS = [
  "albert-park", "shanghai", "suzuka", "miami", "gilles-villeneuve", "monaco",
  "catalunya", "red-bull-ring", "silverstone", "spa-francorchamps", "hungaroring",
  "zandvoort", "monza", "madring", "baku", "marina-bay", "cota",
  "hermanos-rodriguez", "interlagos", "las-vegas", "losail", "yas-marina",
];

const MOTOGP_2026_SLUGS = [
  "buriram", "goiania", "cota", "jerez", "le-mans-bugatti", "catalunya",
  "mugello", "balaton-park", "brno", "assen", "sachsenring", "silverstone",
  "motorland-aragon", "misano", "red-bull-ring", "motegi", "mandalika",
  "phillip-island", "sepang", "losail", "portimao", "ricardo-tormo",
];

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

/** Haversine distance in meters between two [lon,lat] points. */
function haversine([lon1, lat1], [lon2, lat2]) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function ringLength(coords) {
  let total = 0;
  for (let i = 1; i < coords.length; i++) {
    total += haversine(coords[i - 1], coords[i]);
  }
  return total;
}

/**
 * Project [lon,lat] coords into an SVG path string, using local equirectangular
 * projection (x = lon*cos(meanLat), y = -lat), scaled/centered into an 840x840
 * box (80px padding on the limiting axis, viewBox 0 0 1000 1000).
 */
function coordsToSvgPath(coords, closed) {
  const lats = coords.map((c) => c[1]);
  const meanLat = lats.reduce((a, b) => a + b, 0) / lats.length;
  const meanLatRad = (meanLat * Math.PI) / 180;
  const cosLat = Math.cos(meanLatRad);

  const projected = coords.map(([lon, lat]) => ({
    x: lon * cosLat,
    y: -lat,
  }));

  const xs = projected.map((p) => p.x);
  const ys = projected.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const width = maxX - minX;
  const height = maxY - minY;
  const box = 840;
  const scale = width >= height ? box / width : box / height;

  const scaledWidth = width * scale;
  const scaledHeight = height * scale;
  const offsetX = (1000 - scaledWidth) / 2;
  const offsetY = (1000 - scaledHeight) / 2;

  const points = projected.map((p) => ({
    x: (p.x - minX) * scale + offsetX,
    y: (p.y - minY) * scale + offsetY,
  }));

  const round = (n) => Math.round(n * 100) / 100;

  let d = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${round(p.x)},${round(p.y)}`)
    .join(" ");
  if (closed) d += " Z";
  return d;
}

function buildSvg(pathD, attribution) {
  return `<svg viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg" fill="none">
  <!-- ${attribution} -->
  <path d="${pathD}" stroke="#FFFFFF" stroke-width="7" stroke-linejoin="round" stroke-linecap="round" fill="none" />
</svg>
`;
}

// ---------------------------------------------------------------------------
// Source A fetch + write
// ---------------------------------------------------------------------------

async function fetchF1Circuit(entry) {
  const url = `https://raw.githubusercontent.com/bacinger/f1-circuits/master/circuits/${entry.id}.geojson`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} fetching ${url}`);
  }
  const geojson = await res.json();
  const feature = geojson.features?.find(
    (f) => f.geometry?.type === "LineString"
  ) ?? geojson.features?.[0];
  if (!feature || feature.geometry?.type !== "LineString") {
    throw new Error(`No LineString geometry found in ${entry.id}.geojson`);
  }
  const props = feature.properties ?? {};
  const nameCandidate = props.Name || props.name || props.Location || "";
  if (!entry.name.test(nameCandidate)) {
    throw new Error(
      `Name mismatch for ${entry.id}: expected /${entry.name}/ got "${nameCandidate}"`
    );
  }
  const coords = feature.geometry.coordinates;
  return coords;
}

// ---------------------------------------------------------------------------
// Source B: Overpass fetch + assembly
// ---------------------------------------------------------------------------

async function readCache(cacheKey) {
  try {
    const raw = await readFile(
      path.join(OSM_CACHE_DIR, `${cacheKey}.json`),
      "utf8"
    );
    const json = JSON.parse(raw);
    return json.elements ?? [];
  } catch {
    return null;
  }
}

async function writeCache(cacheKey, elements) {
  try {
    await mkdir(OSM_CACHE_DIR, { recursive: true });
    await writeFile(
      path.join(OSM_CACHE_DIR, `${cacheKey}.json`),
      JSON.stringify({ elements }, null, 2),
      "utf8"
    );
  } catch {
    // Cache is best-effort; ignore write failures.
  }
}

async function runOverpassQuery(query) {
  let lastErr;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 45000);
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": UA,
          },
          body: `data=${encodeURIComponent(query)}`,
          signal: controller.signal,
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status} from ${endpoint}`);
        }
        const json = await res.json();
        return json.elements ?? [];
      } catch (err) {
        lastErr = err;
        await new Promise((r) => setTimeout(r, 1500));
      } finally {
        clearTimeout(timer);
      }
    }
  }
  throw lastErr ?? new Error("Overpass query failed");
}

/** around-radius raceway query, cached on disk as <slug>-<radius>.json */
async function overpassQuery(slug, lat, lon, radius) {
  const cacheKey = `${slug}-${radius}`;
  const cached = await readCache(cacheKey);
  if (cached) return cached;

  const query = `[out:json][timeout:60];way["highway"="raceway"](around:${radius},${lat},${lon});out geom;`;
  const elements = await runOverpassQuery(query);
  await writeCache(cacheKey, elements);
  return elements;
}

/** nationwide fallback query, cached on disk as <slug>-nationwide-<isoCode>.json */
async function overpassNationwideQuery(slug, isoCode) {
  const cacheKey = `${slug}-nationwide-${isoCode}`;
  const cached = await readCache(cacheKey);
  if (cached) return cached;

  const query = `[out:json][timeout:60];area["ISO3166-1"="${isoCode}"][admin_level=2]->.a;way["highway"="raceway"](area.a);out geom;`;
  const elements = await runOverpassQuery(query);
  await writeCache(cacheKey, elements);
  return elements;
}

function wayLengthMeters(way) {
  const coords = way.geometry.map((g) => [g.lon, g.lat]);
  return ringLength(coords);
}

/**
 * Drop obvious pit lanes / service tracks / long-lap-penalty branches (by
 * name). Unlike the old filter, we do NOT drop short isolated ways here —
 * the graph cycle search below naturally ignores edges that don't
 * participate in any cycle, so there's no need for a fragile pre-filter.
 */
function filterWays(elems) {
  return elems.filter((el) => {
    if (el.type !== "way" || !el.geometry || el.geometry.length < 2) {
      return false;
    }
    const name = el.tags?.name ?? "";
    if (/pit|paddock|kart|long ?lap|drag|slide/i.test(name)) return false;
    return true;
  });
}

// ---------------------------------------------------------------------------
// Junction clustering + graph cycle search
// ---------------------------------------------------------------------------

const JUNCTION_CLUSTER_RADIUS_M = 30;
const MAX_BRIDGE_GAP_M = 30;
const MAX_TOTAL_BRIDGE_GAP_M = 150;
const MAX_EXPANDED_STATES = 200000;

/**
 * Cluster way endpoints within JUNCTION_CLUSTER_RADIUS_M meters of each other
 * into shared junction ids. Simple O(n^2) over endpoints — there are only
 * dozens of ways per venue, so this is cheap.
 */
function clusterJunctions(ways) {
  const endpoints = []; // { wayIdx, which: 'start'|'end', lonlat }
  ways.forEach((w, wayIdx) => {
    endpoints.push({ wayIdx, which: "start", lonlat: w.coords[0] });
    endpoints.push({
      wayIdx,
      which: "end",
      lonlat: w.coords[w.coords.length - 1],
    });
  });

  const junctionOf = new Array(endpoints.length).fill(-1);
  let nextJunctionId = 0;

  for (let i = 0; i < endpoints.length; i++) {
    if (junctionOf[i] !== -1) continue;
    junctionOf[i] = nextJunctionId;
    for (let j = i + 1; j < endpoints.length; j++) {
      if (junctionOf[j] !== -1) continue;
      const d = haversine(endpoints[i].lonlat, endpoints[j].lonlat);
      if (d <= JUNCTION_CLUSTER_RADIUS_M) {
        junctionOf[j] = nextJunctionId;
      }
    }
    nextJunctionId++;
  }

  // Attach junction ids + gap distance (0 if exact/clustered-but-identical) back onto ways.
  ways.forEach((w, wayIdx) => {
    const startEp = endpoints.find(
      (e) => e.wayIdx === wayIdx && e.which === "start"
    );
    const endEp = endpoints.find(
      (e) => e.wayIdx === wayIdx && e.which === "end"
    );
    w.startJunction = junctionOf[endpoints.indexOf(startEp)];
    w.endJunction = junctionOf[endpoints.indexOf(endEp)];
  });

  return nextJunctionId;
}

/**
 * Build an undirected multigraph: junctions are vertices, ways are edges.
 * Returns { numJunctions, edges, adjacency } where adjacency maps junction id
 * -> list of edge indices incident to it.
 */
function buildGraph(rawWays) {
  const ways = rawWays.map((w) => ({
    coords: w.geometry.map((g) => [g.lon, g.lat]),
    name: w.tags?.name ?? "",
    length: wayLengthMeters(w),
  }));

  const numJunctions = clusterJunctions(ways);

  const edges = ways.map((w, idx) => ({
    idx,
    a: w.startJunction,
    b: w.endJunction,
    coords: w.coords,
    length: w.length,
    name: w.name,
  }));

  const adjacency = Array.from({ length: numJunctions }, () => []);
  edges.forEach((e, i) => {
    adjacency[e.a].push(i);
    if (e.b !== e.a) adjacency[e.b].push(i);
  });

  return { numJunctions, edges, adjacency };
}

/**
 * DFS-based simple-cycle search over the junction graph. From each edge as a
 * start, walk the graph using each edge at most once, pruning any partial
 * path whose accumulated length already exceeds maxLenM. Collect cycles that
 * return to the start junction with total length within [minLenM, maxLenM].
 * Bails out after maxStates expanded states so pathological venues (dozens
 * of branch choices) still terminate.
 */
function findCandidateCycles(graph, minLenM, maxLenM) {
  const { edges, adjacency } = graph;
  const cycles = [];
  let statesExpanded = 0;
  let bailed = false;

  for (let startEdgeIdx = 0; startEdgeIdx < edges.length; startEdgeIdx++) {
    if (bailed) break;
    const startEdge = edges[startEdgeIdx];
    // Try traversing the start edge in both directions.
    for (const startJunction of new Set([startEdge.a, startEdge.b])) {
      if (bailed) break;
      const endJunction = startJunction === startEdge.a ? startEdge.b : startEdge.a;
      const usedEdges = new Set([startEdgeIdx]);
      const path = [{ edgeIdx: startEdgeIdx, from: startJunction, to: endJunction }];

      const dfs = (currentJunction, accLen) => {
        if (bailed) return;
        statesExpanded++;
        if (statesExpanded > MAX_EXPANDED_STATES) {
          bailed = true;
          return;
        }

        if (currentJunction === startJunction) {
          if (accLen >= minLenM && accLen <= maxLenM) {
            cycles.push({ path: [...path], length: accLen });
          }
          // A cycle back to start doesn't preclude continuing to a longer
          // cycle through a different branch, but in practice raceway
          // graphs are simple enough that stopping here is correct and
          // keeps the search tractable. This also correctly accepts
          // single-edge self-loop ways (a way whose two endpoints cluster
          // into the same junction, e.g. a fully-mapped closed circuit).
          return;
        }

        for (const edgeIdx of adjacency[currentJunction]) {
          if (usedEdges.has(edgeIdx)) continue;
          const edge = edges[edgeIdx];
          const nextLen = accLen + edge.length;
          if (nextLen > maxLenM) continue;
          const nextJunction =
            edge.a === currentJunction ? edge.b : edge.a;

          usedEdges.add(edgeIdx);
          path.push({ edgeIdx, from: currentJunction, to: nextJunction });
          dfs(nextJunction, nextLen);
          path.pop();
          usedEdges.delete(edgeIdx);
        }
      };

      dfs(endJunction, startEdge.length);
    }
  }

  return cycles;
}

/**
 * Concatenate a cycle's edges (in traversal order) into a single coordinate
 * ring. Returns null if any single junction-to-junction gap between
 * consecutive edges exceeds MAX_BRIDGE_GAP_M — that would mean the junction
 * clustering matched two endpoints that aren't really the same physical
 * point, and bridging it would fabricate geometry rather than interpolate
 * a mapping gap.
 */
function materializeCycle(graph, cycle) {
  const { edges } = graph;
  let coords = [];
  let bridgedGapTotal = 0;

  for (const step of cycle.path) {
    const edge = edges[step.edgeIdx];
    // Orient this edge's coords so it runs from `step.from` to `step.to`.
    const startsAtFrom = edge.a === step.from;
    const oriented = startsAtFrom ? edge.coords : [...edge.coords].reverse();

    if (coords.length === 0) {
      coords = [...oriented];
    } else {
      const prevEnd = coords[coords.length - 1];
      const nextStart = oriented[0];
      const gap = haversine(prevEnd, nextStart);
      if (gap > MAX_BRIDGE_GAP_M) return null;
      if (gap > 0) bridgedGapTotal += gap;
      // Append; if there's a small gap (junction cluster tolerance) the
      // straight line between prevEnd and oriented[0] bridges it — this is
      // interpolation across a mapping gap, not fabricated geometry.
      coords = coords.concat(oriented);
    }
  }

  return { coords, bridgedGapTotal };
}

/**
 * Find the best closed loop for a venue: cluster junctions, build the graph,
 * search for simple cycles within tolerance of expectedKm, and materialize
 * the one closest to expectedKm. Returns null if no cycle qualifies (either
 * no cycle exists in tolerance, or the best one needs too much gap-bridging).
 */
function findBestLoop(rawWays, expectedKm) {
  const expectedM = expectedKm * 1000;
  const minLenM = expectedM * 0.85;
  const maxLenM = expectedM * 1.15;

  const graph = buildGraph(rawWays);
  if (graph.numJunctions === 0 || graph.edges.length === 0) return null;

  const cycles = findCandidateCycles(graph, minLenM, maxLenM);
  if (!cycles.length) return null;

  // Rank by closeness to expected length, then materialize each in turn
  // until we find one whose bridged gaps stay under the cap.
  cycles.sort(
    (a, b) => Math.abs(a.length - expectedM) - Math.abs(b.length - expectedM)
  );

  for (const cycle of cycles) {
    const materialized = materializeCycle(graph, cycle);
    if (!materialized) continue;
    const { coords, bridgedGapTotal } = materialized;
    if (bridgedGapTotal > MAX_TOTAL_BRIDGE_GAP_M) continue;
    return {
      coords,
      length: cycle.length,
      bridgedGapTotal,
    };
  }

  return null;
}

/**
 * Try to find the best loop out of a raw element set, first restricting to
 * name-matching ways (if any exist) and falling back to the full set. This
 * lets the expected-length-pruned cycle search disambiguate venues with
 * multiple named track variants (e.g. Aragon's "Variante FIM"/"Variante FIA").
 */
function tryFindLoop(elements, entry) {
  const ways = filterWays(elements);
  if (!ways.length) return null;

  const namedWays = ways.filter((w) => entry.name.test(w.tags?.name ?? ""));
  const attempts = [];
  if (namedWays.length && namedWays.length !== ways.length) {
    attempts.push(namedWays);
  }
  attempts.push(ways);

  for (const candidateWays of attempts) {
    const loop = findBestLoop(candidateWays, entry.expectedKm);
    if (loop) return loop;
  }
  return null;
}

async function fetchOsmCircuit(entry) {
  let radius = 5000;
  let elements = await overpassQuery(entry.slug, entry.lat, entry.lon, radius);
  let loop = tryFindLoop(elements, entry);

  if (!loop) {
    // Retry with a larger radius — some venues need more of the surrounding
    // access roads/pit complex captured to close the graph.
    radius = 8000;
    elements = await overpassQuery(entry.slug, entry.lat, entry.lon, radius);
    loop = tryFindLoop(elements, entry);
  }

  if (!loop && entry.nationwideIso) {
    // Last resort for venues the around() query misses entirely (e.g. a
    // brand-new circuit not yet tagged near its own coordinates).
    elements = await overpassNationwideQuery(entry.slug, entry.nationwideIso);
    const nameFiltered = elements.filter((el) =>
      entry.name.test(el.tags?.name ?? "")
    );
    loop = tryFindLoop(nameFiltered.length ? nameFiltered : elements, entry);
  }

  if (!loop) {
    throw new Error(
      `No closed loop found within 15% of official ${entry.expectedKm}km lap (radius up to ${radius}m)`
    );
  }

  const expectedM = entry.expectedKm * 1000;
  const deviation = Math.abs(loop.length - expectedM) / expectedM;
  if (deviation > 0.15) {
    throw new Error(
      `Best closed loop is ${(loop.length / 1000).toFixed(2)}km but official lap is ${entry.expectedKm}km (${(deviation * 100).toFixed(0)}% off) — refusing to use the wrong track`
    );
  }
  if (loop.bridgedGapTotal > MAX_TOTAL_BRIDGE_GAP_M) {
    throw new Error(
      `Best closed loop needs ${loop.bridgedGapTotal.toFixed(0)}m of gap-bridging, exceeding the ${MAX_TOTAL_BRIDGE_GAP_M}m cap`
    );
  }

  return {
    coords: loop.coords,
    lengthKm: loop.length / 1000,
    bridgedGapM: loop.bridgedGapTotal,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function ensureDirs() {
  await mkdir(PUBLIC_F1, { recursive: true });
  await mkdir(PUBLIC_MOTOGP, { recursive: true });
}

async function writeCircuitSvg(folder, slug, pathD, attribution) {
  const dir = folder === "f1" ? PUBLIC_F1 : PUBLIC_MOTOGP;
  const svg = buildSvg(pathD, attribution);
  await writeFile(path.join(dir, `${slug}.svg`), svg, "utf8");
}

async function main() {
  await ensureDirs();

  // Optional slug filter: `node scripts/generate-circuit-svgs.mjs buriram jerez`
  // regenerates only the named circuits (useful to avoid hammering Overpass).
  const onlySlugs = process.argv.slice(2);
  const wanted = (slug) => onlySlugs.length === 0 || onlySlugs.includes(slug);

  const results = [];

  // --- Source A: F1 circuits ---
  for (const entry of F1_SOURCE) {
    if (!wanted(entry.slug)) continue;
    try {
      const coords = await fetchF1Circuit(entry);
      const pathD = coordsToSvgPath(coords, true);
      const attribution = "Circuit geometry: bacinger/f1-circuits (MIT)";
      for (const folder of entry.folders) {
        // Only write into motogp folder if that slug is part of the 2026 motogp list
        if (folder === "motogp" && !MOTOGP_2026_SLUGS.includes(entry.slug)) continue;
        if (folder === "f1" && !F1_2026_SLUGS.includes(entry.slug)) continue;
        await writeCircuitSvg(folder, entry.slug, pathD, attribution);
      }
      results.push({
        slug: entry.slug,
        source: "f1-circuits",
        status: "success",
        folders: entry.folders,
      });
    } catch (err) {
      results.push({
        slug: entry.slug,
        source: "f1-circuits",
        status: "skipped",
        reason: err.message,
      });
    }
  }

  // --- Source B: MotoGP-only circuits via OSM ---
  for (const entry of OSM_SOURCE) {
    if (!wanted(entry.slug)) continue;
    try {
      const { coords, lengthKm, bridgedGapM } = await fetchOsmCircuit(entry);
      const pathD = coordsToSvgPath(coords, true);
      const attribution = "Circuit geometry © OpenStreetMap contributors (ODbL)";
      await writeCircuitSvg("motogp", entry.slug, pathD, attribution);
      results.push({
        slug: entry.slug,
        source: "osm",
        status: "success",
        lengthKm,
        bridgedGapM,
        expectedKm: entry.expectedKm,
      });
    } catch (err) {
      results.push({
        slug: entry.slug,
        source: "osm",
        status: "skipped",
        reason: err.message,
      });
    }
  }

  console.log("\n=== Circuit SVG generation report ===\n");
  for (const r of results) {
    if (r.status === "success") {
      const extra =
        r.source === "osm" && r.lengthKm != null
          ? ` (loop length ${r.lengthKm.toFixed(2)}km vs official ${r.expectedKm}km, bridged gap ${r.bridgedGapM.toFixed(0)}m)`
          : r.folders
          ? ` -> [${r.folders.join(", ")}]`
          : "";
      console.log(`OK    ${r.slug} (${r.source})${extra}`);
    } else {
      console.log(`SKIP  ${r.slug} (${r.source}): ${r.reason}`);
    }
  }

  const skipped = results.filter((r) => r.status === "skipped");
  console.log(`\n${results.length - skipped.length}/${results.length} circuits generated.`);
  if (skipped.length) {
    console.log(`${skipped.length} skipped:`);
    for (const s of skipped) console.log(`  - ${s.slug}: ${s.reason}`);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
