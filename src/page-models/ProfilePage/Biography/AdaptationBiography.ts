import type { AuthorArchive, ScrapedAuthorData } from "#/db-types/author/author.types";
import type { Page } from "playwright";

import BaseBiography from "#/page-models/ProfilePage/Biography/__BaseBiography";

type ScrapedData = {
  bio: string;
  dates: string;
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
    const { bio, dates, imageSrc, imageAlt, innerHTML } = await this.scrapeData();
    const { name, yearBorn, yearDied } = this.parseAdaptationNameAndDates(dates);
    const labeledContents = this.parseLabeledContent(innerHTML);
    const altName = this.getAltName(imageSrc, imageAlt);
    const biography = this.normalizeBiography(bio);

    const _archive: AuthorArchive = {
      name,
      altName,
      biography,
      dates,
      ...labeledContents,
    };

    this.data = {
      _archive,
      name,
      altName,
      yearBorn,
      yearDied,
      biography,
      ...labeledContents,
    };
  }

  protected async scrapeData(): Promise<ScrapedData> {
    return await this.page.evaluate(() => {
      const bioSelector = "#table > p";
      const tableSelector = "#table table:first-child";
      const dateSelector = "#table table:first-child tr:first-child > td:nth-child(2) > h1";
      const imageSelector = "#table table:first-child tr:first-child > td:first-child > p img";

      const bio = document.querySelector(bioSelector)?.textContent?.trim() ?? "";
      const dates = document.querySelector(dateSelector)?.textContent?.trim() ?? "";
      const imageNode = document.querySelector(imageSelector);
      const imageSrc = imageNode?.getAttribute("src") ?? "";
      const imageAlt = imageNode?.getAttribute("alt")?.trim() ?? "";
      const innerHTML = document.querySelector(tableSelector)?.innerHTML ?? "";

      return {
        bio,
        dates,
        imageSrc,
        imageAlt,
        innerHTML,
      };
    });
  }

  private parseAdaptationNameAndDates(dateString: string): ParsedNameAndDates {
    return this.parseDateString(dateString, true);
  }

  private getAltName(imageSrc: string, imageAlt: string): string {
    const hasNoImage = imageSrc === "" || imageSrc.includes("/Images-playwrights/Blank");
    return hasNoImage ? "" : imageAlt;
  }
}
