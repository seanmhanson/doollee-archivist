import type { Page, Locator } from "playwright";
import type { PlayData } from "#/db-types/play";

type PlayLocators = {
  header: Locator;
  body: Locator;
};

type SelectorKey = keyof typeof AdaptationsList.selectors;

/**
 * Scraper for tables of play data present on author pages using a table template,
 * to be used in conjunction with a ProfilePage model representing the author's biography
 * and repetoire listing.
 *
 * In general, these templates are used for plays that are adaptations or translations of
 * an original work, and are gathered under the author of the original source.
 *
 * These are presented in sets of tables that are not clearly labeled, made up of:
 * - a preceding table with the title, doollee play id, and adapting author
 * - a primary table with all other play data
 * - a divider table with a "back to top" link
 */
export default class AdaptationsList {
  static getCellSelector(rowIndex: number, cellIndex: number) {
    return `tr:nth-of-type(${rowIndex}) > td:nth-child(${cellIndex})`;
  }

  static readonly selectors = {
    // container for all play tables on the page
    playTables: "#table > h2 ~ table",

    // found on header tables
    playId: `${AdaptationsList.getCellSelector(
      1,
      1
    )} > p > strong > a:nth-child(1)`,
    adaptingAuthor: `${AdaptationsList.getCellSelector(
      1,
      1
    )} > p > strong > a:nth-child(2)`,
    title: AdaptationsList.getCellSelector(1, 2),

    // found on body tables
    production: AdaptationsList.getCellSelector(1, 2),
    productionDate: AdaptationsList.getCellSelector(1, 3),
    organizations: AdaptationsList.getCellSelector(2, 2),
    publisher: AdaptationsList.getCellSelector(3, 2),
    music: AdaptationsList.getCellSelector(4, 2),
    genre: AdaptationsList.getCellSelector(7, 2),
    maleParts: AdaptationsList.getCellSelector(8, 3),
    femaleParts: AdaptationsList.getCellSelector(8, 5),
    otherParts: AdaptationsList.getCellSelector(9, 2),
    notes: AdaptationsList.getCellSelector(10, 2),
    synopsis: AdaptationsList.getCellSelector(11, 2),
    reference: AdaptationsList.getCellSelector(12, 2),
    isbn: AdaptationsList.getCellSelector(3, 4),
    image: `${AdaptationsList.getCellSelector(11, 1)} > p > img`,
  };

  private page: Page;

  private tables: PlayLocators[];

  private data: Array<Partial<PlayData>>;

  public get worksData() {
    return this.data;
  }

  private constructor(page: Page) {
    this.page = page;
    this.data = [];
    this.tables = [];
  }

  static async create(page: Page): Promise<AdaptationsList> {
    const instance = new AdaptationsList(page);
    try {
      await instance.extractData();
    } catch (error) {
      console.error("Error extracting play data:", error);
    }

    return instance;
  }

  private async getTextContent(
    section: Locator,
    selectorKey: SelectorKey
  ): Promise<string> {
    const locator = section.locator(AdaptationsList.selectors[selectorKey]);
    return (await locator.textContent())?.trim() || "";
  }

  private async getAttribute(
    locator: Locator,
    attribute: string
  ): Promise<string> {
    return (await locator.getAttribute(attribute))?.trim() || "";
  }

  /**
   * Extract all tables after the author biography, and then group the headers and
   * bodies together for each applicable play, omitting the dividers. These tables
   * are grouped in triplets, ordered (1) header, (2) primary, (3) divider.
   */
  public async extractTables(): Promise<void> {
    const tables = await this.page
      .locator(AdaptationsList.selectors.playTables)
      .all();
    const playTables = [];

    for (let i = 0; i < tables.length - 1; i += 3) {
      const header = tables[i];
      const body = tables[i + 1];
      playTables.push({ header, body });
    }

    this.tables = playTables;
  }

  private extractOriginalAuthor(notes: string): string {
    const regex = /Original Playwright:\s*(.+?)(;|$)/i;
    const match = notes.match(regex);
    return match?.[1].trim() || "";
  }

  public async extractData(): Promise<void> {
    await this.extractTables();
    this.data = await Promise.all(
      this.tables.map((table) => this.extractPlayData(table))
    );
  }

  public async extractPlayData({
    header,
    body,
  }: PlayLocators): Promise<Partial<PlayData>> {
    const notes = await this.getTextContent(body, "notes");
    const originalAuthor = this.extractOriginalAuthor(notes);
    const publisher = await this.getTextContent(body, "publisher");

    return {
      playId: await this.getTextContent(header, "playId"),
      title: await this.getTextContent(header, "title"),
      altTitle: await this.getAttribute(
        body.locator(AdaptationsList.selectors.image),
        "alt"
      ),
      adaptingAuthor: await this.getTextContent(header, "adaptingAuthor"),

      isbn: await this.getTextContent(body, "isbn"),
      synopsis: await this.getTextContent(body, "synopsis"),
      firstProduction: {
        location: await this.getTextContent(body, "production"),
        year: await this.getTextContent(body, "productionDate"),
      },
      organizations: await this.getTextContent(body, "organizations"),
      firstPublished: {
        publisher, // TODO: extract publisher name, see below
        year: "", // TODO: extract publisher year, see below
      },
      music: await this.getTextContent(body, "music"),
      genres: await this.getTextContent(body, "genre"),
      partsText: {
        maleParts:
          parseInt(await this.getTextContent(body, "maleParts"), 10) || 0,
        femaleParts:
          parseInt(await this.getTextContent(body, "femaleParts"), 10) || 0,
        otherParts:
          parseInt(await this.getTextContent(body, "otherParts"), 10) || 0,
      },
      reference: await this.getTextContent(body, "reference"),
      originalAuthor, // TODO: update handling once manually tested thoroughly
      notes,
    };
  }
}

/**
 * TODO: extract publisher name
   TODO: extract publisher year
 * TODO: Handle this publisher note and isolate publishing dates:
 * "I don't think it has been published. Try emailing Playwright or Agent where listed at top of page."
 */
