import WebScraper from "#/core/WebScraper";
import ModuleWriter from "#/core/ModuleWriter";
import ProfilePage from "#/page-models/ProfilePage";
import Author from "#/db-types/author/Author.class";
import Play from "#/db-types/play/Play.class";
import type { ObjectId } from "mongodb";

const URL_PREFIX = "https://www.doollee.com/Playwrights";
const SAMPLE_INPUT = { "EURIPIDES ": "euripides" };

async function main() {
  console.debug = () => {};
  const timestamp = new Date().toTimeString().slice(0, 8).replace(/:/g, "");
  const authorDirectory = `${timestamp}-authors`;
  const playDirectory = `${timestamp}-plays`;

  const scraper = await WebScraper.create();
  const authorModuleWriter = await ModuleWriter.create(authorDirectory);
  const playModuleWriter = await ModuleWriter.create(playDirectory);

  async function scrapeProfile([profileName, profileSlug]: [string, string]) {
    console.log(`🔄 Scraping playwright page for ${profileName}, profile slug ${profileSlug}...`);
    const url = `${URL_PREFIX}${profileSlug.charAt(0).toUpperCase()}/${profileSlug}.php`;
    const profilePage = new ProfilePage(scraper.getPage(), { url });
    await profilePage.goto();
    await profilePage.extractPage();
    return profilePage;
  }

  function getPlayFilename(title: string, id: string): string {
    const playId = id.padStart(6, "0") || "0000000";
    const truncatedName = title
      .substring(0, 16)
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-]/g, "");
    return `${playId}-${truncatedName}.json`;
  }

  for (const [profileName, profileSlug] of Object.entries(SAMPLE_INPUT)) {
    const { biographyData, worksData, url: sourceUrl } = await scrapeProfile([profileName, profileSlug]);
    const scrapedAt = new Date();
    const author = new Author({
      ...biographyData,
      listingName: profileName,
      headingName: biographyData.name,
      sourceUrl,
      scrapedAt,
    });

    const originalAuthor = author.name;
    const authorId = author.id;

    const adaptations: ObjectId[] = [];
    const playIds: ObjectId[] = [];
    const playDooleeeIds: string[] = [];

    for (const work of worksData) {
      if (work.title !== "Bakkhai") {
        continue;
      }

      const play = new Play({
        ...work,
        originalAuthor,
        authorId,
        sourceUrl,
        scrapedAt,
      });

      play.isAdaptation ? adaptations.push(play.id) : playIds.push(play.id);
      playDooleeeIds.push(play.doolleeId);

      const playDocument = play.toDocument();
      const playFilename = getPlayFilename(playDocument.title, playDocument.playId);

      await playModuleWriter.writeFile({
        filename: playFilename,
        data: playDocument,
        stringify: true,
        fileType: "json",
      });
      console.log(`✅ play data written to file: ${playFilename}`);

      if (playDocument.title === "Bakkhai") {
        await playModuleWriter.writeFile({
          filename: `_original-${playFilename}`,
          data: work,
          stringify: true,
          fileType: "json",
        });
        console.log(`✅ SPECIAL play data written to file: SPECIAL-${playFilename}`);
      }
    }

    author.addPlays(playIds);
    author.addAdaptations(adaptations);
    author.addDoolleeIds(playDooleeeIds);

    await authorModuleWriter.writeFile({
      filename: `${profileSlug}.json`,
      data: author.toDocument(),
      stringify: true,
      fileType: "json",
    });

    console.log(`✅ bio data written to file: ${profileName}`);
  }

  authorModuleWriter && (await authorModuleWriter.close());
  playModuleWriter && (await playModuleWriter.close());
  scraper && (await scraper.close());
}

main().catch(console.error);
