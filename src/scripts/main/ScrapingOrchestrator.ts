import { MongoNetworkError, MongoOperationTimeoutError, ObjectId } from "mongodb";
import { promises as fs } from "fs";
import path from "path";

import config from "#/core/Config";
import WebScraper from "#/core/WebScraper";
import ModuleWriter from "#/core/ModuleWriter";
import DatabaseService from "#/core/DatabaseService";
import Author from "#/db-types/author/Author.class";
import Play from "#/db-types/play/Play.class";
import ProgressDisplay from "#/scripts/main/ProgressDisplay";
import ProfilePage from "#/page-models/ProfilePage";
import { defaults } from "./ProgressDisplay.types";
import type { AuthorDocument, Input } from "#/db-types/author/author.types";
import type { PlayData } from "#/db-types/play";
import type { GlobalStats, PlayStats, AuthorStats, CurrentStats, ErrorStats } from "./ProgressDisplay.types";
import {
  ScrapingError,
  PlayProcessingError,
  SetupError,
  WriteAuthorError,
  WritePlayError,
  AuthorProcessingError,
} from "./ScrapingError";
import { PlayDocument } from "#/db-types/play/play.types";


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
  authorModuleWriter: ModuleWriter | null;
  playModuleWriter: ModuleWriter | null;
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

type SkippedAuthor = {
  profileName: string;
  url: string;
  reason: string;
};

type SkippedPlay = {
  profileName: string;
  url: string;
  id?: string;
  title?: string;
  reason: string;
};

type FlaggedAuthor = {
  profileName: string;
  id: string;
  name: string;
  url: string;
  filename: string;
  reason: string;
  needsReviewData?: Record<string, Record<string, string>>;
};

type FlaggedPlay = {
  profileName: string;
  title: string;
  id: string;
  authorName: string;
  authorId: string;
  url: string;
  filename: string;
};

type SkippedEntries = {
  authors: SkippedAuthor[];
  plays: SkippedPlay[];
};

type FlaggedEntries = {
  authors: FlaggedAuthor[];
  plays: FlaggedPlay[];
};

type ReviewState = {
  filePath: string;
  hasError: boolean;
  skippedEntries: SkippedEntries;
  flaggedEntries: FlaggedEntries;
};

class ScrapingOrchestrator {
  private services: Services;
  private globalStats: GlobalStats = defaults.globalStats;
  private currentStats: CurrentStats = defaults.currentStats;
  private authorStats: AuthorStats = defaults.authorStats;
  private playStats: PlayStats = defaults.playStats;
  private errorStats: ErrorStats = defaults.errorStats;
  private reviewState: ReviewState = {
    filePath: "",
    hasError: false,
    skippedEntries: { authors: [], plays: [] },
    flaggedEntries: { authors: [], plays: [] },
  };
  private state: State = {
    batches: [],
    playAccumulator: [],
    adaptationAccumulator: [],
    doolleeIdAccumulator: [],
    authorReference: {},
    currentAuthor: undefined,
    currentPlay: undefined,
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
          try {
            this.createPlay(play);
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

      this.endBatch();
    } // end batches loop

    this.globalStats.endTime = new Date();
    this.services.progressDisplay.close();
    await this.writeReviewFile();
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
    await this.setupReviewWriter();
  }

  private async setupReviewWriter() {
    const timestamp = this.globalStats.startTime?.toISOString().replace(/[:.-]/g, "_");
    this.reviewState.filePath = `output/review-queue/review-${timestamp}.json`;
    const dir = path.dirname(this.reviewState.filePath);
    await fs.mkdir(dir, { recursive: true });
  }

  private async addSkippedAuthor(reason: string = "other") {
    const profileName = this.state.profileName;
    const url = this.currentStats.currentAuthorUrl || "";

    const skippedAuthor = { profileName, url, reason };
    this.reviewState.skippedEntries.authors.push(skippedAuthor);
    await this.writeReviewFile();
  }

