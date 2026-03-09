import { MongoClient } from "mongodb";

import type { Db, Collection, CreateIndexesOptions } from "mongodb";

import getConfig from "#/core/Config";
import authorSchema from "#/db-types/author/author.schema";
import playSchema from "#/db-types/play/play.schema";

const COLLECTIONS = [
  { name: "plays", $jsonSchema: playSchema },
  { name: "authors", $jsonSchema: authorSchema },
] as const;

type CollectionName = (typeof COLLECTIONS)[number]["name"];

type IndexSpec = Record<string, 1 | -1>;

/** TODO: Update with proper indexes and move to db-types directory */

type IndexInfo = { field: string; options?: CreateIndexesOptions };
const indexesByCollection = {
  plays: [{ field: "playId", options: { unique: true } }],
  authors: [], // Authors use _id as primary key, no additional indexes needed
} as const satisfies Record<CollectionName, IndexInfo[]>;

type IndexCollectionName = keyof typeof indexesByCollection;

export default class DatabaseService {
  private client: MongoClient | null = null;
  private db: Db | null = null;

  constructor(
    private mongoUri: string = getConfig().mongoUri,
    private dbName: string = getConfig().dbName,
  ) {
    if (!this.mongoUri || !this.dbName) {
      throw new Error("MongoDB URI and database name are required");
    }
  }

  async connect(): Promise<Db> {
    if (this.db) {
      return this.db;
    }

    try {
      this.client = new MongoClient(this.mongoUri);
      await this.client.connect();
      this.db = this.client.db(this.dbName);
      console.info("✅ - Connected to MongoDB");
      return this.db;
    } catch (error) {
      console.error("❌ - Failed to connect to MongoDB:", error);
      throw error;
    }
  }

  public async getCollection(name: CollectionName): Promise<Collection> {
    const database = await this.connect();
    return database.collection(name);
  }

  public async isConnected(): Promise<boolean> {
    if (!this.client || !this.db) {
      return false;
    }

    try {
      await this.client.db("admin").admin().ping();
      return true;
    } catch {
      return false;
    }
  }

  public async close(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      console.info("✅ - Disconnected from MongoDB");
    }
  }

  public async resetDatabase(): Promise<void> {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Database reset is not allowed in production environment");
    }

    const database = await this.connect();
    try {
      await database.dropDatabase();
      console.info("✅ - Database reset complete");
    } catch (error) {
      console.error("❌ - Database reset failed:", error);
      throw error;
    }
  }

  private async createCollections(): Promise<void> {
    const database = await this.connect();
    console.info("⏳ Creating collections:");

    for (const { name } of COLLECTIONS) {
      const exists = await database.listCollections({ name }).hasNext();
      if (exists) {
        console.info(`   - Collection '${name}' already exists`);
        continue;
      }

      /** TODO: Update to strict once data is production-ready */
      await database.createCollection(name);
      console.info(`   - Collection '${name}' created successfully`);
    }
    console.info("✅ Collection creation complete");
  }

  private async createIndexes(): Promise<void> {
    const database = await this.connect();
    console.info("⏳ Creating indexes:");

    for (const collectionName of Object.keys(indexesByCollection)) {
      const collection = database.collection(collectionName);
      const indexes = indexesByCollection[collectionName as IndexCollectionName];
      for (const index of indexes) {
        try {
          const indexSpec: IndexSpec = { [index.field]: 1 }; // ascending index
          await collection.createIndex(indexSpec, index.options);
          console.info(`   - Created index on '${collectionName}.${index.field}'`);
        } catch (error) {
          const message = `Failed to create index on '${collectionName}.${index.field}'`;
          console.error(`❌ - ${message}`);
          throw new Error(message, { cause: error });
        }
      }
    }
    console.info("✅ - Index creation complete");
  }

  public async initDatabase(): Promise<void> {
    console.info("⏳ - Initializing database...");
    await this.connect();
    console.info("--------------------------------");
    await this.createCollections();
    console.info("--------------------------------");
    await this.createIndexes();
    console.info("--------------------------------");
    console.info("✅ - Database initialization complete");
  }
}
