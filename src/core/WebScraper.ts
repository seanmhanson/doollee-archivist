import { chromium, firefox, webkit, Browser, Page } from "playwright";

const userAgent =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";
const httpHeaders = { "User-Agent": userAgent };
const viewport = { width: 1280, height: 800 };
const defaultBrowserArgs = {
  headless: true,
  slowMo: 50,
  ignoreHTTPSErrors: true, // required for doolee.com SSL issues
  args: [
    "--ignore-certificate-errors",
    "--ignore-ssl-errors",
    "--ignore-certificate-errors-spki-list",
    "--disable-web-security",
    "--allow-running-insecure-content",
    "--ignore-urlfetcher-cert-requests",
    "--disable-extensions-https-enforcement",
    "--accept-insecure-certs",
  ],
};

export default class WebScraper {
  private browser: Browser | null = null;
  private page: Page | null = null;

  private constructor() {}

  static async create(browserArgOverrides = {}): Promise<WebScraper> {
    console.log("🏁 Creating a WebScraper Instance...");
    const instance = new WebScraper();
    await instance.initialize(browserArgOverrides);
    console.log("✅ WebScraper created successfully");
    return instance;
  }

  private async initialize(browserArgOverrides = {}): Promise<void> {
    const browserArgs = { ...defaultBrowserArgs, ...browserArgOverrides };

    console.log("🔧 Initializing WebScraper...");
    if (browserArgs.ignoreHTTPSErrors) {
      console.warn("HTTPS errors are currently being ignored");
    }

    // Try browsers in order of SSL permissiveness
    let browserLaunched = false;

    console.log("🚀 Starting browser engine selection process...");

    // Firefox is often most permissive with SSL errors
    if (!browserLaunched) {
      try {
        console.log("🦊 Trying Firefox engine (most SSL permissive)...");
        this.browser = await firefox.launch({
          headless: browserArgs.headless,
          slowMo: browserArgs.slowMo,
          firefoxUserPrefs: {
            "security.tls.ignore_certificate_errors": true,
            "security.insecure_connection_text.enabled": false,
          },
        });
        browserLaunched = true;
        console.log("✅ Firefox launched successfully");
      } catch (error) {
        console.log(
          "❌ Firefox failed:",
          error instanceof Error ? error.message : String(error)
        );
      }
    }

    // WebKit as fallback
    if (!browserLaunched) {
      try {
        console.log("🔍 Trying WebKit engine...");
        this.browser = await webkit.launch({
          headless: browserArgs.headless,
          slowMo: browserArgs.slowMo,
        });
        browserLaunched = true;
        console.log("✅ WebKit launched successfully");
      } catch (error) {
        console.log(
          "❌ WebKit failed:",
          error instanceof Error ? error.message : String(error)
        );
      }
    }

    // Chromium as last resort
    if (!browserLaunched) {
      console.log("🤖 Falling back to Chromium (strict SSL)...");
      this.browser = await chromium.launch(browserArgs);
      console.log("⚠️ Using Chromium - SSL errors may occur");
    }
    if (!this.browser) {
      throw new Error("Failed to launch any browser engine");
    }

    const context = await this.browser.newContext({
      ignoreHTTPSErrors: true,
      bypassCSP: true,
      acceptDownloads: false,
    });
    this.page = await context.newPage();

    // Add request debugging
    this.page.on("requestfailed", (request) => {
      if (request.failure()?.errorText === "NS_BINDING_ABORTED") {
        return; // Ignore aborted requests
      }

      console.log(`❌ Request failed: ${request.url()}`);
      console.log(`   Method: ${request.method()}`);
      console.log(
        `   Failure: ${request.failure()?.errorText || "Unknown error"}`
      );
    });

    this.page.on("response", (response) => {
      if (!response.ok()) {
        if (response.status() === 307 || response.status() === 308) {
          return; // Ignore redirects
        }

        console.log(
          `⚠️  Response error: ${response.url()} - ${response.status()} ${response.statusText()}`
        );
      }
    });

    await this.page.setExtraHTTPHeaders(httpHeaders);
    await this.page.setViewportSize(viewport);
  }

  getPage(): Readonly<Page> {
    if (!this.page) {
      throw new Error("Browser page is not initialized");
    }
    return this.page;
  }

  async close(): Promise<void> {
    if (this.browser && !this.browser.isConnected()) {
      console.warn("Browser already closed");
      return;
    }

    if (this.browser) {
      await this.browser.close();
      console.log("Browser closed");
    }
  }
}

export { WebScraper };
