import { promises as fs } from "fs";
import path from "path";

<<<<<<< HEAD
=======
import { Parser } from "@json2csv/plainjs";
import { flatten } from "@json2csv/transforms";

import {
  getSingleFrequencyPipeline,
  getPartsFrequencyPipeline,
  getSamplePipeline,
  getDateFormatPipeline,
  getFieldPresencePipeline,
  getProdPubDataPipeline,
} from "./aggregation-utils";

>>>>>>> eslint
import type { Collection, Document } from "mongodb";

import DatabaseService from "#/core/DatabaseService";
import { SetupError } from "#/scripts/main/ScrapingError";

type Services = {
  dbService: DatabaseService;
};

type SampleProps = {
  collection: Collection<Document>;
  sampleSize?: number;
};

type SingleFrequencyProps = {
  collection: Collection<Document>;
  fieldName: string;
  sortByField?: boolean;
  sortDescending?: boolean;
};

type ResultDocument = Record<string, string> & { count: number };

<<<<<<< HEAD
=======
type DateFormatResultItem = { value: string; frequency: number };

type DateFormatResults = {
  fourDigitYear: DateFormatResultItem[];
  dayMonthAbbrevYear: DateFormatResultItem[];
  dayMonthFullYear: DateFormatResultItem[];
  other: DateFormatResultItem[];
};

>>>>>>> eslint
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
    this.authorsCollection = await this.services.dbService.getCollection("authors");
  }

  public async run() {
    await this.connect();

    // await this.analyzeGenres();
    // await this.analyzePublishers();
    // await this.analyzeParts();
    // await this.analyzePublicationDates();
    // await this.analyzeProductionDates();
    // await this.analyzePlaysFieldPresence();
    // await this.analyzeAuthorsFieldPresence();
    // await this.getSamplePlays();
    // await this.getSampleAuthors();

<<<<<<< HEAD
=======
    await this.getPublicationProductionInfoCSV();

>>>>>>> eslint
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
    const pipeline = getPartsFrequencyPipeline();

    const collection = this.getPlaysCollection();
    const results = (await collection.aggregate(pipeline).toArray()) as ResultDocument[];

    const csv = [
      "All,Frequency,MaleParts,FemaleParts,OtherParts",
      ...results.map(
        ({ text, frequency, maleParts, femaleParts, otherParts }) =>
          `${this.escapeCsvField(text)},${frequency},${maleParts},${femaleParts},${otherParts}`,
      ),
    ].join("\n");
    const fileName = "frequencies-parts";
    await this.writeToCSV(csv, fileName);
  }

  private async analyzePublicationDates() {
    await this.analyzeDateFormats("publicationYear");
  }

  private async analyzeProductionDates() {
    await this.analyzeDateFormats("productionYear");
  }

  private async analyzeDateFormats(fieldName: string) {
    const collection = this.getPlaysCollection();
    const pipeline = getDateFormatPipeline(fieldName);
    const results = (await collection.aggregate(pipeline).toArray())[0] as DateFormatResults;

    const csv = this.getDateFormatCSV(results);
    const fileName = `frequencies-${fieldName}`;
    await this.writeToCSV(csv, fileName);
  }

  private getDateFormatCSV(data: DateFormatResults): string {
    const categories = Object.keys(data) as (keyof DateFormatResults)[];
    const headers = categories.flatMap((key) => [`${key}_value`, `${key}_frequency`]);

    // iterate through the different categories at the same time and separate their
    // values and frequencies, leaving those without values blank.
    // We iterate up to the maximum size category to ensure we include all data, although
    // not all rows will have the same number of items for each format.
    const rows = [];
    const maxRowCount = Math.max(...categories.map((key) => data[key].length));
    for (let i = 0; i < maxRowCount; i++) {
      const row = categories.flatMap((key) => {
        const item = data[key][i];
        return item ? [this.escapeCsvField(item.value), String(item.frequency)] : ["", ""];
      });
      rows.push(row);
    }

    return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
  }

  private async analyzePlaysFieldPresence() {
    const fields = [
      "authorId",
      "adaptingAuthor",
      "genres",
      "notes",
      "synopsis",
      "organizations",
      "music",
      "reference",
      "publisher",
      "publicationYear",
      "isbn",
      "productionLocation",
      "productionYear",
      "partsCountMale",
      "partsCountFemale",
      "partsCountOther",
      "partsTextMale",
      "partsTextFemale",
      "partsTextOther",
      "metadata.needsReview",
    ];

    const collection = this.getPlaysCollection();
    const pipeline = getFieldPresencePipeline(fields);
    const result = (await collection.aggregate(pipeline).toArray())[0] as Record<string, number>;

    const csv = this.getFieldPresenceCSV(fields, result);
    const fileName = "field-presence-plays";
    await this.writeToCSV(csv, fileName);
  }

  private async analyzeAuthorsFieldPresence() {
    const fields = [
      "metadata.needsReview",
      "metadata.needsReviewReason",
      "metadata.needsReviewData",
      "displayName",
      "isOrganization",
      "lastName",
      "firstName",
      "middleNames",
      "suffixes",
      "yearBorn",
      "yearDied",
      "nationality",
      "email",
      "website",
      "literaryAgent",
      "biography",
      "research",
      "address",
      "telephone",
      "playIds",
      "adaptationIds",
      "doolleePlayIds",
    ];

    const collection = this.getAuthorsCollection();
    const pipeline = getFieldPresencePipeline(fields);
    const result = (await collection.aggregate(pipeline).toArray())[0] as Record<string, number>;

    const csv = this.getFieldPresenceCSV(fields, result);
    const fileName = "field-presence-authors";
    await this.writeToCSV(csv, fileName);
  }

  private async getPublicationProductionInfoCSV() {
    const collection = this.getPlaysCollection();
    const pipeline = getProdPubDataPipeline();
    const result = await collection.aggregate(pipeline).toArray();
    const fileName = "publication-production-info";
    await this.writeDocumentsToCSV(result, fileName);
  }

  private getFieldPresenceCSV(fields: string[], result: Record<string, number>): string {
    const total = result.total;
    const header = "FIELD,PRESENT,ABSENT";
    const sanitizeFieldName = (field: string) => field.replace(/\./g, "_");

    const rows = fields.map((field) => {
      const sanitized = sanitizeFieldName(field);
      const present = result[`${sanitized}_present`] || 0;
      const absent = total - present;
      return `${this.escapeCsvField(field)},${present},${absent}`;
    });

    return [header, ...rows].join("\n");
  }

  private async getSamplePlays() {
    await this.getSample({ collection: this.getPlaysCollection() });
  }

  private async getSampleAuthors() {
    await this.getSample({ collection: this.getAuthorsCollection() });
  }

  private async getSample({ collection, sampleSize = 10 }: SampleProps) {
    const count = await collection.countDocuments();
    const name = collection.collectionName;
    const meetsMinimumCount = count > 100;
    const meetsThreshold = (sampleSize / count) * 100 < 5;
    const meetsSampleSize = sampleSize <= count;
    const fileName = `sampling-${collection.collectionName}`;

    if (!meetsSampleSize) {
      console.warn(
        "The requested sample size exceeds the total number of documents in the collection.\n" +
          `The '${name}' collection has ${count} documents, but a sample size of ${sampleSize} was requested.\n` +
          `Falling back to retrieving all documents from the collection instead.`,
      );
      const results = await collection.find().toArray();
      await this.writeDocumentsToCSV(results, fileName);
      return;
    }

    if (!meetsMinimumCount) {
      console.error(
        "The $sample aggregation stage requires a collection have at least 100 documents.\n" +
          `The '${name}' collection has ${count} documents and cannot be randomly sampled.\n` +
          `Falling back to retrieving the top ${sampleSize} documents from the '${name}' collection instead.`,
      );
      const results = await collection.aggregate(getSamplePipeline({ sampleSize, randomSample: false })).toArray();
      await this.writeDocumentsToCSV(results, fileName);
      return;
    }

    if (!meetsThreshold) {
      console.warn(
        "The requested sample size exceeds the 5% limit for the $sample aggregation stage.\n" +
          `Falling back to retrieving the top ${sampleSize} documents from the '${name}' collection instead.\n` +
          "To retrieve a random sample, please choose a smaller sample size.",
      );

      const results = await collection.aggregate(getSamplePipeline({ sampleSize, randomSample: false })).toArray();
      await this.writeDocumentsToCSV(results, fileName);
      return;
    }

    const results = await collection.aggregate(getSamplePipeline({ sampleSize, randomSample: true })).toArray();
    await this.writeDocumentsToCSV(results, fileName);
    return;
  }

  private async getSingleFrequencyTable({
    collection,
    fieldName,
    sortByField = false,
    sortDescending = true,
  }: SingleFrequencyProps) {
<<<<<<< HEAD
    const pipeline = this.getSingleFrequencyPipeline(fieldName, sortByField, sortDescending);
=======
    const pipeline = getSingleFrequencyPipeline({ fieldName, sortByField, sortDescending });
>>>>>>> eslint
    const results = (await collection.aggregate(pipeline).toArray()) as ResultDocument[];
    const csv = this.getSingleFrequencyCSV(results, fieldName);
    const fileName = `frequencies-${fieldName}`;
    await this.writeToCSV(csv, fileName);
  }

  private getSingleFrequencyCSV(results: ResultDocument[], fieldName: string): string {
    const header = `${fieldName},count`;
    const rows = results.map(({ [fieldName]: fieldValue, count }) => {
      return `${this.escapeCsvField(fieldValue)},${count}`;
    });
    return [header, ...rows].join("\n");
  }

