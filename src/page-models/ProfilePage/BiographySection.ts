import type { Page, Locator } from "playwright";
import type { AuthorData } from "#/types";

type Template = "standard" | "adaptations" | null;

type NameAndDates = {
  name: string;
  born: string;
  died: string;
};

export default class BiographySection {
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

  static readonly selectors = {
    section: "#osborne",
    image: "> img",
    name: "> .welcome > h1",
    dates: "> .welcome",
    bio: "xpath=./text()[last()]",
  };

  static readonly adaptationsSelectors = {
    table: "#table table:first-child",
    name: "> td:nth-child(2) > h1",
    img: "> td:nth-child(1) > P > a > img",
    biography: "#table > p",
    nthRow: (index: number) => `tr:nth-child(${index})`,
  };

  private page: Page;

  private template: Template;

  private data: AuthorData;

  public get biographyData(): AuthorData {
    return this.data;
  }

  private constructor(page: Page, template: Template) {
    this.template = template;
    this.page = page;
    this.data = {};
  }

  static async create(
    page: Page,
    template: Template
  ): Promise<BiographySection> {
    const instance = new BiographySection(page, template);
    try {
      await instance.extractData();
    } catch (error) {
      console.error("Error extracting biographical data:", error);
    }

    return instance;
  }

  private async extractData(): Promise<void> {
    if (this.template === "standard") {
      await this.extractStandardData();
    } else {
      await this.extractAdaptationData();
    }
  }

  private async getAttribute(locator: Locator, attr: string): Promise<string> {
    return (await locator.getAttribute(attr))?.trim() || "";
  }

  private async getTextContent(locator: Locator): Promise<string> {
    return (await locator.textContent())?.trim() || "";
  }

  /**
   * Both templates used for playwright biographies contain text values without clear
   * tags or structure to allow accurate extraction. Instead, we process the
   * full HTML and select values using regex matching to identify bolded labels and
   * their surrounding content. The biography section is distinct between the two
   * templates, so it is handled separately.
   */
  private async getLabeledContent(): Promise<Partial<AuthorData>> {
    const htmlLocator =
      this.template === "standard"
        ? this.page.locator(BiographySection.selectors.section)
        : this.page.locator(BiographySection.adaptationsSelectors.table);
    const innerHTML = await htmlLocator.innerHTML();

    const labels = BiographySection.labels.join("|");

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

    return results;
  }

  private async getAdaptationAltName(): Promise<string> {
    const locator = this.page
      .locator(BiographySection.adaptationsSelectors.table)
      .locator(BiographySection.adaptationsSelectors.nthRow(1))
      .locator(BiographySection.adaptationsSelectors.img);
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

  private async getStandardNameAndDates(): Promise<NameAndDates> {
    const nameLocator = this.page.locator(BiographySection.selectors.name);
    const datesLocator = this.page.locator(BiographySection.selectors.dates);
    const name = await this.getTextContent(nameLocator);
    const { born, died } = await this.extractDates(datesLocator);
    return { name, born, died };
  }

  private async getAdaptationNameAndDates(): Promise<NameAndDates> {
    const locator = this.page
      .locator(BiographySection.adaptationsSelectors.table)
      .locator(BiographySection.adaptationsSelectors.nthRow(1))
      .locator(BiographySection.adaptationsSelectors.name);
    return await this.extractDates(locator);
  }

  private async getStandardBio(): Promise<string> {
    const htmlLocator = this.page.locator(BiographySection.selectors.section);
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

  private async getAdaptationBio(): Promise<string> {
    const locator = this.page.locator(
      BiographySection.adaptationsSelectors.biography
    );
    const textContent = await this.getTextContent(locator);
    return this.normalizeBiography(textContent);
  }

  private async normalizeBiography(bio: string): Promise<string> {
    const bioText = bio
      .replace(/<[^>]*>/g, "") // Remove HTML
      .replace(/&nbsp;/g, " ") // Replace entities for non-breaking spaces
      .trim()
      .replace(/\s+/g, " "); // Normalize whitespace

    if (BiographySection.bioPlaceholders.some(bioText.includes)) {
      return "";
    }

    return bioText;
  }

  private async extractStandardData(): Promise<void> {
    const imageLocator = this.page.locator(BiographySection.selectors.image);
    const altName = await this.getAttribute(imageLocator, "alt");
    const { name, born, died } = await this.getStandardNameAndDates();
    const labeledContents = await this.getLabeledContent();
    const biography = await this.getStandardBio();

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

  private async extractAdaptationData(): Promise<void> {
    const { name, born, died } = await this.getAdaptationNameAndDates();
    const altName = await this.getAdaptationAltName();
    const labeledContents = await this.getLabeledContent();
    const biography = await this.getAdaptationBio();

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
