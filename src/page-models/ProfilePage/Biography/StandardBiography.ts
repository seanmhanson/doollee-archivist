<<<<<<< HEAD
import type { ScrapedAuthorData } from "#/db-types/author/author.types";
=======
import type { AuthorArchive, ScrapedAuthorData } from "#/db-types/author/author.types";
>>>>>>> eslint
import type { Page } from "playwright";

import BaseBiography from "#/page-models/ProfilePage/Biography/__BaseBiography";

type ScrapedData = {
  altName: string;
  name: string;
  dates: string;
  innerHTML: string;
};

type ParseDates = {
  yearBorn: string;
  yearDied: string;
};

export default class StandardBiography extends BaseBiography {
  protected data = {} as ScrapedAuthorData;

  public constructor(page: Page) {
    super(page);
  }

  protected async extractData(): Promise<void> {
    const { altName, name, dates, innerHTML } = await this.scrapeData();
    const { yearBorn, yearDied } = this.parseDates(dates);
    const biography = this.parseBiography(innerHTML);
    const labeledContent = this.parseLabeledContent(innerHTML);

    const _archive: AuthorArchive = {
      name,
      altName,
      biography,
      dates,
      ...labeledContent,
    };

    this.data = {
      _archive,
      name,
      altName,
      yearBorn,
      yearDied,
      biography,
      ...labeledContent,
    };
  }

  protected async scrapeData(): Promise<ScrapedData> {
    return await this.page.evaluate(() => {
      const sectionSelector = "#osborne";
      const nameSelector = "#osborne > .welcome > h1";
      const datesSelector = "#osborne > .welcome";
      const imageSelector = "#osborne > img";

      const name = document.querySelector(nameSelector)?.textContent?.trim() ?? "";
      const altName = document.querySelector(imageSelector)?.getAttribute("alt")?.trim() ?? "";
<<<<<<< HEAD
      const dateString = document.querySelector(datesSelector)?.textContent?.trim() ?? "";
=======
      const dates = document.querySelector(datesSelector)?.textContent?.trim() ?? "";
>>>>>>> eslint
      const innerHTML = document.querySelector(sectionSelector)?.innerHTML ?? "";

      return { altName, name, dates, innerHTML };
    });
  }

  private parseBiography(sectionHTML: string): string {
    const lastStrongPattern = new RegExp(
      `<strong[^>]*>.*?<\\/strong>` + // bold label
        `(?:\\s*<a[^>]*>.*?<\\/a>)?`, // optional anchor tag from literary agent
      "g", // global match flag
    );
    const labelMatches = [...sectionHTML.matchAll(lastStrongPattern)];

    if (labelMatches.length === 0) {
      return "";
    }

    const lastMatch = labelMatches[labelMatches.length - 1];
    const biography = sectionHTML.substring(lastMatch.index + lastMatch[0].length);
    return this.normalizeBiography(biography);
  }

  private parseDates(dateString: string): ParseDates {
    const datePattern = /\s*\(([^-]+?)\s*-\s*([^)]+?)\)$/;
    const match = datePattern.exec(dateString);

    return {
      yearBorn: match?.[1]?.trim() ?? "",
      yearDied: match?.[2]?.trim() ?? "",
    };
  }
}
