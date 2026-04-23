import { describe, it, expect, beforeEach } from "@jest/globals";

import ProfilePage from "..";

import pinterSnapshot from "./fixtures/pinter-harold-snapshot";
import euripidesSnapshot from "./fixtures/euripides-snapshot";

import setupBrowserTest from "#/test-utils/setupBrowserTest";

class TestProfilePage extends ProfilePage {
  async testIdentifyTemplate() {
    return this.identifyTemplate();
  }
}

describe("ProfilePage — standard template (integration)", () => {
  const { getPage, loadFixture } = setupBrowserTest(__dirname);

  let testPage: TestProfilePage;

  beforeEach(async () => {
    const html = loadFixture("pinter-harold.html");
    const page = getPage();
    await page.setContent(html, { waitUntil: "domcontentloaded" });
    testPage = new TestProfilePage(page, { url: "fixture://pinter-harold" });
  });

  it("detects standard template from real HTML selectors", async () => {
    testPage.template = await testPage.testIdentifyTemplate();
    expect(testPage.template).toBe("standard");
  });

  it("produces correct scraped output", async () => {
    testPage.template = "standard";
    await testPage.extractPage();
    expect(testPage.data).toEqual(pinterSnapshot);
  });
});

describe("ProfilePage — adaptations template (integration)", () => {
  const { getPage, loadFixture } = setupBrowserTest(__dirname);

  let testPage: TestProfilePage;

  beforeEach(async () => {
    const html = loadFixture("euripides.html");
    const page = getPage();
    await page.setContent(html, { waitUntil: "domcontentloaded" });
    testPage = new TestProfilePage(page, { url: "fixture://euripides" });
  });

  it("detects adaptations template from real HTML selectors", async () => {
    testPage.template = await testPage.testIdentifyTemplate();
    expect(testPage.template).toBe("adaptations");
  });

  it("produces correct scraped output", async () => {
    testPage.template = "adaptations";
    await testPage.extractPage();
    expect(testPage.data).toEqual(euripidesSnapshot);
  });
});
