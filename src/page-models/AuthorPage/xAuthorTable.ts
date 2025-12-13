import type { Page, Locator } from "playwright";
import type { AuthorData } from "../../types";

export default class AuthorTable {
  static readonly selectors = {
    table: "#table table:first-child",
    name: "> td:nth-child(2) > h1",
    img: "> td:nth-child(1) > P > a > img",
    biography: "#table > p",
    nthRow: (index: number) => `tr:nth-child(${index})`,
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

  static async create(page: Page): Promise<AuthorTable> {
    const instance = new AuthorTable(page);
    try {
      await instance.extractData();
    } catch (error) {
      console.error("Error extracting author bio data:", error);
    }

    return instance;
  }

  private async getAttribute(locator: Locator, attr: string): Promise<string> {
    return (await locator.getAttribute(attr))?.trim() || "";
  }

  private async getTextContent(locator: Locator): Promise<string> {
    return (await locator.textContent())?.trim() || "";
  }

  /**
   * The author biography section contains text values without adequate labeling or
   * tags beyond strong tags that precede them. As a result, we parse the full HTML
   * rather than relying on selectors or specific row or cell positions.
   * @see AuthorSection.ts #getLabeledContent for a virtually identical implementation
   * outside of a table context
   */
  private async getAllLabeledContent() {
    const tableHTML = await this.page
      .locator(AuthorTable.selectors.table)
      .innerHTML();

    let label = AuthorTable.labels[0];
    const labels = AuthorTable.labels.join("|");

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

    const matches = tableHTML.matchAll(labelRegex);
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

  private async getBiography(): Promise<string> {}

  private async extractData(): Promise<void> {
    // const tableLocator = this.page.locator(AuthorTable.selectors.table);
    // const firstRow = tableLocator.locator(AuthorTable.selectors.nthRow(1));
    // const secondRow = tableLocator.locator(AuthorTable.selectors.nthRow(2));
    // const thirdRow = tableLocator.locator(AuthorTable.selectors.nthRow(3));
    // const nameLocator = firstRow.locator(AuthorTable.selectors.name);
    // const imageLocator = firstRow.locator(AuthorTable.selectors.img);
    // const bioLocator = tableLocator.locator(AuthorTable.selectors.bio);

    const nameText = await this.getTextContent(nameLocator);
    const { name, born, died } = await this.extractNameAndDates(nameText);
    this.data.altName = await this.extractAltName(imageLocator);
    this.data.name = name;
    this.data.born = born;
    this.data.died = died;

    // TODO: biography may include formatting and tags we are not capturing here
    this.data.biography = await this.getTextContent(bioLocator);
  }

  private async extractAltName(imageLocator: Locator): Promise<string> {
    const imageUrl = await this.getAttribute(imageLocator, "src");
    const imageAlt = await this.getAttribute(imageLocator, "alt");

    const noImage = imageUrl === "";
    const blankImage = imageUrl.includes("/Images-playwrights/Blank");
    const hasImage = !noImage && !blankImage;

    return hasImage ? imageAlt : "";
  }

  private async extractNameAndDates(
    nameText: string
  ): Promise<{ name: string; born: string; died: string }> {
    const datePattern = /\s*\((\d{4})?\s*-\s*(\d{4})?\)$/;
    const match = nameText.match(datePattern);

    return {
      name: match ? nameText.replace(datePattern, "").trim() : nameText,
      born: match?.[1] || "",
      died: match?.[2] || "",
    };
  }
}
