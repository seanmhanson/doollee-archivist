import { firefox } from "playwright";

import type { Browser, Page } from "playwright";

const httpHeaders = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
};
const viewport = { width: 1280, height: 800 };

// requirements for Firefox to ignore SSL errors
const firefoxUserPrefs = {
  "security.tls.ignore_certificate_errors": true,
  "security.insecure_connection_text.enabled": false,
};
const contextOptions = {
  ignoreHTTPSErrors: true,
  bypassCSP: true,
  acceptDownloads: false,
};

type BrowserOptions = {
  headless?: boolean;
  slowMo?: number;
};

export default class WebScraper {
  private browser: Browser | null = null;
  private page: Page | null = null;

  public isConnected(): boolean {
    return this.browser?.isConnected() ?? false;
  }

  private constructor() {}

  static async create({ headless = true, slowMo = 50 }: BrowserOptions = {}): Promise<WebScraper> {
    console.log("--------------------------------");
    console.log("  🏁 Creating a WebScraper Instance...");
    const instance = new WebScraper();
    await instance.initialize({ headless, slowMo });
    console.log("  ✅ WebScraper created successfully");
    console.log("--------------------------------");
    return instance;
  }

  private async initialize(options: BrowserOptions): Promise<void> {
    console.log("  🔧 Initializing WebScraper...");

    try {
      console.log("  🦊 Launching Firefox engine (most SSL permissive)...");
      this.browser = await firefox.launch({ ...options, firefoxUserPrefs });
      console.log("  ✅ Firefox launched successfully");
    } catch (error) {
      console.log("  ❌ Firefox failed to launch.");
      throw error;
    }

    const context = await this.browser.newContext(contextOptions);
    this.page = await context.newPage();

    // Add request debugging
    this.page.on("requestfailed", (request) => {
      const failure = request.failure();
      const { errorText } = failure ?? {};
      if (errorText === "NS_BINDING_ABORTED") {
        return; // Ignore aborted requests
      }

      console.log(
        `❌ Request failed: ${request.url()}`,
        `   Method: ${request.method()}`,
        `   Failure: ${errorText ?? "Unknown error"}`,
      );
    });

    // handling of response errors
    this.page.on("response", (response) => {
      const expectedResponses = [
        response.ok(), // 200 responses
        response.status() === 307, // temporary redirects
        response.status() === 308, // permanent redirects
        response.status() === 404 &&
          (response.url().includes("/Images-plays/") || // missing play images
            response.url().includes("/Images-playwrights/")), // missing playwright images
      ];

      if (expectedResponses.some((condition) => condition)) {
        return;
      }

      const msg = `${response.url()} - ${response.status()} ${response.statusText()}`;
      console.warn(`⚠️  Response error: ${msg}`);
    });

    await this.page.setExtraHTTPHeaders(httpHeaders);
    await this.page.setViewportSize(viewport);
  }

  getPage(): Readonly<Page> {
    if (!this.page) {
      throw new Error("⚠️  Browser page is not initialized");
    }
    return this.page;
  }

  async close(): Promise<void> {
    if (this.browser && !this.browser.isConnected()) {
      console.warn("⚠️  Browser already closed");
      return;
    }

    if (this.browser) {
      await this.browser.close();
      console.log("✅  Browser closed");
    }
  }
}

export { WebScraper };

// For testing: allows direct instantiation without initialization
// @ts-expect-error - accessing private constructor for testing
export class TestWebScraper extends WebScraper {
  constructor() {
    if (process.env.NODE_ENV !== "test") {
      throw new Error("TestWebScraper can only be instantiated in test environment");
    }

    super();
  }
}
