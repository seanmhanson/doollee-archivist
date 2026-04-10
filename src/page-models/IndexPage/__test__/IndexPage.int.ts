import { readFileSync } from "fs";
import { join } from "path";

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from "@jest/globals";
import { firefox } from "playwright";

import IndexPage from "../IndexPage";

import type { Browser, Page } from "playwright";

describe("IndexPage (integration tests)", () => {
  let browser: Browser;
  let page: Page;

  const loadFixture = (filename: string): string => {
    return readFileSync(join(__dirname, "fixtures", filename), "utf-8");
  };

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

  it("should extract links from standard index page structure", async () => {
    const html = loadFixture("index-page-valid.html");
    await page.setContent(html);

    const indexPage = new IndexPage(page, { letter: "A" });
    await indexPage.extractPage();

    // Should extract only valid links (has href, has range pattern, in <p> tag)
    expect(indexPage.data).toEqual({
      "aa-ad": "../PlaywrightsA/A_playwrights_a-d.php",
      "ae-ag": "../PlaywrightsA/A_playwrights_e-g.php",
      "ah-ak": "../PlaywrightsA/A_playwrights_h-k.php",
      "ar-as": "../PlaywrightsA/A_playwrights_r-s.php",
      "aw-az": "../PlaywrightsA/A_playwrights_w-z.php",
    });

    // Should NOT extract invalid links
    expect(indexPage.data["al-an"]).toBeUndefined(); // no href
    expect(indexPage.data["ao-aq"]).toBeUndefined(); // no match pattern
    expect(indexPage.data["at-av"]).toBeUndefined(); // in span, not p
  });

  it("should extract links from letter E page structure", async () => {
    const html = loadFixture("index-page-letter-e.html");
    await page.setContent(html);

    const indexPage = new IndexPage(page, { letter: "E" });
    await indexPage.extractPage();

    expect(indexPage.data).toEqual({
      "ea-ef": "../PlaywrightsE/E_playwrights_a-f.php",
      "eg-es": "../PlaywrightsE/E_playwrights_g-s.php",
      "et-ev": "../PlaywrightsE/E_playwrights_t-v.php",
      "ew-ez": "../PlaywrightsE/E_playwrights_w-z.php",
    });
  });

  it("should extract links from letter Q/X page structure", async () => {
    const html = loadFixture("index-page-letter-q.html");
    await page.setContent(html);

    const indexPage = new IndexPage(page, { letter: "Q" });
    await indexPage.extractPage();

    expect(indexPage.data).toEqual({
      "qa-qz": "../PlaywrightsQ/Q_playwrights_a-z.php",
    });
  });

  it("should return empty data for invalid page structure", async () => {
    const html = loadFixture("index-page-invalid.html");
    await page.setContent(html);

    // Set a shorter timeout for this test to fail fast
    page.setDefaultTimeout(3000);

    const indexPage = new IndexPage(page, { letter: "C" });

    // Should timeout waiting for proper structure
    await expect(indexPage.extractPage()).rejects.toThrow();
  });

  it("should extract the expected data from a full page fixture", async () => {
    const html = loadFixture("index-page.html");
    await page.setContent(html, { waitUntil: "domcontentloaded" });

    const indexPage = new IndexPage(page, { letter: "H" });
    await indexPage.extractPage();

    expect(indexPage.data).toEqual({
      "ha-hf": "../PlaywrightsH/H_playwrights_a-f.php",
      "hg-hl": "../PlaywrightsH/H_playwrights_g-l.php",
      "hm-hr": "../PlaywrightsH/H_playwrights_m-r.php",
      "hs-hz": "../PlaywrightsH/H_playwrights_s-z.php",
    });
  });
});
