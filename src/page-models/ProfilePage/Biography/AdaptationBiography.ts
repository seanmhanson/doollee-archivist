import type { ScrapedAuthorData } from "#/db-types/author/author.types";
import type { Page } from "playwright";

import BaseBiography from "#/page-models/ProfilePage/Biography/__BaseBiography";

type ScrapedData = {
  bio: string;
  dateString: string;
  imageSrc: string;
  imageAlt: string;
  innerHTML: string;
};

type ParsedNameAndDates = {
  name: string;
  yearBorn: string;
  yearDied: string;
};

export default class AdaptationBiography extends BaseBiography {
  protected data = {} as ScrapedAuthorData;

  public constructor(page: Page) {
    super(page);
  }

  protected async extractData(): Promise<void> {
    const { bio, dateString, imageSrc, imageAlt, innerHTML } = await this.scrapeData();
    const { name, yearBorn, yearDied } = this.parseAdaptationNameAndDates(dateString);
    const hasNoImage = imageSrc === "" || imageSrc.includes("/Images-playwrights/Blank");
    const altName = hasNoImage ? "" : imageAlt;

    const labeledContents = this.parseLabeledContent(innerHTML);
    const biography = this.normalizeBiography(bio);

    this.data = {
      ...this.data,
      ...labeledContents,
      name,
      altName,
      yearBorn,
      yearDied,
      biography,
    };
  }

  protected async scrapeData(): Promise<ScrapedData> {
    return await this.page.evaluate(() => {
      const bioSelector = "#table > p";
      const tableSelector = "#table table:first-child";
      const dateSelector = "#table table:first-child tr:first-child > td:nth-child(2) > h1";
      const imageSelector = "#table table:first-child tr:first-child > td:first-child > p img";

      const bio = document.querySelector(bioSelector)?.textContent?.trim() ?? "";
      const dateString = document.querySelector(dateSelector)?.textContent?.trim() ?? "";
      const imageNode = document.querySelector(imageSelector);
      const imageSrc = imageNode?.getAttribute("src") ?? "";
      const imageAlt = imageNode?.getAttribute("alt") ?? "";
      const innerHTML = document.querySelector(tableSelector)?.innerHTML ?? "";

      return {
        bio,
        dateString,
        imageSrc,
        imageAlt,
        innerHTML,
      };
    });
  }

  private parseAdaptationNameAndDates(dateString: string): ParsedNameAndDates {
    const datePattern = /\s*\(([^-]+?)\s*-\s*([^)]+?)\)$/;
    const match = datePattern.exec(dateString);

    return {
      name: match ? dateString.replace(datePattern, "").trim() : dateString,
      yearBorn: match?.[1]?.trim() ?? "",
      yearDied: match?.[2]?.trim() ?? "",
    };
  }
}
