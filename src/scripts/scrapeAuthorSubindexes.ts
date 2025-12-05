import { promises as fs } from "fs";
import path from "path";
import WebScraper from "../core/WebScraper";

import AuthorSubindexPage from "../page-models/AuthorSubindexPage";
import authorSubindexes from "../../data/input/authorSubindexes";

async function main() {
  const scraper = await WebScraper.create();
  const allMetadata: any = {};
  let totalFiles = 0;
  let totalAuthors = 0;

  // manual override
  const urlsToScrape = { B: authorSubindexes.B };

  for (const [letter, subsections] of Object.entries(urlsToScrape)) {
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
      const filename = `${letterRange}${filenameSuffix}.json`;
      const data = {
        metadata,
        authors: authorListPage.data || {},
      };

      try {
        await writeDataToFile(filename, data);
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
  }

  // Write consolidated metadata file
  if (Object.keys(allMetadata).length > 0) {
    try {
      const metadataFilename = `__metadata.json`;
      await writeDataToFile(metadataFilename, allMetadata);
      console.log(`📊 Metadata written to: ${metadataFilename}`);
    } catch (error) {
      console.error("❌ Error writing metadata file:", error);
    }
  }

  console.log(" 🎭 All author directories processed successfully!");
  console.log("   📁 Total files written:\t", totalFiles);
  console.log("   👤 Total authors scraped:\t", totalAuthors);
  console.log(
    "   ⚠️ Total errors encountered:\t",
    Object.keys(allMetadata).length
  );

  await scraper.close();
}

async function writeDataToFile(filename: string, data: Record<string, any>) {
  const dirName = "./output/indexes";
  const outputDir = path.resolve(dirName);
  await fs.mkdir(outputDir, { recursive: true });

  // Change extension from .json to .ts
  const tsFilename = filename.replace(".json", ".ts");
  const outputPath = path.join(outputDir, tsFilename);

  // Generate TypeScript content
  const tsContent = `export default ${JSON.stringify(data, null, 2)};`;

  await fs.writeFile(outputPath, tsContent, "utf8");
}

// type IndexContent = {
//   imports: string[];
//   exports: string[];
// }

// async function writeIndexFile(filenames: string[]) {
//   const importPaths = filenames.map(filename => `./${filename}`);
//   const exportKeys = filenames.map(filename => filename.replace('.ts', ''));
//   const references = filenames.map(filename => filename.replace(/[-.]/g, "_"));

//   const statements = filenames.reduce((acc, filename): IndexContent => {
//     const importPath = `./${filename}`;
//     const exportKey = filename.replace('.ts', '');
//     const reference = exportKey.replace(/[-.]/g, "_");
//     acc.imports.push(`import ${reference} from '${importPath}';`);
//     acc.exports.push(`  '${exportKey}': ${reference},`);
//     return acc;
//   }, { imports: [], exports: [] });

//   const timestamp = new Date().toISOString();
//   const indexFileContent = `// index.ts - Auto-generated on ${timestamp}\n\n`
//     + statements.imports.join('\n') + '\n\n'
//     + 'export default {\n'
//     + statements.exports.join('\n') + '\n'
//     + '};\n';

//   await writeDataToFile('index.ts', indexFileContent);
// };

main().catch(console.error);
