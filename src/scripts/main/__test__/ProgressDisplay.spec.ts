import { jest, describe, it, expect, beforeEach, afterEach } from "@jest/globals";

import ProgressDisplay from "../ProgressDisplay";

import * as Config from "#/core/Config";
import { DEFAULT_TEST_CONFIG } from "#/test-utils/mockConfig";

jest.mock("fs", () => ({
  existsSync: jest.fn(() => true),
  mkdirSync: jest.fn(),
  appendFileSync: jest.fn(),
  statSync: jest.fn(() => ({ size: 1024 })),
  readFileSync: jest.fn(() => "line1\nline2\nline3"),
}));

const testConfig = {
  ...DEFAULT_TEST_CONFIG,
  logDirectory: "/tmp/test-logs",
  logFile: "/tmp/test-logs/test.log",
  tailLength: 3,
};

describe("ProgressDisplay", () => {
  let display: InstanceType<typeof ProgressDisplay>;
  let originalConsoleLog: typeof console.log;
  let originalConsoleWarn: typeof console.warn;
  let originalConsoleError: typeof console.error;

  beforeEach(() => {
    jest.spyOn(Config, "getConfig").mockReturnValue(testConfig as Config.Config);

    originalConsoleLog = console.log;
    originalConsoleWarn = console.warn;
    originalConsoleError = console.error;

    display = new ProgressDisplay();
  });

  afterEach(() => {
    display.close();
    // Restore console after close
    console.log = originalConsoleLog;
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
    jest.restoreAllMocks();
  });

  describe("constructor", () => {
    it("should set isReady to true after construction", () => {
      expect(display.isReady).toBe(true);
    });
  });

  describe("close", () => {
    it("should set isReady to false", () => {
      display.close();
      expect(display.isReady).toBe(false);
    });

    it("should restore original console methods", () => {
      // After construction, console methods are intercepted
      const interceptedLog = console.log;
      display.close();

      // After close, console methods should be restored (not the intercepted ones)
      expect(console.log).not.toBe(interceptedLog);
    });
  });

  describe("update", () => {
    it("should not throw when called with empty data", () => {
      expect(() => display.update()).not.toThrow();
    });

    it("should not throw when called with partial data", () => {
      expect(() =>
        display.update({
          globalStats: { globalBatchSize: 10 },
          currentStats: { currentBatchIndex: 1 },
        }),
      ).not.toThrow();
    });

    it("should not throw when force update is requested", () => {
      // Mock stdout.write to prevent actual terminal output
      const originalWrite = process.stdout.write;
      process.stdout.write = jest.fn() as unknown as typeof process.stdout.write;

      expect(() => display.update({}, true)).not.toThrow();

      process.stdout.write = originalWrite;
    });

    it("should render to stdout on forced update", () => {
      const originalWrite = process.stdout.write;
      const writeMock = jest.fn();
      process.stdout.write = writeMock as unknown as typeof process.stdout.write;

      display.update(
        {
          authorStats: { totalAuthorsWritten: 5, batchAuthorsWritten: 2 },
          playStats: { totalPlaysWritten: 50, batchPlaysWritten: 10 },
        },
        true,
      );

      expect(writeMock).toHaveBeenCalled();
      process.stdout.write = originalWrite;
    });
  });

  describe("console interception", () => {
    it("should intercept console.log", () => {
      const mockFs = jest.requireMock<{ appendFileSync: jest.Mock }>("fs");

      // Console is intercepted after construction
      console.log("test message");

      expect(mockFs.appendFileSync).toHaveBeenCalledWith(
        expect.stringContaining("test"),
        expect.stringContaining("test message"),
      );
    });

    it("should intercept console.warn", () => {
      const mockFs = jest.requireMock<{ appendFileSync: jest.Mock }>("fs");

      console.warn("warning message");

      expect(mockFs.appendFileSync).toHaveBeenCalledWith(
        expect.stringContaining("test"),
        expect.stringContaining("warning message"),
      );
    });

    it("should intercept console.error", () => {
      const mockFs = jest.requireMock<{ appendFileSync: jest.Mock }>("fs");

      console.error("error message");

      expect(mockFs.appendFileSync).toHaveBeenCalledWith(
        expect.stringContaining("test"),
        expect.stringContaining("error message"),
      );
    });
  });
});
