import { describe, it, expect } from "@jest/globals";

import ProfilePage from "..";

import euripidesExpected from "./fixtures/euripides-expected";
import pinterExpected from "./fixtures/pinter-harold-expected";

import setupBrowserTest from "#/test-utils/setupBrowserTest";

describe("ProfilePage (integration tests)", () => {
  const { getPage, loadFixture } = setupBrowserTest(__dirname);

  describe("standard template (Pinter)", () => {
    it("should identify the standard template", async () => {
      const html = loadFixture("pinter-harold.html");
      const page = getPage();

      await page.setContent(html, { waitUntil: "domcontentloaded" });

      const profilePage = new ProfilePage(page, { slug: "pinter-harold", letter: "p" });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      profilePage.template = await (profilePage as any).identifyTemplate();

      expect(profilePage.template).toBe("standard");
    });

    it("should extract the expected data from the Pinter fixture", async () => {
      const html = loadFixture("pinter-harold.html");
      const page = getPage();

      await page.setContent(html, { waitUntil: "domcontentloaded" });

      const profilePage = new ProfilePage(page, { slug: "pinter-harold", letter: "p" });
      profilePage.template = "standard";
      await profilePage.extractPage();

      expect(profilePage.biographyData).toEqual(pinterExpected.biography);
      expect(profilePage.worksData.length).toBe(pinterExpected.works.length);
      expect(profilePage.worksData).toEqual(pinterExpected.works);
    });
  });

  describe("adaptations template (Euripides)", () => {
    it("should identify the adaptations template", async () => {
      const html = loadFixture("euripides.html");
      const page = getPage();

      await page.setContent(html, { waitUntil: "domcontentloaded" });

      const profilePage = new ProfilePage(page, { slug: "euripides", letter: "e" });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      profilePage.template = await (profilePage as any).identifyTemplate();

      expect(profilePage.template).toBe("adaptations");
    });

    it("should extract the expected data from the Euripides fixture", async () => {
      const html = loadFixture("euripides.html");
      const page = getPage();

      await page.setContent(html, { waitUntil: "domcontentloaded" });

      const profilePage = new ProfilePage(page, { slug: "euripides", letter: "e" });
      profilePage.template = "adaptations";
      await profilePage.extractPage();

      expect(profilePage.biographyData).toEqual(euripidesExpected.biography);
      expect(profilePage.worksData.length).toBe(euripidesExpected.works.length);
      expect(profilePage.worksData).toEqual(euripidesExpected.works);
    });
  });
});
