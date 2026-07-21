/**
 * CLI: build a ReplayPackage from a historical source adapter.
 *
 * Usage:
 *   npx tsx scripts/build-replay-package.ts \
 *     --sport f1 \
 *     --slug australian-gp-r1 \
 *     --adapter timeline \
 *     --input path/to/timeline.json
 *
 * Options:
 *   --dry-run     Validate and print; do not write
 *   --session     practice | qualifying | sprint | race (optional override)
 *   --list        List available adapters and exit
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import {
  buildReplayPackage,
  getReplayAdapter,
  listReplayAdapters,
  writeReplayPackage,
  type BuildContext,
} from "../src/lib/replay/builder";
import type { Championship } from "../src/lib/live/types";
import type { ReplaySessionKind } from "../src/lib/replay/types";

type Args = {
  sport?: Championship;
  slug?: string;
  adapter?: string;
  input?: string;
  session?: ReplaySessionKind;
  dryRun: boolean;
  list: boolean;
};

function printUsage(): void {
  console.log(`Replay Package Builder

Usage:
  npx tsx scripts/build-replay-package.ts --sport <f1|motogp> --slug <slug> --adapter <id> --input <file.json> [--dry-run] [--session <kind>]
  npx tsx scripts/build-replay-package.ts --list

Adapters:
${listReplayAdapters()
  .map((a) => `  - ${a.id.padEnd(22)} ${a.label}`)
  .join("\n")}
`);
}

function parseArgs(argv: string[]): Args {
  const args: Args = { dryRun: false, list: false };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    const next = argv[i + 1];

    if (token === "--list") {
      args.list = true;
      continue;
    }
    if (token === "--dry-run") {
      args.dryRun = true;
      continue;
    }
    if (token === "--sport" && next) {
      args.sport = next as Championship;
      i += 1;
      continue;
    }
    if (token === "--slug" && next) {
      args.slug = next;
      i += 1;
      continue;
    }
    if (token === "--adapter" && next) {
      args.adapter = next;
      i += 1;
      continue;
    }
    if (token === "--input" && next) {
      args.input = next;
      i += 1;
      continue;
    }
    if (token === "--session" && next) {
      args.session = next as ReplaySessionKind;
      i += 1;
      continue;
    }
    if (token === "--help" || token === "-h") {
      printUsage();
      process.exit(0);
    }
  }

  return args;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.list) {
    for (const adapter of listReplayAdapters()) {
      console.log(`${adapter.id}\t${adapter.label}`);
    }
    return;
  }

  if (!args.sport || !args.slug || !args.adapter || !args.input) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  if (args.sport !== "f1" && args.sport !== "motogp") {
    console.error(`Invalid sport: ${args.sport}`);
    process.exitCode = 1;
    return;
  }

  const adapter = getReplayAdapter(args.adapter);
  if (!adapter) {
    console.error(`Unknown adapter: ${args.adapter}`);
    console.error(
      `Available: ${listReplayAdapters()
        .map((a) => a.id)
        .join(", ")}`
    );
    process.exitCode = 1;
    return;
  }

  const inputPath = path.resolve(process.cwd(), args.input);
  const rawText = await fs.readFile(inputPath, "utf8");
  const input = JSON.parse(rawText) as unknown;

  const context: BuildContext = {
    sport: args.sport,
    slug: args.slug,
    ...(args.session ? { sessionKind: args.session } : {}),
  };

  const result = await buildReplayPackage(adapter, input, context);

  if (!result.ok) {
    console.error(`Build failed (${result.adapterId}): ${result.reason ?? ""}`);
    for (const issue of result.issues) {
      console.error(`  [${issue.severity}] ${issue.path}: ${issue.message}`);
    }
    process.exitCode = 1;
    return;
  }

  for (const warning of result.warnings) {
    console.warn(`  [warning] ${warning.path}: ${warning.message}`);
  }

  if (args.dryRun) {
    console.log(
      `Dry run OK — ${result.package.sport}/${result.package.slug} ` +
        `(${result.package.samples.length} samples, ` +
        `${result.package.events.length} events, ` +
        `${result.package.bookmarks.length} bookmarks)`
    );
    console.log(JSON.stringify(result.package, null, 2));
    return;
  }

  const written = await writeReplayPackage(result.package);
  console.log(`Wrote ${written.path}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
