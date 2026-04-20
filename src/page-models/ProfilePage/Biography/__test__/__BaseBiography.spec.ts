import { describe, it, expect } from "@jest/globals";

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

  public static placeholderPhrases = BaseBiography.placeholders;
}

describe("BaseBiography", () => {
  const mockPage = {} as Page;

  describe("constructor", () => {
    it("should initialize with a Page instance, without extracting and populating biographyData", () => {
      const biography = new TestBiography(mockPage);
      expect(biography).toBeInstanceOf(BaseBiography);
      expect(biography.getPage()).toBe(mockPage);
      expect(biography.biographyData).toEqual({});
    });

    it("when created via the static create method, it should extract and populate biographyData", async () => {
      const biography = await TestBiography.create(mockPage);
      expect(biography).toBeInstanceOf(BaseBiography);
      expect(biography.getPage()).toBe(mockPage);
      expect(biography.biographyData).toEqual({ name: "Test Author" });
    });
  });

  describe("biographyData getter", () => {
    it("should return the data property", async () => {
      const emptyBiography = new TestBiography(mockPage);
      expect(emptyBiography.biographyData).toEqual({});

      const biography = await TestBiography.create(mockPage);
      expect(biography.biographyData).toEqual({ name: "Test Author" });
    });
  });

  describe("normalizeBiography", () => {
    it("removes HTML tags from the biography text", () => {
      const input = "This is a <strong>biography</strong> with <em>HTML</em> tags.";
      const expectedOutput = "This is a biography with HTML tags.";
      const biography = new TestBiography(mockPage);
      const result = biography.normalizeBiography(input);
      expect(result).toBe(expectedOutput);
    });
    it("replaces non-breaking spaces in the biography text", () => {
      const input = "This biography contains&nbsp;non-breaking&nbsp;spaces.";
      const expectedOutput = "This biography contains non-breaking spaces.";
      const biography = new TestBiography(mockPage);
      const result = biography.normalizeBiography(input);
      expect(result).toBe(expectedOutput);
    });

    it("trims and collapses whitespace in the biography text", () => {
      const input = "   This biography has   irregular   whitespace.  ";
      const expectedOutput = "This biography has irregular whitespace.";
      const biography = new TestBiography(mockPage);
      const result = biography.normalizeBiography(input);
      expect(result).toBe(expectedOutput);
    });

    it("returns an empty string if the biography text contains placeholder phrases", () => {
      const lowercasePhrases = TestBiography.placeholderPhrases;
      const mixedcasePhrases = TestBiography.placeholderPhrases.map((phrase) =>
        phrase
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" "),
      );

      const phrases = [...lowercasePhrases, ...mixedcasePhrases];
      const biography = new TestBiography(mockPage);

      phrases.forEach((phrase) => {
        const biographyText = `Preceding biography text. ${phrase} Following biography text.`;
        expect(biography.normalizeBiography(biographyText)).toBe("");
      });
    });
  });

  describe("parseLabeledContent", () => {
    it("should extract labeled values from standard bold-label HTML", () => {
      const biography = new TestBiography(mockPage);
      const html = `<strong>Nationality:</strong> British<br />`;
      const result = biography.parseLabeledContent(html);
      expect(result.nationality).toBe("British");
    });

    it("should extract the link text for labeled values with an anchor tag", () => {
      const biography = new TestBiography(mockPage);
      const html = `<strong>Literary Agent:</strong> <a href="/agents/foo.php">Some Agency</a>`;
      const result = biography.parseLabeledContent(html);
      expect(result.literaryAgent).toBe("Some Agency");
    });

    it("should set the field to empty string when the value is n/a", () => {
      const biography = new TestBiography(mockPage);
      const html = `<strong>email:</strong> n/a`;
      const result = biography.parseLabeledContent(html);
      expect(result.email).toBe("");
    });

    it("should not leave a trailing space when &nbsp; entities follow the value text", () => {
      const biography = new TestBiography(mockPage);
      const html = `<strong>Nationality:&nbsp;&nbsp;</strong> Greek&nbsp;&nbsp;&nbsp;&nbsp;<strong>Email:</strong> n/a`;
      const result = biography.parseLabeledContent(html);
      expect(result.nationality).toBe("Greek");
    });

    it("should be case-insensitive for label matching", () => {
      const biography = new TestBiography(mockPage);
      const html = `<strong>NATIONALITY:</strong> British<br /><strong>Email:</strong> n/a`;
      const result = biography.parseLabeledContent(html);
      expect(result.nationality).toBe("British");
      expect(result.email).toBe("");
    });

    it("should include text that follows a closing anchor tag", () => {
      const biography = new TestBiography(mockPage);
      const html = `<strong>Literary Agent:</strong>\n      <a href="/agents/foo.php">Some Agency</a>&nbsp;&nbsp;(Estate of)\n      <br><br>`;
      const result = biography.parseLabeledContent(html);
      expect(result.literaryAgent).toBe("Some Agency (Estate of)");
    });

    it("should concatenate text across multiple anchor tags", () => {
      const biography = new TestBiography(mockPage);
      const html = `<strong>Literary Agent:</strong>\n      <a href="/agents/one.php">First Agency</a> UK representative <a href="/agents/two.php">Second Agency</a>\n      <br><br>`;
      const result = biography.parseLabeledContent(html);
      expect(result.literaryAgent).toBe("First Agency UK representative Second Agency");
    });

    it("should extract the URL from the href attribute for the website field", () => {
      const biography = new TestBiography(mockPage);
      const html = `<strong>Website:</strong>\n      <a href="http://www.example.com" target="_blank">Click here</a>\n      <br><br>`;
      const result = biography.parseLabeledContent(html);
      expect(result.website).toBe("http://www.example.com");
    });

    it("should return empty string for a website field with n/a text and no anchor", () => {
      const biography = new TestBiography(mockPage);
      const html = `<strong>Website:</strong> n/a`;
      const result = biography.parseLabeledContent(html);
      expect(result.website).toBe("");
    });
  });
});
