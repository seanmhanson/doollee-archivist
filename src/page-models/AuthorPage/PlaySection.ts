import type { Page } from "playwright";
import { PartsData } from "../../types/play";

export default class PlaySection {
  static indexedSelector = (selector: string) => (index: number) =>
    `${selector}:nth-of-type(${index})`;

  static readonly selectors = {
    titlesList: "#listPlaytitles > strong",

    /**
     * NB: All play data is listed in a flat structure with non-unique IDs;
     * we therefore need to index them based on the play's position in the list.
     */
    id: PlaySection.indexedSelector("#playwrightTable"),
    title: PlaySection.indexedSelector("#playTable"),
    synopsis: PlaySection.indexedSelector("#synopsisName"),
    notes: PlaySection.indexedSelector("#notesName"),
    production: PlaySection.indexedSelector("#producedPlace"),
    organizations: PlaySection.indexedSelector("#companyName"),
    publisher: PlaySection.indexedSelector("#publishedName"),
    music: PlaySection.indexedSelector("#musicName"),
    genre: PlaySection.indexedSelector("#genreName"),
    parts: PlaySection.indexedSelector("#partsMaletitle"),
    references: PlaySection.indexedSelector("#refname"),
  };

  private page: Page;

  private data: any;

  public get playsData(): any {
    return this.data;
  }

  private constructor(page: Page) {
    this.page = page;
    this.data = {};
  }

  static async create(page: Page): Promise<PlaySection> {
    const instance = new PlaySection(page);
    try {
      await instance.extractData();
    } catch (error) {
      console.error("Error extracting author bio data:", error);
    }

    return instance;
  }

  private async getTextContent(selector: string): Promise<string> {
    return (await this.page.locator(selector).textContent())?.trim() || "";
  }

  /**
   * Assemble a definitive list of play titles and doollee IDs; this may also
   * be available in the body of the list, but the references here are the
   * simplest and most reliable due to usage as smage page anchors.
   */
  private async getPlayList() {
    const titles = await this.page
      .locator(PlaySection.selectors.titlesList)
      .all();

    for (const title of titles) {
      const playId = await title.getAttribute("href");
      const playTitle = await title.textContent();

      if (playId && playTitle) {
        this.data = {
          [playId.replace("#", "").trim()]: playTitle.trim(),
        };
      }
    }
  }

  /**
   *  Extract the data for the play, including some formatting cleanup,
   *  provided the index of the play in the list.
   *  @param index the 1-based index of the play in the list, provided to
   *  ensure correct selection given non-unique IDs.
   */
  private async extractPlay(index: number) {
    const playId = await this.getTextContent(PlaySection.selectors.id(index));
    const title = await this.getTextContent(PlaySection.selectors.title(index));
    const synopsis = await this.getTextContent(
      PlaySection.selectors.synopsis(index)
    );
    const notes = await this.getTextContent(PlaySection.selectors.notes(index));
    const production = await this.getTextContent(
      PlaySection.selectors.production(index)
    );
    const organizations = await this.getTextContent(
      PlaySection.selectors.organizations(index)
    );
    const publisher = await this.getTextContent(
      PlaySection.selectors.publisher(index)
    );
    const music = await this.getTextContent(PlaySection.selectors.music(index));
    const genre = await this.getTextContent(PlaySection.selectors.genre(index));
    const references = await this.getTextContent(
      PlaySection.selectors.references(index)
    );

    let partsData: PartsData | null = null;
    try {
      partsData = await this.extractParts(index);
    } catch (error) {
      console.error(`Error extracting parts data for play ${playId}: ${title}`);
    }

    const isbn = this.extractISBN(publisher);

    this.data.playId = {
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
    const partsText = await this.getTextContent(
      PlaySection.selectors.parts(index)
    );

    const pattern = /Male\: (\d-*) Female\: (\d-*) Other\: (\d-*)/;
    const match = partsText.match(pattern);

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

  /**
   * ISBN values are not clearly provided in this template, so this accepts the publisher details
   * and matches broadly against ISBN patterns, then filters and selects the best candidate,
   * favoring ISBN-13 where available; ISBN-13 values are more likely correctly identifiable due
   * to their prefixing.
   * @param publisherText
   * @returns
   */
  private extractISBN(publisherText: string): string | null {
    const isbnPrefixes = ["978", "979"];
    const isbnPattern = /[\d-]{10,}/g;
    const isbnCandidates = publisherText.match(isbnPattern);

    if (!isbnCandidates) {
      return null;
    }

    let isbn10Candidates = [];
    let isbn13Candidates = [];

    for (const isbn of isbnCandidates) {
      const normalizedIsbn = isbn.replace(/-/, "");
      const isbnLength = normalizedIsbn.length;
      const prefix = normalizedIsbn.slice(0, 3);

      if (isbnLength === 13 && isbnPrefixes.includes(prefix)) {
        isbn13Candidates.push(isbn);
      }
      if (isbnLength === 10) {
        isbn10Candidates.push(isbn);
      }
    }

    const totalIsbn10s = isbn10Candidates.length;
    const totalIsbn13s = isbn13Candidates.length;

    if (totalIsbn13s) {
      if (totalIsbn13s >= 1) {
        console.warn(
          `Multiple ISBN-13 candidates found; selecting the first one: ${isbn13Candidates.join(
            ", "
          )}`
        );
      }
      return isbn13Candidates[0];
    }
    if (totalIsbn10s) {
      if (totalIsbn10s >= 1) {
        console.warn(
          `Multiple ISBN-10 candidates found; selecting the first one: ${isbn10Candidates.join(
            ", "
          )}`
        );
      }
      return isbn10Candidates[0];
    }

    return null;
  }

  private async extractProduction(): Promise<void> {}
  private async extractPublisher(): Promise<void> {}

  private async extractData(): Promise<void> {}
}
