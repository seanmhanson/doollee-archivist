import config from "#/core/Config";
import ModuleWriter from "#/core/ModuleWriter";
import WebScraper from "#/core/WebScraper";
import listingUrls from "#/input/listingUrls";
import ListingPage from "#/page-models/ListingPage";

async function main() {
  const noop = () => {
    /* intentionally empty for local testing only */
  };
  console.debug = noop;

  const rootDir = "profile-urls";
  const scraper = await WebScraper.create();

  const allMetadata: Record<string, unknown> = {};
  let totalFiles = 0;
  let totalPlaywrights = 0;

  const rootModuleWriter = await ModuleWriter.create(rootDir);
  for (const [letter, subsections] of Object.entries(listingUrls)) {
    const path = `${rootDir}/${letter.toUpperCase()}`;
    const moduleWriter = await ModuleWriter.create(path);

    console.log(`🔄 Scraping playwrights for letter ${letter}...`);
    for (const [letterRange, url] of Object.entries(subsections)) {
      let filenameSuffix = "";
      console.log(`   ➡️  Scraping playwright profile urls for range ${letterRange}...`);

      const listingPage = new ListingPage(scraper.getPage(), { url });
      await listingPage.goto();
      const rateLimitTimeout = new Promise((resolve) => setTimeout(resolve, config.rateLimitDelay));

      try {
        await listingPage.extractPage();
      } catch (error) {
        console.error(`  ⚠️ Error scraping page for url ${url}:`, error);
        filenameSuffix = "_error";
      }

      const playwrightCount = Object.keys(listingPage.data).length;

      const metadata = {
        ...listingPage.metadata,
        results: playwrightCount,
        timeStamp: new Date().toISOString(),
        url,
      };
      const filename = `${letterRange}${filenameSuffix}.ts`;
      const data = {
        metadata,
        playwrights: listingPage.data || {},
      };

      try {
        await moduleWriter.writeFile({
          filename,
          data,
          stringify: true,
          fileType: "ts",
        });
      } catch (error) {
        console.error(`  ❌ Error writing data to file ${filename}:`, error);
      }

      totalFiles += 1;
      totalPlaywrights += playwrightCount;

      // Collect metadata from all pages (including 404s, extraction errors, etc.)
      if (Object.keys(listingPage.metadata).length > 0) {
        allMetadata[letterRange] = {
          url,
          ...listingPage.metadata,
        };
      }

      await rateLimitTimeout;
    }
    await moduleWriter.close(true, true);
  }

  // Write consolidated metadata file
  if (Object.keys(allMetadata).length > 0) {
    try {
      const metadataFilename = "__metadata";
      await rootModuleWriter.writeFile({
        filename: "__metadata.ts",
        data: allMetadata,
        fileType: "ts",
        stringify: true,
      });
      console.log(`📊 Metadata written to: ${rootDir}/${metadataFilename}`);
    } catch (error) {
      console.error("❌ Error writing metadata file:", error);
    }
    await rootModuleWriter.close(false, true);
  }

  await scraper.close();

  console.log("--------------------------------");
  console.log("🎭 All playwright directories processed successfully!");
  console.log("  📁 Total files written:\t", totalFiles);
  console.log("  👤 Total playwrights scraped:\t", totalPlaywrights);
  console.log("   ⚠️ Total errors encountered:\t", Object.keys(allMetadata).length);
  console.log("--------------------------------");
}

main().catch(console.error);
