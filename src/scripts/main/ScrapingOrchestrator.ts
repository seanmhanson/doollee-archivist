import { ObjectId } from "mongodb";

import config from "#/core/Config";
import WebScraper from "#/core/WebScraper";
import ModuleWriter from "#/core/ModuleWriter";
import DatabaseService from "#/core/DatabaseService";
import Author from "#/db-types/author/Author.class";
import Play from "#/db-types/play/Play.class";
import ProgressDisplay from "#/scripts/main/ProgressDisplay";
import ProfilePage from "#/page-models/ProfilePage";
import { defaults } from "./ProgressDisplay.types";
import type { Input } from "#/db-types/author/author.types";
import type { PlayData } from "#/db-types/play";
import type { GlobalStats, PlayStats, AuthorStats, CurrentStats } from "./ProgressDisplay.types";
import {
  ScrapingError,
  PlayProcessingError,
  SetupError,
  WriteAuthorError,
  WritePlayError,
  AuthorProcessingError,
} from "./ScrapingError";

type AuthorListIndex = { [letter: string]: { [authorName: string]: string } };

type Batch = { [authorName: string]: string };

type AuthorData = { biographyData: Input; worksData: PlayData[]; url: string };

type AuthorReference = {
  originalAuthor: string;
  authorId: ObjectId;
  scrapedAt: Date;
  sourceUrl: string;
};

type Services = {
  dbService: DatabaseService;
  scraper: WebScraper;
  authorModuleWriter: ModuleWriter;
  playModuleWriter: ModuleWriter;
  progressDisplay: ProgressDisplay;
};

type State = {
  batches: Batch[];
  playAccumulator: ObjectId[];
  adaptationAccumulator: ObjectId[];
  doolleeIdAccumulator: string[];
  authorReference: AuthorReference | {};
  currentAuthor?: Author;
  currentPlay?: Play;
  currentPlays: PlayData[];
  profileSlug: string;
  profileName: string;
};

class ScrapingOrchestrator {
  private services: Services;
  private globalStats: GlobalStats = defaults.globalStats;
  private currentStats: CurrentStats = defaults.currentStats;
  private authorStats: AuthorStats = defaults.authorStats;
  private playStats: PlayStats = defaults.playStats;
  private state: State = {
    batches: [],
    playAccumulator: [],
    adaptationAccumulator: [],
    doolleeIdAccumulator: [],
    authorReference: {},
    currentAuthor: undefined,
    currentPlays: [],
    profileSlug: "",
    profileName: "",
  };

  constructor(services: Services) {
    this.services = services;
  }

  public async run() {
    await this.setup();

    for (const batch of this.state.batches) {
      this.beginBatch(batch);

      for (const [profileName, profileSlug] of Object.entries(batch)) {
        this.beginAuthor(profileName, profileSlug);
        await this.updateDisplay({ forceUpdate: true });

        try {
          const authorData = await this.scrapeAuthor();
          this.createAuthor(authorData);
        } catch (error) {
          this.errorHandler(error);
          continue;
        }
        await this.updateDisplay({ forceUpdate: true });

        for (const play of this.state.currentPlays) {
          this.beginPlay();
          await this.createPlay(play);
          try {
            await this.writePlay();
          } catch (error) {
            this.errorHandler(error);
            continue;
          }
          await this.updateDisplay();
        } // end plays loop

        try {
          await this.writeAuthor();
        } catch (error) {
          this.errorHandler(error);
          continue;
        }
        await this.updateDisplay();
      } // end authors loop
    } // end batches loop

    this.globalStats.endTime = new Date();
    this.services.progressDisplay.close();
    await this.teardown();
  }

  /**
   * Initial setup before starting the scraping process, ensuring all
   * dependencies are correctly intialized and that the input author/url pairs are
   * prepared into batches for processing.
   * @throws {SetupError} If there is an error during setup. Fatal error.
   */
  private async setup() {
    await this.getBatches();
    this.globalStats.startTime = new Date();
    this.globalStats.globalBatchSize = config.batchSize;
    this.globalStats.globalBatchCount = this.state.batches.length;
    await this.checkDependencies();
  }

