import { jest } from "@jest/globals";

import type { Config } from "#/core/Config";

import { defaults } from "#/core/Config";

type ConfigData = Omit<
  Config,
  "getEnvOrDefault" | "getIntEnvOrDefault" | "getWriteTo" | "getTailLength" | "getLogFile"
>;
type ConfigOverrides = Partial<ConfigData>;

export const DEFAULT_TEST_CONFIG: ConfigData = {
  mongoUri: "mongodb://localhost:27017",
  dbName: defaults.DB_NAME,
  baseUrl: defaults.BASE_URL,
  pageTimeout: parseInt(defaults.PAGE_TIMEOUT, 10),
  elementTimeout: parseInt(defaults.ELEMENT_TIMEOUT, 10),
  rateLimitDelay: parseInt(defaults.RATE_LIMIT_DELAY, 10),
  writeTo: defaults.WRITE_TO as "db" | "file" | "stage",
  batchSize: parseInt(defaults.BATCH_SIZE, 10),
  maxBatches: parseInt(defaults.MAX_BATCHES, 10),
  tailLength: parseInt(defaults.TAIL_LENGTH, 10),
  logDirectory: defaults.LOG_DIRECTORY,
  logFile: defaults.LOG_FILE,
  authorListPath: defaults.AUTHOR_LIST_PATH,
};

export function mockConfig(overrides: ConfigOverrides = {}): ConfigData {
  const mockConfigObject = { ...DEFAULT_TEST_CONFIG, ...overrides };

  jest.mock("#/core/Config", () => ({
    __esModule: true,
    getConfig: jest.fn(() => mockConfigObject),
    resetConfig: jest.fn(),
    defaults: defaults,
  }));

  return mockConfigObject;
}
