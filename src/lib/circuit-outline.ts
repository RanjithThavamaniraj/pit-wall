import type { Sport } from "@/lib/sport";

/**
 * Maps circuits to the pre-generated outline SVGs under
 * public/circuits/<sport>/<slug>.svg. Every SVG referenced here was generated
 * from real geographic data (F1 circuits GeoJSON or OpenStreetMap) — see
 * scripts/generate-circuit-svgs.mjs. Circuits whose SVG generation was
 * skipped (fetch failure, no closed loop found, etc.) are omitted from
 * GENERATED_SLUGS so we never link to a missing file.
 *
 * This file is the ONLY place API circuit identifiers/names are translated
 * into internal slugs. Callers should never match on display names directly.
 *
 * Lookup order, most to least stable:
 *   1. Stable circuit id from the API (Jolpica `Circuit.circuitId` for F1,
 *      PulseLive `circuit.id` UUID for MotoGP) — survives display-name
 *      renames (sponsor changes, wording tweaks) entirely.
 *   2. Normalized display-name match — a fallback for the rare case an API
 *      response omits the id. Exact-string based, so it can go stale if a
 *      name changes; that's fine, it's a safety net, not the primary path.
 *   3. Token match — a last-resort fallback for MotoGP that looks for a
 *      distinctive substring (e.g. "sachsenring", "brno") anywhere in the
 *      normalized name, so even an unexpected rename/sponsor-prefix change
 *      still resolves as long as the core place name survives.
 */

const DIACRITIC_PATTERN = /[̀-ͯ]/g;

