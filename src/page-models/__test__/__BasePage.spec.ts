import { jest, describe, it, expect, beforeEach, afterEach } from "@jest/globals";

import BasePage from "../__BasePage";

import type { PageMetadata } from "#/types";
import type { BasePageArgs } from "../__BasePage";
import type { Page } from "playwright";

import { mockConfig } from "#/test-utils/mockConfig";

type StatusFn = () => number;
type MockResponse = { status: StatusFn } | null;
type MockGoto<T> = (url: string, options: unknown) => Promise<T>;
type MockTextElement = {
  textContent: jest.Mock<() => Promise<string | null>>;
};

const DEFAULT_URL = "https://test.url";

class TestBasePage extends BasePage<{ id: string }, { title: string }> {
  public data = { title: "" };

  constructor(page: Page, pageArgs?: BasePageArgs<{ id: string }>) {
    const args = pageArgs ?? { url: DEFAULT_URL }; // Use default URL if no args provided
    super(page, args);
  }

  constructUrl(args: { id: string }): string {
    return `${BasePage.baseUrl}/test/${args.id}`;
  }

  async extractPage(): Promise<void> {
    this.data.title = await this.getTextContent("h1");
  }

  public async _getTextContent(selector: string): Promise<string> {
    return this.getTextContent(selector);
  }

  public async _getAllTextContents(selector: string): Promise<string[]> {
    return this.getAllTextContents(selector);
  }

  public async _waitForSelector(selector: string, timeout?: number): Promise<void> {
    return this.waitForSelector(selector, timeout);
  }

  public _recordError(errorInfo: Partial<PageMetadata>): void {
    return this.recordError(errorInfo);
  }
}

mockConfig();

