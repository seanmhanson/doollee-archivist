import WebScraper from "../core/WebScraper";
import ModuleWriter from "../core/ModuleWriter";

import AuthorSubindexPage from "../page-models/AuthorSubindexPage";
import authorSubindexes from "../input/authorSubindexes";

async function main() {
  // for local only testing
  console.debug = () => {};

  const rootDir = "authors";
  const scraper = await WebScraper.create();

  const allMetadata: any = {};
  let totalFiles = 0;
  let totalAuthors = 0;

  const rootModuleWriter = await ModuleWriter.create(rootDir);
  for (const [letter, subsections] of Object.entries(authorSubindexes)) {
    const path = `${rootDir}/${letter.toUpperCase()}`;
    const moduleWriter = await ModuleWriter.create(path);

    console.log(`🔄 Scraping authors for letter ${letter}...`);
    for (const [letterRange, url] of Object.entries(subsections)) {
      let filenameSuffix = "";
      console.log(`   ➡️  Scraping authors for range ${letterRange}...`);

      const authorListPage = new AuthorSubindexPage(scraper.getPage(), { url });
      await authorListPage.goto();
      const rateLimitTimeout = new Promise((resolve) =>
        setTimeout(resolve, 3000)
      );

      try {
        await authorListPage.extractPage();
      } catch (error) {
        console.error(`  ⚠️ Error scraping page for URL ${url}:`, error);
        filenameSuffix = "_error";
      }

      let numberOfAuthors = Object.keys(authorListPage.data).length;

      const metadata = {
        ...authorListPage.metadata,
        results: numberOfAuthors,
        timeStamp: new Date().toISOString(),
        url,
      };
      const filename = `${letterRange}${filenameSuffix}.ts`;
      const data = {
        metadata,
        authors: authorListPage.data || {},
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
      totalAuthors += numberOfAuthors;

      // Collect metadata from all pages (including 404s, extraction errors, etc.)
      if (Object.keys(authorListPage.metadata).length > 0) {
        allMetadata[letterRange] = {
          url: url,
          ...authorListPage.metadata,
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
  console.log("🎭 All author directories processed successfully!");
  console.log("  📁 Total files written:\t", totalFiles);
  console.log("  👤 Total authors scraped:\t", totalAuthors);
  console.log(
    "   ⚠️ Total errors encountered:\t",
    Object.keys(allMetadata).length
  );
  console.log("--------------------------------");
}

main().catch(console.error);
