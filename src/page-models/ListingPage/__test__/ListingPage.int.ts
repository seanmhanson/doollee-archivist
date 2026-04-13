import { describe, it, expect } from "@jest/globals";

import ListingPage from "..";

import expectedFixtureOutput from "./fixtures/listing-page-output";

import setupBrowserTest from "#/test-utils/setupBrowserTest";

describe("ListingPage (integration tests)", () => {
  const { getPage, loadFixture } = setupBrowserTest(__dirname);

  it("should extract the expected data from a full page fixture", async () => {
    const html = loadFixture("listing-page.html");
    const page = getPage();

    await page.setContent(html, { waitUntil: "domcontentloaded" });
    const pageArgs = { indexLetter: "S", firstLetter: "s", lastLetter: "z" };

    const listingPage = new ListingPage(page, pageArgs);

    await listingPage.extractPage();

    expect(Object.entries(listingPage.data).length).toBe(1376);
    expect(listingPage.data).toEqual(expectedFixtureOutput);
  });
});
