import { jest, describe, it, expect, beforeEach } from "@jest/globals";

import AdaptationBiography from "../AdaptationBiography";

import type { Page } from "playwright";

function getMockPage(evaluateReturn: Record<string, string> = {}): Page {
  const defaults = {
    bio: 'Euripides was the son of a retailer - Mnesarchus. When he was a boy the Oracle predicted that he would "win crowns of victory".',
    dates: "EURIPIDES   (480 BC? - 406 BC)",
    imageSrc: "/Images-playwrights/euripides.jpg",
    imageAlt: " Euripides",
    innerHTML: [
      `<strong>Nationality</strong> Greek`,
      `<strong>Email</strong>&nbsp;n/a`,
      `<strong>Website</strong>&nbsp;n/a`,
      `<strong>Literary Agent</strong>&nbsp;n/a`,
    ].join("\n"),
  };

  const data = { ...defaults, ...evaluateReturn };

  return {
    evaluate: jest.fn<() => Promise<typeof data>>().mockResolvedValue(data),
  } as unknown as Page;
}

describe("AdaptationBiography", () => {
  describe("when created via static create method", () => {
    let biography: AdaptationBiography;

    beforeEach(async () => {
      const mockPage = getMockPage();
      biography = await AdaptationBiography.create(mockPage);
    });

    it("should parse the author name from the dates string", () => {
      expect(biography.biographyData.name).toBe("EURIPIDES");
    });

    it("should extract the alt name from the image alt text", () => {
      expect(biography.biographyData.altName).toBe(" Euripides");
    });

    it("should parse birth and death years from the dates string", () => {
      expect(biography.biographyData.yearBorn).toBe("480 BC?");
      expect(biography.biographyData.yearDied).toBe("406 BC");
    });

    it("should extract labeled content fields", () => {
      expect(biography.biographyData.nationality).toBe("Greek");
    });

    it("should normalize n/a fields to empty string", () => {
      expect(biography.biographyData.email).toBe("");
      expect(biography.biographyData.website).toBe("");
      expect(biography.biographyData.literaryAgent).toBe("");
    });

    it("should extract the biography text from the bio section", () => {
      expect(biography.biographyData.biography).toContain("Euripides was the son of a retailer");
    });

    it("should populate _archive with raw scraped data", () => {
      const archive = biography.biographyData._archive;
      expect(archive).toBeDefined();
      expect(archive?.name).toBe("EURIPIDES");
      expect(archive?.dates).toBe("EURIPIDES   (480 BC? - 406 BC)");
    });
  });

  describe("alt name logic", () => {
    it("should return empty alt name when image src is blank", async () => {
      const mockPage = getMockPage({
        imageSrc: "",
        imageAlt: "Some Alt Text",
      });
      const biography = await AdaptationBiography.create(mockPage);
      expect(biography.biographyData.altName).toBe("");
    });

    it("should return empty alt name when using blank placeholder image", async () => {
      const mockPage = getMockPage({
        imageSrc: "/Images-playwrights/Blank.jpg",
        imageAlt: "Some Alt Text",
      });
      const biography = await AdaptationBiography.create(mockPage);
      expect(biography.biographyData.altName).toBe("");
    });

    it("should return image alt when image has a real source", async () => {
      const mockPage = getMockPage({
        imageSrc: "/Images-playwrights/euripides.jpg",
        imageAlt: "Euripides Portrait",
      });
      const biography = await AdaptationBiography.create(mockPage);
      expect(biography.biographyData.altName).toBe("Euripides Portrait");
    });
  });

  describe("name and date parsing edge cases", () => {
    it("should handle name without dates in parentheses", async () => {
      const mockPage = getMockPage({
        dates: "UNKNOWN AUTHOR",
      });
      const biography = await AdaptationBiography.create(mockPage);
      expect(biography.biographyData.name).toBe("UNKNOWN AUTHOR");
      expect(biography.biographyData.yearBorn).toBe("");
      expect(biography.biographyData.yearDied).toBe("");
    });

    it("should handle standard modern dates", async () => {
      const mockPage = getMockPage({
        dates: "JOHN DOE  (1950 - 2020)",
      });
      const biography = await AdaptationBiography.create(mockPage);
      expect(biography.biographyData.name).toBe("JOHN DOE");
      expect(biography.biographyData.yearBorn).toBe("1950");
      expect(biography.biographyData.yearDied).toBe("2020");
    });
  });

  describe("biography normalization", () => {
    it("should return empty string for placeholder biography text", async () => {
      const mockPage = getMockPage({
        bio: "i do not have a biography of this playwright",
      });
      const biography = await AdaptationBiography.create(mockPage);
      expect(biography.biographyData.biography).toBe("");
    });

    it("should strip HTML tags from biography text", async () => {
      const mockPage = getMockPage({
        bio: "This is a <strong>biography</strong> with <em>HTML</em> tags.",
      });
      const biography = await AdaptationBiography.create(mockPage);
      expect(biography.biographyData.biography).toBe("This is a biography with HTML tags.");
    });
  });
});
