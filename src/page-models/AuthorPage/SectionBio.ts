import { Page } from "playwright";
import type { AuthorData } from "../../types";

export default class SectionBio {
  static readonly selectors = {
    section: "#osborne",
    image: "> img",
    name: "> .welcome > h1",
    dates: "> .welcome",
    bio: "xpath=./text()[last()]",
  };

  private page: Page;

  private data: AuthorData;

  public get authorData(): AuthorData {
    return this.data;
  }

  private constructor(page: Page) {
    this.page = page;
    this.data = {};
  }

  static async create(page: Page): Promise<SectionBio> {
    const instance = new SectionBio(page);
    try {
      await instance.extractData();
    } catch (error) {
      console.error("Error extracting author bio data:", error);
    }

    return instance;
  }

  private async getLabeledContent(labelText: string): Promise<string> {
    const section = this.page.locator(SectionBio.selectors.section);
    const label = section.locator(`strong:has-text("${labelText}")`);
    const content = label.locator("xpath=following-sibling::text()[1]");
    return (await content.textContent())?.trim() || "";
  }

  private async getAttribute(
    selector: string,
    attribute: string
  ): Promise<string> {
    return (
      (
        await this.page
          .locator(SectionBio.selectors.section)
          .locator(selector)
          .getAttribute(attribute)
      )?.trim() || ""
    );
  }

  private async getTextContent(selector: string): Promise<string> {
    return (
      (
        await this.page
          .locator(SectionBio.selectors.section)
          .locator(selector)
          .textContent()
      )?.trim() || ""
    );
  }

  private async extractData(): Promise<void> {
    this.data.name = await this.getTextContent(SectionBio.selectors.name);
    this.data.altName = await this.getAttribute(
      SectionBio.selectors.image,
      "alt"
    );

    const { born, died } = await this.getDates();
    this.data.born = born;
    this.data.died = died;

    this.data.nationality = await this.getLabeledContent("Nationality:");
    this.data.email = await this.getLabeledContent("Email:");
    this.data.website = await this.getLabeledContent("Website:");
    this.data.literaryAgent = await this.getLabeledContent("Literary Agent:");
    this.data.research = await this.getLabeledContent("Research:");
    this.data.address = await this.getLabeledContent("Address:");
    this.data.telephone = await this.getLabeledContent("Telephone:");
    this.data.biography = await this.getBiography();
  }

  private async getDates(): Promise<{ born: string; died: string }> {
    const datesText = await this.getTextContent(SectionBio.selectors.dates);
    const datePattern = /\((\d{4})?\s*-\s*(\d{4})?\)/;
    const match = datesText.match(datePattern);
    return {
      born: match?.[1] || "",
      died: match?.[2] || "",
    };
  }

  private async getBiography(): Promise<string> {
    const biographyPlaceholders = [
      "including biography, theatres, agent, synopses, cast sizes, production and published dates",
      "please send me a biography and information about this playwright",
      "i do not have a biography of this playwright",
      "please help doollee to become even more complete",
    ];

    const normalizedBioText = (
      await this.page
        .locator(SectionBio.selectors.section)
        .locator("xpath=./strong[last()]/following-sibling::text()")
        .allTextContents()
    )
      .join("")
      .trim()
      .replace(/\s+/g, " ");

    if (biographyPlaceholders.includes(normalizedBioText.toLowerCase())) {
      return "";
    }

    return normalizedBioText;
  }
}
