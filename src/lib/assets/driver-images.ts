import { IMAGE_EXTENSIONS, type AssetSport } from "./constants";

function normalizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildCandidates(basePath: string): readonly string[] {
  return IMAGE_EXTENSIONS.map((extension) => `${basePath}${extension}`);
}

/**
 * Driver (F1) or rider (MotoGP) headshot candidates in priority order.
 * Pass `sport: "motogp"` to resolve `/images/motogp/riders/`.
 */
export function getDriverImage(
  slug: string,
  sport: AssetSport = "f1"
): readonly string[] {
  const folder = sport === "f1" ? "drivers" : "riders";
  const base = `/images/${sport}/${folder}/${normalizeSlug(slug)}`;
  return buildCandidates(base);
}

/**
 * Team (F1) or manufacturer (MotoGP) logo candidates in priority order.
 */
export function getTeamLogo(
  slug: string,
  sport: AssetSport = "f1"
): readonly string[] {
  const folder = sport === "f1" ? "teams" : "manufacturers";
  const base = `/images/${sport}/${folder}/${normalizeSlug(slug)}`;
  return buildCandidates(base);
}

/**
 * Circuit image candidates in priority order.
 */
export function getCircuitImage(
  slug: string,
  sport: AssetSport = "f1"
): readonly string[] {
  const base = `/images/${sport}/circuits/${normalizeSlug(slug)}`;
  return buildCandidates(base);
}
