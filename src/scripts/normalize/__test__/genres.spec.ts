import { promises as fs } from "fs";
import os from "os";
import path from "path";

import { describe, expect, it, beforeAll, afterAll, beforeEach, afterEach } from "@jest/globals";
import { ObjectId } from "mongodb";
import { MongoMemoryServer } from "mongodb-memory-server";

import { runGenreNormalization } from "../genres";

import DatabaseService from "#/core/DatabaseService";

describe("scripts/normalize/genres", () => {
  let dbService: DatabaseService;
  let mongoServer: MongoMemoryServer;
  let mongoUri: string;
  let reviewQueueDir: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    mongoUri = mongoServer.getUri();
  });

  beforeEach(async () => {
    dbService = new DatabaseService(mongoUri, "test-db");
    await dbService.initDatabase();
    reviewQueueDir = await fs.mkdtemp(path.join(os.tmpdir(), "genre-review-"));
  });

  afterEach(async () => {
    await dbService.resetDatabase();
    await dbService.close();
    await fs.rm(reviewQueueDir, { recursive: true, force: true });
  });

  afterAll(async () => {
    await mongoServer.stop();
  });

  const now = new Date();
  const metadata = { createdAt: now, updatedAt: now, scrapedAt: now, sourceUrl: "http://example.com" };

  async function seedPlay(playId: string, rawGenres: string | undefined) {
    const db = await dbService.connect();
    const id = new ObjectId();

    await db.collection("play_archives").insertOne({
      _id: id,
      _type: "play",
      playId,
      title: "Test Play",
      ...(rawGenres !== undefined ? { genres: rawGenres } : {}),
    });
    await db.collection("plays").insertOne({
      _id: id,
      playId,
      title: "Test Play",
      author: "Test Author",
      displayAuthor: "Test Author",
      isAdaptation: false,
      metadata,
    });

    return id;
  }

  describe("#runGenreNormalization", () => {
    it("derives tags and duration from the archived genre string and writes them to the play document", async () => {
      const id = await seedPlay("1", "comedy drama, 1h 30m");

      const summary = await runGenreNormalization({ dbService, reviewQueueDir });

      expect(summary).toMatchObject({ processed: 1, updated: 1, missingPlayDocument: 0 });

      const db = await dbService.connect();
      const updatedPlay = await db.collection("plays").findOne({ _id: id });
      expect(updatedPlay?.genreTags).toEqual({ genre: ["comedy", "drama"] });
      expect(updatedPlay?.duration).toEqual([1, 30, 0]);

      const archiveDoc = await db.collection("play_archives").findOne({ _id: id });
      expect(archiveDoc?.genres).toBe("comedy drama, 1h 30m");
    });

    it("does not modify the archive document", async () => {
      const id = await seedPlay("2", "one act, typescript");
      await runGenreNormalization({ dbService, reviewQueueDir });

      const db = await dbService.connect();
      const archiveDoc = await db.collection("play_archives").findOne({ _id: id });
      expect(archiveDoc?.genres).toBe("one act, typescript");
    });

    it("writes unmatched residue to a review-queue file", async () => {
      await seedPlay("3", "typescript, jaime hayes");
      const summary = await runGenreNormalization({ dbService, reviewQueueDir });

      expect(summary.reviewFilePath).toBeDefined();
      expect(summary.residueEntries).toEqual([{ playId: "3", residue: ["typescript", "jaime hayes"] }]);

      if (!summary.reviewFilePath) throw new Error("expected reviewFilePath to be set");
      const written = JSON.parse(await fs.readFile(summary.reviewFilePath, "utf8")) as {
        residueEntries: typeof summary.residueEntries;
      };
      expect(written.residueEntries).toEqual(summary.residueEntries);
    });

    it("in dry-run mode, reports what would change without writing to the database", async () => {
      const id = await seedPlay("4", "comedy");
      const summary = await runGenreNormalization({ dbService, dryRun: true, reviewQueueDir });

      expect(summary).toMatchObject({ processed: 1, updated: 1 });

      const db = await dbService.connect();
      const updatedPlay = await db.collection("plays").findOne({ _id: id });
      expect(updatedPlay?.genreTags).toBeUndefined();
    });

    it("limits processing to the given ids", async () => {
      const idA = await seedPlay("5", "comedy");
      await seedPlay("6", "drama");

      const summary = await runGenreNormalization({ dbService, ids: [idA.toHexString()], reviewQueueDir });

      expect(summary.processed).toBe(1);
      const db = await dbService.connect();
      const untouched = await db.collection("plays").findOne({ playId: "6" });
      expect(untouched?.genreTags).toBeUndefined();
    });

    it("is idempotent - re-running produces the same result", async () => {
      const id = await seedPlay("7", "comedy drama");
      await runGenreNormalization({ dbService, reviewQueueDir });
      const summary = await runGenreNormalization({ dbService, reviewQueueDir });

      expect(summary).toMatchObject({ processed: 1, updated: 1, missingPlayDocument: 0 });
      const db = await dbService.connect();
      const play = await db.collection("plays").findOne({ _id: id });
      expect(play?.genreTags).toEqual({ genre: ["comedy", "drama"] });
    });
  });
});