  /**
   * Prepares the list of author batches to be processed by reading all author index files
   * provided in the configured input path (ex: A.ts, B.ts, etc.) and grouping authors into groups
   * of a set maximum size.
   * @throws {SetupError} If there is an error loading or processing the author index files. Fatal error.
   */
  private async getBatches() {
    const { batchSize, maxBatches, authorListPath } = config;
    const letters: string[] = [];
    const firstLetter = `A`.charCodeAt(0);
    const lastLetter = `Z`.charCodeAt(0);
    const exception = `V`.charCodeAt(0);
    for (let i = firstLetter; i <= lastLetter; i++) {
      if (i === exception) {
        continue;
      }
      letters.push(String.fromCharCode(i));
    }

    let authorListIndex: AuthorListIndex;
    try {
      authorListIndex = await import(`${authorListPath}/index`);
    } catch (error) {
      throw new SetupError(`Failed to load author list index from path: ${authorListPath}/index`, error);
    }

    try {
      letterLoop: for (const letter of letters) {
        const authorEntriesByLetter = Object.entries(authorListIndex[letter] || {});
        for (let i = 0; i < authorEntriesByLetter.length; i += batchSize) {
          if (maxBatches > 0 && this.state.batches.length >= maxBatches) {
            break letterLoop; // exit both loops if we hit the provided batch limit
          }

          const batchEntries = authorEntriesByLetter.slice(i, i + batchSize);
          const batch: Batch = Object.fromEntries(batchEntries);
          this.state.batches.push(batch);
        }
      }
    } catch (error) {
      throw new SetupError(`Error preparing batches from author list data`, error);
    }
  }

  /**
   * Checks that all required services are properly initialized and ready.
   * @throws {SetupError} If any required service is not ready. Fatal error.
   */
  private async checkDependencies() {
    const dbConnected = await this.services.dbService.isConnected();
    const scraperConnected = this.services.scraper.isConnected();
    const authorWriterReady = this.services.authorModuleWriter.isReady;
    const playWriterReady = this.services.playModuleWriter.isReady;
    const progressDisplayReady = this.services.progressDisplay.isReady;

    if (!dbConnected) {
      try {
        await this.services.dbService.connect();
      } catch (error) {
        throw new SetupError(`DatabaseService failed to connect`, error);
      }
      if (!(await this.services.dbService.isConnected())) {
        throw new SetupError("DatabaseService connection attempt failed");
      }
    }

    if (!scraperConnected) {
      throw new SetupError("WebScraper is not connected");
    }
    if (!authorWriterReady) {
      throw new SetupError("Author ModuleWriter is not ready");
    }
    if (!playWriterReady) {
      throw new SetupError("Play ModuleWriter is not ready");
    }
    if (!progressDisplayReady) {
      throw new SetupError("ProgressDisplay is not ready");
    }
  }

  /**
   * Resets the current state and statistics for a new batch of authors to be processed.
   * @param batch the batch of authors to begin processing
   */
  private beginBatch(batch: Batch) {
    const authors = Object.keys(batch);
    this.currentStats.firstAuthorName = authors[0] || "";
    this.currentStats.lastAuthorName = authors[authors.length - 1] || "";
    this.currentStats.authorsByBatchCount = authors.length;

    // Reset batch-level stats
    this.authorStats.batchAuthorsWritten = 0;
    this.authorStats.batchAuthorsSkipped = 0;
    this.authorStats.batchAuthorsFlagged = 0;
    this.playStats.batchPlaysWritten = 0;
    this.playStats.batchPlaysSkipped = 0;
    this.playStats.batchPlaysFlagged = 0;

    // Reset current position counters
    this.currentStats.currentAuthorIndex = 0;
    this.currentStats.currentPlayIndex = 0;
    this.currentStats.currentBatchIndex++;
  }

  /**
   * Initializes the state for a new author to be processed, including
   * setting up their profile URL and resetting relevant accumulators and counters.
   * @param profileName the display name of the author
   * @param profileSlug the URL slug of the author's profile
   */
  private beginAuthor(profileName: string, profileSlug: string) {
    const hasNumericPrefix = profileSlug.charAt(0).match(/[0-9]/);
    const prefix = hasNumericPrefix ? "A" : profileSlug.charAt(0).toUpperCase();
    const authorUrl = `/Playwrights${prefix}/${profileSlug}.php`;

    this.state.profileName = profileName;
    this.state.profileSlug = profileSlug;
    this.state.authorReference = {} as AuthorReference;
    this.state.currentAuthor = undefined;
    this.currentStats.currentAuthorUrl = authorUrl;
    this.currentStats.playsByAuthorCount = 0;
    this.currentStats.currentAuthorIndex++;
  }

  /**
   * Advances the current play index counter when beginning to process a new play.
   * Note: the progress display is not updated in this lifecycle method because of the
   * frequency with which plays are processed (as they do not require scraping)
   */
  private beginPlay() {
    this.currentStats.currentPlayIndex++;
  }

