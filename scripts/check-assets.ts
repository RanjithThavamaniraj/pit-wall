import fs from "node:fs";
import path from "node:path";
import { IMAGE_EXTENSIONS } from "../src/lib/assets/constants";
import {
  ASSET_MANIFEST,
  getCircuitImage,
  getDriverImage,
  getTeamLogo,
  type ManifestEntry,
} from "../src/lib/assets";

const PUBLIC_ROOT = path.join(process.cwd(), "public");

function resolveCandidates(entry: ManifestEntry): readonly string[] {
  switch (entry.category) {
    case "f1-drivers":
      return getDriverImage(entry.slug, "f1");
    case "f1-teams":
      return getTeamLogo(entry.slug, "f1");
    case "f1-circuits":
      return getCircuitImage(entry.slug, "f1");
    case "motogp-riders":
      return getDriverImage(entry.slug, "motogp");
    case "motogp-manufacturers":
      return getTeamLogo(entry.slug, "motogp");
    case "motogp-circuits":
      return getCircuitImage(entry.slug, "motogp");
    default:
      return [];
  }
}

function findCaseMismatch(
  candidates: readonly string[]
): { expected: string; actual: string } | null {
  if (candidates.length === 0) return null;

  const relative = candidates[0].replace(/^\//, "");
  const directory = path.dirname(path.join(PUBLIC_ROOT, relative));
  const expectedBase = path.basename(relative, IMAGE_EXTENSIONS[0]);

  if (!fs.existsSync(directory)) {
    return null;
  }

  for (const fileName of fs.readdirSync(directory)) {
    if (fileName.startsWith(".")) continue;
    const base = fileName.replace(/\.(webp|png|jpg)$/i, "");
    if (base.toLowerCase() === expectedBase.toLowerCase() && base !== expectedBase) {
      return {
        expected: `${expectedBase}{.webp|.png|.jpg}`,
        actual: fileName,
      };
    }
  }

  return null;
}

function findExistingAsset(candidates: readonly string[]): string | null {
  for (const candidate of candidates) {
    const filePath = path.join(PUBLIC_ROOT, candidate.replace(/^\//, ""));
    if (fs.existsSync(filePath)) {
      try {
        fs.accessSync(filePath, fs.constants.R_OK);
        const stat = fs.statSync(filePath);
        if (stat.isFile()) {
          return candidate;
        }
      } catch {
        continue;
      }
    }
  }
  return null;
}

function main() {
  const existing: string[] = [];
  const missing: string[] = [];
  const caseMismatches: string[] = [];

  for (const entry of ASSET_MANIFEST) {
    const candidates = resolveCandidates(entry);
    const found = findExistingAsset(candidates);
    const line = `${entry.label} (${candidates.join(" | ")})`;

    if (found) {
      existing.push(`✓ ${line} → ${found}`);
      continue;
    }

    const mismatch = findCaseMismatch(candidates);
    if (mismatch) {
      caseMismatches.push(
        `⚠ ${entry.label}: found "${mismatch.actual}" but expected lowercase slug filename "${mismatch.expected}"`
      );
    }

    missing.push(`✗ ${line}`);
  }

  console.log("Pit Wall asset check\n");
  console.log(`Existing assets (${existing.length}):`);
  if (existing.length === 0) {
    console.log("  (none)");
  } else {
    for (const line of existing) {
      console.log(`  ${line}`);
    }
  }

  if (caseMismatches.length > 0) {
    console.log(`\nCase mismatches (${caseMismatches.length}):`);
    for (const line of caseMismatches) {
      console.log(`  ${line}`);
    }
  }

  console.log(`\nMissing assets (${missing.length}):`);
  if (missing.length === 0) {
    console.log("  (none)");
  } else {
    for (const line of missing) {
      console.log(`  ${line}`);
    }
  }

  console.log(
    `\nSummary: ${existing.length} present, ${missing.length} missing, ${ASSET_MANIFEST.length} total`
  );

  if (missing.length > 0) {
    process.exitCode = 1;
  }
}

main();
