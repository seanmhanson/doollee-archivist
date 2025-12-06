import { Page } from "playwright";
import BasePage from "./__BasePage";
import type { BasePageArgs } from "./__BasePage";

type UrlArgs = { slug: string; letter: string };

type PageArgs = BasePageArgs<UrlArgs>;

type Data = { [key: string]: string };

export default class AuthorPage extends BasePage<UrlArgs, Data> {
  static authorSelectors = {
    section: "#osborne",
    name: "#osborne > .welcome > h1",
    dates: "#osborne > .welcome",
    image: "#osborne > img",
    nationality: '//*[@id="osborne"]/text()[1]',
    email: '//*[@id="osborne"]/text()[2]',
    website: '//*[@id="osborne"]/text()[3]',
    literaryAgent: '//*[@id="osborne"]/text()[4]',
    biography: '//*[@id="osborne"]/text()[5]',
  };
  static selectors = {
    authorSection: "#osborne",
    authorImage: "#osborne > img",
    authorName: "#osborne > .welcome > h1",
    authorDates: "#osborne > .welcome",
  };

  public readonly data: Data = {};

  constructor(page: Page, pageArgs: PageArgs) {
    super(page, pageArgs);
  }

  public constructUrl(pageArgs: UrlArgs): string {
    const uppercase = pageArgs.letter.toUpperCase();
    const directory = `Playwrights${uppercase}`;
    const pageName = `3Playwrights${uppercase}data.php`;
    return `${BasePage.baseUrl}/${directory}/${pageName}`;
  }

  public async extractPage(): Promise<void> {}

  private async getAuthorTextContent(
    labelText: string
  ): Promise<string | null> {
    return this.page
      .locator(AuthorPage.authorSelectors.section)
      .locator(`strong:has-text("${labelText}")`)
      .locator("xpath=following-sibling::text()[1]")
      .textContent();
  }

  public async extractAuthorDetails(): Promise<void> {
    const nationality = await this.getAuthorTextContent("Nationality:");
    const email = await this.getAuthorTextContent("email");
    const website = await this.getAuthorTextContent("Website:");
    const literaryAgent = await this.getAuthorTextContent("Literary Agent:");
    // TODO: continue
    // xpath=//strong[contains(text(), "Nationality:")]/following-sibling::text()[1]'
  }
}
