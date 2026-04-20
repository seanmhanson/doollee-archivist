import { describe, it, expect, jest } from "@jest/globals";

import StandardBiography from "../StandardBiography";

import type { Page } from "playwright";

type EvaluateFn = <T>(fn: () => T) => Promise<T>;

function createMockPage(scrapedData: object): Page {
  return {
    evaluate: jest.fn<EvaluateFn>().mockResolvedValue(scrapedData as never),
  } as unknown as Page;
}

describe("StandardBiography", () => {
  describe("extractData / parseBiography", () => {
    it("should extract biography text that appears after the last labeled section", async () => {
      const mockPage = createMockPage({
        altName: "Sarah Kane",
        name: "SARAH KANE",
        dates: "SARAH KANE  (1971 - 1999)",
        innerHTML: `
          <strong>Nationality:</strong> British<br />
          <strong>email:</strong> n/a<strong>Website:</strong> n/a<br /><br />
          <strong>Literary Agent:</strong>
          <a href="/agents/casarotto.php">Casarotto Ramsay and Associates Ltd</a>
          <br /><br />
          Sarah Kane was an English playwright.
        `,
      });

      const biography = await StandardBiography.create(mockPage);
      expect(biography.biographyData.biography).toBe("Sarah Kane was an English playwright.");
    });

    it("should extract biography text that precedes a trailing Research section", async () => {
      const mockPage = createMockPage({
        altName: "David Mamet",
        name: "DAVID MAMET",
        dates: "DAVID MAMET  (1947 - )",
        innerHTML: `
          <strong>Nationality:</strong> USA<br />
          <strong>email:</strong> n/a<strong>Website:</strong> n/a<br /><br />
          <strong>Literary Agent:</strong>
          <a href="/agents/abrams.php">Abrams Artists Agency</a>
          <br /><br />
          BA. English Literature, Goddard College, VT, 1969.
          <br /><br />
          <strong>Research: </strong><a href="http://www.dramatistsguild.com/">Member of the Dramatists Guild</a>
        `,
      });

      const biography = await StandardBiography.create(mockPage);
      expect(biography.biographyData.biography).toContain("BA. English Literature, Goddard College, VT, 1969.");
    });

    it("should return an empty biography when there is only a Research section and no body text", async () => {
      const mockPage = createMockPage({
        altName: "Some Author",
        name: "SOME AUTHOR",
        dates: "SOME AUTHOR  (1900 - 1980)",
        innerHTML: `
          <strong>Nationality:</strong> British<br />
          <strong>Research: </strong><a href="http://example.com/">Some resource</a>
        `,
      });

      const biography = await StandardBiography.create(mockPage);
      expect(biography.biographyData.biography).toBe("");
    });

    it("should not include the Research link in the biography field", async () => {
      const mockPage = createMockPage({
        altName: "David Mamet",
        name: "DAVID MAMET",
        dates: "DAVID MAMET  (1947 - )",
        innerHTML: `
          <strong>Literary Agent:</strong>
          <a href="/agents/abrams.php">Abrams Artists Agency</a>
          <br /><br />
          BA. English Literature, Goddard College, VT, 1969.
          <br /><br />
          <strong>Research: </strong><a href="http://www.dramatistsguild.com/">Member of the Dramatists Guild</a>
        `,
      });

      const biography = await StandardBiography.create(mockPage);
      expect(biography.biographyData.biography).not.toContain("Member of the Dramatists Guild");
    });
  });

  describe("extractData / parseDates", () => {
    it("should extract both yearBorn and yearDied from a date range", async () => {
      const mockPage = createMockPage({
        altName: "Harold Pinter",
        name: "HAROLD PINTER",
        dates: "HAROLD PINTER  (1930 - 2008)",
        innerHTML: "",
      });

      const biography = await StandardBiography.create(mockPage);
      expect(biography.biographyData.yearBorn).toBe("1930");
      expect(biography.biographyData.yearDied).toBe("2008");
    });

    it("should extract yearBorn and leave yearDied empty for a living author", async () => {
      const mockPage = createMockPage({
        altName: "David Mamet",
        name: "DAVID MAMET",
        dates: "DAVID MAMET  (1947)",
        innerHTML: "",
      });

      const biography = await StandardBiography.create(mockPage);
      expect(biography.biographyData.yearBorn).toBe("1947");
      expect(biography.biographyData.yearDied).toBe("");
    });

    it("should return empty strings for both when no year is present", async () => {
      const mockPage = createMockPage({
        altName: "Some Author",
        name: "SOME AUTHOR",
        dates: "SOME AUTHOR",
        innerHTML: "",
      });

      const biography = await StandardBiography.create(mockPage);
      expect(biography.biographyData.yearBorn).toBe("");
      expect(biography.biographyData.yearDied).toBe("");
    });
  });
});
