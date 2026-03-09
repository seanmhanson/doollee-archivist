import { getConfig } from "#/core/Config";
import DatabaseService from "#/core/DatabaseService";

async function main() {
  const { mongoUri, dbName } = getConfig();
  const dbService = new DatabaseService(mongoUri, dbName);
  await dbService.resetDatabase();
  await dbService.close();
  process.exit(0);
}

main().catch((error) => {
  console.error("Failed to reset database:", error);
  process.exit(1);
});
