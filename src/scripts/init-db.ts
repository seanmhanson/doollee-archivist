import DatabaseService from "#/core/DatabaseService";
import config from "#/core/Config";

async function main() {
  const dbService = new DatabaseService(config.mongoUri, config.dbName);
  await dbService.initDatabase();
  await dbService.close();
  process.exit(0);
}

main();
