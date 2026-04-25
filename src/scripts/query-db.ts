import { promises as fs } from "fs";
import path from "path";

import yargs from "yargs";

import DatabaseService, { VALID_COLLECTION_NAMES } from "#/core/DatabaseService";

function parseJsonArg(value: string, argName: string): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error(`Invalid JSON for --${argName}: ${value}`);
  }
  const isPlainObject =
    typeof parsed === "object" &&
    parsed !== null &&
    !Array.isArray(parsed) &&
    Object.getPrototypeOf(parsed) === Object.prototype;
  if (!isPlainObject) {
    throw new Error(`Invalid JSON for --${argName}: expected a JSON object, received ${value}`);
  }
  return parsed as Record<string, unknown>;
}

async function main() {
  const argv = await yargs(process.argv.slice(2))
    .option("collection", {
      type: "string",
      demandOption: true,
      choices: VALID_COLLECTION_NAMES,
      description: "Collection to query",
    })
    .option("filter", {
      type: "string",
      default: "{}",
      description: "MongoDB filter as a JSON string",
    })
    .option("projection", {
      type: "string",
      default: "{}",
      description: "MongoDB projection as a JSON string",
    })
    .option("limit", {
      type: "number",
      default: 20,
      description: "Maximum number of documents to return (must be >= 1; MongoDB treats 0 as no limit)",
    })
    .option("out", {
      type: "string",
      default: "output/query-result.json",
      description: "Output file path",
    })
    .strict()
    .exitProcess(false)
    .fail((message, error) => {
      if (error) {
        throw error;
      }
      throw new Error(message ?? "Argument parsing failed.");
    })
    .parse();

  // Validate JSON args before connecting
  const parsedFilter = parseJsonArg(argv.filter, "filter");
  const parsedProjection = parseJsonArg(argv.projection, "projection");

  const collection = argv.collection;
  const { limit: rawLimit, out } = argv;

  if (!Number.isInteger(rawLimit) || rawLimit < 1) {
    throw new Error(`Invalid --limit value: ${rawLimit}. Must be a positive integer (>= 1).`);
  }
  const limit = rawLimit;

  const dbService = new DatabaseService();
  try {
    const col = await dbService.getCollection(collection);
    const results = await col.find(parsedFilter).project(parsedProjection).limit(limit).toArray();

    const output = {
      metadata: {
        collection,
        filter: parsedFilter,
        projection: parsedProjection,
        limit,
        count: results.length,
        queriedAt: new Date().toISOString(),
      },
      results,
    };

    await fs.mkdir(path.dirname(out), { recursive: true });
    await fs.writeFile(out, JSON.stringify(output, null, 2));
    console.log(`Wrote ${results.length} document(s) to ${out}`);
  } finally {
    await dbService.close();
  }
}

main().catch((error: unknown) => {
  console.error("Query failed:", error);
  process.exitCode = 1;
});
