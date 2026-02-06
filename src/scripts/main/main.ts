import WebScraper from "#/core/WebScraper";
import ModuleWriter from "#/core/ModuleWriter";
import DatabaseService from "#/core/DatabaseService";
import ProgressDisplay from "#/scripts/main/ProgressDisplay";
import ScrapingOrchestrator from "#/scripts/main/ScrapingOrchestrator";

async function main() {
  const timestamp = new Date().toTimeString().slice(0, 8).replace(/:/g, "");

  try {
    // Initialize all required services
    const authorModuleWriter = await ModuleWriter.create(`${timestamp}-authors`);
    const playModuleWriter = await ModuleWriter.create(`${timestamp}-plays`);
    const dbService = new DatabaseService();
    const scraper = await WebScraper.create();
    const progressDisplay = new ProgressDisplay();

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
