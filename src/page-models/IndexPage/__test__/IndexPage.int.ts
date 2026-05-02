import { describe, it, expect } from "@jest/globals";

import IndexPage from "../IndexPage";

import type { BasePageArgs } from "#/page-models/__BasePage";
import type { UrlArgs } from "#/page-models/IndexPage/IndexPage";

import setupBrowserTest from "#/test-utils/setupBrowserTest";

describe("IndexPage (integration tests)", () => {
  const { getPage, loadFixture } = setupBrowserTest(__dirname);

  async function getTestPage(
    fixtureName: string,
    pageArgs: BasePageArgs<UrlArgs>,
    defaultTimeout?: number,
  ): Promise<IndexPage> {
    const html = loadFixture(fixtureName);
    const page = getPage();

    if (defaultTimeout) {
      page.setDefaultTimeout(defaultTimeout);
    }

    await page.setContent(html, { waitUntil: "domcontentloaded" });
    return new IndexPage(page, pageArgs);
  }

  it("should extract links from standard index page structure", async () => {
    const indexPage = await getTestPage("index-page-valid.html", { letter: "A" });
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
    const indexPage = await getTestPage("index-page-letter-e.html", { letter: "E" });
    await indexPage.extractPage();

    expect(indexPage.data).toEqual({
      "ea-ef": "../PlaywrightsE/E_playwrights_a-f.php",
      "eg-es": "../PlaywrightsE/E_playwrights_g-s.php",
      "et-ev": "../PlaywrightsE/E_playwrights_t-v.php",
      "ew-ez": "../PlaywrightsE/E_playwrights_w-z.php",
    });
  });

  it("should extract links from letter Q/X page structure", async () => {
    const indexPage = await getTestPage("index-page-letter-q.html", { letter: "Q" });
    await indexPage.extractPage();

    expect(indexPage.data).toEqual({
      "qa-qz": "../PlaywrightsQ/Q_playwrights_a-z.php",
    });
  });

  it("should return empty data for invalid page structure", async () => {
    const defaultTimeout = 1500; // set a shorter timeout for this test to fail quickly
    const indexPage = await getTestPage("index-page-invalid.html", { letter: "C" }, defaultTimeout);

    // Should timeout waiting for proper structure
    await expect(indexPage.extractPage()).rejects.toThrow();
  });

  it("should extract the expected data from a full page fixture", async () => {
    const indexPage = await getTestPage("index-page.html", { letter: "H" });
    await indexPage.extractPage();

    expect(indexPage.data).toEqual({
      "ha-hf": "../PlaywrightsH/H_playwrights_a-f.php",
      "hg-hl": "../PlaywrightsH/H_playwrights_g-l.php",
      "hm-hr": "../PlaywrightsH/H_playwrights_m-r.php",
      "hs-hz": "../PlaywrightsH/H_playwrights_s-z.php",
    });
  });
});
