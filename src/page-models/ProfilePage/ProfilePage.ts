import type { Page } from "playwright";

import BasePage from "../__BasePage";
import { AdaptationBiography, StandardBiography } from "./Biography";
import { AdaptationList, PlaysList } from "./WorksList";

import type { AuthorData } from "#/types";
import type { BasePageArgs } from "../__BasePage";
import type { PlayData } from "#/db-types/play";

type UrlArgs = { slug: string; letter: string };

type Data = {
  biography: AuthorData;
  works: PlayData[];
};

type TemplateType = "standard" | "adaptations" | null;

export default class ProfilePage extends BasePage<UrlArgs, Data> {
  static readonly selectors = {
    tableIdentifier: "#table table:first-child",
    sectionIdentifier: "#osborne",
  };

  private template: TemplateType = null;

  private biographyComponent: StandardBiography | AdaptationBiography | null = null;

  private worksListComponent: PlaysList | AdaptationList | null = null;

  public readonly data: Data = {
    biography: {},
    works: [],
  };

  public get biographyData(): AuthorData {
    return this.data.biography;
  }

  public get worksData(): PlayData[] {
    return this.data.works;
  }

  constructor(page: Page, pageArgs: BasePageArgs<UrlArgs>) {
    super(page, pageArgs);
  }

  public constructUrl(pageArgs: UrlArgs): string {
    const uppercase = pageArgs.letter.toUpperCase();
    const directory = `Playwrights${uppercase}`;
    const pageName = `${pageArgs.slug}.php`;
    return `${BasePage.baseUrl}/${directory}/${pageName}`;
  }

  public async goto(options?: {
    waitUntil?: "load" | "domcontentloaded" | "networkidle" | "commit";
    timeout?: number;
  }): Promise<void> {
    await super.goto(options);
    this.template = await this.identifyTemplate();

    if (this.template === "standard") {
      this.biographyComponent = await StandardBiography.create(this.page);
      this.worksListComponent = await PlaysList.create(this.page);
    } else {
      this.biographyComponent = await AdaptationBiography.create(this.page);
      this.worksListComponent = await AdaptationList.create(this.page);
    }
  }

  public async extractPage(): Promise<void> {
    if (this.biographyComponent) {
      Object.assign(this.data.biography, this.biographyComponent.biographyData);
    } else {
      console.warn("No biography component available for data extraction.");
    }

    if (this.worksListComponent) {
      Object.assign(this.data.works, this.worksListComponent.worksData);
    } else {
      console.warn("No works list component available for data extraction.");
    }
  }

  private async identifyTemplate(): Promise<TemplateType> {
    const regularLocator = this.page.locator(ProfilePage.selectors.sectionIdentifier);
    const tableLocator = this.page.locator(ProfilePage.selectors.tableIdentifier).first();

    await regularLocator.or(tableLocator).first().waitFor();

    const regularIsVisible = await regularLocator.isVisible();
    const tableIsVisible = await tableLocator.isVisible();

    if (regularIsVisible && tableIsVisible) {
      throw new Error("Both regular and table templates are visible.");
    }

    if (!regularIsVisible && !tableIsVisible) {
      throw new Error("Neither regular nor table templates are visible.");
    }

    return regularIsVisible ? "standard" : "adaptations";
  }
}