  private async addSkippedPlay(reason: string = "other") {
    const profileName = this.state.profileName;
    const url = this.currentStats.currentAuthorUrl || "";
    const playId = this.state.currentPlay?.doolleeId;
    const title = this.state.currentPlay?.title;

    const skippedPlay = { profileName, url, id: playId, title, reason };
    this.reviewState.skippedEntries.plays.push(skippedPlay);
    await this.writeReviewFile();
  }

  private async addFlaggedAuthor(document: AuthorDocument) {
    const flaggedAuthor: FlaggedAuthor = {
      profileName: this.state.profileName,
      filename: `${this.state.profileSlug}.json`,
      url: document.metadata.sourceUrl || this.currentStats.currentAuthorUrl || "",
      id: document._id?.toHexString() || "",
      name: document.name || "",
      reason: document.metadata.needsReviewReason || "(unspecified reason)",
    };

    if (document.metadata.needsReviewData) {
      flaggedAuthor.needsReviewData = document.metadata.needsReviewData;
    }

    this.reviewState.flaggedEntries.authors.push(flaggedAuthor);
    await this.writeReviewFile();
  }

  private async addFlaggedPlay() {
    const profileName = this.state.profileName;
    const title = this.state.currentPlay?.title || "";
    const id = this.state.currentPlay?.doolleeId || "";
    const url = this.currentStats.currentAuthorUrl || "";
    const filename = this.getPlayFilename(title, id);

    let authorName = "";
    let authorId = "";
    if (this.state.currentAuthor) {
      authorName = this.state.currentAuthor.authorName;
      authorId = this.state.currentAuthor.id.toHexString();
    } else {
      const authorReference = this.state.authorReference;
      if (this.isPopulatedAuthorReference(authorReference)) {
        authorName = authorReference.originalAuthor;
        authorId = authorReference.authorId.toHexString();
      }
    }

    const flaggedPlay = {
      profileName,
      title,
      id,
      authorName,
      authorId,
      url,
      filename,
    };

    this.reviewState.flaggedEntries.plays.push(flaggedPlay);
    await this.writeReviewFile();
  }

  private async writeReviewFile() {
    if (!this.reviewState.filePath) {
      this.reviewState.hasError = true;
      return;
    }

    const skippedAuthorCount = this.reviewState.skippedEntries.authors.length;
    const skippedPlayCount = this.reviewState.skippedEntries.plays.length;
    const flaggedAuthorCount = this.reviewState.flaggedEntries.authors.length;
    const flaggedPlayCount = this.reviewState.flaggedEntries.plays.length;
    const reviewData = {
      metadata: {
        createdAt: this.globalStats.startTime,
        lastUpdated: new Date(),
        plays: {
          skipped: skippedPlayCount,
          flagged: flaggedPlayCount,
          totalForReview: skippedPlayCount + flaggedPlayCount,
        },
        authors: {
          skipped: skippedAuthorCount,
          flagged: flaggedAuthorCount,
          totalForReview: skippedAuthorCount + flaggedAuthorCount,
        },
      },
      skippedEntries: this.reviewState.skippedEntries,
      flaggedEntries: this.reviewState.flaggedEntries,
    };

    try {
      await fs.writeFile(this.reviewState.filePath, JSON.stringify(reviewData, null, 2));
    } catch (error) {
      this.reviewState.hasError = true;
    }
  }

