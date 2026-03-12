import { readFileSync } from "fs";
import { join } from "path";

import { beforeAll, afterAll, beforeEach, afterEach } from "@jest/globals";
import { firefox } from "playwright";

import type { Browser, Page } from "playwright";

function setupBrowserTest(dirname: string) {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await firefox.launch();
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    page = await browser.newPage();
  });

  afterEach(async () => {
    await page.close();
  });

  const loadFixture = (filename: string): string => {
    return readFileSync(join(dirname, "fixtures", filename), "utf-8");
  };

  return {
    getBrowser: () => browser,
    getPage: () => page,
    loadFixture,
  };
}

export default setupBrowserTest;
