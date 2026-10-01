import { promises as fs } from "fs";
import path from "path";

import { ObjectId } from "mongodb";

import type { PlayArchiveDocument } from "#/db-types/play/play-archive.types";
import type { Document } from "mongodb";

import DatabaseService from "#/core/DatabaseService";
import { classifyGenres } from "#/normalization/classifyGenres";
import * as dbUtils from "#/utils/dbUtils";

// mirrors BaseWorksList#formatGenres - kept local since this reads directly from the
// archive collection rather than from a freshly-scraped page
const splitGenres = (raw?: string): string[] =>
  (raw ?? "")
    .split(",")
    .map((token) => token.toLowerCase().trim())
    .filter((token) => token.length > 0);

export type GenreNormalizationOptions = {
  dbService: DatabaseService;
  dryRun?: boolean;
  ids?: string[];
  reviewQueueDir?: string;
};

export type GenreNormalizationSummary = {
  processed: number;
  updated: number;
  missingPlayDocument: number;
  residueEntries: { playId: string; residue: string[] }[];
  reviewFilePath?: string;
};

export const runGenreNormalization = async ({
  dbService,
  dryRun = false,
  ids,
  reviewQueueDir = path.join("output", "review-queue"),
}: GenreNormalizationOptions): Promise<GenreNormalizationSummary> => {
  const archiveCollection = await dbService.getCollection("play_archives");
  const playsCollection = await dbService.getCollection("plays");

  const filter: Document = ids?.length ? { _id: { $in: ids.map((id) => new ObjectId(id)) } } : {};

  let processed = 0;
  let updated = 0;
  let missingPlayDocument = 0;
  const residueEntries: { playId: string; residue: string[] }[] = [];

  const cursor = archiveCollection.find(filter);
  for await (const document of cursor) {
    const archiveDoc = document as unknown as PlayArchiveDocument;
    processed += 1;

    const genreTokens = splitGenres(archiveDoc.genres);
    const classification = classifyGenres(genreTokens);

    if (classification.residue?.length) {
      residueEntries.push({ playId: archiveDoc.playId, residue: classification.residue });
    }

    const update = dbUtils.removeEmptyFields({
      genres: Object.values(classification.tags).flat(),
      genreTags: Object.keys(classification.tags).length ? classification.tags : undefined,
      duration: classification.duration,
      durationRange: classification.durationRange,
      actCount: classification.actCount,
      collectionSize: classification.collectionSize,
    });

    if (!update) continue;
    if (dryRun) {
      updated += 1;
      continue;
    }

    const result = await playsCollection.findOneAndUpdate({ _id: archiveDoc._id }, { $set: update });
    if (!result) {
      missingPlayDocument += 1;
      continue;
    }
    updated += 1;
  }

  let reviewFilePath: string | undefined;
  if (residueEntries.length > 0) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "_");
    reviewFilePath = path.join(reviewQueueDir, `genre-review-${timestamp}.json`);
    await fs.mkdir(path.dirname(reviewFilePath), { recursive: true });
    await fs.writeFile(
      reviewFilePath,
      JSON.stringify({ metadata: { createdAt: new Date() }, residueEntries }, null, 2),
    );
  }

  return { processed, updated, missingPlayDocument, residueEntries, reviewFilePath };
};

async function main() {
  // loaded dynamically so importing runGenreNormalization (e.g. in tests) doesn't require
  // evaluating the ESM-only yargs package
  const { default: yargs } = await import("yargs");
  const argv = await yargs(process.argv.slice(2))
    .option("dry-run", {
      type: "boolean",
      default: false,
      description: "Report what would change without writing to the database",
    })
    .option("ids", {
      type: "string",
      description: "Comma-separated list of _id hex strings to reprocess (default: all play_archives documents)",
    })
    .strict()
    .exitProcess(false)
    .fail((message, error) => {
      if (error) throw error;
      throw new Error(message ?? "Argument parsing failed.");
    })
    .parse();

  const dryRun = argv["dry-run"];
  const ids = argv.ids
    ?.split(",")
    .map((id) => id.trim())
    .filter((id) => id.length > 0);

  const dbService = new DatabaseService();
  const summary = await runGenreNormalization({ dbService, dryRun, ids });

  console.info(`${dryRun ? "[dry run] " : ""}Processed ${summary.processed} archived play(s).`);
  console.info(`${dryRun ? "Would update" : "Updated"} ${summary.updated} play document(s).`);
  if (summary.missingPlayDocument > 0) {
    console.info(`Skipped ${summary.missingPlayDocument} archive document(s) with no matching play document.`);
  }
  if (summary.reviewFilePath) {
    console.info(`Wrote ${summary.residueEntries.length} entries with unmatched residue to ${summary.reviewFilePath}`);
  }

  await dbService.close();
}

if (require.main === module) {
  main().catch((error: unknown) => {
    console.error("Fatal error during genre normalization:", error);
    process.exitCode = 1;
  });
}
