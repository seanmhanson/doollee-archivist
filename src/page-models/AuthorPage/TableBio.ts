import type { Page, Locator } from "playwright";
import type { AuthorData } from "../../types";

export default class TableBio {
  static readonly selectors = {
    table: "#table table:first-child",
    name: "> td:nth-child(2) > h1",
    img: "> td:nth-child(1) > P > a > img",
    bio: "> p:last-child",
    nthRow: (index: number) => `tr:nth-child(${index})`,
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

  static async create(page: Page): Promise<TableBio> {
    const instance = new TableBio(page);
    try {
      await instance.extractData();
    } catch (error) {
      console.error("Error extracting author bio data:", error);
    }

    return instance;
  }

  private async getLabeledContent(
    locator: Locator,
    labelText: string
  ): Promise<string> {
    const label = locator.locator(`strong:has-text("${labelText}")`);
    const content = label.locator("xpath=following-sibling::text()[1]");
    return (await content.textContent())?.trim() || "";
  }

  private async getAttribute(locator: Locator, attr: string): Promise<string> {
    return (await locator.getAttribute(attr))?.trim() || "";
  }

  private async getTextContent(locator: Locator): Promise<string> {
    return (await locator.textContent())?.trim() || "";
  }

  private async extractData(): Promise<void> {
    const tableLocator = this.page.locator(TableBio.selectors.table);
    const firstRow = tableLocator.locator(TableBio.selectors.nthRow(1));
    const secondRow = tableLocator.locator(TableBio.selectors.nthRow(2));
    const thirdRow = tableLocator.locator(TableBio.selectors.nthRow(3));
    const nameLocator = firstRow.locator(TableBio.selectors.name);
    const imageLocator = firstRow.locator(TableBio.selectors.img);
    const bioLocator = tableLocator.locator(TableBio.selectors.bio);

    const nameText = await this.getTextContent(nameLocator);
    const { name, born, died } = await this.extractNameAndDates(nameText);
    this.data.altName = await this.extractAltName(imageLocator);
    this.data.name = name;
    this.data.born = born;
    this.data.died = died;

    this.data.nationality = await this.getLabeledContent(
      secondRow,
      "Nationality"
    );
    this.data.email = await this.getLabeledContent(secondRow, "Email");
    this.data.website = await this.getLabeledContent(secondRow, "Website");

    this.data.literaryAgent = await this.getLabeledContent(
      thirdRow,
      "Literary Agent"
    );
    this.data.research = await this.getLabeledContent(thirdRow, "Research");
    this.data.address = await this.getLabeledContent(thirdRow, "Address");
    this.data.telephone = await this.getLabeledContent(thirdRow, "Telephone");

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