describe("BasePage", () => {
  const originalLog = console.log;
  const originalDebug = console.debug;

  beforeEach(() => {
    console.log = jest.fn();
    console.debug = jest.fn();
  });

  afterEach(() => {
    console.log = originalLog;
    console.debug = originalDebug;
    jest.clearAllMocks();
  });

  function getMockPage(overrides: Record<string, unknown> = {}): Page {
    return {
      goto: jest.fn(),
      locator: jest.fn(),
      waitForSelector: jest.fn(),
      ...overrides,
    } as unknown as Page;
  }

  function getMockTextElement(text: string | null): MockTextElement {
    return { textContent: jest.fn<() => Promise<string | null>>().mockResolvedValue(text) };
  }

  describe("constructor", () => {
    function setupMockPage({ url, id }: { url?: string; id?: string } = {}) {
      const args = url ? { url } : id ? { id } : undefined;
      const mockPage = getMockPage();
      const page = new TestBasePage(mockPage, args);
      return { mockPage, page };
    }

    it("should initialize with URL from arguments", () => {
      const url = "https://custom.url/test";
      const { page } = setupMockPage({ url });
      expect(page.url).toBe(url);
    });

    it("should construct URL from arguments", () => {
      const { page } = setupMockPage({ id: "123" });
      expect(page.url).toBe("https://www.doollee.com/test/123");
    });

    it("should initialize with empty metadata", () => {
      const { page } = setupMockPage();
      expect(page.metadata).toEqual({});
    });
  });

  describe("goto", () => {
    function setupMockPage({ statusCode, errorMessage }: { statusCode: number | null; errorMessage?: string }) {
      if (errorMessage) {
        const mockGoto = jest.fn<MockGoto<never>>().mockRejectedValue(new Error(errorMessage));
        const mockPage = getMockPage({ goto: mockGoto });
        const page = new TestBasePage(mockPage);
        return { mockGoto, mockPage, page };
      }

      if (statusCode !== null) {
        const mockResponse: MockResponse = { status: jest.fn<StatusFn>().mockReturnValue(statusCode) };
        const mockGoto = jest.fn<MockGoto<MockResponse>>().mockResolvedValue(mockResponse);
        const mockPage = getMockPage({ goto: mockGoto });
        const page = new TestBasePage(mockPage);
        return { mockGoto, mockPage, page };
      }

      const mockGoto = jest.fn<MockGoto<null>>().mockResolvedValue(null);
      const mockPage = getMockPage({ goto: mockGoto });
      const page = new TestBasePage(mockPage);
      return { mockGoto, mockPage, page };
    }

    it("should navigate successfully with default options", async () => {
      const { mockGoto, page } = setupMockPage({ statusCode: 200 });
      await page.goto();

      expect(mockGoto).toHaveBeenCalledWith(DEFAULT_URL, {
        waitUntil: "domcontentloaded",
        timeout: 10000,
      });
      expect(console.debug).toHaveBeenCalledWith(`🔗 Attempting navigation to: ${DEFAULT_URL}`);
      expect(console.debug).toHaveBeenCalledWith(`✅ Successfully navigated to: ${DEFAULT_URL}`);
    });

    it("should accept custom options", async () => {
      const { mockGoto, page } = setupMockPage({ statusCode: 200 });
      await page.goto({ waitUntil: "networkidle", timeout: 5000 });

      expect(mockGoto).toHaveBeenCalledWith(DEFAULT_URL, { waitUntil: "networkidle", timeout: 5000 });
    });

    it("should handle 404 errors gracefully", async () => {
      const { page } = setupMockPage({ statusCode: 404 });
      await page.goto();

      expect(console.log).toHaveBeenCalledWith(`⚠️  404 Not Found: ${DEFAULT_URL}`);
      expect(page.metadata).toMatchObject({
        url: DEFAULT_URL,
        error: "404 Not Found",
        statusCode: 404,
      });
      expect(page.metadata.timestamp).toBeDefined();
    });

    it("should handle other HTTP errors (400+)", async () => {
      const { page } = setupMockPage({ statusCode: 500 });
      await page.goto();

      expect(console.log).toHaveBeenCalledWith(`⚠️  HTTP 500: ${DEFAULT_URL}`);
      expect(page.metadata).toMatchObject({ url: DEFAULT_URL, statusCode: 500 });
      expect(page.metadata.timestamp).toBeDefined();
    });

    it("should handle null response", async () => {
      const { page } = setupMockPage({ statusCode: null });
      await page.goto();

      expect(console.debug).toHaveBeenCalledWith(`✅ Successfully navigated to: ${DEFAULT_URL}`);
    });

    it("should throw error on navigation failure", async () => {
      const { page } = setupMockPage({ statusCode: null, errorMessage: "Network error" });
      await expect(page.goto()).rejects.toThrow(`Navigation failed for: ${DEFAULT_URL}`);
    });
  });

  describe("getTextContent", () => {
    function setupMockPage(text: string | null) {
      const mockTextElement = getMockTextElement(text);
      const mockLocator = jest.fn().mockReturnValue(mockTextElement);
      const mockPage = getMockPage({ locator: mockLocator });
      const page = new TestBasePage(mockPage);
      return { mockLocator, mockTextElement, mockPage, page };
    }

    it("should extract text content from element", async () => {
      const { mockLocator, mockTextElement, page } = setupMockPage("Hello World");

      const result = await page._getTextContent("h1");
      expect(mockLocator).toHaveBeenCalledWith("h1");
      expect(mockTextElement.textContent).toHaveBeenCalled();
      expect(result).toBe("Hello World");
    });

    it("should return empty string when text content is null", async () => {
      const { page } = setupMockPage(null);

      const result = await page._getTextContent("h1");
      expect(result).toBe("");
    });
  });

  describe("getAllTextContents", () => {
    function setupMockPage(texts: (string | null)[] = []) {
      const elements = texts.map((text) => getMockTextElement(text));
      const mockAll = jest.fn<() => Promise<MockTextElement[]>>().mockResolvedValue(elements);
      const mockLocator = jest.fn().mockReturnValue({ all: mockAll });
      const mockPage = getMockPage({ locator: mockLocator });
      const page = new TestBasePage(mockPage);
      return {
        mockAll,
        mockLocator,
        mockPage,
        page,
      };
    }

    it("should extract text from all matching elements", async () => {
      const textValues = ["Item 1", "Item 2", "Item 3"];
      const { mockAll, mockLocator, page } = setupMockPage(textValues);

      const result = await page._getAllTextContents("li");
      expect(mockLocator).toHaveBeenCalledWith("li");
      expect(mockAll).toHaveBeenCalled();
      expect(result).toEqual(textValues);
    });

    it("should handle null text content in elements", async () => {
      const textValues = ["Item 1", null, "Item 3"];
      const expectedTextValues = textValues.map((text) => text ?? "");
      const { page } = setupMockPage(textValues);

      const result = await page._getAllTextContents("li");
      expect(result).toEqual(expectedTextValues);
    });

    it("should return empty array when no elements match", async () => {
      const { page } = setupMockPage();

      const result = await page._getAllTextContents("li");
      expect(result).toEqual([]);
    });
  });

  describe("waitForSelector", () => {
    function setupMockPage() {
      const mockWaitForSelector = jest
        .fn<(selector: string, options: unknown) => Promise<void>>()
        .mockResolvedValue(undefined);
      const mockPage = getMockPage({ waitForSelector: mockWaitForSelector });
      const page = new TestBasePage(mockPage);
      return { mockWaitForSelector, mockPage, page };
    }

    it("should wait for selector with default timeout", async () => {
      const { mockWaitForSelector, page } = setupMockPage();
      await page._waitForSelector(".dynamic-content");

      expect(mockWaitForSelector).toHaveBeenCalledWith(".dynamic-content", { timeout: 30000 });
    });

    it("should wait for selector with custom timeout", async () => {
      const { mockWaitForSelector, page } = setupMockPage();
      await page._waitForSelector(".dynamic-content", 10000);

      expect(mockWaitForSelector).toHaveBeenCalledWith(".dynamic-content", { timeout: 10000 });
    });
  });

  describe("recordError", () => {
    function setupMockPage() {
      const mockPage = getMockPage();
      const page = new TestBasePage(mockPage);
      return { mockPage, page };
    }

    it("should record error metadata", () => {
      const { page } = setupMockPage();
      const expectedError = {
        url: DEFAULT_URL,
        error: "Something went wrong",
        statusCode: 500,
      };

      page._recordError(expectedError);
      expect(page.metadata).toMatchObject(expectedError);
    });

    it("should merge multiple error recordings", () => {
      const { page } = setupMockPage();
      page._recordError({ error: "First error" });
      page._recordError({ statusCode: 404 });

      expect(page.metadata).toMatchObject({
        error: "First error",
        statusCode: 404,
      });
    });
  });
});
