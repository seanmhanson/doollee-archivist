import { promises as fs } from "fs";
import path from "path";

import config from "#/core/Config";
import DatabaseService from "#/core/DatabaseService";

async function main() {
  const dbService = new DatabaseService(config.mongoUri, config.dbName);
  await dbService.connect();

  const playsCollection = await dbService.getCollection("plays");

  // Get genre frequencies
  const pipeline = [
    { $match: { genres: { $exists: true, $nin: ["", null] } } },
    { $group: { _id: "$genres", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $project: { _id: 0, genre: "$_id", count: 1 } },
  ];

  const results = await playsCollection.aggregate(pipeline).toArray();

  // Export to CSV
  const outputDir = path.resolve("analysis");
  await fs.mkdir(outputDir, { recursive: true });

  const csv = [
    "genre,count",
    ...results.map(({ genre, count }) => `"${genre}",${count}`),
  ].join("\n");

  const filePath = path.join(outputDir, "genre-frequencies.csv");
  await fs.writeFile(filePath, csv, "utf8");

  await dbService.close();
  console.log(`✅ Exported ${results.length} genre frequencies to ${filePath}`);
}

main().catch(console.error);
