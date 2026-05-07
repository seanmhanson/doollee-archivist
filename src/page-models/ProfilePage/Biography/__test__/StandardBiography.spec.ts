import { describe, it, expect, jest } from "@jest/globals";

import StandardBiography from "../StandardBiography";

import type { ScrapedData, ParsedDates } from "../StandardBiography";
import type { Page } from "playwright";

type EvaluateFn = <T>(fn: () => T) => Promise<T>;

function createMockPage(scrapedData: Partial<ScrapedData> = {}): Page {
  return {
    evaluate: jest.fn<EvaluateFn>().mockResolvedValue(scrapedData),
  } as unknown as Page;
}

class TestStandardBiography extends StandardBiography {
  constructor(page: Page) {
    super(page);
  }

  public async scrapeData(): Promise<ScrapedData> {
    return super.scrapeData();
  }

  public parseBiography(sectionHTML: string): string {
    return super.parseBiography(sectionHTML);
  }

  public parseDates(dateString: string): ParsedDates {
    return super.parseDates(dateString);
  }

  public async extractData(): Promise<void> {
    return super.extractData();
  }
}

describe("StandardBiography", () => {
  const name = "SARAH KANE";
  const altName = "SARAH KANE";
  const dates = "SARAH KANE  (1971 - 1999)";
  const agentHTML = `<strong>Literary Agent:</strong>` + `<a href="/agents/test.php">Unit Test Artists Agency</a>`;
  const biographyHTML = `Sarah Kane was a queer English playwright, most famous for her play <em>Blasted</em>.`;
  const researchHTML =
    `<strong>Research: </strong>` +
    `<a href="https://www.dramatistsguild.test/">Member of the Unit Test Dramatists Guild</a>`;

  const expectedBiography = "Sarah Kane was a queer English playwright, most famous for her play Blasted.";

  function getMockInnerHTML({ includeBiography = true, includeResearch = true } = {}) {
    const biographyDelimiter = `<br /><br />`;
    const researchDelimiter = includeBiography ? biographyDelimiter : `<br/>`;
    return `
      ${agentHTML}
      ${includeBiography ? `${biographyDelimiter}${biographyHTML}` : ""}
      ${includeResearch ? `${researchDelimiter}${researchHTML}` : ""}
    `;
  }

  describe("#extractData / #scrapeData", () => {
    it("should populate the biographyData property with the extracted and parsed data", async () => {
      const mockPage = createMockPage({ altName, name, dates, innerHTML: getMockInnerHTML() });
      const biography = new TestStandardBiography(mockPage);
      await biography.extractData();

      expect(biography.biographyData).toEqual({
        _archive: {
          name,
          altName,
          biography: expectedBiography,
          dates,
          literaryAgent: "Unit Test Artists Agency",
          research: "Member of the Unit Test Dramatists Guild",
        },
        name,
        altName,
        yearBorn: "1971",
        yearDied: "1999",
        biography: expectedBiography,
        literaryAgent: "Unit Test Artists Agency",
        research: "Member of the Unit Test Dramatists Guild",
      });
    });

    it("should include all AuthorArchive fields in the _archive", async () => {
      // Build an innerHTML with all possible labeled fields. Address and telephone
      // are placed last (before Research) so that parseBiography sees Research as the
      // last label and returns an empty biography — avoiding the telephone value from
      // being captured as biography text. No <br /><br /> precedes Research, so
      // parseBiography correctly returns "".
      const fullLabelHTML = `
        <strong>Nationality:</strong> English
        <strong>Email:</strong> <a href="mailto:test@example.com">test@example.com</a>
        <strong>Website:</strong> <a href="https://example.com">Website</a>
        <strong>Literary Agent:</strong> <a href="/agents/test.php">Test Agent</a>
        <strong>Address:</strong> 1 Test Street, London, UK
        <strong>Telephone:</strong> 020-1234-5678
        <strong>Research: </strong> Some research text
      `;

      const mockPage = createMockPage({ altName, name, dates, innerHTML: fullLabelHTML });
      const biography = new TestStandardBiography(mockPage);
      await biography.extractData();

      expect(biography.biographyData._archive).toEqual({
        name,
        altName,
        dates,
        biography: "",
        nationality: "English",
        email: "test@example.com",
        website: "https://example.com",
        literaryAgent: "Test Agent",
        address: "1 Test Street, London, UK",
        telephone: "020-1234-5678",
        research: "Some research text",
      });
    });
  });

  describe("#parseBiography", () => {
    describe("when there is no Research section", () => {
      it("returns a biography string when one is present", () => {
        const biography = new TestStandardBiography(createMockPage());
        const innerHTML = getMockInnerHTML({ includeBiography: true, includeResearch: false });
        expect(biography.parseBiography(innerHTML)).toBe(expectedBiography);
      });
      it("returns an empty string when no biography text is present", () => {
        const biography = new TestStandardBiography(createMockPage());
        const innerHTML = getMockInnerHTML({ includeBiography: false, includeResearch: false });
        expect(biography.parseBiography(innerHTML)).toBe("");
      });
    });

    describe("when there is a Research section", () => {
      it("returns a biography string that appears before and separate from the Research section", () => {
        const biography = new TestStandardBiography(createMockPage());
        const innerHTML = getMockInnerHTML({ includeBiography: true, includeResearch: true });
        expect(biography.parseBiography(innerHTML)).toBe(expectedBiography);
      });
      it("returns an empty string when there is no biography text preceding the Research section", () => {
        const biography = new TestStandardBiography(createMockPage());
        const innerHTML = getMockInnerHTML({ includeBiography: false, includeResearch: true });
        expect(biography.parseBiography(innerHTML)).toBe("");
      });
    });

    it("returns a normalized biography string", () => {
      const biography = new TestStandardBiography(createMockPage());
      const biographyHTML = `&nbsp;  &nbsp;I am\n a <em>biographical  </em>\ttext!   `;
      const innerHTML = `<strong>Literary Agent:</strong> <a href="/agents/test.php">Unit Test Artists Agency</a><br /><br />${biographyHTML}`;
      const expectedOutput = "I am a biographical text!";
      expect(biography.parseBiography(innerHTML)).toBe(expectedOutput);
    });
  });

  describe("#parseDates", () => {
    it("should return parsed birth and death dates, without a name field", () => {
      const biography = new TestStandardBiography(createMockPage());
      const result = biography.parseDates(dates);
      expect(result).toEqual({ yearBorn: "1971", yearDied: "1999" });
      expect(result).not.toHaveProperty("name");
    });
  });
});
