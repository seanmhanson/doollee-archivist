import WebScraper from "../core/WebScraper";
import ModuleWriter from "../core/ModuleWriter";
import AuthorPage from "../page-models/AuthorPage";
import authorFixtures from "../input/authorLists";

function constructUrl([authorName, authorSlug]: [string, string]): string {
  const firstLetter = authorSlug.charAt(0).toUpperCase();
  return `https://www.doollee.com/Playwrights${firstLetter}/${authorSlug}.php`;
}

async function main() {
  // for local only testing
  console.debug = () => {};

  const authorDir = "authors";
  const playDir = "plays";
  const scraper = await WebScraper.create();

  // const allMetadata: any = {};
  // let totalFiles = 0;
  // let totalAuthors = 0;
  // let totalPlays = 0;

  const authorModuleWriter = await ModuleWriter.create(authorDir);
  const playModuleWriter = await ModuleWriter.create(playDir);

  console.log(
    "[TESTING] - Fixture Length: ",
    Object.keys(authorFixtures).length
  );

  for (const [authorName, authorSlug] of Object.entries(authorFixtures)) {
    const url = constructUrl([authorName, authorSlug]);
    console.log(
      `🔄 Scraping author page for ${authorName}, author slug ${authorSlug}...`
    );
    const authorPage = new AuthorPage(scraper.getPage(), { url });
    await authorPage.goto();
    await authorPage.extractPage();
    const authorData = authorPage.authorData;
    const playsData = authorPage.playsData;
    console.log("[TESTING] - Data extracted");

    // write author
    const authorFilename = `${authorSlug}.ts`;
    const authorFileData = {
      metadata: {
        timeStamp: new Date().toISOString(),
        url,
      },
      data: {
        authorData,
      },
    };
    await authorModuleWriter.writeFile({
      filename: authorFilename,
      data: authorFileData,
      stringify: true,
      fileType: "ts",
    });
    console.log("[TESTING] - Author file written");

    // write plays
    for (const playData of playsData) {
      const playId = playData.playId || "000000";
      const truncatedName = playData.title
        .substring(0, 12)
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9\-]/g, "");
      const playFilename = `${playId}-${truncatedName}.json`;

      console.log(`[TESTING] - Writing play file: ${playFilename}`);

      const playFileData = {
        metadata: {
          timeStamp: new Date().toISOString(),
          url,
        },
        data: {
          playData,
        },
      };
      await playModuleWriter.writeFile({
        filename: playFilename,
        data: playFileData,
        stringify: true,
        fileType: "json",
      });
      console.log("[TESTING] - Play file written");
    }
  }
  await playModuleWriter.close();
  await authorModuleWriter.close();
}

main().catch(console.error);
