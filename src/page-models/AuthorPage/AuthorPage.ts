import type { Page } from "playwright";
import BasePage from "../__BasePage";
import AuthorSection from "./AuthorSection";
import AuthorTable from "./AuthorTable";
import PlaySection from "./PlaySection";
import PlayTable from "./PlayTable";
import type { AuthorData } from "../../types";
import type { BasePageArgs } from "../__BasePage";
import type { PlayData } from "../../types/play";

type UrlArgs = { slug: string; letter: string };

type Data = {
  author: AuthorData;
  plays: PlayData[];
};

type TemplateType = "regular" | "table" | null;

export default class AuthorPage extends BasePage<UrlArgs, Data> {
  static readonly selectors = {
    tableIdentifier: ".content > #table > table",
    sectionIdentifier: "#osborne",
  };

  private template: TemplateType = null;

  private biographyComponent: AuthorSection | AuthorTable | null = null;

  private playsListComponent: PlaySection | PlayTable | null = null;

  public readonly data: Data = {
    author: {},
    plays: [],
  };

  public get AuthorData(): AuthorData {
    return this.data.author;
  }

  public get PlaysData(): PlayData[] {
    return this.data.plays;
  }

  constructor(page: Page, pageArgs: BasePageArgs<UrlArgs>) {
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

    if (this.template === "regular") {
      this.biographyComponent = await AuthorSection.create(this.page);
      this.playsListComponent = await PlaySection.create(this.page);
    } else if (this.template === "table") {
      this.biographyComponent = await AuthorTable.create(this.page);
      this.playsListComponent = await PlayTable.create(this.page);
    }
  }

  public async extractPage(): Promise<void> {
    if (this.biographyComponent) {
      Object.assign(this.data.author, this.biographyComponent.authorData);
    } else {
      console.warn("No biography component available for data extraction.");
    }

    if (this.playsListComponent) {
      this.data.plays = this.playsListComponent.playsData;
      Object.assign(this.data.plays, this.playsListComponent.playsData);
    } else {
      console.warn("No works list component available for data extraction.");
    }
  }

  private async identifyTemplate(): Promise<TemplateType> {
    const regularLocator = this.page.locator(
      AuthorPage.selectors.sectionIdentifier
    );
    const tableLocator = this.page.locator(
      AuthorPage.selectors.tableIdentifier
    );
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
}
