import BasePage from "../__BasePage";

import type { BasePageArgs } from "../__BasePage";
import type { Page } from "@playwright/test";

export type UrlArgs = {
  indexLetter: string;
  firstLetter: string;
  lastLetter: string;
};

type Data = Record<string, string>;

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
 * const listingPage = new ListingPage(page, {
 *   indexLetter: 'A',
 *   firstLetter: 'g',
 *   lastLetter: 'l'
 * });
 * await listingPage.extractPage();
 * console.log(listingPage.data);
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
export default class ListingPage extends BasePage<UrlArgs, Data> {
  /**
   * @inheritDoc
   */
  public data: Data = {};

  /**
   * @inheritDoc
   */
  constructor(page: Page, pageArgs: BasePageArgs<UrlArgs>) {
    super(page, pageArgs);
  }

  /**
   * @inheritDoc
   */
  public constructUrl(pageArgs: UrlArgs): string {
    const { indexLetter = "", firstLetter = "", lastLetter = "" } = pageArgs;
    const argsArray = [indexLetter, firstLetter, lastLetter];

    const missingArgs = argsArray.some((arg) => !arg);
    const invalidArgs = argsArray.some((arg) => /[^a-zA-Z]/.test(arg) || arg.length !== 1);

    if (missingArgs) {
      throw new Error("Missing required URL arguments");
    }

    if (invalidArgs) {
      throw new Error("Invalid URL arguments");
    }

    const index = pageArgs.indexLetter.toUpperCase();
    const first = pageArgs.firstLetter.toLowerCase();
    const last = pageArgs.lastLetter.toLowerCase();

    const directory = `Playwrights${index}`;
    const pageName = `${index}_playwrights_${first}-${last}.php`;
    return `${BasePage.baseUrl}/${directory}/${pageName}`;
  }

  /**
   * @inheritDoc
   */
  public async extractPage(): Promise<void> {
    this.data = await this.page.evaluate(() => {
      /**
       * Given a table row, determine if it is a presentation-only row based off whether or not it
       * does not contain links (corresponding to the initial header), or if it contains navigation
       * links ("Top of Page").
       */
      function isPresentationRow(row: Element): boolean {
        const linkElement = row.querySelector("td > p")?.querySelector("a");
        const linkText = linkElement?.textContent?.trim() ?? "";
        return !linkElement || linkText.includes("Top of Page");
      }
      const data: Record<string, string> = {};

      document.querySelectorAll("#table > table > tbody > tr").forEach((row) => {
        if (isPresentationRow(row)) {
          return;
        }

        row.querySelectorAll("td > p > a").forEach((link) => {
          const text = link.textContent?.trim() ?? "";
          const href = link.getAttribute("href") ?? "";
          const urlMatch = /Playwrights[A-Z]\/([a-z0-9\-()]+)\.php/.exec(href);

          if (!text || !urlMatch) {
            return;
          }

          data[text] = urlMatch[1];
        });
      });
      return data;
    });
  }
}
