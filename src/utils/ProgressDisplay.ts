import fs from "fs";
import config from "#/core/Config";

type DisplayData = {
  batchTotal: number;
  currentBatch: number;
  batchSize: number;
  authorCount: number;
  totalAuthors: number;
  playCount: number;
  totalPlays: number;
  currentUrl: string;
};

type UpdateDisplayDoc = Partial<DisplayData>;

class ProgressDisplay {
  private data: DisplayData = {
    batchTotal: 1,
    currentBatch: 1,
    batchSize: 100,
    authorCount: 0,
    playCount: 0,
    totalAuthors: 0,
    totalPlays: 0,
    currentUrl: "",
  };

  private lastLogMessage = "";
  private logFile: string;
  private originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
  };

  constructor(data: UpdateDisplayDoc = {}) {
    this.data = { ...this.data, ...data };
    const timestamp = new Date().toISOString().replace(/:/g, "-");
    this.logFile = `output/${timestamp}.log`;
    this.setupLogInterception();
  }

  private setupLogInterception() {
    const logToFile = (level: string, message: string, useUrl?: boolean) => {
      const timestamp = `[${new Date().toISOString()}]`;
      const severity = level.toUpperCase();
      const url = useUrl ? ` (${this.stripBaseUrl(this.data.currentUrl)}) -` : "";
      const logMessage = `${timestamp} ${severity}:${url} ${message} \n`;
      this.lastLogMessage = `${severity}:${url} ${message}`;
      fs.appendFileSync(this.logFile, logMessage);
      // Don't auto-render on every log - only when display data changes
    };

    console.log = (...args) => {
      const message = args.join(" ");
      logToFile("info", message);
    };

    console.error = (...args) => {
      const message = args.join(" ");
      logToFile("error", message, true);
    };

    console.warn = (...args) => {
      const message = args.join(" ");
      logToFile("warn", message, true);
    };
  }

  public updateDisplay(data: UpdateDisplayDoc) {
    this.data = { ...this.data, ...data };
    this.render();
  }

  private render() {
    // Always clear screen and rewrite everything from top
    process.stdout.write("\x1b[2J\x1b[H"); // Clear screen, go to home

    const { batchTotal, currentBatch, batchSize, authorCount, totalAuthors, playCount, totalPlays, currentUrl } =
      this.data;
    process.stdout.write(`Batch: ${currentBatch} / ${batchTotal} (Size: ${batchSize})\n`);
    process.stdout.write(`-------------------------\n`);
    process.stdout.write(`Current URL:       ${this.truncateUrl(currentUrl)}\n`);
    process.stdout.write(`Authors Processed: ${authorCount} / ${totalAuthors}\n`);
    process.stdout.write(`Plays Processed:   ${playCount} / ${totalPlays}\n`);
    process.stdout.write(`-------------------------\n`);
    process.stdout.write(`Last Log: ${this.truncateLog(this.lastLogMessage)}`);
  }

  private stripBaseUrl(url: string): string {
    return url.replace(config.baseUrl, "");
  }

  private truncateString(str: string, maxLength: number): string {
    return str.length > maxLength ? `${str.substring(0, maxLength)}...` : str;
  }

  private truncateLog = (message: string) => this.truncateString(message, 70);
  private truncateUrl = (url: string) => this.truncateString(this.stripBaseUrl(url), 50);

  public complete() {
    Object.assign(console, this.originalConsole);
  }

  public summary() {
    // TODO: Update with more useful stats, lists of errors, etc.
    const { totalAuthors, totalPlays } = this.data;
    process.stdout.write("\x1b[2J\x1b[H");
    process.stdout.write(`\nProcessing complete\n`);
    process.stdout.write(`        Authors Processed: ${totalAuthors}\n`);
    process.stdout.write(`        Plays Processed:   ${totalPlays}\n`);
    process.stdout.write(`        Log file: ${this.logFile}\n`);
  }
}

export default ProgressDisplay;
