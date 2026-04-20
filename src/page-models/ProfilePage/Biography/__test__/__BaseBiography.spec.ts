import { describe, it, expect, beforeEach } from "@jest/globals";

import BaseBiography from "../__BaseBiography";

import type { ScrapedAuthorData } from "#/db-types/author/author.types";
import type { Page } from "playwright";

class TestBiography extends BaseBiography {
  protected data = {} as ScrapedAuthorData;

  constructor(page: Page) {
    super(page);
  }

  protected async extractData(): Promise<void> {
    this.data.name = "Test Author";
    return Promise.resolve();
  }

  public getPage(): Page {
    return this.page;
  }

  public normalizeBiography(bio: string): string {
    return super.normalizeBiography(bio);
  }

  public parseLabeledContent(sectionHTML: string) {
    return super.parseLabeledContent(sectionHTML);
  }

  public normalizeHtmlString(html: string): string {
    return super.normalizeHtmlString(html);
  }

  public parseDateString(dateString: string, includeName = false) {
    return super.parseDateString(dateString, includeName);
  }

  public static placeholderPhrases = BaseBiography.placeholders;
}

describe("BaseBiography", () => {
  const mockPage = {} as Page;
  let biography: TestBiography;

  beforeEach(() => {
    biography = new TestBiography(mockPage);
  });

  describe("constructor", () => {
    it("should initialize with a Page instance, without extracting and populating biographyData", () => {
      expect(biography).toBeInstanceOf(BaseBiography);
      expect(biography.getPage()).toBe(mockPage);
      expect(biography.biographyData).toEqual({});
    });

    it("when created via the static create method, it should extract and populate biographyData", async () => {
      const biographyFromFactory = await TestBiography.create(mockPage);
      expect(biographyFromFactory).toBeInstanceOf(BaseBiography);
      expect(biographyFromFactory.getPage()).toBe(mockPage);
      expect(biographyFromFactory.biographyData).toEqual({ name: "Test Author" });
    });
  });

  describe("biographyData getter", () => {
    it("should return the data property", async () => {
      const emptyBiography = new TestBiography(mockPage);
      expect(emptyBiography.biographyData).toEqual({});

      const biographyFromFactory = await TestBiography.create(mockPage);
      expect(biographyFromFactory.biographyData).toEqual({ name: "Test Author" });
    });
  });

  describe("#parseLabeledContent", () => {
    it("should extract labeled values from standard bold-label HTML", () => {
      const html = `<strong>Nationality:</strong> British<br />`;
      const result = biography.parseLabeledContent(html);
      expect(result.nationality).toBe("British");
    });

    it("should extract the link text for labeled values with an anchor tag", () => {
      const html = `<strong>Literary Agent:</strong> <a href="/agents/foo.php">Some Agency</a>`;
      const result = biography.parseLabeledContent(html);
      expect(result.literaryAgent).toBe("Some Agency");
    });

    it("should set the field to empty string when the value is n/a", () => {
      const html = `<strong>email:</strong> n/a`;
      const result = biography.parseLabeledContent(html);
      expect(result.email).toBe("");
    });

    it("should not leave a trailing space when &nbsp; entities follow the value text", () => {
      const html = `<strong>Nationality:&nbsp;&nbsp;</strong> Greek&nbsp;&nbsp;&nbsp;&nbsp;<strong>Email:</strong> n/a`;
      const result = biography.parseLabeledContent(html);
      expect(result.nationality).toBe("Greek");
    });

    it("should be case-insensitive for label matching", () => {
      const html = `<strong>NATIONALITY:</strong> British<br /><strong>Email:</strong> n/a`;
      const result = biography.parseLabeledContent(html);
      expect(result.nationality).toBe("British");
      expect(result.email).toBe("");
    });

    it("should include text that follows a closing anchor tag", () => {
      const html = `<strong>Literary Agent:</strong>\n      <a href="/agents/foo.php">Some Agency</a>&nbsp;&nbsp;(Estate of)\n      <br><br>`;
      const result = biography.parseLabeledContent(html);
      expect(result.literaryAgent).toBe("Some Agency (Estate of)");
    });

    it("should concatenate text across multiple anchor tags", () => {
      const html = `<strong>Literary Agent:</strong>\n      <a href="/agents/one.php">First Agency</a> UK representative <a href="/agents/two.php">Second Agency</a>\n      <br><br>`;
      const result = biography.parseLabeledContent(html);
      expect(result.literaryAgent).toBe("First Agency UK representative Second Agency");
    });

    it("should extract the URL from the href attribute for the website field", () => {
      const html = `<strong>Website:</strong>\n      <a href="http://www.example.com" target="_blank">Click here</a>\n      <br><br>`;
      const result = biography.parseLabeledContent(html);
      expect(result.website).toBe("http://www.example.com");
    });

    it("should return empty string for a website field with n/a text and no anchor", () => {
      const html = `<strong>Website:</strong> n/a`;
      const result = biography.parseLabeledContent(html);
      expect(result.website).toBe("");
    });

    it("should extract the email address from a mailto: href", () => {
      const html = `<strong>email:</strong> <a href="mailto:author@example.com">Click here to contact</a>`;
      const result = biography.parseLabeledContent(html);
      expect(result.email).toBe("author@example.com");
    });

    it("should extract email text directly when no anchor is present", () => {
      const html = `<strong>email:</strong> author@example.com`;
      const result = biography.parseLabeledContent(html);
      expect(result.email).toBe("author@example.com");
    });
  });

  describe("normalizeBiography", () => {
    const lowercasePhrases = TestBiography.placeholderPhrases;
    const mixedCasePhrases = TestBiography.placeholderPhrases.map((phrase) =>
      phrase
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "),
    );
    const phrases = [...lowercasePhrases, ...mixedCasePhrases];

    it("calls to normalize the biography text", () => {
      const input = "&nbsp;  &nbsp;I am\n a <strong>biography  </strong>\ttext!   ";
      const expectedOutput = "I am a biography text!";
      const result = biography.normalizeBiography(input);
      expect(result).toBe(expectedOutput);
    });

    it("returns an empty string if the biography text contains placeholder phrases", () => {
      phrases.forEach((phrase) => {
        const biographyText = `Preceding biography text. ${phrase} Following biography text.`;
        expect(biography.normalizeBiography(biographyText)).toBe("");
      });
    });
  });

  describe("#normalizeHtmlString", () => {
    it("removes HTML tags from the provided text", () => {
      const input = "This is a <strong>biography text</strong> with <em>HTML</em> tags.";
      const expectedOutput = "This is a biography text with HTML tags.";
      const result = biography.normalizeHtmlString(input);
      expect(result).toBe(expectedOutput);
    });
    it("replaces non-breaking spaces in the provided text", () => {
      const input = "This biography text contains&nbsp;non-breaking&nbsp;spaces.";
      const expectedOutput = "This biography text contains non-breaking spaces.";
      const result = biography.normalizeHtmlString(input);
      expect(result).toBe(expectedOutput);
    });

    it("trims and collapses whitespace in the provided text", () => {
      const input = "   This biography text has   irregular   whitespace.  ";
      const expectedOutput = "This biography text has irregular whitespace.";
      const result = biography.normalizeHtmlString(input);
      expect(result).toBe(expectedOutput);
    });
  });

  describe("#parseDateString", () => {
    const name = "HAROLD PINTER";
    const yearBorn = "1930";
    const yearDied = "2008";
    const rangeDateString = `${name}  (${yearBorn} - ${yearDied})`;
    const unknownBirthDateString = `${name}  (? - ${yearDied})`;
    const unknownDeathDateString = `${name}  (${yearBorn} - deceased)`;
    const birthOnlyDateString = `${name}  (${yearBorn})`;
    const noDateString = `${name}`;

    it("should correctly parse a date string with both birth and death years", () => {
      const result = biography.parseDateString(rangeDateString);
      expect(result).toEqual({ name: "", yearBorn, yearDied });
    });

    it("should correctly parse a date with an unknown birth year", () => {
      const result = biography.parseDateString(unknownBirthDateString);
      expect(result).toEqual({ name: "", yearBorn: "?", yearDied });
    });
    it("should correctly parse a date with an unknown death year", () => {
      const result = biography.parseDateString(unknownDeathDateString);
      expect(result).toEqual({ name: "", yearBorn, yearDied: "deceased" });
    });

    it("should correctly parse a date string with only a birth year", () => {
      const result = biography.parseDateString(birthOnlyDateString);
      expect(result).toEqual({ name: "", yearBorn, yearDied: "" });
    });

    it("should return empty years when no date pattern is present", () => {
      const result = biography.parseDateString(noDateString);
      expect(result).toEqual({ name: "", yearBorn: "", yearDied: "" });
    });

    it("should include the name in the results when includeName is true", () => {
      const rangeResult = biography.parseDateString(rangeDateString, true);
      const singleYearResult = biography.parseDateString(birthOnlyDateString, true);
      const noDateResult = biography.parseDateString(noDateString, true);

      expect(rangeResult).toEqual({ name, yearBorn, yearDied });
      expect(singleYearResult).toEqual({ name, yearBorn, yearDied: "" });
      expect(noDateResult).toEqual({ name, yearBorn: "", yearDied: "" });
    });
  });
});