  /**
   * Scrapes the author's profile page to extract their biography and list of works.
   * @returns scraped author data including biography, works, and source URL
   * @throws {ScrapingError} If there is an error during scraping. Recoverable Error (skip current author)
   * @throws {Error} If there is an unexpected error during scraping, such as a network failure. Fatal Error.
   */
  private async scrapeAuthor(): Promise<AuthorData> {
    const profileUrl = `${config.baseUrl}${this.currentStats.currentAuthorUrl}`.trim();
    try {
      const profilePage = new ProfilePage(this.services.scraper.getPage(), { url: profileUrl });
      await profilePage.goto();
      await profilePage.extractPage();

      const { biographyData, worksData, url } = profilePage;
      return { biographyData, worksData, url };
    } catch (error) {
      throw new ScrapingError(`Failed to scrape author profile: ${this.state.profileName} at ${profileUrl}`, error);
    }
  }

  /**
   * Creates an Author instance from the scraped data and updates the orchestrator state accordingly,
   * to prepare for writing and iterating through the author's plays
   * @param biographyData the scraped biography data of the author
   * @param worksData the scraped list of works by the author
   * @param sourceUrl the URL of the author's profile page
   */
  private createAuthor({ biographyData, worksData, url: sourceUrl }: AuthorData) {
    if (!biographyData || !worksData || !sourceUrl) {
      const url = sourceUrl || this.state.profileSlug;
      throw new AuthorProcessingError(`Incomplete author data scraped for author: ${this.state.profileName} at ${url}`);
    }

    const headingName = biographyData.name;
    const scrapedAt = new Date();
    const author = new Author({
      ...biographyData,
      listingName: this.state.profileName,
      headingName,
      sourceUrl,
      scrapedAt,
    });

    this.currentStats.playsByAuthorCount = worksData.length;
    this.state.currentAuthor = author;
    this.state.currentPlays = worksData;
    this.state.authorReference = {
      originalAuthor: author.authorName,
      authorId: author.id,
      sourceUrl,
      scrapedAt,
    };
  }

  /**
   * Creates a Play instance from the provided play data and updates the orchestrator state accordingly,
   * @param playData the scraped data of the play to be created
   */
  private async createPlay(playData: PlayData) {
    if (!this.isPopulatedAuthorReference(this.state.authorReference)) {
      throw new PlayProcessingError("Author reference data is incomplete when creating play.");
    }

    const play = new Play({ ...playData, ...this.state.authorReference });
    play.isAdaptation ? this.state.adaptationAccumulator.push(play.id) : this.state.playAccumulator.push(play.id);
    this.state.doolleeIdAccumulator.push(play.doolleeId);
  }

  /**
   * Writes the current author data to the configured output (database or file).
   * @throws {WriteAuthorError} If there is an error during writing. Recoverable Error (skip current author)
   */
  private async writeAuthor() {
    if (!this.state.currentAuthor) {
      throw new AuthorProcessingError("Current author data is undefined at the time of writing");
    }

    const document = this.state.currentAuthor.toDocument();
    const authorId = this.state.currentAuthor.id;

    try {
      if (config.writeTo === "db") {
        const authorsCollection = await this.services.dbService.getCollection("authors");
        const { _id, ...authorDocument } = document;
        await authorsCollection.findOneAndUpdate({ _id: authorId }, { $set: authorDocument }, { upsert: true });
      } else if (config.writeTo === "file") {
        await this.services.authorModuleWriter.writeFile({
          filename: `${this.state.profileSlug}.json`,
          stringify: true,
          fileType: "json",
          data: document,
        });
      }

      const { needsReview } = document.metadata;
      if (needsReview) {
        this.authorStats.totalAuthorsFlagged++;
        this.authorStats.batchAuthorsFlagged++;
      } else {
        this.authorStats.totalAuthorsWritten++;
        this.authorStats.batchAuthorsWritten++;
      }
    } catch (error) {
      const target = config.writeTo === "db" ? "database" : `file ${this.state.profileSlug}.json`;
      const message =
        `Error writing author to ${target}:\n` +
        `Document ID: ${document._id}\n` +
        `Name: ${document.name}\n` +
        `Source URL: ${document.metadata.sourceUrl}\n` +
        `Scraped At: ${document.metadata.scrapedAt}\n`;

      throw new WriteAuthorError(message, error);
    }
  }

  /**
   * Writes the current play data to the configured output (database or file).
   * @throws {WritePlayError} If there is an error during writing. Recoverable Error (skip current play)
   */
  private async writePlay() {
    if (!this.state.currentPlay) {
      throw new PlayProcessingError("Current play data is undefined at the time of writing");
    }

    const document = this.state.currentPlay.toDocument();

    let filename = "";
    try {
      if (config.writeTo === "db") {
        const playsCollection = await this.services.dbService.getCollection("plays");
        const { _id, ...documentWithoutId } = document;
        await playsCollection.findOneAndUpdate(
          { playId: documentWithoutId.playId },
          { $set: documentWithoutId, $setOnInsert: { _id } },
          { upsert: true }
        );
      } else if (config.writeTo === "file") {
        const { title, playId } = document;
        const id = playId.padStart(6, "0") || "0000000";
        const truncatedName = title
          .substring(0, 16)
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9\-]/g, "");
        const filename = `${id}-${truncatedName}.json`;
        await this.services.playModuleWriter.writeFile({
          stringify: true,
          fileType: "json",
          data: document,
          filename,
        });
      }

