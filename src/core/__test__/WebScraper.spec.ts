import { jest, describe, beforeEach, expect, afterEach, it } from "@jest/globals";
import { firefox } from "playwright";

import { TestWebScraper as WebScraper } from "../WebScraper";

import type { Browser, BrowserContext, Page } from "playwright";

jest.mock("playwright");

const mockedFirefox = jest.mocked(firefox);

// Default mock implementations for Playwright methods
const defaultMockPage = {
  on: jest.fn(),
  setExtraHTTPHeaders: jest.fn(),
  setViewportSize: jest.fn(),
};

const defaultMockContext = {
  newPage: jest.fn(),
};

const defaultMockBrowser = {
  isConnected: jest.fn(),
  newContext: jest.fn(),
  close: jest.fn(),
};

// Mock types
type MockBrowser = jest.Mocked<Browser>;
type MockBrowserContext = jest.Mocked<BrowserContext>;
type MockPage = jest.Mocked<Page>;

describe("core/WebScraper", () => {
  let mockBrowser: MockBrowser;
  let mockContext: MockBrowserContext;
  let mockPage: MockPage;

  beforeEach(() => {
    mockPage = defaultMockPage as unknown as MockPage;
    mockContext = defaultMockContext as unknown as MockBrowserContext;
    mockBrowser = defaultMockBrowser as unknown as MockBrowser;
    mockContext.newPage.mockResolvedValue(mockPage);
    mockBrowser.newContext.mockResolvedValue(mockContext);
    mockBrowser.isConnected.mockReturnValue(true);
    mockedFirefox.launch.mockResolvedValue(mockBrowser);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("when creating an instance", () => {
    it("should launch Firefox and initialize the page", async () => {
      const scraper = await WebScraper.create({ headless: true });

      expect(mockedFirefox.launch).toHaveBeenCalledWith(
        expect.objectContaining({
          headless: true,
          slowMo: 50,
        }),
      );
      expect(mockBrowser.newContext).toHaveBeenCalled();
      expect(mockContext.newPage).toHaveBeenCalled();
      expect(scraper.isConnected()).toBe(true);
    });

    it("should set extra HTTP headers and viewport size", async () => {
      await WebScraper.create();

      expect(mockPage.setExtraHTTPHeaders).toHaveBeenCalledWith(
        expect.objectContaining({
          "User-Agent": expect.any(String),
        }),
      );
      expect(mockPage.setViewportSize).toHaveBeenCalledWith(
        expect.objectContaining({
          width: 1280,
          height: 800,
        }),
      );
    });
  });

  describe("when getting the page", () => {
    it("should return the page instance", async () => {
      const scraper = await WebScraper.create();
      const page = scraper.getPage();

      expect(page).toBe(mockPage);
    });

    it("should throw if page is not initialized", () => {
      const scraper = new WebScraper();
      expect(() => scraper.getPage()).toThrow("⚠️  Browser page is not initialized");
    });
  });

  describe("when closing the browser", () => {
    it("should close the browser", async () => {
      const scraper = await WebScraper.create();
      await scraper.close();

      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it("should warn if browser is already closed", async () => {
      const scraper = await WebScraper.create();
      mockBrowser.isConnected.mockReturnValue(false);

      const consoleSpy = jest.spyOn(console, "warn");
      await scraper.close();

      expect(consoleSpy).toHaveBeenCalledWith("⚠️  Browser already closed");
    });
  });
});
