import fs from "fs";

import type {
  GlobalStats,
  CurrentStats,
  AuthorStats,
  PlayStats,
  LoggingStats,
  DisplayData,
} from "#/scripts/main/ProgressDisplay.types";

import config from "#/core/Config";
import { defaults } from "#/scripts/main/ProgressDisplay.types";
import debounce from "#/utils/debounce";

const RENDER_DEBOUNCE_MS = 200;

class ProgressDisplay {
  private globalStats: GlobalStats = defaults.globalStats;
  private currentStats: CurrentStats = defaults.currentStats;
  private authorStats: AuthorStats = defaults.authorStats;
  private playStats: PlayStats = defaults.playStats;
  private loggingStats: LoggingStats = defaults.loggingStats;
  private isReadyFlag = false;

  private readonly originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
  };

  private debouncedRender!: () => void;
  private forceRender!: () => void;
  private clearDebounce!: () => void;

  // ============================================================================
  // Public Interface
  // ============================================================================

  public get isReady() {
    return this.isReadyFlag;
  }

  public update(data: DisplayData = {}, forceUpdate = false) {
    this.updateData(data);

    if (forceUpdate) {
      return this.forceRender();
    }
    return this.debouncedRender();
  }

  public close() {
    Object.assign(console, this.originalConsole);
    this.clearDebounce();
    this.isReadyFlag = false;
  }

  // ============================================================================
  // Initialization & Setup
  // ============================================================================

  constructor() {
    this.initializeLogging();
    this.initializeDebouncing();
    this.isReadyFlag = true;
  }

  private initializeLogging() {
    this.loggingStats = {
      ...this.loggingStats,
      logDirectory: config.logDirectory,
      logFile: config.logFile,
      tailLength: config.tailLength,
    };
    this.globalStats.startTime = new Date();
    this.setupLogFile();
    this.setupLogInterception();
  }

  private initializeDebouncing() {
    const { debouncedFn, forcedFn, clear } = debounce(() => this.render(), RENDER_DEBOUNCE_MS);
    this.debouncedRender = debouncedFn;
    this.forceRender = forcedFn;
    this.clearDebounce = clear;
  }

  private updateData(data: DisplayData = {}) {
    const { globalStats = {}, currentStats = {}, authorStats = {}, playStats = {} } = data;
    const { startTime, endTime, ...globalBatchStats } = globalStats;
    this.globalStats = { ...this.globalStats, ...globalBatchStats };
    this.currentStats = { ...this.currentStats, ...currentStats };
    this.authorStats = { ...this.authorStats, ...authorStats };
    this.playStats = { ...this.playStats, ...playStats };
  }

  private setupLogFile() {
    this.globalStats.startTime = this.globalStats.startTime ?? new Date();

    const timestamp = this.globalStats.startTime.toISOString().replace(/:/g, "-");
    const outputDir = this.loggingStats.logDirectory;
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    if (!this.loggingStats.logFile) {
      this.loggingStats.logFile = `${outputDir}/${timestamp}.log`;
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private toPaddedString(num: number, length: number, padChar = "0"): string {
    return num.toString().padStart(length, padChar);
  }

  private getStartTime(): string {
    return this.globalStats.startTime?.toTimeString().slice(0, 8) ?? "";
  }

  private getElapsedTime(): string {
    const durationMs = this.globalStats.startTime ? Date.now() - this.globalStats.startTime.getTime() : 0;

    const totalSeconds = Math.floor(durationMs / 1000);
    const hours = Math.floor(totalSeconds / 3600)
      .toString()
      .padStart(3, "0");
    const minutes = Math.floor((totalSeconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  }

  private setupLogInterception() {
    const logToFile = (level: string, message: string) => {
      const timestamp = new Date().toISOString();
      const severity = level.toUpperCase();

      const includeUrl = level === "warn" || level === "error";
      const strippedUrl = (this.currentStats.currentAuthorUrl ?? "").replace(config.baseUrl, "");
      const url = includeUrl && strippedUrl ? ` (${strippedUrl}) -` : "";
      const logMessage = `[${timestamp}] ${severity}:${url} ${message} \n`;

      if (this.loggingStats.lastLoggedLines.length >= this.loggingStats.tailLength) {
        this.loggingStats.lastLoggedLines.shift();
      }
      this.loggingStats.lastLoggedLines.push(logMessage.trim());

      if (level === "warn") {
        this.loggingStats.warningsLogged += 1;
      } else if (level === "error") {
        this.loggingStats.errorsLogged += 1;
      }

      // Write logs in real time to the log file, but only render when display data changes
      fs.appendFileSync(this.loggingStats.logFile, logMessage);
    };

    console.log = (...args) => {
      const message = args.join(" ");
      logToFile("info", message);
    };

    console.error = (...args) => {
      const message = args.join(" ");
      logToFile("error", message);
    };

    console.warn = (...args) => {
      const message = args.join(" ");
      logToFile("warn", message);
    };

    process.on("exit", () => this.close());
    process.on("SIGINT", () => {
      this.close();
      process.exit();
    });
  }

  // ============================================================================
  // Rendering Methods - Body
  // ============================================================================

  private render() {
    // clear the screen and redraw the display
    process.stdout.write("\x1b[2J\x1b[H");
    process.stdout.write(
      `${this.renderDataHeader()}\n` +
        `${this.renderglobalStatsSection()}\n\n` +
        `${this.rendercurrentStatsSection()}\n` +
        `${this.renderOutputDataSection()}\n\n` +
        `${this.renderLoggingSection()}`,
    );
  }

  private renderDataHeader() {
    return (
      `╒═══════════════════════════════════════════════════════════════════════╕\n` +
      `│ Doollee Archivist Author & Works Scraper                              │\n` +
      `╘═══════════════════════════════════════════════════════════════════════╛`
    );
  }

  private renderglobalStatsSection() {
    const startTime = this.getStartTime();
    const elapsedTime = this.getElapsedTime();
    const batchSize = this.toPaddedString(this.globalStats.globalBatchSize, 4);
    const totalBatches = this.toPaddedString(this.globalStats.globalBatchCount, 3);

    return (
      `┌─ Time Started:  ${startTime}       ` +
      `┌─ Batch Size:     ${batchSize}\n` +
      `└─ Duration:     ${elapsedTime}       ` +
      `└─ Total Batches:  ${totalBatches}`
    );
  }

  private rendercurrentStatsSection() {
    const totalBatches = this.toPaddedString(this.globalStats.globalBatchCount, 3);
    const currentBatchIndex = this.toPaddedString(this.currentStats.currentBatchIndex + 1, 3);
    const currentAuthorIndex = this.toPaddedString(this.currentStats.currentAuthorIndex + 1, 4);
    const currentPlayIndex = this.toPaddedString(this.currentStats.currentPlayIndex + 1, 3);
    const authorsByBatchCount = this.toPaddedString(this.currentStats.authorsByBatchCount, 4);
    const playsByAuthorCount = this.toPaddedString(this.currentStats.playsByAuthorCount, 3);
    const firstAuthorName = this.currentStats.firstAuthorName?.toLowerCase().replace(/\s+/g, "").slice(0, 10);
    const lastAuthorName = this.currentStats.lastAuthorName?.toLowerCase().replace(/\s+/g, "").slice(0, 10);
    const currentAuthorUrl = this.currentStats.currentAuthorUrl?.replace(config.baseUrl, "").slice(0, 21);

    return (
      `┌─ Current Batch:    ` +
      `${currentBatchIndex} /  ${totalBatches}  ` +
      `(${firstAuthorName} - ${lastAuthorName})\n` +
      `├─ Current Author:  ` +
      `${currentAuthorIndex} / ${authorsByBatchCount}  ` +
      `(${currentAuthorUrl})\n` +
      `└─ Current Play:     ` +
      `${currentPlayIndex} /  ${playsByAuthorCount}`
    );
  }

  private renderOutputDataSection() {
    const batchAuthorsWritten = this.toPaddedString(this.authorStats.batchAuthorsWritten, 4);
    const batchAuthorsSkipped = this.toPaddedString(this.authorStats.batchAuthorsSkipped, 4);
    const batchAuthorsFlagged = this.toPaddedString(this.authorStats.batchAuthorsFlagged, 4);
    const totalAuthorsWritten = this.toPaddedString(this.authorStats.totalAuthorsWritten, 5);
    const totalAuthorsSkipped = this.toPaddedString(this.authorStats.totalAuthorsSkipped, 5);
    const totalAuthorsFlagged = this.toPaddedString(this.authorStats.totalAuthorsFlagged, 5);
    const batchPlaysWritten = this.toPaddedString(this.playStats.batchPlaysWritten, 5);
    const batchPlaysSkipped = this.toPaddedString(this.playStats.batchPlaysSkipped, 5);
    const batchPlaysFlagged = this.toPaddedString(this.playStats.batchPlaysFlagged, 5);
    const totalPlaysWritten = this.toPaddedString(this.playStats.totalPlaysWritten, 6);
    const totalPlaysSkipped = this.toPaddedString(this.playStats.totalPlaysSkipped, 6);
    const totalPlaysFlagged = this.toPaddedString(this.playStats.totalPlaysFlagged, 6);

    return (
      `          ┌─────── Current Batch ───────┐ ┌─────── All Batches ─────────┐\n` +
      `          │ Written │ Skipped │ Flagged │ │ Written │ Skipped │ Flagged │\n` +
      `┌─────────┼─────────┼─────────┼─────────┤ ├─────────┼─────────┼─────────┤\n` +
      `│ Authors ` +
      `│   ${batchAuthorsWritten}  │   ${batchAuthorsSkipped}  │   ${batchAuthorsFlagged}  │ ` +
      `│   ${totalAuthorsWritten} │   ${totalAuthorsSkipped} │   ${totalAuthorsFlagged} │\n` +
      `│ Plays   ` +
      `│   ${batchPlaysWritten} │   ${batchPlaysSkipped} │   ${batchPlaysFlagged} │ ` +
      `│  ${totalPlaysWritten} │  ${totalPlaysSkipped} │  ${totalPlaysFlagged} │\n` +
      `└─────────┴─────────┴─────────┴─────────┘ └─────────┴─────────┴─────────┘`
    );
  }

  private renderLoggingSection() {
    const { logFile, warningsLogged, errorsLogged, lastLoggedLines, tailLength } = this.loggingStats;
    const logDir = logFile || "N/A";
    const warnings = this.toPaddedString(warningsLogged, 5);
    const errors = this.toPaddedString(errorsLogged, 5);
    const tailLines = lastLoggedLines
      .slice(-tailLength)
      .map((line) => `  ${line}`)
      .join("\n");

    return (
      `┌─ Log Output: ${logDir}\n` + `├─ ${warnings} Warnings  /  ${errors} Errors\n` + `└─ Tail:\n` + `${tailLines}`
    );
  }

  // ============================================================================
  // Rendering Methods - Summary
  // ============================================================================

  private renderSummary() {
    // clear the screen and redraw the display
    process.stdout.write("\x1b[2J\x1b[H");
    process.stdout.write(`${this.renderSummaryHeader()}\n`);

    process.stdout.write("\x1b[2J\x1b[H");
    process.stdout.write(
      `${this.renderSummaryHeader()}\n` +
        `${this.renderSummaryStatsSection()}\n\n` +
        `${this.renderOutputSummary()}\n` +
        `${this.renderReviewSummary()}\n\n`,
    );
  }

  private renderSummaryHeader() {
    return (
      `╒═══════════════════════════════════════════════════════════════════════╕\n` +
      `│ Doollee Archivist - Scraping Complete                                 │\n` +
      `╘═══════════════════════════════════════════════════════════════════════╛`
    );
  }

  private getRuntime(startTime: number, endTime: number): string {
    const HOUR = 3600000;
    const MINUTE = 60000;
    const SECOND = 1000;
    const diff = endTime - startTime;

    return (
      `${this.toPaddedString(Math.floor(diff / HOUR), 2)}:` +
      `${this.toPaddedString(Math.floor((diff % HOUR) / MINUTE), 2)}:` +
      `${this.toPaddedString(Math.floor((diff % MINUTE) / SECOND), 2)}`
    );
  }

  private getSuccessRate(successCount: number, skipCount: number): string {
    if (successCount + skipCount === 0) {
      return "100.0";
    }
    return ((successCount / (successCount + skipCount)) * 100).toFixed(1);
  }

  private getLogFileData() {
    const stats = fs.statSync(this.loggingStats.logFile);
    const fileSizeInKB = (stats.size / 1024).toFixed(2);

    const content = fs.readFileSync(this.loggingStats.logFile, "utf-8");
    const lineCount = content.split("\n").length;

    return {
      fileSizeInKB,
      lineCount,
    };
  }
  private renderSummaryStatsSection() {
    const startTime = this.globalStats.startTime?.getTime();
    const endTime = this.globalStats.endTime?.getTime();
    const runtime = startTime && endTime ? this.getRuntime(startTime, endTime) : "N/A";

    const batchCount = this.globalStats.completedBatchCount; // TODO
    const authorCount = this.authorStats.totalAuthorsWritten;
    const playCount = this.playStats.totalPlaysWritten;
    const adaptationCount = ""; // TODO

    const authorsSkipped = this.authorStats.totalAuthorsSkipped;
    const playsSkipped = this.playStats.totalPlaysSkipped;

    const authorSuccessRate = this.getSuccessRate(authorCount, authorsSkipped);
    const playSuccessRate = this.getSuccessRate(playCount, playsSkipped);
    return (
      `SUMMARY STATISTICS\n` +
      `├─ Total Runtime:         ${runtime}\n` +
      `├─ Authors Processed:     ${authorCount} authors across ${batchCount} batches\n` +
      `├─ Plays Catalogued:      ${playCount} plays (including ${adaptationCount} adaptations)\n` +
      `├─ Author Success Rate:   ${authorSuccessRate}% (${authorsSkipped} authors skipped due to errors)\n` +
      `└─ Play Success Rate:     ${playSuccessRate}% (${playsSkipped} plays skipped due to errors)\n`
    );
  }

  private renderOutputSummary() {
    const outputType = config.writeTo;

    let outputLocationLine = "";
    if (outputType === "db") {
      outputLocationLine = `Database:   Connected to MongoDB cluster`;
    }
    if (outputType === "file") {
      outputLocationLine = `Files:     Directories written to ./output/`;
    }

    const { fileSizeInKB, lineCount } = this.getLogFileData();
    return (
      `OUTPUT LOCATIONS\n` +
      `┌─ ${outputLocationLine}\n` +
      `├─ Logs:      ./${this.loggingStats.logFile}\n` +
      `└─ Log Size:      ${fileSizeInKB} KB (${lineCount} lines)`
    );
  }

  private renderReviewSummary() {
    const outputType = config.writeTo;
    const flaggedAuthors = this.authorStats.totalAuthorsFlagged;
    const flaggedPlays = this.playStats.totalPlaysFlagged;
    const scrapeErrors = 0; // TODO
    const validationErrors = 0; // TODO
    const writeErrors = 0; // TODO
    const otherErrors = 0; // TODO
    const reviewFilePath = ""; // TODO

    let writeErrorLine = "";
    if (outputType === "file") {
      writeErrorLine = `Write Errors:      ${writeErrors} errors encountered when writing files`;
    }
    if (outputType === "db") {
      writeErrorLine = `Write Errors:      ${writeErrors} errors encountered when inserting documents`;
    }

    return (
      `REVIEW REQUIRED\n` +
      `┌─ Flagged Authors:   ${flaggedAuthors} authors need manual review\n` +
      `├─ Flagged Plays:     ${flaggedPlays} plays need verification\n` +
      `├─ Scrape Errors:     ${scrapeErrors} biography sections failed extraction\n` +
      `├─ Validation Errors: ${validationErrors} authors had incomplete required fields\n` +
      `├─ ${writeErrorLine}\n` +
      `├─ Other Errors:      ${otherErrors} other errors encountered\n` +
      `└─ Review File:       ${reviewFilePath}\n`
    );
  }
}

export default ProgressDisplay;
