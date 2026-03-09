import { describe, expect, it, beforeEach, afterEach } from "@jest/globals";

import { getConfig, resetConfig, defaults } from "../Config";

describe("core/Config", () => {
  let initialEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    initialEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = initialEnv;
    resetConfig();
  });

  describe("default behavior", () => {
    it("should have default values for all configuration options", () => {
      const defaultInstance = getConfig();

      // selected standard required properties
      expect(defaultInstance.dbName).toBe(defaults.DB_NAME);

      // selected custom required properties
      expect(defaultInstance.writeTo).toBe(defaults.WRITE_TO);
      expect(defaultInstance.maxBatches).toBe(parseInt(defaults.MAX_BATCHES, 10));
      expect(defaultInstance.tailLength).toBe(parseInt(defaults.TAIL_LENGTH, 10));
      expect(defaultInstance.logFile).toBe(defaults.LOG_FILE);
    });
  });

  describe("environment overrides", () => {
    it("should override default values with environment variables", () => {
      process.env.MONGO_URI = "mongodb://test-uri";
      process.env.DB_NAME = "test-db";
      process.env.WRITE_TO = "file";
      process.env.MAX_BATCHES = "5";
      process.env.TAIL_LENGTH = "50";
      process.env.LOG_FILE = "test.log";
      const config = getConfig();

      expect(config.mongoUri).toEqual("mongodb://test-uri");
      expect(config.dbName).toEqual("test-db");
      expect(config.writeTo).toEqual("file");
      expect(config.maxBatches).toEqual(5);
      expect(config.tailLength).toEqual(50);
      expect(config.logFile).toEqual("test.log");
    });
  });

  describe("validation", () => {
    it("throws an error for missing required env variables", () => {
      const expectedError = /Missing required configuration for MONGO_URI/;
      delete process.env.MONGO_URI;

      expect(() => getConfig()).toThrow(expectedError);
    });

    it("throws an error for invalid integer values", () => {
      const expectedError = /Invalid integer value for PAGE_TIMEOUT/;
      process.env.PAGE_TIMEOUT = "not-an-integer";

      expect(() => getConfig()).toThrow(expectedError);
    });

    it("throws an error for invalid WRITE_TO values", () => {
      const expectedError = /Invalid value for WRITE_TO/;
      process.env.WRITE_TO = "invalid-value";

      expect(() => getConfig()).toThrow(expectedError);
    });

    it("throws an error for invalid TAIL_LENGTH values", () => {
      const expectedError = /Invalid value for TAIL_LENGTH/;
      process.env.TAIL_LENGTH = "0";

      expect(() => getConfig()).toThrow(expectedError);
    });

    it("throws an error for invalid LOG_FILE values", () => {
      const expectedError = /Invalid value for LOG_FILE/;
      process.env.LOG_FILE = "invalid-file-name.txt";

      expect(() => getConfig()).toThrow(expectedError);
    });
  });
});
