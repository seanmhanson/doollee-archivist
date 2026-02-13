import config from "#/core/Config";
import DatabaseService from "#/core/DatabaseService";
import ModuleWriter from "#/core/ModuleWriter";
import WebScraper from "#/core/WebScraper";
import ProgressDisplay from "#/scripts/main/ProgressDisplay";
import ScrapingOrchestrator from "#/scripts/main/ScrapingOrchestrator";

async function main() {
  const timestamp = new Date().toTimeString().slice(0, 8).replace(/:/g, "");

  try {
    // Initialize services
    const dbService = new DatabaseService();
    const scraper = await WebScraper.create();
    const progressDisplay = new ProgressDisplay();

    // Only create ModuleWriters if writing to files
    const authorModuleWriter = config.writeTo === "file" ? await ModuleWriter.create(`${timestamp}-authors`) : null;
    const playModuleWriter = config.writeTo === "file" ? await ModuleWriter.create(`${timestamp}-plays`) : null;

    // Create services object for orchestrator
    const services = {
      dbService,
      scraper,
      authorModuleWriter,
      playModuleWriter,
      progressDisplay,
    };

    // Create and run orchestrator
    const orchestrator = new ScrapingOrchestrator(services);
    await orchestrator.run();

    console.log("Scraping completed successfully");
  } catch (error) {
    console.error("Fatal error during scraping:", error);
  }
}

main().catch(console.error);
