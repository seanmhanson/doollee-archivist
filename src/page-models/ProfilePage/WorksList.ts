import type { Page } from "playwright";
import type { PartsData } from "#/db-types/play";

import { extractISBN } from "#/utils/isbnUtils";

export default class WorksList {
  /**
   * NB: All play data is listed in a flat structure with non-unique IDs;
   * we therefore need to index them based on the play's position in the list.
   */
  static readonly selectors = {
    id: "#playwrightTable",
    title: "#playTable",
    synopsis: "#synopsisName",
    notes: "#notesName",
    production: "#producedPlace",
    organizations: "#companyName",
    publisher: "#publishedName",
    music: "#musicName",
    genre: "#genreName",
    parts: "#partsMaletitle",
    references: "#refname",
  };

  private page: Page;

  private data: any[];

  public get worksData(): any {
    return this.data;
  }

  private constructor(page: Page) {
    this.page = page;
    this.data = [];
  }

  static async create(page: Page): Promise<WorksList> {
    const instance = new WorksList(page);
    try {
      await instance.extractData();
    } catch (error) {
      console.error("Error extracting works list:", error);
    }

    return instance;
  }

  private async getTextContent(
    selector: string,
    index: number
  ): Promise<string> {
    const textContent = await this.page
      .locator(selector)
      .nth(index - 1)
      .textContent();

    if (textContent === null || textContent.trim() === "-") {
      return "";
    }

    return textContent.trim();
  }

  private async getPlayId(index: number): Promise<string> {
    const locator = this.page
      .locator(WorksList.selectors.id)
      .nth(index - 1)
      .locator("a");
    const name = await locator.getAttribute("name");
    return name?.trim() || "0000000";
  }

  /**
   *  Extract the data for the play, including some formatting cleanup,
   *  provided the index of the play in the list.
   *  @param index the 1-based index of the play in the list, provided to
   *  ensure correct selection given non-unique IDs.
   */
  private async extractPlay(index: number) {
    const playId = await this.getPlayId(index);
    const title = await this.getTextContent(WorksList.selectors.title, index);
    const notes = await this.getTextContent(WorksList.selectors.notes, index);
    const music = await this.getTextContent(WorksList.selectors.music, index);
    const genre = await this.getTextContent(WorksList.selectors.genre, index);

    const synopsis = await this.getTextContent(
      WorksList.selectors.synopsis,
      index
    );
    const production = await this.getTextContent(
      WorksList.selectors.production,
      index
    );
    const organizations = await this.getTextContent(
      WorksList.selectors.organizations,
      index
    );
    const publisher = await this.getTextContent(
      WorksList.selectors.publisher,
      index
    );
    const references = await this.getTextContent(
      WorksList.selectors.references,
      index
    );

    let partsData: PartsData | null = null;
    try {
      partsData = await this.extractParts(index);
    } catch (error) {
      console.error(`Error extracting parts data for play ${playId}: ${title}`);
    }

    const isbn = extractISBN(publisher);

    return {
      playId,
      title,
      synopsis,
      notes,
      production,
      organizations,
      publisher,
      music,
      genre,
      references,
      partsData,
      isbn,
    };
  }

  private async extractParts(index: number): Promise<PartsData | null> {
    const pattern = /Male:\s*(\d+|-)\s*Female:\s*(\d+|-)\s*Other:\s*(\d+|-)/;

    const partsText = await this.getTextContent(
      WorksList.selectors.parts,
      index
    );

    const match = partsText
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .match(pattern);

    if (!match) {
      throw new Error(
        `Parts text does not match expected format: ${partsText}`
      );
    }

    if ([match[1], match[2], match[3]].every((str) => str === "-")) {
      return null;
    }

    return {
      maleParts: match[1] === "-" ? 0 : parseInt(match[1]),
      femaleParts: match[2] === "-" ? 0 : parseInt(match[2]),
      otherParts: match[3] === "-" ? 0 : parseInt(match[3]),
    };
  }

  private async extractData(): Promise<void> {
    const numberOfWorks = await this.page.locator("#playwrightTable").count();
    console.log("play data found for " + numberOfWorks + " works");
    for (let i = 1; i <= numberOfWorks; i++) {
      this.data.push(await this.extractPlay(i));
    }
  }
}
