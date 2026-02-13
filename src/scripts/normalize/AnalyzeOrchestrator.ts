import { promises as fs } from "fs";
import path from "path";

import type { Collection, Document } from "mongodb";

import DatabaseService from "#/core/DatabaseService";
import { SetupError } from "#/scripts/main/ScrapingError";

type Services = {
  dbService: DatabaseService;
};

type SingleFrequencyProps = {
  collection: Collection<Document>;
  fieldName: string;
  sortByField?: boolean;
  sortDescending?: boolean;
};

type ResultDocument = Record<string, string> & { count: number };

class AnalyzeOrchestrator {
  private services: Services;
  private playsCollection?: Collection<Document>;
  private authorsCollection?: Collection<Document>;
  private writtenFiles: string[] = [];

  constructor(services: Services) {
    this.services = services;
  }

  private getPlaysCollection() {
    if (!this.playsCollection) {
      throw new Error("Database not connected. Call connect() first.");
    }
    return this.playsCollection;
  }

  private getAuthorsCollection() {
    if (!this.authorsCollection) {
      throw new Error("Database not connected. Call connect() first.");
    }
    return this.authorsCollection;
  }

  private async connect() {
    const dbConnected = await this.services.dbService.isConnected();

    if (!dbConnected) {
      try {
        await this.services.dbService.connect();
      } catch (error) {
        throw new SetupError(`DatabaseService failed to connect`, error);
      }
      if (!(await this.services.dbService.isConnected())) {
        throw new SetupError("DatabaseService connection attempt failed");
      }
    }

    this.playsCollection = await this.services.dbService.getCollection("plays");
    this.authorsCollection =
      await this.services.dbService.getCollection("authors");
  }

  public async run() {
    await this.connect();

    await this.analyzeGenres();
    await this.analyzePublishers();
    await this.analyzeParts();

    await this.close();
  }

  private async close() {
    console.log("Analysis complete. Written files:");
    this.writtenFiles.forEach((file) => console.log(`- ${file}`));
    await this.services.dbService.close();
  }

  private async analyzeGenres() {
    await this.getSingleFrequencyTable({
      collection: this.getPlaysCollection(),
      fieldName: "genres",
    });
  }

  private async analyzePublishers() {
    await this.getSingleFrequencyTable({
      collection: this.getPlaysCollection(),
      fieldName: "publisher",
      sortByField: true,
    });
  }

  private async analyzeParts() {
    const pipeline = this.getPartsPipeline();

    const collection = this.getPlaysCollection();
    const results = (await collection
      .aggregate(pipeline)
      .toArray()) as ResultDocument[];

    const csv = [
      "All,Frequency,MaleParts,FemaleParts,OtherParts",
      ...results.map(
        ({ text, frequency, maleParts, femaleParts, otherParts }) =>
          `${this.escapeCsvField(text)},${frequency},${maleParts},${femaleParts},${otherParts}`,
      ),
    ].join("\n");

    await this.writeToCSV(csv, "parts");
  }

  private getSingleFrequencyPipeline(
    fieldName: string,
    sortByField = false,
    sortDescending = true,
  ) {
    const groupField = `$${fieldName}`;

    const sortOrder = sortDescending ? -1 : 1;
    const sortField = sortByField ? fieldName : "count";
    const sortStage = { [sortField]: sortOrder };

    return [
      { $match: { [fieldName]: { $exists: true, $nin: ["", null] } } },
      { $group: { _id: groupField, count: { $sum: 1 } } },
      { $sort: sortStage },
      { $project: { _id: 0, [fieldName]: "$_id", count: 1 } },
    ];
  }

  private async getSingleFrequencyTable({
    collection,
    fieldName,
    sortByField = false,
    sortDescending = true,
  }: SingleFrequencyProps) {
    const pipeline = this.getSingleFrequencyPipeline(
      fieldName,
      sortByField,
      sortDescending,
    );
    const results = (await collection
      .aggregate(pipeline)
      .toArray()) as ResultDocument[];
    const csv = this.getSingleFrequencyCSV(results, fieldName);
    await this.writeToCSV(csv, fieldName);
  }

  private getSingleFrequencyCSV(
    results: ResultDocument[],
    fieldName: string,
  ): string {
    const header = `${fieldName},count`;
    const rows = results.map(({ [fieldName]: fieldValue, count }) => {
      return `${this.escapeCsvField(fieldValue)},${count}`;
    });
    return [header, ...rows].join("\n");
  }

  private getPartsPipeline() {
    const labels = ["male", "female", "other"];
    const toKey = (label: string) => `${label}Parts`;
    const toCapitalized = (label: string) =>
      label.charAt(0).toUpperCase() + label.slice(1);

    const input = labels.map((label) => {
      return { type: label, text: `$partsText${toCapitalized(label)}` };
    });

    const groupings = labels.reduce(
      (acc, label) => {
        const key = toKey(label);
        const condition = { $eq: ["$parts.type", label] };
        acc[key] = { $sum: { $cond: [condition, 1, 0] } };
        return acc;
      },
      {} as Record<string, unknown>,
    );

    const projections = labels.reduce(
      (acc, label) => {
        const key = toKey(label);
        acc[key] = 1;
        return acc;
      },
      {} as Record<string, unknown>,
    );

    return [
      // Reshape each document into an array of {type, text} objects
      {
        $project: {
          parts: {
            $filter: {
              input,
              as: "part",
              cond: {
                $and: [
                  { $ne: ["$$part.text", null] },
                  { $ne: ["$$part.text", ""] },
                ],
              },
            },
          },
        },
      },

      // Flatten the array
      { $unwind: "$parts" },

      // Group by text, counting total and per-type occurrences
      { $group: { _id: "$parts.text", frequency: { $sum: 1 }, ...groupings } },

      // Sort by total frequency descending
      { $sort: { frequency: -1 } },

      // Clean up the output
      { $project: { _id: 0, text: "$_id", frequency: 1, ...projections } },
    ];
  }

  private async writeToCSV(csv: string, fieldName: string): Promise<void> {
    const outputDir = path.resolve("analysis");
    const filePath = path.join(outputDir, `${fieldName}-frequencies.csv`);

    try {
      await fs.mkdir(outputDir, { recursive: true });
      await fs.writeFile(filePath, csv, "utf8");
    } catch (error) {
      console.error(`Error writing CSV for ${fieldName} frequencies:`, error);
      throw error;
    }

    this.writtenFiles.push(filePath);
  }

  private escapeCsvField(value: string): string {
    return `"${value.replace(/"/g, '""')}"`;
  }
}

async function main() {
  try {
    const dbService = new DatabaseService();
    const orchestrator = new AnalyzeOrchestrator({ dbService });
    await orchestrator.run();
  } catch (error) {
    console.error("Fatal error during analysis:", error);
  }
}

main().catch(console.error);
