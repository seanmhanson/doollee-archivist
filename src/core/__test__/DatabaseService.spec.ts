import { describe, expect, it, beforeAll, afterAll, beforeEach, afterEach } from "@jest/globals";
import { Db } from "mongodb";
import { MongoMemoryServer } from "mongodb-memory-server";

import DatabaseService from "../DatabaseService";

describe("core/DatabaseService", () => {
  let dbService: DatabaseService;
  let mongoServer: MongoMemoryServer;
  let mongoUri: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    mongoUri = mongoServer.getUri();
  });

  beforeEach(() => {
    dbService = new DatabaseService(mongoUri, "test-db");
  });

  afterEach(async () => {
    await dbService.resetDatabase();
    await dbService.close();
  });

  afterAll(async () => {
    await mongoServer.stop();
  });

  describe("when initialized", () => {
    it("does not immediately connect", async () => {
      const dbService = new DatabaseService();
      await expect(dbService.isConnected()).resolves.toBe(false);
    });

    it("throws an error if missing the required configuration values", () => {
      const expectedError = "MongoDB URI and database name are required";
      expect(() => new DatabaseService("uri", "")).toThrow(expectedError);
      expect(() => new DatabaseService("", "db")).toThrow(expectedError);
    });
  });

  describe("when manually calling to connect", () => {
    it("should connect to the database", async () => {
      await expect(dbService.connect()).resolves.toBeInstanceOf(Db);
    });

    it("should return the same db instance on subsequent calls", async () => {
      const db1 = await dbService.connect();
      const db2 = await dbService.connect();
      expect(db1).toBe(db2);
    });
  });

  describe("when initializing the database", () => {
    beforeEach(async () => {
      await dbService.initDatabase();
    });

    it("should connect to the database", async () => {
      await expect(dbService.isConnected()).resolves.toBe(true);
    });

    it("should create collections", async () => {
      const expectedCollections = ["plays", "authors"];
      const db = await dbService.connect();

      const collections = await db.listCollections().toArray();
      expect(collections.length).toEqual(expectedCollections.length);

      const collectionNames = collections.map((c) => c.name);
      for (const name of expectedCollections) {
        expect(collectionNames).toContain(name);
      }
    });

    it("should create indexes", async () => {
      const db = await dbService.connect();
      const playIndexes = await db.collection("plays").indexes();
      const playIdIndex = playIndexes.find((idx) => idx.key.playId === 1);
      expect(playIdIndex).toBeDefined();
      expect(playIdIndex?.unique).toBe(true);
    });

    it("should create collections with a $jsonSchema validator", async () => {
      const db = await dbService.connect();
      const collections = await db.listCollections().toArray();

      for (const info of collections) {
        const validator = info.options?.validator as Record<string, unknown> | undefined;
        expect(validator).toBeDefined();
        expect(validator!["$jsonSchema"]).toBeDefined();
      }
    });

    it("should reject writes that violate the collection schema", async () => {
      const db = await dbService.connect();
      // A document missing all required fields (playId, title, author, metadata, _archive)
      await expect(db.collection("plays").insertOne({ invalid: true })).rejects.toThrow();
    });
  });

  describe("when resetting the database", () => {
    beforeEach(async () => {
      await dbService.initDatabase();
    });

    it("should drop the database", async () => {
      await dbService.resetDatabase();
      const db = await dbService.connect();
      const collections = await db.listCollections().toArray();
      expect(collections.length).toBe(0);
    });

    it("should throw in production environment", async () => {
      const expectedError = "Database reset is not allowed in production environment";
      const testEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      await expect(dbService.resetDatabase()).rejects.toThrow(expectedError);
      process.env.NODE_ENV = testEnv;
    });
  });

  describe("when closing the connection", () => {
    beforeEach(async () => {
      await dbService.initDatabase();
      await dbService.close();
    });

    it("should close the client connection", async () => {
      await expect(dbService.isConnected()).resolves.toBe(false);
    });
  });

  describe("when verifying if connected", () => {
    let dbService: DatabaseService;

    beforeEach(() => {
      dbService = new DatabaseService(mongoUri, "test-connected");
    });

    afterEach(async () => {
      await dbService.close();
    });

    it("should return false when not connected", async () => {
      await expect(dbService.isConnected()).resolves.toBe(false);
    });

    it("should return true when connected", async () => {
      await dbService.connect();
      await expect(dbService.isConnected()).resolves.toBe(true);
    });
  });

  describe("when getting a collection", () => {
    let dbService: DatabaseService;

    beforeEach(() => {
      dbService = new DatabaseService(mongoUri, "test-collection");
    });

    afterEach(async () => {
      await dbService.close();
    });

    it("should connect if not already connected", async () => {
      await dbService.getCollection("plays");
      expect(await dbService.isConnected()).toBe(true);
    });

    it("should return the requested collection", async () => {
      await dbService.connect();
      const collection = await dbService.getCollection("authors");
      expect(collection.collectionName).toBe("authors");
    });
  });
});