      const { needsReview } = document.metadata;
      if (needsReview) {
        this.playStats.totalPlaysFlagged++;
        this.playStats.batchPlaysFlagged++;
      } else {
        this.playStats.totalPlaysWritten++;
        this.playStats.batchPlaysWritten++;
      }
    } catch (error) {
      const target = config.writeTo === "db" ? "database" : `file ${filename}`;
      const message =
        `Error writing play to ${target}:\n` +
        `Document ID: ${document._id}\n` +
        `Title: ${document.title}\n` +
        `Source URL: ${document.metadata.sourceUrl}\n` +
        `Scraped At: ${document.metadata.scrapedAt}\n`;
      throw new WritePlayError(message, error);
    }
  }

  /**
   * Type guard to check if an object is a fully populated AuthorReference
   * @param obj a partial AuthorReference object, possibly missing fields
   * @returns a boolean indicating if the object is a complete AuthorReference
   */
  private isPopulatedAuthorReference(obj: Partial<AuthorReference>): obj is AuthorReference {
    const { originalAuthor, authorId, scrapedAt, sourceUrl } = obj;
    return !!(originalAuthor && authorId && scrapedAt && sourceUrl);
  }

  /**
   * Handles expected errors thrown by the script during the scraping and writing processes,
   * @param error the error object thrown during processing
   */
  private async errorHandler(error: unknown) {
    const isSetupError = error instanceof SetupError;
    const isScrapingError = error instanceof ScrapingError;
    const isWritePlayError = error instanceof WritePlayError;
    const isWriteAuthorError = error instanceof WriteAuthorError;
    const isPlayProcessingError = error instanceof PlayProcessingError;
    const isAuthorProcessingError = error instanceof AuthorProcessingError;
    const isUnexpectedError = ![
      isSetupError,
      isScrapingError,
      isWriteAuthorError,
      isAuthorProcessingError,
      isWritePlayError,
      isPlayProcessingError,
    ].some(Boolean);

    const incrementAuthors = () => {
      this.authorStats.totalAuthorsSkipped++;
      this.authorStats.batchAuthorsSkipped++;
    };

    const incrementPlays = () => {
      this.playStats.totalPlaysSkipped++;
      this.playStats.batchPlaysSkipped++;
    };

    // fatal errors

    if (isUnexpectedError) {
      console.error("Unexpected error encountered:", error);
      throw error;
    }

    if (isSetupError) {
      console.error("Fatal setup error encountered. Terminating process.");
      await this.teardown();
      process.exit(1);
    }

    // recoverable errors

    if (isScrapingError) {
      console.warn(`Skipping author ${this.state.profileName} due to scraping error.`);
      incrementAuthors();
    }

    if (isWritePlayError) {
      console.warn(`Skipping writing play for ${this.state.profileName} due to writing error.`);
      incrementPlays();
    }

    if (isWriteAuthorError) {
      console.warn(`Skipping writing author bio for ${this.state.profileName} due to writing error.`);
      incrementAuthors();
    }

    if (isPlayProcessingError) {
      console.warn(`Skipping play for ${this.state.profileName} due to processing error.`);
      incrementPlays();
    }

    if (isAuthorProcessingError) {
      console.warn(`Skipping author ${this.state.profileName} due to processing error.`);
      incrementAuthors();
    }

    await this.updateDisplay({ forceUpdate: true });
  }

  /**
   * Updates the progress display with the latest statistics and queues a refresh of the UI
   * @param forceUpdate whether to force an immediate update of the display
   */
  private async updateDisplay({ forceUpdate = false } = {}) {
    return this.services.progressDisplay.update(
      {
        globalStats: this.globalStats,
        currentStats: this.currentStats,
        authorStats: this.authorStats,
        playStats: this.playStats,
      },
      forceUpdate
    );
  }

  /**
   * Cleans up and closes all services used during the scraping process.
   * The progress display is closed first to restore terminal state before other services are closed.
   */
  private async teardown() {
    this.services.progressDisplay.close();
    await this.services.scraper.close();
    await this.services.dbService.close();
    await this.services.authorModuleWriter.close();
    await this.services.playModuleWriter.close();
  }
}

export default ScrapingOrchestrator;
