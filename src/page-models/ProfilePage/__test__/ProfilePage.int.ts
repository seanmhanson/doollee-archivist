import { describe, it, expect, beforeEach } from "@jest/globals";

import ProfilePage from "..";

import euripidesSnapshot from "./fixtures/euripides-snapshot";
import pinterSnapshot from "./fixtures/pinter-harold-snapshot";

import setupBrowserTest from "#/test-utils/setupBrowserTest";

type TemplateType = ProfilePage["template"];

class TestProfilePage extends ProfilePage {
  async testIdentifyTemplate(): Promise<TemplateType> {
    return this.identifyTemplate();
  }
}

const { getPage, loadFixture } = setupBrowserTest(__dirname);

describe("ProfilePage — standard template (integration)", () => {
  let testPage: TestProfilePage;

  beforeEach(async () => {
    const html = loadFixture("pinter-harold.html");
    const page = getPage();
    await page.setContent(html, { waitUntil: "domcontentloaded" });
    testPage = new TestProfilePage(page, { url: "fixture://pinter-harold" });
  });

  it("detects standard template from real HTML selectors", async () => {
    const template: TemplateType = await testPage.testIdentifyTemplate();
    expect(template).toBe("standard");
  });

  it("produces correct scraped output", async () => {
    testPage.template = "standard";
    await testPage.extractPage();
    expect(testPage.data).toEqual(pinterSnapshot);
  });
});

describe("ProfilePage — adaptations template (integration)", () => {
  let testPage: TestProfilePage;

  beforeEach(async () => {
    const html = loadFixture("euripides.html");
    const page = getPage();
    await page.setContent(html, { waitUntil: "domcontentloaded" });
    testPage = new TestProfilePage(page, { url: "fixture://euripides" });
  });

  it("detects adaptations template from real HTML selectors", async () => {
    const template: TemplateType = await testPage.testIdentifyTemplate();
    expect(template).toBe("adaptations");
  });

  it("produces correct scraped output", async () => {
    testPage.template = "adaptations";
    await testPage.extractPage();
    expect(testPage.data).toEqual(euripidesSnapshot);
  });
});
