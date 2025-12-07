import { Page } from "playwright";
import BasePage from "../__BasePage";
import SectionBio from "./SectionBio";
import TableBio from "./TableBio";
import type { AuthorData } from "../../types";
import type { BasePageArgs } from "../__BasePage";

type UrlArgs = { slug: string; letter: string };

type Data = { [key: string]: string };

type TemplateType = "regular" | "table" | null;

export default class AuthorPage extends BasePage<UrlArgs, Data> {
  static readonly selectors = {
    tableIdentifier: ".content > #table > table",
    sectionIdentifier: "#osborne",
  };

  private template: TemplateType = null;
  private biographyComponent: SectionBio | TableBio | null = null;
  public readonly data: AuthorData = {};

  public get authorData(): AuthorData {
    return this.data;
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
      this.biographyComponent = await SectionBio.create(this.page);
    } else if (this.template === "table") {
      this.biographyComponent = await TableBio.create(this.page);
    }
  }

  public async extractPage(): Promise<void> {
    if (this.biographyComponent) {
      Object.assign(this.data, this.biographyComponent.authorData);
    } else {
      console.warn("No biography component available for data extraction.");
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
