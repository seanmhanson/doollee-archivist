import type { Page, Locator } from "playwright";
import type { AuthorData } from "../../types";

type Template = "section" | "table" | null;

type NameAndDates = {
  name: string;
  born: string;
  died: string;
};

export default class AuthorDetails {
  static readonly labels = [
    "Nationality",
    "Email",
    "Website",
    "Literary Agent",
    "Research",
    "Address",
    "Telephone",
  ];

  static readonly bioPlaceholders = [
    "including biography, theatres, agent, synopses, cast sizes, production and published dates",
    "please send me a biography and information about this playwright",
    "i do not have a biography of this playwright",
    "please help doollee to become even more complete",
  ];

  static readonly sectionSelectors = {
    section: "#osborne",
    image: "> img",
    name: "> .welcome > h1",
    dates: "> .welcome",
    bio: "xpath=./text()[last()]",
  };

  static readonly tableSelectors = {
    table: "#table table:first-child",
    name: "> td:nth-child(2) > h1",
    img: "> td:nth-child(1) > P > a > img",
    biography: "#table > p",
    nthRow: (index: number) => `tr:nth-child(${index})`,
  };

  private page: Page;

  private template: Template;

  private data: AuthorData;

  public get authorData(): AuthorData {
    return this.data;
  }

  private constructor(page: Page, template: Template) {
    this.template = template;
    this.page = page;
    this.data = {};
  }

  static async create(page: Page, template: Template): Promise<AuthorDetails> {
    const instance = new AuthorDetails(page, template);
    try {
      await instance.extractData();
    } catch (error) {
      console.error("Error extracting author biographical data:", error);
    }

    return instance;
  }

  private async extractData(): Promise<void> {
    if (this.template === "section") {
      await this.extractDataForSection();
    } else {
      await this.extractDataForTable();
    }
  }

  private async getAttribute(locator: Locator, attr: string): Promise<string> {
    return (await locator.getAttribute(attr))?.trim() || "";
  }

  private async getTextContent(locator: Locator): Promise<string> {
    return (await locator.textContent())?.trim() || "";
  }

  /**
   * Both templates used for authro biographies contain text values without clear
   * tags or structure to allow accurate extraction. Instead, we process the
   * full HTML and select values using regex matching to identify bolded labels and
   * their surrounding content. The biography section is distinct between the two
   * templates, so it is handled separately.
   */
  private async getLabeledContent(): Promise<Partial<AuthorData>> {
    const htmlLocator =
      this.template === "section"
        ? this.page.locator(AuthorDetails.sectionSelectors.section)
        : this.page.locator(AuthorDetails.tableSelectors.table);
    const innerHTML = await htmlLocator.innerHTML();

    const labels = AuthorDetails.labels.join("|");

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

    const matches = innerHTML.matchAll(labelRegex);
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

    // const biography = await this.getBiography();
    // results["biography"] = biography || "";
    return results;
  }

  private async getAltNameFromTable(): Promise<string> {
    const locator = this.page
      .locator(AuthorDetails.tableSelectors.table)
      .locator(AuthorDetails.tableSelectors.nthRow(1))
      .locator(AuthorDetails.tableSelectors.img);
    const imageSrc = await this.getAttribute(locator, "src");
    const imageAlt = await this.getAttribute(locator, "alt");
    const hasNoImage =
      imageSrc === "" || imageSrc.includes("/Images-playwrights/Blank");
    return hasNoImage ? "" : imageAlt;
  }

  /**
   * Get the text of a given locator and then extract birth and death years,
   * allowing for 1-4 digit years as well as additional indicators like ?, BC/BCE,
   * AD/CE, "Nth century" and similar.
   *
   * This returns a value "name" that strips out these dates, which is expected
   * to be blank for the section template.
   */
  private async extractDates(locator: Locator): Promise<NameAndDates> {
    const datePattern = /\s*\(([^-]+?)\s*-\s*([^)]+?)\)$/;
    const textContent = await this.getTextContent(locator);
    const match = textContent.match(datePattern);

    return {
      name: match ? textContent.replace(datePattern, "").trim() : textContent,
      born: match?.[1]?.trim() || "",
      died: match?.[2]?.trim() || "",
    };
  }

  private async getNameAndDatesFromSection(): Promise<NameAndDates> {
    const nameLocator = this.page.locator(AuthorDetails.sectionSelectors.name);
    const datesLocator = this.page.locator(
      AuthorDetails.sectionSelectors.dates
    );
    const name = await this.getTextContent(nameLocator);
    const { born, died } = await this.extractDates(datesLocator);
    return { name, born, died };
  }

  private async getNameAndDatesFromTable(): Promise<NameAndDates> {
    const locator = this.page
      .locator(AuthorDetails.tableSelectors.table)
      .locator(AuthorDetails.tableSelectors.nthRow(1))
      .locator(AuthorDetails.tableSelectors.name);
    return await this.extractDates(locator);
  }

  private async getBioFromSection(): Promise<string> {
    const htmlLocator = this.page.locator(
      AuthorDetails.sectionSelectors.section
    );
    const innerHTML = await htmlLocator.innerHTML();

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
    const labelMatches = [...innerHTML.matchAll(lastStrongPattern)];

    if (labelMatches.length === 0) {
      return "";
    }
    const lastMatch = labelMatches[labelMatches.length - 1];
    const afterLastStrong = innerHTML.substring(
      lastMatch.index + lastMatch[0].length
    );

    return this.normalizeBiography(afterLastStrong);
  }

  private async getBioFromTable(): Promise<string> {
    const locator = this.page.locator(AuthorDetails.tableSelectors.biography);
    const textContent = await this.getTextContent(locator);
    return this.normalizeBiography(textContent);
  }

  private async normalizeBiography(bio: string): Promise<string> {
    const bioText = bio
      .replace(/<[^>]*>/g, "") // Remove HTML
      .replace(/&nbsp;/g, " ") // Replace entities for non-breaking spaces
      .trim()
      .replace(/\s+/g, " "); // Normalize whitespace

    if (AuthorDetails.bioPlaceholders.some(bioText.includes)) {
      return "";
    }

    return bioText;
  }

  private async extractDataForSection(): Promise<void> {
    const imageLocator = this.page.locator(
      AuthorDetails.sectionSelectors.image
    );
    const altName = await this.getAttribute(imageLocator, "alt");
    const { name, born, died } = await this.getNameAndDatesFromSection();
    const labeledContents = await this.getLabeledContent();
    const biography = await this.getBioFromSection();

    this.data = {
      ...this.data,
      ...labeledContents,
      name,
      altName,
      born,
      died,
      biography,
    };
  }

  private async extractDataForTable(): Promise<void> {
    // const tableLocator = this.page.locator(AuthorTable.selectors.table);
    // const firstRow = tableLocator.locator(AuthorTable.selectors.nthRow(1));
    // const secondRow = tableLocator.locator(AuthorTable.selectors.nthRow(2));
    // const thirdRow = tableLocator.locator(AuthorTable.selectors.nthRow(3));
    // const nameLocator = firstRow.locator(AuthorTable.selectors.name);
    // const imageLocator = firstRow.locator(AuthorTable.selectors.img);
    // const bioLocator = tableLocator.locator(AuthorTable.selectors.bio);

    const { name, born, died } = await this.getNameAndDatesFromTable();
    const altName = await this.getAltNameFromTable();
    const labeledContents = await this.getLabeledContent();
    const biography = await this.getBioFromTable();

    this.data = {
      ...this.data,
      ...labeledContents,
      name,
      altName,
      born,
      died,
      biography,
    };
  }
}
