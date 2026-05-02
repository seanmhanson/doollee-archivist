import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";

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

describe("ProfilePage Integration Tests", () => {
  const { getPage, loadFixture } = setupBrowserTest(__dirname);

  beforeEach(() => {
    // suppress expected error logging from parsing production and publication values
    // that occur in fixture data (as intended) but would otherwise clutter test output
    const expectedErrorMessages = [
      "Error parsing production details, multiple matches found:",
      "Error parsing publication details, multiple matches found:",
    ];

    const originalError = console.error.bind(console);
    jest.spyOn(console, "error").mockImplementation((message: unknown, ...args: unknown[]) => {
      if (typeof message === "string" && expectedErrorMessages.includes(message)) {
        return; // ignore expected parsing errors
      }
      originalError(message, ...args); // log unexpected errors as normal
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

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
});
