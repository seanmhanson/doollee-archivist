import type { Page } from "playwright";

import type { PageMetadata, WaitUntilConditions } from "#/types";
import config from "#/core/Config";

/**
 * Supports both direct URL scraping and parameterized URL construction.
 * Enables flexible page targeting for batch processing vs single-page extraction.
 * @template T - Additional parameters for URL construction specific to a given page.
 */
export type BasePageArgs<T> = { url: string } | T;

/**
 * Foundation for doollee.com page scrapers with graceful error handling.
 * Provides navigation, extraction scaffolding, and metadata recording.
 * @template Args - Parameters for URL construction specific to a given page.
 * @template Data - Structured content extracted from the page DOM.
 */
export default abstract class BasePage<Args extends object, Data extends object> {
  /**
   * Base URL used in construction any full page URLs
   */
  protected static baseUrl: string = config.baseUrl;

  /**
   * Playwright Page instance providing browser context for DOM interaction and navigation.
   */
  protected readonly page: Page;

  /**
   * Full resolved URL of the target page.
   */
  public readonly url: string;

  /**
   * Data assembled during extraction, including errors and status codes.
   */
  public readonly metadata: PageMetadata = {};

  /**
   * Structured content extracted from page DOM.
   */
  public abstract readonly data: Data;

  /**
   * Initializes scraper with browser context and target URL resolution.
   * @param page Playwright Page instance for DOM interaction and navigation.
   * @param pageArgs Either direct URL or parameters for URL construction.
   */
  constructor(page: Page, pageArgs: BasePageArgs<Args>) {
    this.page = page;
    if ("url" in pageArgs) {
      this.url = pageArgs.url;
    } else {
      this.url = this.constructUrl(pageArgs);
    }
  }

  /**
   * Builds target URL from page-specific parameters.
   * @param args Parameters for URL construction specific to a given page.
   * @returns Fully constructed URL string.
   */
  public abstract constructUrl(args: Args): string;

  /**
   * Performs DOM parsing and data extraction after successful navigation.
   * Implementation populates the `data` property with structured page content.
   */
  public abstract extractPage(): Promise<void>;

  /**
   * Navigates to target URL with graceful 404 handling for batch processing.
   * Records errors in metadata without interrupting scraping operations.
   * @param options Navigation options including waitUntil and timeout.
   */
  async goto(options?: { waitUntil?: WaitUntilConditions; timeout?: number }): Promise<void> {
    const defaultOptions = {
      waitUntil: "domcontentloaded" as const,
      timeout: config.pageTimeout,
    };
    const gotoOptions = { ...defaultOptions, ...options };

    console.debug(`🔗 Attempting navigation to: ${this.url}`);

    try {
      const response = await this.page.goto(this.url, gotoOptions);
      const statusCode = response?.status();

      if (statusCode === 404) {
        console.log(`⚠️  404 Not Found: ${this.url}`);
        this.recordError({
          url: this.url,
          error: "404 Not Found",
          timestamp: new Date().toISOString(),
          statusCode,
        });
      } else if (statusCode && statusCode >= 400) {
        console.log(`⚠️  HTTP ${statusCode}: ${this.url}`);
        this.recordError({
          url: this.url,
          timestamp: new Date().toISOString(),
          statusCode,
        });
      } else {
        console.debug(`✅ Successfully navigated to: ${this.url}`);
      }
    } catch (error) {
      console.log(`❌ Navigation failed for: ${this.url}`);
      console.log(`   Error: ${error}`);
      throw error;
    }
  }

  /**
   * Extracts text from first matching element
   * @param selector selector for Locator to match an element
   * @returns Text content of the element or empty string if not found.
   */
  protected async getTextContent(selector: string): Promise<string> {
    return (await this.page.locator(selector).textContent()) || "";
  }

  /**
   * Extracts text from all matching elements
   * @param selector selector for Locator to match multiple elements
   * @returns Array of text contents from all matched elements.
   */
  protected async getAllTextContents(selector: string): Promise<string[]> {
    const elements = await this.page.locator(selector).all();
    const texts = await Promise.all(elements.map(async (element) => (await element.textContent()) || ""));
    return texts;
  }

  /**
   * Waits for dynamic content to load before extraction.
   * @param selector Selector of the element to wait for.
   * @param timeout Maximum wait time in milliseconds.
   */
  protected async waitForSelector(selector: string, timeout = config.elementTimeout): Promise<void> {
    await this.page.waitForSelector(selector, { timeout });
  }

  /**
   * Records extraction failures without interrupting batch processing.
   * @param errorData Partial metadata about the error encountered.
   */
  protected recordError(errorData: Partial<PageMetadata>): void {
    Object.assign(this.metadata, errorData);
  }
}
