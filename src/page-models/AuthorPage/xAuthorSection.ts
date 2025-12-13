import type { Page } from "playwright";
import type { AuthorData } from "../../types";

export default class AuthorSection {
  static readonly selectors = {
    section: "#osborne",
    image: "> img",
    name: "> .welcome > h1",
    dates: "> .welcome",
    bio: "xpath=./text()[last()]",
  };

  static readonly labels = [
    "Nationality",
    "Email",
    "Website",
    "Literary Agent",
    "Research",
    "Address",
    "Telephone",
  ];

  private page: Page;

  private data: AuthorData;

  public get authorData(): AuthorData {
    return this.data;
  }

  private constructor(page: Page) {
    this.page = page;
    this.data = {};
  }

  static async create(page: Page): Promise<AuthorSection> {
    const instance = new AuthorSection(page);
    try {
      await instance.extractData();
    } catch (error) {
      console.error("Error extracting author bio data:", error);
    }

    return instance;
  }

  /**
   * The author biography section contains text values without clear labels or tags
   * that allow accurate extraction. This processes the full HTML and selects values
   * from it using regex matching, intended to run only once per page to minimize
   * performance impact.
   */
  private async getLabeledContent(): Promise<Partial<AuthorData>> {
    const sectionHTML = await this.page
      .locator(AuthorSection.selectors.section)
      .innerHTML();

    let label = AuthorSection.labels[0];
    const labels = AuthorSection.labels.join("|");
    /**
     * Construct a case-insensitive regex that will find bolded labels, then omit
     * whitespace and any optional anchor tags, capturing the text content that follows
     */
    const labelRegex = new RegExp(
      `<strong>(${labels})[^<]*</strong>` + // any of the bold label text
        `\\s*` + // optional whitespace
        `(?:<a[^>]*>)?` + // optional opening anchor tag
        `([^<]+)` + // capture text content (greedy now)
        `(?:</a>)?`, // optional closing anchor tag
      "gi" // global, case-insensitive flag
    );

    const matches = sectionHTML.matchAll(labelRegex);
    const results: Record<string, string> = {};

    for (const match of matches) {
      const key = match[1].toLowerCase();
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

    const biography = await this.getBiography(sectionHTML);
    results["biography"] = biography || "";
    return results;
  }

  private async getAttribute(
    selector: string,
    attribute: string
  ): Promise<string> {
    return (
      (
        await this.page
          .locator(AuthorSection.selectors.section)
          .locator(selector)
          .getAttribute(attribute)
      )?.trim() || ""
    );
  }

  private async getTextContent(selector: string): Promise<string> {
    return (
      (
        await this.page
          .locator(AuthorSection.selectors.section)
          .locator(selector)
          .textContent()
      )?.trim() || ""
    );
  }

  private async extractData(): Promise<void> {
    const name = await this.getTextContent(AuthorSection.selectors.name);
    const altName = await this.getAttribute(
      AuthorSection.selectors.image,
      "alt"
    );
    const dates = await this.getDates();

    this.data.born = dates.born;
    this.data.died = dates.died;

    const labeledContents = await this.getLabeledContent();

    this.data = {
      ...this.data,
      ...labeledContents,
      name,
      altName,
      born: dates.born,
      died: dates.died,
    };
  }

  private async getDates(): Promise<{ born: string; died: string }> {
    const datesText = await this.getTextContent(AuthorSection.selectors.dates);
    const datePattern = /\((\d{4})?\s*-\s*(\d{4})?\)/;
    const match = datesText.match(datePattern);
    return {
      born: match?.[1] || "",
      died: match?.[2] || "",
    };
  }

  private async getBiography(sectionHTML: string): Promise<string> {
    const biographyPlaceholders = [
      "including biography, theatres, agent, synopses, cast sizes, production and published dates",
      "please send me a biography and information about this playwright",
      "i do not have a biography of this playwright",
      "please help doollee to become even more complete",
    ];

    /**
     * The biography is the last text content after the labeled sections, so this
     * regex finds all bold labels, and matching against all gives the remaining
     * text content for the section
     */
    const lastStrongPattern = new RegExp(
      `<strong[^>]*>.*?<\\/strong>` + // bold label
        `(?:\\s*<a[^>]*>.*?<\\/a>)?`, // optional anchor tag from literary agent
      "g" // global match flag
    );
    const labelMatches = [...sectionHTML.matchAll(lastStrongPattern)];

    if (labelMatches.length === 0) {
      return "";
    }
    const lastMatch = labelMatches[labelMatches.length - 1];
    const afterLastStrong = sectionHTML.substring(
      lastMatch.index + lastMatch[0].length
    );

    // Clean up the biography text
    const bioText = afterLastStrong
      .replace(/<[^>]*>/g, "") // Remove HTML
      .replace(/&nbsp;/g, " ") // Replace entities for non-breaking spaces
      .trim()
      .replace(/\s+/g, " "); // Normalize whitespace

    if (biographyPlaceholders.some(bioText.includes)) {
      return "";
    }

    return bioText;
  }
}