<<<<<<< HEAD
  private getPartsPipeline() {
    const labels = ["male", "female", "other"];
    const toKey = (label: string) => `${label}Parts`;
    const toCapitalized = (label: string) => label.charAt(0).toUpperCase() + label.slice(1);

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
                $and: [{ $ne: ["$$part.text", null] }, { $ne: ["$$part.text", ""] }],
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
=======
  private async writeToCSV(csv: string, fileName: string): Promise<void> {
>>>>>>> eslint
    const outputDir = path.resolve("analysis");
    const filePath = path.join(outputDir, `${fileName}.csv`);

    try {
      await fs.mkdir(outputDir, { recursive: true });
      await fs.writeFile(filePath, csv, "utf8");
    } catch (error) {
<<<<<<< HEAD
      const message = `Error writing CSV for ${fieldName} frequencies`;
=======
      const message = `Error writing CSV file ${fileName}`;
>>>>>>> eslint
      throw new Error(message, { cause: error });
    }

    this.writtenFiles.push(filePath);
  }

  private writeDocumentsToCSV(results: Document[], fileName: string) {
    const parser = new Parser({ transforms: [flatten()] });
    const csv = parser.parse(results);
    return this.writeToCSV(csv, fileName);
  }

  private escapeCsvField(value: string | null | undefined): string {
    const safeValue = value ?? "";
    return `"${safeValue.replace(/"/g, '""')}"`;
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
