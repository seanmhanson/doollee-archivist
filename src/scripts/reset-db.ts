import { Db, MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";
const DB_NAME = process.env.DB_NAME || "doollee-archive";

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

async function resetDatabase() {
  const client = new MongoClient(MONGO_URI);
  const db = await connectToDatabase(client);

  try {
    await db.dropDatabase();
    console.log("✅ - Database Reset Complete");
  } catch (error) {
    console.error("❌ - Failed to reset database:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

resetDatabase();
