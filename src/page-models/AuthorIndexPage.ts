import type { Page } from "@playwright/test";
import BasePage from "./__BasePage";
import type { BasePageArgs } from "./__BasePage";

type UrlArgs = { letter: string };

type PageArgs = BasePageArgs<UrlArgs>;

type Data = { [key: string]: string };

/**
 * Scraper for top-level index pages for authors on doollee.com.
 *
 * The top-level index pages are divided by the starting letter of the playwright's
 * last name, and provide links to sub-indexes covering ranges of names.
 * This class extracts these links to sub-indexes.
 *
 * @example
 * Ex: Playwrights beginning with "A" are divided into four sub-indexes:
 *   "Aa-Af", "Ag-Al", "Am-Ar", "As-Az"
 *
 * ```
 * const authorIndexPage = new AuthorIndexPage(page, { letter: 'A' });
 * await authorIndexPage.extractPage();
 * console.log(authorIndexPage.data);
 * ```
 *
 * Resulting data structure:
 * ```
 * {
 *   "aa-af": "https://www.doollee.com/PlaywrightsA/A_playwrights_a-f.php",
 *   "ag-al": "https://www.doollee.com/PlaywrightsA/A_playwrights_g-l.php",
 *   "am-ar": "https://www.doollee.com/PlaywrightsA/A_playwrights_m-r.php",
 *   "as-az": "https://www.doollee.com/PlaywrightsA/A_playwrights_s-z.php",
 * }
 * ```
 */
export default class AuthorIndexPage extends BasePage<UrlArgs, Data> {
  /**
   * Selectors for locating link containers and links within the page.
   * @remarks  Page structure differs for the indexes for the letters
   * E, Q, and X, and their selectors are included here as well.
   */
  static selectors = {
    linkContainer: ".content > h2 > center",
    linkContainerE: ".content > center > center > h2",
    linkContainerQX: ".content > #table",
    links: "p > a",
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
    const uppercase = pageArgs.letter.toUpperCase();
    const directory = `Playwrights${uppercase}`;
    const pageName = `3Playwrights${uppercase}data.php`;
    return `${BasePage.baseUrl}/${directory}/${pageName}`;
  }

  /**
   * @inheritDoc
   */
  public async extractPage(): Promise<void> {
    const mainSelector = this.page.locator(
      AuthorIndexPage.selectors.linkContainer
    );
    const eSelector = this.page.locator(
      AuthorIndexPage.selectors.linkContainerE
    );
    const qxSelector = this.page.locator(
      AuthorIndexPage.selectors.linkContainerQX
    );
    const combinedSelector = mainSelector.or(eSelector).or(qxSelector);
    await combinedSelector.waitFor();

    const links = this.page.locator(AuthorIndexPage.selectors.links);
    const linkCount = await links.count();

    for (let i = 0; i < linkCount; i++) {
      const link = links.nth(i);
      const href = await link.getAttribute("href");
      const text = await link.textContent();
      const match = text?.match(/\(([a-z]{2}) - ([a-z]{2})\)/);

      if (!href || !match) continue;
      const rangeStart = match[1];
      const rangeEnd = match[2];
      const key = `${rangeStart}-${rangeEnd}`;
      this.data[key] = href;
    }
  }
}
