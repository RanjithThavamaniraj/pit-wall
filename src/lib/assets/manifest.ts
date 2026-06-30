/**
 * Canonical list of expected image assets.
 * Drop a .webp, .png, or .jpg into the matching folder to satisfy an entry.
 */

export const F1_DRIVERS = [
  "max-verstappen",
  "lando-norris",
  "oscar-piastri",
  "charles-leclerc",
  "lewis-hamilton",
  "george-russell",
  "andrea-kimi-antonelli",
  "fernando-alonso",
  "lance-stroll",
  "pierre-gasly",
  "franco-colapinto",
  "alexander-albon",
  "carlos-sainz",
  "oliver-bearman",
  "liam-lawson",
  "isack-hadjar",
  "esteban-ocon",
  "gabriel-bortoleto",
  "nico-hulkenberg",
  "kimi-antonelli",
  "yuki-tsunoda",
  "jack-doohan",
] as const;

export const F1_TEAMS = [
  "red-bull-racing",
  "mclaren",
  "ferrari",
  "mercedes",
  "aston-martin",
  "alpine",
  "williams",
  "racing-bulls",
  "haas",
  "sauber",
] as const;

export const F1_CIRCUITS = [
  "albert-park",
  "shanghai",
  "suzuka",
  "sakhir",
  "jeddah",
  "miami",
  "imola",
  "monaco",
  "montreal",
  "barcelona",
  "red-bull-ring",
  "silverstone",
  "spa-francorchamps",
  "hungaroring",
  "zandvoort",
  "monza",
  "baku",
  "marina-bay",
  "circuit-of-the-americas",
  "mexico-city",
  "interlagos",
  "las-vegas",
  "losail",
  "yas-marina",
] as const;

export const MOTOGP_RIDERS = [
  "francesco-bagnaia",
  "marc-marquez",
  "jorge-martin",
  "pedro-acosta",
  "enea-bastianini",
  "brad-binder",
  "maverick-vinales",
  "fabio-quartararo",
  "aleix-espargaro",
  "raul-fernandez",
  "marco-bezzecchi",
  "alex-marquez",
  "jack-miller",
  "johann-zarco",
  "luca-marini",
  "fabio-di-giannantonio",
  "augusto-fernandez",
  "joan-mir",
  "takaaki-nakagami",
  "somkiat-chantra",
  "ai-ogura",
  "mario-ayo",
] as const;

export const MOTOGP_MANUFACTURERS = [
  "ducati",
  "aprilia",
  "ktm",
  "yamaha",
  "honda",
] as const;

export const MOTOGP_CIRCUITS = [
  "buriram",
  "circuit-of-the-americas",
  "losail",
  "jerez",
  "le-mans",
  "catalunya",
  "mugello",
  "assen",
  "sachsenring",
  "silverstone",
  "aragon",
  "red-bull-ring",
  "hungaroring",
  "misano",
  "motorland",
  "motegi",
  "phillip-island",
  "petronas",
  "valencia",
  "portimao",
] as const;

export type ManifestCategory =
  | "f1-drivers"
  | "f1-teams"
  | "f1-circuits"
  | "motogp-riders"
  | "motogp-manufacturers"
  | "motogp-circuits";

export type ManifestEntry = {
  category: ManifestCategory;
  slug: string;
  label: string;
};

function entries(
  category: ManifestCategory,
  slugs: readonly string[],
  labelPrefix: string
): ManifestEntry[] {
  return slugs.map((slug) => ({
    category,
    slug,
    label: `${labelPrefix}/${slug}`,
  }));
}

export const ASSET_MANIFEST: readonly ManifestEntry[] = [
  ...entries("f1-drivers", F1_DRIVERS, "f1/drivers"),
  ...entries("f1-teams", F1_TEAMS, "f1/teams"),
  ...entries("f1-circuits", F1_CIRCUITS, "f1/circuits"),
  ...entries("motogp-riders", MOTOGP_RIDERS, "motogp/riders"),
  ...entries("motogp-manufacturers", MOTOGP_MANUFACTURERS, "motogp/manufacturers"),
  ...entries("motogp-circuits", MOTOGP_CIRCUITS, "motogp/circuits"),
] as const;

export const assetManifest = {
  f1: {
    drivers: F1_DRIVERS,
    teams: F1_TEAMS,
    circuits: F1_CIRCUITS,
  },
  motogp: {
    riders: MOTOGP_RIDERS,
    manufacturers: MOTOGP_MANUFACTURERS,
    circuits: MOTOGP_CIRCUITS,
  },
} as const;
