import { Db, MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";
const DB_NAME = process.env.DB_NAME || "doollee-archive";
const COLLECTIONS = [{ name: "plays" }, { name: "authors" }];

async function connectToDatabase(client: MongoClient): Promise<Db> {
  try {
    await client.connect();
    console.info("✅ - Connected to MongoDB");
  } catch (error) {
    console.error("❌ - Failed to connect to MongoDB:", error);
    process.exit(1);
  }
  return client.db(DB_NAME);
}

async function createCollections(db: Db): Promise<void> {
  for (const { name } of COLLECTIONS) {
    try {
      const exists = await db.listCollections({ name }).hasNext();
      if (exists) {
        console.info(`ℹ️ - Collection '${name}' already exists`);
        return;
      }

      await db.createCollection(name);

      // await db.createCollection(name, {
      //   validator: { $jsonSchema },
      //   validationLevel: "strict",
      //   validationAction: "error",
      // });
      console.info(`✅ - Collection '${name}' created successfully`);
    } catch (error) {
      console.error(`❌ - Error checking collection '${name}':`, error);
      process.exit(1);
    }
  }
}

async function createIndexes(db: Db): Promise<void> {
  try {
    // Example indexes
    // await db.collection('plays').createIndex({ title: 1 }, { unique: true });
    // await db.collection('authors').createIndex({ lastName: 1, firstName: 1 });
    console.info("✅ - Indexes created successfully");
  } catch (error) {
    console.error("❌ - Index creation failed:", error);
    process.exit(1);
  }
}

async function initDatabase() {
  const client = new MongoClient(MONGO_URI);
  const db = await connectToDatabase(client);
  await createCollections(db);
  await createIndexes(db);
  await client.close();
  console.info("✅ - Database initialization complete");
}

initDatabase();
