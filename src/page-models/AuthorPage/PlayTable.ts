import type { Page } from "playwright";
import type { PlayData } from "../../types/play";

export default class PlayTable {
  static readonly selectors = {
    playId: "tr > td:nth-child(1) > p > strong > a:nth-child(1)",
    title: "tr > td:nth-child(2)",
    synopsis: "",
    notes: "",
    production: "",
    productionDate: "",
    organizations: "",
    publisher: "",
    music: "",
    genre: "",
    maleParts: "",
    femaleParts: "",
    otherParts: "",
    reference: "",
    isbn: "",
  };

  private page: Page;

  private data: Partial<PlayData>;

  public get playsData() {
    return this.data;
  }

  private constructor(page: Page) {
    this.page = page;
    this.data = {};
  }

  static async create(page: Page): Promise<PlayTable> {
    const instance = new PlayTable(page);
    try {
      await instance.extractData();
    } catch (error) {
      console.error("Error extracting play data:", error);
    }

    return instance;
  }

  public async extractData(): Promise<void> {}
}