function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(DIACRITIC_PATTERN, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

// ─── F1 (Jolpica/Ergast) ────────────────────────────────────────────────────

// Primary: stable Ergast/Jolpica `Circuit.circuitId` -> our slug.
const F1_CIRCUIT_ID_SLUGS: Record<string, string> = {
  albert_park: "albert-park",
  shanghai: "shanghai",
  suzuka: "suzuka",
  miami: "miami",
  villeneuve: "gilles-villeneuve",
  monaco: "monaco",
  catalunya: "catalunya",
  red_bull_ring: "red-bull-ring",
  silverstone: "silverstone",
  spa: "spa-francorchamps",
  hungaroring: "hungaroring",
  zandvoort: "zandvoort",
  monza: "monza",
  madring: "madring",
  baku: "baku",
  marina_bay: "marina-bay",
  americas: "cota",
  rodriguez: "hermanos-rodriguez",
  interlagos: "interlagos",
  vegas: "las-vegas",
  losail: "losail",
  yas_marina: "yas-marina",
  sepang: "sepang",
  portimao: "portimao",
};

// Fallback: normalized display name -> slug, used only when circuitId is
// missing from the API response.
const F1_CIRCUIT_NAME_SLUGS: Record<string, string> = {
  "albert park grand prix circuit": "albert-park",
  "shanghai international circuit": "shanghai",
  "suzuka circuit": "suzuka",
  "miami international autodrome": "miami",
  "circuit gilles villeneuve": "gilles-villeneuve",
  "circuit de monaco": "monaco",
  "circuit de barcelona-catalunya": "catalunya",
  "red bull ring": "red-bull-ring",
  "silverstone circuit": "silverstone",
  "circuit de spa-francorchamps": "spa-francorchamps",
  hungaroring: "hungaroring",
  "circuit park zandvoort": "zandvoort",
  "autodromo nazionale di monza": "monza",
  madring: "madring",
  "baku city circuit": "baku",
  "marina bay street circuit": "marina-bay",
  "circuit of the americas": "cota",
  "autodromo hermanos rodriguez": "hermanos-rodriguez",
  "autodromo jose carlos pace": "interlagos",
  "las vegas strip street circuit": "las-vegas",
  "losail international circuit": "losail",
  "yas marina circuit": "yas-marina",
  "petronas sepang international circuit": "sepang",
  "autodromo internacional do algarve": "portimao",
};

// ─── MotoGP (PulseLive) ─────────────────────────────────────────────────────

// Primary: stable PulseLive `circuit.id` UUID -> our slug.
const MOTOGP_CIRCUIT_ID_SLUGS: Record<string, string> = {
  "a8bd93f8-8e7e-4669-ae1c-1f3f5156b4e7": "buriram",
  "dc7c629b-f6e2-410e-860a-1ca0f28beb8f": "goiania",
  "5b97d826-e527-43e9-b696-09f61cf4559c": "cota",
  "763812ea-9435-4c1c-b61b-a0c14ccdfbe4": "jerez",
  "ebb41e75-8664-4dfd-b0eb-07f24bd5fb92": "le-mans-bugatti",
  "2218098d-ab2d-498b-a633-1a4a39119e9e": "catalunya",
  "1ab286fc-eb24-4980-85a8-b7b940f46e13": "mugello",
  "c2119f01-e758-41a7-a721-d5baec22deb9": "balaton-park",
  "b8664e71-95a8-4c71-b093-96a23fa839df": "brno",
  "f4f9b0e8-1319-4d4f-a5ae-6cf193b01fca": "assen",
  "551f87c7-1940-48b0-bce7-1ad8de7ce548": "sachsenring",
  "473ee5fa-b4e5-4c00-a0fe-28051700e20d": "silverstone",
  "50209e25-6cd8-4d8d-912e-c48a06275a8a": "motorland-aragon",
  "e0d07d48-0b62-40fa-9d36-411b15af406f": "misano",
  "8dc64efd-25f8-41cf-aa4f-dfbfa41a762a": "red-bull-ring",
  "213eb1ff-9ae5-4aec-862f-44a10637f36d": "motegi",
  "a1ec6331-c571-418c-92d7-768cf0c83872": "mandalika",
  "d4629be0-3742-4950-af2e-2807562d6cb8": "phillip-island",
  "f5a7f3f8-0097-4810-a2da-eee749aedc77": "sepang",
  "e9a71399-cea9-400a-b2ef-48bfdcdf6526": "losail",
  "912a9d7f-2864-4311-bebb-19851e9c2620": "portimao",
  "664c40ff-8deb-4613-91cd-62c945f95e1e": "ricardo-tormo",
};

// Fallback #1: normalized full display name -> slug, used only when the id
// is missing from the API response.
const MOTOGP_CIRCUIT_NAME_SLUGS: Record<string, string> = {
  "chang international circuit": "buriram",
  "autodromo internacional de goiania - ayrton senna": "goiania",
  "circuit of the americas": "cota",
  "circuito de jerez - angel nieto": "jerez",
  "le mans": "le-mans-bugatti",
  "circuit de barcelona-catalunya": "catalunya",
  "autodromo internazionale del mugello": "mugello",
  "balaton park circuit": "balaton-park",
  "creditas autodrom brno": "brno",
  "tt circuit assen": "assen",
  sachsenring: "sachsenring",
  "silverstone circuit": "silverstone",
  "motorland aragon": "motorland-aragon",
  "misano world circuit marco simoncelli": "misano",
  "red bull ring - spielberg": "red-bull-ring",
  "mobility resort motegi": "motegi",
  "pertamina mandalika circuit": "mandalika",
  "phillip island": "phillip-island",
  "petronas sepang international circuit": "sepang",
  "lusail international circuit": "losail",
  "autodromo internacional do algarve": "portimao",
  "circuit ricardo tormo": "ricardo-tormo",
};

// Fallback #2: last resort. Looks for a distinctive token anywhere in the
// normalized name, so the mapping survives sponsor-prefix/suffix churn
// (e.g. "CREDITAS Autodrom Brno" -> "Brno Circuit presented by X") even if
// both the id and the exact name change.
const MOTOGP_CIRCUIT_TOKEN_SLUGS: Array<{ token: RegExp; slug: string }> = [
  { token: /chang/i, slug: "buriram" },
  { token: /goiania/i, slug: "goiania" },
  { token: /circuit of the americas|\bcota\b/i, slug: "cota" },
  { token: /jerez/i, slug: "jerez" },
  { token: /\ble mans\b/i, slug: "le-mans-bugatti" },
  { token: /catalunya|barcelona/i, slug: "catalunya" },
  { token: /mugello/i, slug: "mugello" },
  { token: /balaton/i, slug: "balaton-park" },
  { token: /brno/i, slug: "brno" },
  { token: /assen/i, slug: "assen" },
  { token: /sachsenring/i, slug: "sachsenring" },
  { token: /silverstone/i, slug: "silverstone" },
  { token: /motorland|aragon/i, slug: "motorland-aragon" },
  { token: /misano|simoncelli/i, slug: "misano" },
  { token: /red bull ring/i, slug: "red-bull-ring" },
  { token: /motegi/i, slug: "motegi" },
  { token: /mandalika/i, slug: "mandalika" },
  { token: /phillip island/i, slug: "phillip-island" },
  { token: /sepang/i, slug: "sepang" },
  { token: /lusail|losail/i, slug: "losail" },
  { token: /algarve|portimao/i, slug: "portimao" },
  { token: /ricardo tormo|cheste/i, slug: "ricardo-tormo" },
];

// Slugs whose SVG generation succeeded (kept in sync with
// scripts/generate-circuit-svgs.mjs output). If a circuit could not be
// fetched from a real data source, its slug is omitted here so we return
// null instead of a broken image path.
const GENERATED_SLUGS: Record<Sport, Set<string>> = {
  f1: new Set([
    "albert-park",
    "shanghai",
    "suzuka",
    "miami",
    "gilles-villeneuve",
    "monaco",
    "catalunya",
    "red-bull-ring",
    "silverstone",
    "spa-francorchamps",
    "hungaroring",
    "zandvoort",
    "monza",
    "madring",
    "baku",
    "marina-bay",
    "cota",
    "hermanos-rodriguez",
    "interlagos",
    "las-vegas",
    "losail",
    "yas-marina",
  ]),
  motogp: new Set([
    "buriram",
    "goiania",
    "cota",
    "jerez",
    "le-mans-bugatti",
    "catalunya",
    "mugello",
    // "balaton-park" skipped — no raceway geometry found in OSM, even via
    // nationwide fallback query (new circuit, not yet mapped)
    "brno",
    "assen",
    "sachsenring",
    "silverstone",
    "motorland-aragon",
    "misano",
    "red-bull-ring",
    "motegi",
    "mandalika",
    "phillip-island",
    "sepang",
    "losail",
    "portimao",
    "ricardo-tormo",
  ]),
};

function warnMissingLookup(sport: Sport, id: string | undefined, name: string): void {
  if (process.env.NODE_ENV === "production") return;
  console.warn(
    `[circuit-outline] No slug mapping for ${sport} circuit (id=${id ?? "none"}, name="${name}"). ` +
      "The API may have renamed/re-identified this circuit — update src/lib/circuit-outline.ts."
  );
}

function resolveF1Slug(id: string | undefined, name: string): string | null {
  if (id && F1_CIRCUIT_ID_SLUGS[id]) return F1_CIRCUIT_ID_SLUGS[id];
  const key = normalizeName(name);
  if (F1_CIRCUIT_NAME_SLUGS[key]) return F1_CIRCUIT_NAME_SLUGS[key];
  return null;
}

function resolveMotoGpSlug(id: string | undefined, name: string): string | null {
  if (id && MOTOGP_CIRCUIT_ID_SLUGS[id]) return MOTOGP_CIRCUIT_ID_SLUGS[id];
  const key = normalizeName(name);
  if (MOTOGP_CIRCUIT_NAME_SLUGS[key]) return MOTOGP_CIRCUIT_NAME_SLUGS[key];
  const token = MOTOGP_CIRCUIT_TOKEN_SLUGS.find((entry) => entry.token.test(key));
  return token?.slug ?? null;
}

export type CircuitLookup = {
  /** Stable API-provided circuit identifier, if available. */
  id?: string;
  /** Circuit display name, used only as a fallback when `id` doesn't resolve. */
  name: string;
};

export function getCircuitOutlinePath(
  sport: Sport,
  circuit: CircuitLookup
): string | null {
  if (!circuit.name && !circuit.id) return null;

  const slug =
    sport === "motogp"
      ? resolveMotoGpSlug(circuit.id, circuit.name)
      : resolveF1Slug(circuit.id, circuit.name);

  if (!slug) {
    warnMissingLookup(sport, circuit.id, circuit.name);
    return null;
  }

  if (!GENERATED_SLUGS[sport].has(slug)) return null;

  return `/circuits/${sport}/${slug}.svg`;
}
