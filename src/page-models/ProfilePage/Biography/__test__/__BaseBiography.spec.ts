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
      const phrases = TestBiography.placeholderPhrases;
      const biography = new TestBiography(mockPage);

      phrases.forEach((phrase) => {
        const biographyText = `Preceding biography text. ${phrase} Following biography text.`;
        expect(biography.normalizeBiography(biographyText)).toBe("");
      });
    });
  });
});
