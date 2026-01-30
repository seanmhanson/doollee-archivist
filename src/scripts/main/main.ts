import { ObjectId } from "mongodb";

import config from "#/core/Config";
import WebScraper from "#/core/WebScraper";
import ModuleWriter from "#/core/ModuleWriter";
import DatabaseService from "#/core/DatabaseService";
import Author from "#/db-types/author/Author.class";
import Play from "#/db-types/play/Play.class";
import ProgressDisplay from "#/scripts/main/ProgressDisplay";

import ProfilePage from "#/page-models/ProfilePage";
import profileUrls from "#/input/profileUrls";

import type { PlayDocument } from "#/db-types/play/play.types";
import type { AuthorDocument } from "#/db-types/author/author.types";

function getAuthorUrls(profileSlug: string): { shortUrl: string; fullUrl: string } {
  // all authors with leading numeric characters are indexed under "A"
  const prefix = profileSlug.charAt(0).match(/[0-9]/) ? "A" : profileSlug.charAt(0).toUpperCase();
  const shortenedUrl = `/Playwrights${prefix}/${profileSlug}.php`;
  const fullUrl = `${config.baseUrl}${shortenedUrl}`.trim();
  return { shortUrl: shortenedUrl, fullUrl };
}

async function writeAuthorToDb(document: AuthorDocument, documentId: ObjectId, dbService: DatabaseService) {
  const authorsCollection = await dbService.getCollection("authors");
  const { _id, ...authorDocument } = document;
  await authorsCollection.findOneAndUpdate({ _id: documentId }, { $set: authorDocument }, { upsert: true });
}

async function writeAuthorToFile(data: AuthorDocument, slug: string, moduleWriter: ModuleWriter) {
  await moduleWriter.writeFile({
    filename: `${slug}.json`,
    stringify: true,
    fileType: "json",
    data,
  });
}

async function writePlayToDb(document: PlayDocument, dbService: DatabaseService) {
  const playsCollection = await dbService.getCollection("plays");
  const { _id, ...documentWithoutId } = document;
  await playsCollection.findOneAndUpdate(
    { playId: documentWithoutId.playId },
    { $set: documentWithoutId, $setOnInsert: { _id } },
    { upsert: true }
  );
}

async function writePlayToFile(data: PlayDocument, moduleWriter: ModuleWriter) {
  const { title, playId } = data;
  const id = playId.padStart(6, "0") || "0000000";
  const truncatedName = title
    .substring(0, 16)
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "");
  await moduleWriter.writeFile({
    filename: `${id}-${truncatedName}.json`,
    stringify: true,
    fileType: "json",
    data,
  });
}

async function main() {
  const timestamp = new Date().toTimeString().slice(0, 8).replace(/:/g, "");
  const authorModuleWriter = await ModuleWriter.create(`${timestamp}-authors`);
  const playModuleWriter = await ModuleWriter.create(`${timestamp}-plays`);
  const dbService = new DatabaseService(config.mongoUri, config.dbName);
  const scraper = await WebScraper.create();

  // TODO: divide up sets of authors
  const totalAuthors = Object.entries(profileUrls).length;
  const batchSize = config.batchSize;
  const maxBatches = config.maxBatches > 0 ? config.maxBatches : Infinity;
  const numBatches = Math.min(Math.ceil(totalAuthors / batchSize), maxBatches);

  const progressDisplay = new ProgressDisplay({
    globalBatchSize: batchSize,
    globalBatchCount: numBatches,
    logDirectory: config.logDirectory,
    logFile: config.logFile,
    tailLength: config.tailLength,
  });

  let bioCount = 0;
  let playCount = 0;

  // TODO: loop over bundles of authors

  for (const [profileName, profileSlug] of Object.entries(profileUrls)) {
    // TODO: UI Data to update: first name, last name, current author url, plays per author

    const { fullUrl } = getAuthorUrls(profileSlug);
    const profilePage = new ProfilePage(scraper.getPage(), { url: fullUrl });
    await profilePage.goto();
    await profilePage.extractPage();

    const { biographyData, worksData, url } = profilePage;
    const scrapingData = { sourceUrl: url, scrapedAt: new Date() };
    const author = new Author({
      ...biographyData,
      ...scrapingData,
      listingName: profileName,
      headingName: biographyData.name,
    });
    const { authorName: originalAuthor, id: authorId } = author;
    const authorReference = { originalAuthor, authorId, ...scrapingData };

    for (const work of worksData) {
      const play = new Play({ ...work, ...authorReference });
      const playDocument = play.toDocument();
      const { isAdaptation, id, doolleeId } = play;

      isAdaptation ? author.addAdaptations([id]) : author.addPlays([]);
      author.addDoolleeIds([doolleeId]);

      if (config.writeTo === "db") {
        await writePlayToDb(playDocument, dbService);
      } else if (config.writeTo === "file") {
        await writePlayToFile(playDocument, playModuleWriter);
      }
      playCount++;
    }

    const authorDocument = author.toDocument();

    if (config.writeTo === "db") {
      await writeAuthorToDb(authorDocument, authorId, dbService);
    } else if (config.writeTo === "file") {
      await writeAuthorToFile(authorDocument, profileSlug, authorModuleWriter);
    }
    bioCount++;
  }
  progressDisplay.complete();
  await authorModuleWriter.close();
  await playModuleWriter.close();
  await dbService.close();
  await scraper.close();
  // progressDisplay.summary();
}

main().catch(console.error);