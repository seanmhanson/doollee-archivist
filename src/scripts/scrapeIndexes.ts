import { promises as fs } from "fs";
import path from "path";

import WebScraper from "#/core/WebScraper";

/** page models */
import IndexPage from "#/page-models/IndexPage";

import type { IndexUrlsData } from "#/types";

async function main() {
  const data: IndexUrlsData = {};
  const scraper = await WebScraper.create();

  const uppercaseLetters: string[] = [];
  const firstLetter = `A`.charCodeAt(0);
  const lastLetter = `Z`.charCodeAt(0);
  for (let i = firstLetter; i <= lastLetter; i++) {
    uppercaseLetters.push(String.fromCharCode(i));
  }

  for (const letter of uppercaseLetters) {
    console.log(`🔄 Scraping letter ${letter}...`);
    const indexPage = new IndexPage(scraper.getPage(), { letter });

    try {
      await indexPage.goto();
      await indexPage.extractPage();
      console.log(`Successfully scraped data from: ${indexPage.url}`);
    } catch (error) {
      console.error(`Error scraping page for letter ${letter}:`, error);
    }

    // Always record the result; on an error, links will be empty and metadata may
    // contain error details for troubleshooting
    data[letter] = {
      url: indexPage.url,
      links: indexPage.data || {},
      metadata: indexPage.metadata,
    };

    // Rate limiting: 3 second delay to stay under 10 requests per 30 seconds
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  try {
    // Create output directory if it doesn't exist
    const outputDir = path.resolve("./output");
    await fs.mkdir(outputDir, { recursive: true });

    const filename = "indexUrls.json";
    const outputPath = path.join(outputDir, filename);

    // Write JSON to file
    await fs.writeFile(outputPath, JSON.stringify(data, null, 2), "utf8");
    console.log(`✅ Data saved to: ${outputPath}`);
  } catch (error) {
    console.error(`Error writing data to file:`, error);
    throw error;
  } finally {
    await scraper.close();
  }
}

main().catch(console.error);
