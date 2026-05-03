import AnalyzeOrchestrator from "./AnalyzeOrchestrator";

import DatabaseService from "#/core/DatabaseService";

async function main() {
  try {
    const dbService = new DatabaseService();
    const orchestrator = new AnalyzeOrchestrator({ dbService });
    await orchestrator.run();
  } catch (error) {
    console.error("Fatal error during analysis:", error);
  }
}

main().catch(console.error);
