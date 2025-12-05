import type { Page, Locator } from "@playwright/test";
import BasePage from "./__BasePage";
import type { BasePageArgs } from "./__BasePage";

type UrlArgs = {
  indexLetter: string;
  firstLetter: string;
  lastLetter: string;
};
type Data = { [key: string]: string };

type PageArgs = BasePageArgs<UrlArgs>;

/**
 * Scraper for sub-index pages for authors on doollee.com.
 *
 * The sub-index pages provide links to individual playwright pages
 * for last names for a given range (ex: "Aa-Af"). This class extracts the
 * full names and links for each playwright. The first letter and pair
 * of second letters are provided for URL construction.
 *
 * @example
 * ```
 * const authorSubindexPage = new AuthorSubindexPage(page, {
 *   indexLetter: 'A',
 *   firstLetter: 'g',
 *   lastLetter: 'l'
 * });
 * await authorSubindexPage.extractPage();
 * console.log(authorSubindexPage.data);
 * ```
 *
 * Resulting data structure (excerpted):
 * ```
 * {
 *   "AGABIAN Nancy": "agabian-nancy",
 *   ...,
 *   "ALZOUGBI Alian": "alzougbi-alian",
 * }
 * ```
 */
export default class AuthorSubindexPage extends BasePage<UrlArgs, Data> {
  /**
   * Selectors for locating table rows that containt links to
   * individual author pages, and those links.
   */
  static selectors = {
    tableRows: "#table > table > tbody > tr",
    tableLink: "td > p > a",
  };

  /**
   * @inheritDoc
   */
  public readonly data: Data = {};

  /**
   * @inheritDoc
   */
  constructor(page: Page, pageArgs: PageArgs) {
    super(page, pageArgs);
  }

  /**
   * @inheritDoc
   */
  public constructUrl(pageArgs: UrlArgs): string {
    const indexLetter = pageArgs.indexLetter.toUpperCase();
    const firstLetter = pageArgs.firstLetter.toLowerCase();
    const lastLetter = pageArgs.lastLetter.toLowerCase();

    const directory = `Playwrights${indexLetter}`;
    const pageName = `${indexLetter}_playwrights_${firstLetter}-${lastLetter}.php`;
    return `${BasePage.baseUrl}/${directory}/${pageName}`;
  }

  /**
   * @inheritDoc
   */
  public async extractPage(): Promise<void> {
    const rows = this.page.locator(AuthorSubindexPage.selectors.tableRows);
    const rowCount = await rows.count();
    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);

      // omit rows with group labels or navigation links
      if (await this.isPresentationRow(row)) {
        continue;
      }

      // some rows are malformed, so we can't assume a fixed number of cells
      const links = row.locator(AuthorSubindexPage.selectors.tableLink);
      const linkCount = await links.count();

      for (let j = 0; j < linkCount; j++) {
        const link = links.nth(j);
        const href = await link.getAttribute("href");
        const text = await link.textContent();
        if (!href || !text) {
          continue;
        }

        const url = href.match(/Playwrights[A-Z]\/([a-z0-9\-\(\)]+)\.php/);
        if (!url) {
          continue;
        }

        // for now store and move on; handling name data found
        // here is especially complicated
        this.data[text] = url[1];
      }
    }
  }

  /**
   * Determines if a table row is a presentation row (header or navigation).
   * This addresses discrepancies in the table, such as rows with headers,
   * unrelated navigation or incorrectly number of cells.
   * @param row Locator for the table row to evaluate.
   * @returns whether or not the row is presentation-only (no author links)
   */
  private async isPresentationRow(row: Locator): Promise<boolean> {
    // check for the header row, which has no anchor tags
    const firstCell = row.locator("td > p").first();
    const firstLink = firstCell.locator("a");
    const count = await firstLink.count();
    if (count === 0) {
      return true;
    }

    // check for the "top of page" rows, based on the first cell's link
    const label = (await firstLink.textContent()) || "";
    return label.includes("Top of Page");
  }
}
