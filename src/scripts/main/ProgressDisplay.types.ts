type GlobalStats = {
  startTime?: Date;
  endTime?: Date;
  globalBatchSize: number;
  globalBatchCount: number;
  completedBatchCount: number;
  totalAdaptations: number;
  filesWritten: number;
};

const globalStats: GlobalStats = {
  startTime: undefined,
  endTime: undefined,
  globalBatchSize: 0,
  globalBatchCount: 0,
  completedBatchCount: 0,
  totalAdaptations: 0,
  filesWritten: 0,
};

type CurrentStats = {
  currentBatchIndex: number;
  currentAuthorIndex: number;
  currentPlayIndex: number;
  authorsByBatchCount: number;
  playsByAuthorCount: number;
  firstAuthorName?: string;
  lastAuthorName?: string;
  currentAuthorUrl?: string;
};

const currentStats: CurrentStats = {
  currentBatchIndex: 0,
  currentAuthorIndex: 0,
  currentPlayIndex: 0,
  authorsByBatchCount: 0,
  playsByAuthorCount: 0,
  firstAuthorName: "",
  lastAuthorName: "",
  currentAuthorUrl: "",
};

type AuthorStats = {
  totalAuthorsWritten: number;
  totalAuthorsSkipped: number;
  totalAuthorsFlagged: number;
  batchAuthorsWritten: number;
  batchAuthorsSkipped: number;
  batchAuthorsFlagged: number;
};

const authorStats: AuthorStats = {
  totalAuthorsWritten: 0,
  totalAuthorsSkipped: 0,
  totalAuthorsFlagged: 0,
  batchAuthorsWritten: 0,
  batchAuthorsSkipped: 0,
  batchAuthorsFlagged: 0,
};

type PlayStats = {
  totalPlaysWritten: number;
  totalPlaysSkipped: number;
  totalPlaysFlagged: number;
  batchPlaysWritten: number;
  batchPlaysSkipped: number;
  batchPlaysFlagged: number;
};

const playStats: PlayStats = {
  totalPlaysWritten: 0,
  totalPlaysSkipped: 0,
  totalPlaysFlagged: 0,
  batchPlaysWritten: 0,
  batchPlaysSkipped: 0,
  batchPlaysFlagged: 0,
};

type LoggingStats = {
  logDirectory: string;
  logFile: string;
  warningsLogged: number;
  errorsLogged: number;
  lastLoggedLines: string[];
  tailLength: number;
};

const loggingStats: LoggingStats = {
  logDirectory: "output",
  logFile: "",
  warningsLogged: 0,
  errorsLogged: 0,
  lastLoggedLines: [],
  tailLength: 1,
};

type DisplayData = {
  globalStats?: Partial<GlobalStats>;
  currentStats?: Partial<CurrentStats>;
  authorStats?: Partial<AuthorStats>;
  playStats?: Partial<PlayStats>;
};

type ErrorStats = {
  scrapeErrors: number;
  writeErrors: number;
  processErrors: number;
  otherErrors: number;
  networkErrors: number;
};

const errorStats: ErrorStats = {
  scrapeErrors: 0,
  writeErrors: 0,
  processErrors: 0,
  otherErrors: 0,
  networkErrors: 0,
};

export const defaults = {
  globalStats,
  currentStats,
  authorStats,
  playStats,
  loggingStats,
  errorStats,
};

export type { GlobalStats, AuthorStats, PlayStats, LoggingStats, CurrentStats, DisplayData, ErrorStats };
