import { promises as fs } from "fs";
import path from "path";

import { Parser } from "@json2csv/plainjs";
import { flatten } from "@json2csv/transforms";
import { BSONValue } from "bson";

import {
  getSingleFrequencyPipeline,
  getPartsFrequencyPipeline,
  getSamplePipeline,
  getDateFormatPipeline,
  getFieldPresencePipeline,
  getProdPubDataPipeline,
  getGenreTermsPipeline,
  getPublishingInfoFormatsPipeline,
  getBoilerplateFrequencyPipeline,
  getPlaysWithoutAuthorPipeline,
  getAuthorsWithPlayCountMismatchPipeline,
} from "./aggregation-utils";
import XlsxWorkbook from "./XlsxWorkbook";

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
  sheetName?: string;
  collectionName?: string;
};

type ResultDocument = Record<string, string> & { count: number };

type DateFormatResultItem = { value: string; frequency: number };

type DateFormatResults = {
  fourDigitYear: DateFormatResultItem[];
  dayMonthAbbrevYear: DateFormatResultItem[];
  dayMonthFullYear: DateFormatResultItem[];
  other: DateFormatResultItem[];
};

type GenreTermsResult = {
  terms: { term: string; variants: string[]; count: number }[];
  compoundStats: { compound: number; single: number }[];
};

type PublishingInfoResult = {
  formatCategories: { format: string; count: number }[];
  publisherNames: { publisher: string; count: number }[];
};

type BoilerplateRow = { value: string; count: number };

type IntegrityRow = {
  check: string;
  displayName: string | null;
  doolleeCount: number | null;
  playCount: number | null;
  count: number | null;
};

class AnalyzeOrchestrator {
  private services: Services;
  private playsCollection?: Collection<Document>;
  private authorsCollection?: Collection<Document>;
  private writtenFiles: string[] = [];
  private workbook = new XlsxWorkbook();

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

    // Field presence
    await this.analyzeAuthorsFieldPresence();
    await this.analyzePlaysFieldPresence();

    // Samples
    await this.getSampleAuthors();
    await this.getSamplePlays();
    await this.getPublicationProductionInfoCSV();

    // Frequencies
    await this.analyzeGenreTerms();
    await this.analyzeParts();
    await this.analyzeNationality();
    await this.analyzeProductionDates();
    await this.analyzePublicationDates();

    // Publishers (CSV only, no xlsx sheet)
    await this.analyzePublishers();

    // Publishing info
    await this.analyzePublishingInfoFormats();

    // Boilerplate
    await this.analyzeBoilerplate();

    // Referential integrity
    await this.analyzeReferentialIntegrity();

    // Write xlsx workbook
    const xlsxPath = path.resolve("analysis", "doollee-analysis.xlsx");
    await this.workbook.write(xlsxPath);
    this.writtenFiles.push(xlsxPath);

