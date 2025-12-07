import { Page } from "playwright";
import BasePage from "../__BasePage";
import type { BasePageArgs } from "../__BasePage";

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
  private template: TemplateType = null;
  private authorData: AuthorData = {};

  constructor(page: Page, pageArgs: PageArgs) {
    super(page, pageArgs);
  }

  public constructUrl(pageArgs: UrlArgs): string {
    const uppercase = pageArgs.letter.toUpperCase();
    const directory = `Playwrights${uppercase}`;
    const pageName = `3Playwrights${uppercase}data.php`;
    return `${BasePage.baseUrl}/${directory}/${pageName}`;
  }

  public async goto(options?: {
    waitUntil?: "load" | "domcontentloaded" | "networkidle" | "commit";
    timeout?: number;
  }): Promise<void> {
    await super.goto(options);
    this.template = await this.identifyTemplate();
  }

  public async extractPage(): Promise<void> {}

  private async identifyTemplate(): Promise<TemplateType> {
    const regularLocator = this.page.locator("#osborne");
    const tableLocator = this.page.locator(".content > #table > table");
    await regularLocator.or(tableLocator).first().waitFor();

    const regularIsVisible = await regularLocator.isVisible();
    const tableIsVisible = await tableLocator.isVisible();

    if (regularIsVisible && tableIsVisible) {
      throw new Error("Both regular and table templates are visible.");
    }

    if (!regularIsVisible && !tableIsVisible) {
      throw new Error("Neither regular nor table templates are visible.");
    }

    return regularIsVisible ? "regular" : "table";
  }

  private async getAuthorData(): Promise<void> {
    if (this.template === "regular") {
      await this.getRegularAuthorData();
    } else if (this.template === "table") {
      await this.getTableAuthorData();
    } else {
      throw new Error(`Unknown template type: ${this.template}`);
    }
  }

  private async getRegularAuthorData(): Promise<void> {
    const section = this.page.locator("#osborne");

    this.authorData = {
      image: (await section.locator("img").getAttribute("src")) || "",
      imageAlt: (await section.locator("img").getAttribute("alt")) || "",
      name: (await section.locator(".welcome > h1").textContent()) || "",
      dates: (await section.locator(".welcome").textContent()) || "",
      nationality: (await this.getAuthorTextContent("Nationality")) || "";
      email: (await this.getAuthorTextContent("Email")) || "",
      website: (await this.getAuthorTextContent("Website")) || "",
      literaryAgent: (await this.getAuthorTextContent("Literary Agent")) || "",
      research: (await this.getAuthorTextContent("Website")) || "",
      address: (await this.getAuthorTextContent("Website")) || "",
      telephone: (await this.getAuthorTextContent("Website")) || "",
    }
  }

  private async getTableAuthorData(): Promise<void> {}

  private async getAuthorTextContent(
    labelText: string,
    section = "#osborne"
  ): Promise<string | null> {
    return this.page
      .locator(section)
      .locator(`strong:has-text("${labelText}")`)
      .locator("xpath=following-sibling::text()[1]")
      .textContent();
  }
}

type TemplateType = "regular" | "table" | null;

type AuthorData = Partial<{
  image: string;
  name: string;
  born: string;
  died: string;
  nationality: string;
  email: string;
  website: string;
  literaryAgent: string;
  biography: string;
  research: string;
  address: string;
  telephone: string;
}>;
