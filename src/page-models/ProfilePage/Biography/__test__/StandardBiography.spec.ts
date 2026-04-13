import { jest, describe, it, expect, beforeEach } from "@jest/globals";

import StandardBiography from "../StandardBiography";

import type { Page } from "playwright";

function getMockPage(evaluateReturn: Record<string, string> = {}): Page {
  const defaults = {
    altName: "Harold Pinter",
    name: "HAROLD PINTER",
    dates: "HAROLD PINTER  (1930 - 2008)",
    innerHTML: [
      `<strong>Nationality</strong> British<br>`,
      `<strong>Email</strong>&nbsp;n/a<br>`,
      `<strong>Website</strong> <a href="https://example.com">Click here</a><br>`,
      `<strong>Research</strong> Member of Dramatists Guild<br>`,
      `<strong>Address</strong> 1 London Road, London<br>`,
      `<strong>Telephone</strong> 020-7946-0111<br>`,
      `<strong>Literary Agent</strong> <a href="mailto:agent@example.com">Judy Daish Associates Ltd</a><br>`,
      `Playwright, poet, actor, political activist and Nobel laureate.`,
    ].join("\n"),
  };

  const data = { ...defaults, ...evaluateReturn };

  return {
    evaluate: jest.fn<() => Promise<typeof data>>().mockResolvedValue(data),
  } as unknown as Page;
}

describe("StandardBiography", () => {
  describe("when created via static create method", () => {
    let biography: StandardBiography;

    beforeEach(async () => {
      const mockPage = getMockPage();
      biography = await StandardBiography.create(mockPage);
    });

    it("should extract the author name from the heading", () => {
      expect(biography.biographyData.name).toBe("HAROLD PINTER");
    });

    it("should extract the alt name from the image alt text", () => {
      expect(biography.biographyData.altName).toBe("Harold Pinter");
    });

    it("should parse birth and death years from the dates string", () => {
      expect(biography.biographyData.yearBorn).toBe("1930");
      expect(biography.biographyData.yearDied).toBe("2008");
    });

    it("should extract labeled content fields", () => {
      expect(biography.biographyData.nationality).toBe("British");
      expect(biography.biographyData.website).toBe("Click here");
      expect(biography.biographyData.literaryAgent).toBe("Judy Daish Associates Ltd");
      expect(biography.biographyData.research).toBe("Member of Dramatists Guild");
      expect(biography.biographyData.address).toBe("1 London Road, London");
      expect(biography.biographyData.telephone).toBe("020-7946-0111");
    });

    it("should normalize n/a email to empty string", () => {
      expect(biography.biographyData.email).toBe("");
    });

    it("should extract the biography text after the last labeled content", () => {
      // parseBiography takes everything after the last <strong>...</strong>(optional <a>...</a>)
      // In real HTML, Literary Agent is the last labeled field with an anchor tag
      expect(biography.biographyData.biography).toBe("Playwright, poet, actor, political activist and Nobel laureate.");
    });

    it("should populate _archive with raw scraped data", () => {
      const archive = biography.biographyData._archive;
      expect(archive).toBeDefined();
      expect(archive?.name).toBe("HAROLD PINTER");
      expect(archive?.altName).toBe("Harold Pinter");
      expect(archive?.dates).toBe("HAROLD PINTER  (1930 - 2008)");
    });
  });

  describe("date parsing edge cases", () => {
    it("should handle dates with BC years", async () => {
      const mockPage = getMockPage({
        dates: "EURIPIDES   (480 BC? - 406 BC)",
        name: "EURIPIDES",
      });
      const biography = await StandardBiography.create(mockPage);
      expect(biography.biographyData.yearBorn).toBe("480 BC?");
      expect(biography.biographyData.yearDied).toBe("406 BC");
    });

    it("should handle missing dates gracefully", async () => {
      const mockPage = getMockPage({
        dates: "SOME AUTHOR",
        name: "SOME AUTHOR",
      });
      const biography = await StandardBiography.create(mockPage);
      expect(biography.biographyData.yearBorn).toBe("");
      expect(biography.biographyData.yearDied).toBe("");
    });

    it("should handle dates with only birth year", async () => {
      const mockPage = getMockPage({
        dates: "AUTHOR NAME  (1950 -  )",
        name: "AUTHOR NAME",
      });
      const biography = await StandardBiography.create(mockPage);
      expect(biography.biographyData.yearBorn).toBe("1950");
      expect(biography.biographyData.yearDied).toBe("");
    });
  });

  describe("biography extraction edge cases", () => {
    it("should return empty string when innerHTML has no strong tags", async () => {
      const mockPage = getMockPage({
        innerHTML: "Just some plain text without any labels.",
      });
      const biography = await StandardBiography.create(mockPage);
      expect(biography.biographyData.biography).toBe("");
    });

    it("should return empty string for placeholder biography text", async () => {
      const mockPage = getMockPage({
        innerHTML:
          "<strong>Nationality</strong> British<br>" +
          "please send me a biography and information about this playwright",
      });
      const biography = await StandardBiography.create(mockPage);
      expect(biography.biographyData.biography).toBe("");
    });
  });
});
