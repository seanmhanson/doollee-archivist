import type { Services as OrchestratorServices } from "#/scripts/scrape/ScrapingOrchestrator/ScrapingOrchestrator";

import { getConfig } from "#/core/Config";
import DatabaseService from "#/core/DatabaseService";
import ModuleWriter from "#/core/ModuleWriter";
import WebScraper from "#/core/WebScraper";
import ProgressDisplay from "#/scripts/scrape/ProgressDisplay/ProgressDisplay";
import { createErrorLogPayload } from "#/scripts/scrape/ScrapingErrors";
import ScrapingOrchestrator from "#/scripts/scrape/ScrapingOrchestrator";

type Services = Partial<{
  dbService: DatabaseService;
  scraper: WebScraper;
  progressDisplay: ProgressDisplay;
  authorModuleWriter: ModuleWriter;
  playModuleWriter: ModuleWriter;
}>;

async function initServices(): Promise<Services> {
  const services: Services = {};
  services.dbService = new DatabaseService();
  services.scraper = await WebScraper.create();
  services.progressDisplay = new ProgressDisplay();

  const useModuleWriter = getConfig()?.writeTo === "file";
  if (useModuleWriter) {
    const timestamp = new Date().toTimeString().slice(0, 8).replace(/:/g, "");
    services.authorModuleWriter = await ModuleWriter.create(`${timestamp}-authors`);
    services.playModuleWriter = await ModuleWriter.create(`${timestamp}-plays`);
  }

  return services;
}

async function closeServices(services: Services = {}) {
  const { progressDisplay } = services;

  // close the progress display first to resume normal console output before closing other services
  if (progressDisplay?.isReady) {
    progressDisplay.close();
  }

  return await Promise.all(
    Object.values(services).map(async (service) => {
      // handle null or undefined services gracefully
      if (!service) {
        return;
      }

      // typecheck to ensure the service has a close method before calling it
      if (typeof (service as { close?: unknown }).close !== "function") {
        return;
      }

      if (service instanceof ModuleWriter && !service.isReady) {
        return;
      }

      if ((service instanceof WebScraper || service instanceof DatabaseService) && !service.isConnected()) {
        return;
      }

      try {
        await service.close();
      } catch (error) {
        console.error("Error closing service:", JSON.stringify(createErrorLogPayload(error)));
      }
    }),
  );
}

async function main() {
  let services: Services = {};

  try {
    try {
      services = await initServices();
    } catch (error) {
      console.error("Fatal error during service initialization:", JSON.stringify(createErrorLogPayload(error)));
      throw error;
    }

    try {
      const orchestrator = new ScrapingOrchestrator(services as OrchestratorServices);
      await orchestrator.run();
      console.log("Scraping completed successfully.");
    } catch (error) {
      console.error("Fatal error during scraping:", JSON.stringify(createErrorLogPayload(error)));
      throw error;
    }
  } catch {
    process.exitCode = 1;
  } finally {
    await closeServices(services);
  }
}

main().catch((error) => {
  console.error("Unhandled fatal error during execution:", JSON.stringify(createErrorLogPayload(error)));
  process.exitCode = 1;
});