  /**
   * Prepares the list of author batches to be processed by reading all author index files
   * provided in the configured input path (ex: A.ts, B.ts, etc.) and grouping authors into groups
   * of a set maximum size.
   * @throws {SetupError} If there is an error loading or processing the author index files. Fatal error.
   */
  private async getBatches() {
    // const { batchSize, maxBatches } = config;

    // testing
    const batchSize = 20;
    const maxBatches = 1;

    const letters: string[] = [];
    const firstLetter = `A`.charCodeAt(0);
    const lastLetter = `A`.charCodeAt(0);
    const exception = `V`.charCodeAt(0);
    for (let i = firstLetter; i <= lastLetter; i++) {
      if (i === exception) {
        continue;
      }
      letters.push(String.fromCharCode(i));
    }

    let authorListIndex: AuthorListIndex = {};
    try {
      const imported = await import(`#/input/authors/index`);
      authorListIndex = imported.default;
    } catch (error) {
      throw new SetupError(`Failed to load author list index from path: #/input/authors/index`, error);
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

    // Only check ModuleWriter readiness when writing to files
    if (config.writeTo === "file") {
      const authorWriterReady = this.services.authorModuleWriter?.isReady;
      const playWriterReady = this.services.playModuleWriter?.isReady;

      if (!authorWriterReady) {
        throw new SetupError("Author ModuleWriter is not ready");
      }
      if (!playWriterReady) {
        throw new SetupError("Play ModuleWriter is not ready");
      }
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
    this.state.playAccumulator = [];
    this.state.adaptationAccumulator = [];
    this.state.doolleeIdAccumulator = [];
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
   * Marks the end of processing for the current batch, updating the completed batch count,
   * given that no error was thrown requiring the batch to be aborted.
   */
  private endBatch() {
    this.globalStats.completedBatchCount++;
  }
  /**
   * Scrapes the author's profile page to extract their biography and list of works.
   * @returns scraped author data including biography, works, and source URL
   * @throws {ScrapingError} If there is an error during scraping. Recoverable Error (skip current author)
   */
  private async scrapeAuthor(): Promise<AuthorData> {
    const profileUrl = `${config.baseUrl}${this.currentStats.currentAuthorUrl}`.trim();
    let profilePage;

    try {
      profilePage = new ProfilePage(this.services.scraper.getPage(), { url: profileUrl });
    } catch (initializationError) {
      this.incrementErrorStats("otherErrors");
      throw new ScrapingError(
        `Failed to initialize ProfilePage for author: ${this.state.profileName} at ${profileUrl}`,
        initializationError,
      );
    }

    try {
      await profilePage.goto();
    } catch (gotoError) {
      this.incrementErrorStats("networkErrors");
      throw new ScrapingError(
        `Failed to navigate to author profile: ${this.state.profileName} at ${profileUrl}`,
        gotoError,
      );
    }

    try {
      await profilePage.extractPage();
      const { biographyData, worksData, url } = profilePage;
      return { biographyData, worksData, url };
    } catch (scrapeError) {
      this.incrementErrorStats("scrapeErrors");
      throw new ScrapingError(
        `Failed to scrape author profile: ${this.state.profileName} at ${profileUrl}`,
        scrapeError,
      );
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
      this.incrementErrorStats("processErrors");
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
  private createPlay(playData: PlayData) {
    if (!this.isPopulatedAuthorReference(this.state.authorReference)) {
      this.incrementErrorStats("processErrors");
      throw new PlayProcessingError("Author reference data is incomplete when creating play.");
    }

    const play = new Play({ ...playData, ...this.state.authorReference });
    this.state.currentPlay = play;

    if (play.isAdaptation) {
      this.globalStats.totalAdaptations++;
      this.state.adaptationAccumulator.push(play.id);
    } else {
      this.state.playAccumulator.push(play.id);
    }

    this.state.doolleeIdAccumulator.push(play.doolleeId);
  }

  private getPlayFilename(title: string, playId: string) {
    const id = playId.padStart(6, "0") || "0000000";
    const truncatedName = title
      .substring(0, 16)
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-]/g, "");
    return `${id}-${truncatedName}.json`;
  }

  /**
   * Writes the current author data to the configured output (database or file).
   * @throws {WriteAuthorError} If there is an error during writing. Recoverable Error (skip current author)
   */
  private async writeAuthor() {
    if (!this.state.currentAuthor) {
      this.incrementErrorStats("processErrors");
      throw new AuthorProcessingError("Current author data is undefined at the time of writing");
    }

    this.state.currentAuthor.addPlays(this.state.playAccumulator);
    this.state.currentAuthor.addAdaptations(this.state.adaptationAccumulator);
    this.state.currentAuthor.addDoolleeIds(this.state.doolleeIdAccumulator);

    const document = this.state.currentAuthor.toDocument();
    const authorId = this.state.currentAuthor.id;

    if (config.writeTo === "db") {
      try {
        const authorsCollection = await this.services.dbService.getCollection("authors");
        const { _id, ...authorDocument } = document;
        await authorsCollection.findOneAndUpdate(
          { _id: authorId },
          { $set: authorDocument, $setOnInsert: { _id } },
          { upsert: true },
        );
      } catch (dbError) {
        if (this.isDbNetworkError(dbError)) {
          this.incrementErrorStats("networkErrors");
        } else {
          this.incrementErrorStats("writeErrors");
        }
        const message = this.getWriteErrorMessage(document);
        throw new WriteAuthorError(message, dbError);
      }
    }

    if (config.writeTo === "file") {
      if (!this.services.authorModuleWriter) {
        throw new WriteAuthorError("AuthorModuleWriter is not initialized for file output");
      }
      try {
        await this.services.authorModuleWriter.writeFile({
          filename: `${this.state.profileSlug}.json`,
          stringify: true,
          fileType: "json",
          data: document,
        });
      } catch (fileWriteError) {
        this.incrementErrorStats("writeErrors");
        const message = this.getWriteErrorMessage(document);
        throw new WriteAuthorError(message, fileWriteError);
      }
    }

    const { needsReview } = document.metadata;
    if (needsReview) {
      this.authorStats.totalAuthorsFlagged++;
      this.authorStats.batchAuthorsFlagged++;
      await this.addFlaggedAuthor(document);
    } else {
      this.authorStats.totalAuthorsWritten++;
      this.authorStats.batchAuthorsWritten++;
    }

    this.globalStats.filesWritten++;
  }

  /**
   * Writes the current play data to the configured output (database or file).
   * @throws {WritePlayError} If there is an error during writing. Recoverable Error (skip current play)
   */
  private async writePlay() {
    if (!this.state.currentPlay) {
      this.incrementErrorStats("processErrors");
      throw new PlayProcessingError("Current play data is undefined at the time of writing");
    }

    const document = this.state.currentPlay.toDocument();

    if (config.writeTo === "db") {
      try {
        const playsCollection = await this.services.dbService.getCollection("plays");
        const { _id, ...documentWithoutId } = document;
        await playsCollection.findOneAndUpdate(
          { playId: documentWithoutId.playId },
          { $set: documentWithoutId, $setOnInsert: { _id } },
          { upsert: true },
        );
      } catch (dbError) {
        if (this.isDbNetworkError(dbError)) {
          this.incrementErrorStats("networkErrors");
        } else {
          this.incrementErrorStats("writeErrors");
        }
        const message = this.getWriteErrorMessage(document);
        throw new WritePlayError(message, dbError);
      }
    }

    if (config.writeTo === "file") {
      if (!this.services.playModuleWriter) {
        throw new WritePlayError("PlayModuleWriter is not initialized for file output");
      }
      const { title, playId } = document;
      const filename = this.getPlayFilename(title, playId);
      try {
        await this.services.playModuleWriter.writeFile({
          stringify: true,
          fileType: "json",
          data: document,
          filename,
        });
      } catch (fileWriteError) {
        this.incrementErrorStats("writeErrors");
        const message = this.getWriteErrorMessage(document);
        throw new WritePlayError(message, fileWriteError);
      }
    }

    const { needsReview } = document.metadata;
    if (needsReview) {
      this.playStats.totalPlaysFlagged++;
      this.playStats.batchPlaysFlagged++;
      await this.addFlaggedPlay();
    } else {
      this.playStats.totalPlaysWritten++;
      this.playStats.batchPlaysWritten++;
    }
    this.globalStats.filesWritten++;
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
    if (error instanceof SetupError) {
      console.error("Fatal setup error encountered. Terminating process.");
      await this.teardown();
      process.exit(1);
    }

    const skipAuthor = async (reason: string, error?: unknown) => {
      if (error) {
        // Log the main error message cleanly
        if (error && typeof error === "object" && "message" in error) {
          console.error((error as any).message);
        }

        // Log the original cause with full detail (including getByText examples)
        if (error && typeof error === "object" && "cause" in error && error.cause) {
          console.error(error.cause);
        }
      }

      this.authorStats.totalAuthorsSkipped++;
      this.authorStats.batchAuthorsSkipped++;
      await this.addSkippedAuthor(reason);
      await this.updateDisplay({ forceUpdate: true });
    };

    const skipPlay = async (reason: string, error?: unknown) => {
      console.warn(`Skipping play due to ${reason}`);

      if (error) {
        console.error(`Error details:`, error);
        // If it's one of our custom errors with a cause, also log the original error
        if (error && typeof error === "object" && "cause" in error && error.cause) {
          console.error(`Original error cause:`, error.cause);
        }
      }

      this.playStats.totalPlaysSkipped++;
      this.playStats.batchPlaysSkipped++;
      await this.addSkippedPlay(reason);
      await this.updateDisplay({ forceUpdate: true });
    };

    const errorActions = {
      [ScrapingError.name]: async () => await skipAuthor("scraping error", error),
      [WriteAuthorError.name]: async () => await skipAuthor("writing error", error),
      [AuthorProcessingError.name]: async () => await skipAuthor("processing error", error),
      [WritePlayError.name]: async () => await skipPlay("writing error", error),
      [PlayProcessingError.name]: async () => await skipPlay("processing error", error),
    };

    const errorName = error?.constructor.name || "UnknownError";
    const action = errorActions[errorName];
    if (action) {
      await action();
      return;
    }

    this.incrementErrorStats("otherErrors");
    console.error("Unexpected error encountered:", error);
    throw error;
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
      forceUpdate,
    );
  }

  private isDbNetworkError(error: unknown) {
    // OperationTimeoutError isn't strictly a network error, but we treat it as such given
    // our minimal usage of the database
    return error instanceof MongoNetworkError || error instanceof MongoOperationTimeoutError;
  }

  private getWriteErrorMessage(document: AuthorDocument | PlayDocument): string {
    const isAuthor = "name" in document;
    const isPlay = "title" in document;

    const documentIdLine = `Document ID: ${document._id}`;
    const sourceUrlLine = `Source URL: ${document.metadata.sourceUrl}`;
    const scrapedAtLine = `Scraped At: ${document.metadata.scrapedAt}`;

    // this is a safeguard and should never happen, but if it does, we will return a message
    // that does not rely on type-specific fields and allow the caller to handle it appropriately
    if (!isAuthor && !isPlay) {
      const summaryLine =
        config.writeTo === "db"
          ? `No identifiable document type provided when writing to database:`
          : `No identifiable document type provided when writing to file ${this.state.profileSlug}.json:`;
      return `${summaryLine}\n` + `    ${documentIdLine}\n` + `    ${sourceUrlLine}\n` + `    ${scrapedAtLine}`;
    }

    const documentType = isAuthor ? "author" : "play";
    const summaryLine =
      config.writeTo === "db"
        ? `Error writing ${documentType} to database:`
        : `Error writing ${documentType} to file ${this.state.profileSlug}.json:\n`;

    const nameLine = isAuthor ? `Name: ${document.name}` : `Title: ${document.title}`;

    return (
      `${summaryLine}\n` +
      `    ${documentIdLine}\n` +
      `    ${nameLine}\n` +
      `    ${sourceUrlLine}\n` +
      `    ${scrapedAtLine}`
    );
  }

  private incrementErrorStats(errorType: keyof ErrorStats) {
    if (this.errorStats.hasOwnProperty(errorType)) {
      this.errorStats[errorType]++;
    } else {
      this.errorStats.otherErrors++;
    }
  }

  /**
   * Cleans up and closes all services used during the scraping process.
   * The progress display is closed first to restore terminal state before other services are closed.
   */
  private async teardown() {
    this.services.progressDisplay.close();
    await this.services.scraper.close();
    await this.services.dbService.close();
    if (this.services.authorModuleWriter) {
      await this.services.authorModuleWriter.close();
    }
    if (this.services.playModuleWriter) {
      await this.services.playModuleWriter.close();
    }
  }
}

export default ScrapingOrchestrator;
