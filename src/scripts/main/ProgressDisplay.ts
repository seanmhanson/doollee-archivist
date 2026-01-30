import fs from "fs";
import config from "#/core/Config";

import type {
  GlobalStats,
  CurrentStats,
  AuthorStats,
  PlayStats,
  LoggingStats,
  DisplayData,
} from "#/scripts/main/ProgressDisplay.types";
import { defaults } from "#/scripts/main/ProgressDisplay.types";

class ProgressDisplay {
  private globalStats: GlobalStats = defaults.globalStats;
  private currentStats: CurrentStats = defaults.currentStats;
  private authorStats: AuthorStats = defaults.authorStats;
  private playStats: PlayStats = defaults.playStats;
  private loggingStats: LoggingStats = defaults.loggingStats;
  private isReadyFlag: boolean = false;

  private readonly originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
  };

  public get isReady() {
    return this.isReadyFlag;
  }

  private updateData(data: DisplayData = {}) {
    const { globalStats = {}, currentStats = {}, authorStats = {}, playStats = {} } = data;
    const { startTime, endTime, ...globalBatchStats } = globalStats;
    this.globalStats = { ...this.globalStats, ...globalBatchStats };
    this.currentStats = { ...this.currentStats, ...currentStats };
    this.authorStats = { ...this.authorStats, ...authorStats };
    this.playStats = { ...this.playStats, ...playStats };
  }

  constructor() {
    this.loggingStats = {
      ...this.loggingStats,
      logDirectory: config.logDirectory,
      logFile: config.logFile,
      tailLength: config.tailLength,
    };

    this.globalStats.startTime = new Date();
    this.setupLogFile();
    this.setupLogInterception();
    this.isReadyFlag = true;
  }

  private setupLogFile() {
    if (!this.globalStats.startTime) {
      this.globalStats.startTime = new Date();
    }

    const timestamp = this.globalStats.startTime.toISOString().replace(/:/g, "-");
    const outputDir = this.loggingStats.logDirectory;
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    if (!this.loggingStats.logFile) {
      this.loggingStats.logFile = `${outputDir}/${timestamp}.log`;
    }
  }

  private toPaddedString(num: number, length: number, padChar: string = "0"): string {
    return num.toString().padStart(length, padChar);
  }

  private getStartTime(): string {
    return this.globalStats.startTime?.toTimeString().slice(0, 8) || "";
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
      const strippedUrl = (this.currentStats.currentAuthorUrl || "").replace(config.baseUrl, "");
      const url = includeUrl && strippedUrl ? ` (${strippedUrl}) -` : "";
      const logMessage = `[${timestamp}] ${severity}:${url} ${message} \n`;

      if (this.loggingStats.lastLoggedLines.length >= this.loggingStats.tailLength!) {
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

    process.on("exit", () => this.complete());
    process.on("SIGINT", () => {
      this.complete();
      process.exit();
    });
  }

  public update(data: DisplayData = {}, forceUpdate = false) {
    this.updateData(data);
    // add logic for debouncing
    this.render();
  }

  private render() {
    // clear the screen and redraw the display
    process.stdout.write("\x1b[2J\x1b[H");
    process.stdout.write(
      `${this.renderDataHeader()}\n` +
        `${this.renderglobalStatsSection()}\n\n` +
        `${this.rendercurrentStatsSection()}\n` +
        `${this.renderOutputDataSection()}\n\n` +
        `${this.renderLoggingSection()}`
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
      .slice(-tailLength!)
      .map((line) => `  ${line}`)
      .join("\n");

    return (
      `┌─ Log Output: ${logDir}\n` + `├─ ${warnings} Warnings  /  ${errors} Errors\n` + `└─ Tail:\n` + `${tailLines}`
    );
  }

  public close() {
    Object.assign(console, this.originalConsole);
    this.isReadyFlag = false;
  }

  // public summary() {
  //   // TODO: Update with more useful stats, lists of errors, etc.
  //   const { totalAuthors, totalPlays } = this.data;
  //   process.stdout.write("\x1b[2J\x1b[H");
  //   process.stdout.write(`\nProcessing complete\n`);
  //   process.stdout.write(`        Authors Processed: ${totalAuthors}\n`);
  //   process.stdout.write(`        Plays Processed:   ${totalPlays}\n`);
  //   process.stdout.write(`        Log file: ${this.logFile}\n`);
  // }
}

export default ProgressDisplay;