    await this.close();
  }

  private async close() {
    console.log("Analysis complete. Written files:");
    this.writtenFiles.forEach((file) => console.log(`- ${file}`));
    await this.services.dbService.close();
  }

  private async analyzeGenreTerms() {
    const pipeline = getGenreTermsPipeline();
    const collection = this.getPlaysCollection();
    const result = (await collection.aggregate(pipeline).toArray())[0] as GenreTermsResult;

    const { terms, compoundStats } = result;

    const termsCsv = [
      "term,variants,count",
      ...terms.map(
        ({ term, variants, count }) =>
          `${this.escapeCsvField(term)},${this.escapeCsvField(variants.join("|"))},${count}`,
      ),
    ].join("\n");
    await this.writeToCSV(termsCsv, "frequencies-genres");

    const termsXlsxRows = terms.map(({ term, variants, count }) => ({
      term,
      variants: variants.join("|"),
      count,
    }));
    this.workbook.addSheet("Frequencies \u2014 Genres", termsXlsxRows, termsXlsxRows.length, "plays", [
      "term",
      "variants",
      "count",
    ]);

    const stats = compoundStats[0] ?? { compound: 0, single: 0 };
    const statsCsv = `type,count\n"compound",${stats.compound}\n"single",${stats.single}`;
    await this.writeToCSV(statsCsv, "frequencies-genres-compound-stats");

    const statsXlsxRows = [
      { type: "compound", count: stats.compound },
      { type: "single", count: stats.single },
    ];
    this.workbook.addSheet("Genre \u2014 Compound Stats", statsXlsxRows, 2, "plays", ["type", "count"]);
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

    const xlsxRows = results.map(({ text, frequency, maleParts, femaleParts, otherParts }) => ({
      all: text,
      frequency,
      maleParts,
      femaleParts,
      otherParts,
    }));
    this.workbook.addSheet("Frequencies \u2014 Parts", xlsxRows, xlsxRows.length, "plays", [
      "all",
      "frequency",
      "maleParts",
      "femaleParts",
      "otherParts",
    ]);
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

    const sheetName =
      fieldName === "productionYear" ? "Frequencies \u2014 Production Year" : "Frequencies \u2014 Publication Year";
    const xlsxRows = this.getDateFormatRows(results);
    this.workbook.addSheet(sheetName, xlsxRows, xlsxRows.length, "plays", ["format", "value", "count"]);
  }

  private getDateFormatCSV(data: DateFormatResults): string {
    const header = "format,value,count";
    const rows: string[] = [];
    for (const category of Object.keys(data) as (keyof DateFormatResults)[]) {
      for (const { value, frequency } of data[category]) {
        rows.push(`${this.escapeCsvField(category)},${this.escapeCsvField(value)},${frequency}`);
      }
    }
    return [header, ...rows].join("\n");
  }

  private getDateFormatRows(data: DateFormatResults): { format: string; value: string; count: number }[] {
    const rows: { format: string; value: string; count: number }[] = [];
    for (const category of Object.keys(data) as (keyof DateFormatResults)[]) {
      for (const { value, frequency } of data[category]) {
        rows.push({ format: category, value, count: frequency });
      }
    }
    return rows;
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
    await this.writeToCSV(csv, "field-presence-plays");

    const sanitize = (f: string) => f.replace(/\./g, "_");
    const xlsxRows = fields.map((field) => ({
      field,
      present: result[`${sanitize(field)}_present`] || 0,
      absent: result.total - (result[`${sanitize(field)}_present`] || 0),
    }));
    this.workbook.addSheet("Field Presence \u2014 Plays", xlsxRows, xlsxRows.length, "plays", [
      "field",
      "present",
      "absent",
    ]);
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
    await this.writeToCSV(csv, "field-presence-authors");

    const sanitize = (f: string) => f.replace(/\./g, "_");
    const xlsxRows = fields.map((field) => ({
      field,
      present: result[`${sanitize(field)}_present`] || 0,
      absent: result.total - (result[`${sanitize(field)}_present`] || 0),
    }));
    this.workbook.addSheet("Field Presence \u2014 Authors", xlsxRows, xlsxRows.length, "authors", [
      "field",
      "present",
      "absent",
    ]);
  }

  private async getPublicationProductionInfoCSV() {
    const collection = this.getPlaysCollection();
    const pipeline = getProdPubDataPipeline();
    const result = await collection.aggregate(pipeline).toArray();
    await this.writeDocumentsToCSV(result, "publication-production-info");

    const xlsxRows = result.map((doc) => this.flattenForXlsx(doc));
    this.workbook.addSheet("Samples \u2014 Production Info", xlsxRows, xlsxRows.length, "plays");
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
    const sheetName = `Samples \u2014 ${name.charAt(0).toUpperCase() + name.slice(1)}`;

    const writeAndSheet = async (results: Document[]) => {
      await this.writeDocumentsToCSV(results, fileName);
      const xlsxRows = results.map((doc) => this.flattenForXlsx(doc));
      this.workbook.addSheet(sheetName, xlsxRows, xlsxRows.length, name);
    };

    if (!meetsSampleSize) {
      console.warn(
        "The requested sample size exceeds the total number of documents in the collection.\n" +
          `The '${name}' collection has ${count} documents, but a sample size of ${sampleSize} was requested.\n` +
          `Falling back to retrieving all documents from the collection instead.`,
      );
      const results = await collection.find().toArray();
      await writeAndSheet(results);
      return;
    }

    if (!meetsMinimumCount) {
      console.error(
        "The $sample aggregation stage requires a collection have at least 100 documents.\n" +
          `The '${name}' collection has ${count} documents and cannot be randomly sampled.\n` +
          `Falling back to retrieving the top ${sampleSize} documents from the '${name}' collection instead.`,
      );
      const results = await collection.aggregate(getSamplePipeline({ sampleSize, randomSample: false })).toArray();
      await writeAndSheet(results);
      return;
    }

    if (!meetsThreshold) {
      console.warn(
        "The requested sample size exceeds the 5% limit for the $sample aggregation stage.\n" +
          `Falling back to retrieving the top ${sampleSize} documents from the '${name}' collection instead.\n` +
          "To retrieve a random sample, please choose a smaller sample size.",
      );
      const results = await collection.aggregate(getSamplePipeline({ sampleSize, randomSample: false })).toArray();
      await writeAndSheet(results);
      return;
    }

    const results = await collection.aggregate(getSamplePipeline({ sampleSize, randomSample: true })).toArray();
    await writeAndSheet(results);
    return;
  }

  private async getSingleFrequencyTable({
    collection,
    fieldName,
    sortByField = false,
    sortDescending = true,
    sheetName,
    collectionName = "",
  }: SingleFrequencyProps) {
    const pipeline = getSingleFrequencyPipeline({ fieldName, sortByField, sortDescending });
    const results = (await collection.aggregate(pipeline).toArray()) as ResultDocument[];
    const csv = this.getSingleFrequencyCSV(results, fieldName);
    const fileName = `frequencies-${fieldName}`;
    await this.writeToCSV(csv, fileName);

    if (sheetName) {
      this.workbook.addSheet(sheetName, results, results.length, collectionName, [fieldName, "count"]);
    }
  }

  private getSingleFrequencyCSV(results: ResultDocument[], fieldName: string): string {
    const header = `${fieldName},count`;
    const rows = results.map(({ [fieldName]: fieldValue, count }) => {
      return `${this.escapeCsvField(fieldValue)},${count}`;
    });
    return [header, ...rows].join("\n");
  }

  private async writeToCSV(csv: string, fileName: string): Promise<void> {
    const outputDir = path.resolve("analysis");
    const filePath = path.join(outputDir, `${fileName}.csv`);

    try {
      await fs.mkdir(outputDir, { recursive: true });
      await fs.writeFile(filePath, csv, "utf8");
    } catch (error) {
      const message = `Error writing CSV file ${fileName}`;
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

  private flattenForXlsx(doc: Document): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    const recurse = (obj: Record<string, unknown>, prefix: string) => {
      for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;

        const isNullOrUndefined = value === null || value === undefined;
        const isPrimitive = typeof value !== "object";
        const isDate = value instanceof Date;
        if (isNullOrUndefined || isPrimitive || isDate) {
          result[fullKey] = value;
          continue;
        }

        const isArray = Array.isArray(value);
        if (isArray) {
          result[fullKey] = JSON.stringify(value);
          continue;
        }

        if (value instanceof BSONValue) {
          // BSONValue defines toString() as abstract and all BSON types implement it, so it will not use the default
          // Object.prototype.toString() method. However, typescript-eslint only recognizes the method as implemented
          // when asserting against specific BSON types, so we bypass the check here safely instead of implementing
          // numerous unnecessary type assertions.

          // eslint-disable-next-line @typescript-eslint/no-base-to-string
          result[fullKey] = String(value);
          continue;
        }

        const entries = Object.entries(value as Record<string, unknown>);
        const isEmptyObject = entries.length === 0;
        if (isEmptyObject) {
          result[fullKey] = JSON.stringify(value);
          continue;
        }

        recurse(value as Record<string, unknown>, fullKey);
      }
    };

    recurse(doc as Record<string, unknown>, "");
    return result;
  }

  private async analyzeNationality() {
    await this.getSingleFrequencyTable({
      collection: this.getAuthorsCollection(),
      fieldName: "nationality",
      sheetName: "Frequencies \u2014 Nationality",
      collectionName: "authors",
    });
  }

  private async analyzePublishingInfoFormats() {
    const pipeline = getPublishingInfoFormatsPipeline();
    const collection = this.getPlaysCollection();
    const result = (await collection.aggregate(pipeline).toArray())[0] as PublishingInfoResult;

    const { formatCategories, publisherNames } = result;

    const formatsCsv = [
      "format,count",
      ...formatCategories.map(({ format, count }) => `${this.escapeCsvField(format)},${count}`),
    ].join("\n");
    await this.writeToCSV(formatsCsv, "publishing-info-formats");
    this.workbook.addSheet("Publishing \u2014 Info Formats", formatCategories, formatCategories.length, "plays", [
      "format",
      "count",
    ]);

    const publishersCsv = [
      "publisher,count",
      ...publisherNames.map(({ publisher, count }) => `${this.escapeCsvField(publisher)},${count}`),
    ].join("\n");
    await this.writeToCSV(publishersCsv, "publishing-info-publishers");
    this.workbook.addSheet("Publishing \u2014 Publisher Names", publisherNames, publisherNames.length, "plays", [
      "publisher",
      "count",
    ]);
  }

  private async analyzeBoilerplate() {
    const authorFields = [
      {
        fieldName: "biography",
        sheetName: "Boilerplate \u2014 Author Biography",
        fileName: "boilerplate-author-biography",
      },
      {
        fieldName: "research",
        sheetName: "Boilerplate \u2014 Author Research",
        fileName: "boilerplate-author-research",
      },
    ];

    const playFields = [
      { fieldName: "notes", sheetName: "Boilerplate \u2014 Play Notes", fileName: "boilerplate-play-notes" },
      { fieldName: "synopsis", sheetName: "Boilerplate \u2014 Play Synopsis", fileName: "boilerplate-play-synopsis" },
      {
        fieldName: "organizations",
        sheetName: "Boilerplate \u2014 Play Orgs",
        fileName: "boilerplate-play-organizations",
      },
    ];

    for (const { fieldName, sheetName, fileName } of authorFields) {
      await this.runBoilerplateAnalysis({
        collection: this.getAuthorsCollection(),
        fieldName,
        sheetName,
        fileName,
        collectionName: "authors",
      });
    }

    for (const { fieldName, sheetName, fileName } of playFields) {
      await this.runBoilerplateAnalysis({
        collection: this.getPlaysCollection(),
        fieldName,
        sheetName,
        fileName,
        collectionName: "plays",
      });
    }
  }

  private async runBoilerplateAnalysis({
    collection,
    fieldName,
    sheetName,
    fileName,
    collectionName,
  }: {
    collection: Collection<Document>;
    fieldName: string;
    sheetName: string;
    fileName: string;
    collectionName: string;
  }) {
    const pipeline = getBoilerplateFrequencyPipeline(fieldName);
    const results = (await collection.aggregate(pipeline).toArray()) as BoilerplateRow[];

    const csv = ["value,count", ...results.map(({ value, count }) => `${this.escapeCsvField(value)},${count}`)].join(
      "\n",
    );
    await this.writeToCSV(csv, fileName);

    this.workbook.addSheet(sheetName, results as unknown as Record<string, unknown>[], results.length, collectionName, [
      "value",
      "count",
    ]);
  }

  private async analyzeReferentialIntegrity() {
    const playsCollection = this.getPlaysCollection();
    const authorsCollection = this.getAuthorsCollection();

    const playsWithoutAuthorResult = await playsCollection.aggregate(getPlaysWithoutAuthorPipeline()).toArray();
    const playsWithoutAuthorCount = (playsWithoutAuthorResult[0] as { count: number } | undefined)?.count ?? 0;

    const mismatchFilter = {
      $expr: {
        $ne: [{ $size: { $ifNull: ["$doolleePlayIds", []] } }, { $size: { $ifNull: ["$playIds", []] } }],
      },
    };
    const mismatchTotal = await authorsCollection.countDocuments(mismatchFilter);
    const mismatchSample = (await authorsCollection.aggregate(getAuthorsWithPlayCountMismatchPipeline()).toArray()) as {
      displayName: string;
      doolleeCount: number;
      playCount: number;
    }[];

    const rows: IntegrityRow[] = [
      {
        check: "plays_missing_author_id",
        displayName: null,
        doolleeCount: null,
        playCount: null,
        count: playsWithoutAuthorCount,
      },
      {
        check: "author_play_count_mismatch_total",
        displayName: null,
        doolleeCount: null,
        playCount: null,
        count: mismatchTotal,
      },
      ...mismatchSample.map(({ displayName, doolleeCount, playCount }) => ({
        check: "author_play_count_mismatch_sample",
        displayName,
        doolleeCount,
        playCount,
        count: null,
      })),
    ];

    const csv = [
      "check,displayName,doolleeCount,playCount,count",
      ...rows.map(({ check, displayName, doolleeCount, playCount, count }) =>
        [
          this.escapeCsvField(check),
          this.escapeCsvField(displayName),
          doolleeCount ?? "",
          playCount ?? "",
          count ?? "",
        ].join(","),
      ),
    ].join("\n");

    await this.writeToCSV(csv, "integrity-referential");
    this.workbook.addSheet(
      "Integrity \u2014 Referential",
      rows as unknown as Record<string, unknown>[],
      rows.length,
      "authors + plays",
      ["check", "displayName", "doolleeCount", "playCount", "count"],
    );
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
