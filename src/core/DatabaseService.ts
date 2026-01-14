import dotenv from "dotenv";
import { MongoClient, Db, Collection } from "mongodb";
import type { CreateIndexesOptions } from "mongodb";

import authorSchema from "../db-types/author/author.schema";
import playSchema from "../db-types/play/play.schema";

dotenv.config();
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";
const DB_NAME = process.env.DB_NAME || "doollee-archive";

const COLLECTIONS = [
  { name: "plays", $jsonSchema: playSchema },
  { name: "authors", $jsonSchema: authorSchema },
] as const;

type CollectionName = (typeof COLLECTIONS)[number]["name"];

/** TODO: Update with proper indexes and move to db-types directory */

type IndexInfo = { field: string; options?: CreateIndexesOptions };
const indexesByCollection = {
  plays: [{ field: "playId", options: { unique: true } }],
  authors: [{ field: "authorId", options: { unique: true } }],
} as const satisfies Record<CollectionName, IndexInfo[]>;

type IndexCollectionName = keyof typeof indexesByCollection;

export default class DatabaseService {
  private client: MongoClient | null = null;
  private db: Db | null = null;

  constructor(private mongoUri: string = MONGO_URI, private dbName: string = DB_NAME) {
    if (!mongoUri || !dbName) {
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

  getDatabaseInfo() {
    const credentialPattern = /\/\/[^:]+:[^@]+@/;
    return {
      uri: this.mongoUri.replace(credentialPattern, "//***:***@"),
      dbName: this.dbName,
      isConnected: this.isConnected(),
    };
  }

  async getCollection(name: CollectionName): Promise<Collection> {
    const database = await this.connect();
    return database.collection(name);
  }

  async isConnected(): Promise<boolean> {
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

  async close(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      console.info("✅ - Disconnected from MongoDB");
    }
  }

  async resetCollections(): Promise<void> {
    const database = await this.connect();
    const existingCollections = await database.listCollections().toArray();
    for (const { name } of existingCollections) {
      await database.collection(name).drop();
      console.info(`🗑️  Dropped collection: ${name}`);
    }
    console.info("✅ - Collections reset complete");
  }

  async resetDatabase(): Promise<void> {
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

  async hasCollections(): Promise<boolean> {
    try {
      const database = await this.connect();
      const collections = await database.listCollections().toArray();
      const collectionNames = new Set(collections.map((c) => c.name));
      const expectedNames = new Set(COLLECTIONS.map((c) => c.name));

      const sameSize = collectionNames.size === expectedNames.size;
      const sameNames = [...expectedNames].every((name) => collectionNames.has(name));

      return sameSize && sameNames;
    } catch (error) {
      console.error("❌ - Database collections check failed:", error);
      throw error;
    }
  }

  async hasIndexes(): Promise<boolean> {
    try {
      for (const [collectionName, expectedIndexes] of Object.entries(indexesByCollection)) {
        const collection = await this.getCollection(collectionName as CollectionName);
        const indexes = await collection.listIndexes().toArray();

        for (const expectedIndex of expectedIndexes) {
          const exists = indexes.some((idx) => idx.key && expectedIndex.field in idx.key);

          if (!exists) {
            return false;
          }
        }
      }
      return true;
    } catch (error) {
      console.error("❌ - Database indexes check failed:", error);
      throw error;
    }
  }

  async isInitialized(): Promise<boolean> {
    try {
      const hasValidCollections = await this.hasCollections();
      const hasValidIndexes = await this.hasIndexes();
      return hasValidCollections && hasValidIndexes;
    } catch (error) {
      console.error("❌ - Database initialization check failed:", error);
      throw error;
    }
  }

  async createCollections(): Promise<void> {
    const database = await this.connect();

    for (const { name, $jsonSchema } of COLLECTIONS) {
      const exists = await database.listCollections({ name }).hasNext();
      if (exists) {
        console.info(`ℹ️ - Collection '${name}' already exists`);
        continue;
      }

      /** TODO: Update to strict once data is production-ready */
      await database.createCollection(name, {
        validator: { $jsonSchema },
        validationAction: "warn",
        validationLevel: "moderate",
      });
      console.info(`✅ - Collection '${name}' created successfully`);
    }
    console.info("✅ - Collection creation complete");
  }

  async createIndexes(): Promise<void> {
    const database = await this.connect();

    for (const collectionName of Object.keys(indexesByCollection)) {
      const collection = database.collection(collectionName);
      const indexes = indexesByCollection[collectionName as IndexCollectionName];
      for (const index of indexes) {
        try {
          const indexSpec: any = {};
          indexSpec[index.field] = 1; // Ascending index
          await collection.createIndex(indexSpec, index.options);
          console.info(`✅ - Created index on '${collectionName}.${index.field}'`);
        } catch (error: any) {
          const indexExistsError = error?.code === 85;
          if (indexExistsError) {
            console.info(`ℹ️ - Index '${collectionName}.${index.field}' already exists`);
          } else {
            console.error(`❌ - Failed to create index on '${collectionName}.${index.field}':`, error);
            throw error;
          }
        }
      }
    }

    console.info("✅ - Index creation complete");
  }

  async initDatabase(): Promise<void> {
    await this.createCollections();
    await this.createIndexes();
    console.info("✅ - Database initialization complete");
  }
}
