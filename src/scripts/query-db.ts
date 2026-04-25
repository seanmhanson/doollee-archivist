import { promises as fs } from "fs";
import path from "path";

import yargs from "yargs";

import DatabaseService from "#/core/DatabaseService";

const VALID_COLLECTIONS = ["plays", "authors"] as const;
type CollectionName = (typeof VALID_COLLECTIONS)[number];

function parseJsonArg(value: string, argName: string): Record<string, unknown> {
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    console.error(`Invalid JSON for --${argName}: ${value}`);
    process.exit(1);
  }
}

async function main() {
  const argv = await yargs(process.argv.slice(2))
    .option("collection", {
      type: "string",
      demandOption: true,
      description: `Collection to query. Must be one of: ${VALID_COLLECTIONS.join(", ")}`,
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
      description: "Maximum number of documents to return",
    })
    .option("out", {
      type: "string",
      default: "output/query-result.json",
      description: "Output file path",
    })
    .strict()
    .parse();

  // Validate --collection before connecting
  if (!VALID_COLLECTIONS.includes(argv.collection as CollectionName)) {
    console.error(`Invalid --collection value: "${argv.collection}". Must be one of: ${VALID_COLLECTIONS.join(", ")}`);
    process.exit(1);
  }

  // Validate JSON args before connecting
  const parsedFilter = parseJsonArg(argv.filter, "filter");
  const parsedProjection = parseJsonArg(argv.projection, "projection");

  const collection = argv.collection as CollectionName;
  const { limit, out } = argv;

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
