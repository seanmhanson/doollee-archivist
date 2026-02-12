import type { Page } from "playwright";

import type { ScrapedAuthorData } from "#/db-types/author/author.types";

export default abstract class BaseBiography {
  protected static readonly labels = [
    "Nationality",
    "Email",
    "Website",
    "Literary Agent",
    "Research",
    "Address",
    "Telephone",
  ].join("|");

  protected static readonly placeholders = [
    "including biography, theatres, agent, synopses, cast sizes, production and published dates",
    "please send me a biography and information about this playwright",
    "i do not have a biography of this playwright",
    "please help doollee to become even more complete",
  ];

  protected page: Page;

  protected abstract data: ScrapedAuthorData;

  public get biographyData(): ScrapedAuthorData {
    return this.data;
  }

  protected constructor(page: Page) {
    this.page = page;
  }

  public static async create<T extends BaseBiography>(this: new (page: Page) => T, page: Page): Promise<T> {
    const instance = new this(page);
    try {
      await instance.extractData();
    } catch (error) {
      console.error("Error extracting biographical data:", error);
    }
    return instance;
  }

  protected abstract extractData(): Promise<void>;

  protected parseLabeledContent(sectionHTML: string): Partial<ScrapedAuthorData> {
    /**
     * Construct a case-insensitive regex that will find bolded labels, then omit
     * whitespace and any optional anchor tags, capturing the text content that follows
     */
    const labelRegex = new RegExp(
      `<strong>(${BaseBiography.labels})[^<]*</strong>` + // any of the bold label text
        `\\s*` + // optional whitespace
        `(?:<a[^>]*>)?` + // optional opening anchor tag
        `([^<]+)` + // capture text content (greedy now)
        `(?:</a>)?`, // optional closing anchor tag
      "gi", // global, case-insensitive flag
    );

    const matches = sectionHTML.matchAll(labelRegex);
    const results: Partial<Record<keyof ScrapedAuthorData, string>> = {};

    for (const match of matches) {
      const key = match[1].toLowerCase() as keyof ScrapedAuthorData;
      const rawValue = match[2] || "";
      const trimmedValue = rawValue
        .replace(/&nbsp;/g, "")
        ?.replace(/\s/g, "")
        .toLowerCase();

      if (trimmedValue === "n/a" || trimmedValue === "") {
        results[key] = "";
        continue;
      }

      const normalizedValue = rawValue
        .trim() // Remove leading/trailing whitespace and newlines
        .replace(/&nbsp;/g, " ") // Replace non-breaking spaces
        .replace(/\s+/g, " "); // Normalize multiple whitespace to single spaces

      results[key] = normalizedValue || "";
    }

    return results as Partial<ScrapedAuthorData>;
  }

  protected normalizeBiography(bio: string): string {
    const bioText = bio
      .replace(/<[^>]*>/g, "") // Remove HTML
      .replace(/&nbsp;/g, " ") // Replace entities for non-breaking spaces
      .trim()
      .replace(/\s+/g, " "); // Normalize whitespace

    const isPlaceholderText = BaseBiography.placeholders.some((placeholder) => {
      return bioText.includes(placeholder);
    });

    return isPlaceholderText ? "" : bioText;
  }
}
