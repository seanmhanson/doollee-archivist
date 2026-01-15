import { ObjectId } from "mongodb";

import config from "#/core/Config";
import WebScraper from "#/core/WebScraper";
import ModuleWriter from "#/core/ModuleWriter";
import DatabaseService from "#/core/DatabaseService";
import ProfilePage from "#/page-models/ProfilePage";
import Author from "#/db-types/author/Author.class";
import Play from "#/db-types/play/Play.class";
import profileUrls from "#/input/profileUrls";
import ProgressDisplay from "#/utils/ProgressDisplay";

async function main() {
  console.debug = () => {};

  const timestamp = new Date().toTimeString().slice(0, 8).replace(/:/g, "");
  const totalAuthors = Object.entries(profileUrls).length;

  // Setup infrastructure first (without progress display)
  const authorModuleWriter = await ModuleWriter.create(`${timestamp}-authors`);
  const playModuleWriter = await ModuleWriter.create(`${timestamp}-plays`);
  const dbService = new DatabaseService(config.mongoUri, config.dbName);
  const scraper = await WebScraper.create();

  const progressDisplay = new ProgressDisplay({
    totalAuthors,
    batchSize: totalAuthors,
  });

  async function scrapeProfile([profileName, profileSlug]: [string, string]) {
    // all authors with leading numeric characters are indexed under "A"
    const prefix = profileSlug.charAt(0).match(/[0-9]/) ? "A" : profileSlug.charAt(0).toUpperCase();
    const url = `${config.baseUrl}/Playwrights${prefix}/${profileSlug}.php`;
    const shortUrl = `/Playwrights${prefix}/${profileSlug}.php`;

    console.log(`Scraping: { name: ${profileName.trim()}, url: ${shortUrl} }`);

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

  let bioCount = 0;
  let playCount = 0;

  for (const [profileName, profileSlug] of Object.entries(profileUrls)) {
    const baseUrl = `${config.baseUrl}/Playwrights`;
    const slugPrefix = profileSlug.charAt(0).toUpperCase();
    const url = `${baseUrl}${slugPrefix}/${profileSlug}.php`;

    progressDisplay.updateDisplay({
      currentUrl: url,
      authorCount: bioCount,
    });

    const { biographyData, worksData, url: sourceUrl } = await scrapeProfile([profileName, profileSlug]);
    const scrapedAt = new Date();
    const author = new Author({
      ...biographyData,
      listingName: profileName,
      headingName: biographyData.name,
      sourceUrl,
      scrapedAt,
    });

    const originalAuthor = author.authorName;
    const authorId = author.id;

    const adaptations: ObjectId[] = [];
    const playIds: ObjectId[] = [];
    const playDooleeIds: string[] = [];

    for (const work of worksData) {
      const play = new Play({
        ...work,
        originalAuthor,
        authorId,
        sourceUrl,
        scrapedAt,
      });

      play.isAdaptation ? adaptations.push(play.id) : playIds.push(play.id);
      playDooleeIds.push(play.doolleeId);

      const playDocument = play.toDocument();
      const playFilename = getPlayFilename(playDocument.title, playDocument.playId);

      if (config.writeTo === "db") {
        const playsCollection = await dbService.getCollection("plays");
        const { _id, ...playDocumentWithoutId } = play.toDocument();

        await playsCollection.findOneAndUpdate(
          { playId: playDocumentWithoutId.playId },
          { $set: playDocumentWithoutId, $setOnInsert: { _id } },
          { upsert: true }
        );

        playCount++;
        progressDisplay.updateDisplay({ playCount });
      } else if (config.writeTo === "file") {
        await playModuleWriter.writeFile({
          filename: playFilename,
          data: playDocument,
          stringify: true,
          fileType: "json",
        });
        console.log(`✅ play data written to file: ${playFilename}`);
      }
    }

    author.addPlays(playIds);
    author.addAdaptations(adaptations);
    author.addDoolleeIds(playDooleeIds);

    if (config.writeTo === "db") {
      const authorsCollection = await dbService.getCollection("authors");
      const { _id, ...authorDocument } = author.toDocument();

      await authorsCollection.findOneAndUpdate(
        { _id: authorId },
        { $set: authorDocument },
        { upsert: true }
      );

      bioCount++;
      progressDisplay.updateDisplay({
        authorCount: bioCount,
        totalPlays: playCount,
      });
      console.log(`Completed: ${profileName.trim()}, (${worksData.length} works)`);
    } else if (config.writeTo === "file") {
      await authorModuleWriter.writeFile({
        filename: `${profileSlug}.json`,
        data: author.toDocument(),
        stringify: true,
        fileType: "json",
      });
      console.log(`✅ bio data written to file: ${profileName}`);
    }
  }
  progressDisplay.complete();
  await authorModuleWriter.close();
  await playModuleWriter.close();
  await dbService.close();
  await scraper.close();
  progressDisplay.summary();
}

main().catch(console.error);
