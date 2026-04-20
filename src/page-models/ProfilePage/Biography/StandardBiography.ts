import type { AuthorArchive, ScrapedAuthorData } from "#/db-types/author/author.types";
import type { Page } from "playwright";

import BaseBiography from "#/page-models/ProfilePage/Biography/__BaseBiography";

type ScrapedData = {
  altName: string;
  name: string;
  dates: string;
  innerHTML: string;
};

type ParsedDates = {
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
      const dates = document.querySelector(datesSelector)?.textContent?.trim() ?? "";
      const innerHTML = document.querySelector(sectionSelector)?.innerHTML ?? "";

      return { altName, name, dates, innerHTML };
    });
  }

  // Note: typically the biography text appears after the set of labeled sections, and has no label itself;
  // however if there is a research section, the biography text appears prior to the research label,
  // so we have to check and identify this exception separately, then split on the double line break that
  // separates the preceding section and the biography text.
  private parseBiography(sectionHTML: string): string {
    const researchLabelPattern = new RegExp(`<strong[^>]*>\\s*research`, "i");
    const paragraphBreakPattern = /(?:<br\s*\/?>\s*){2}/i;
    const lastStrongPattern = new RegExp(
      `<strong[^>]*>.*?<\\/strong>` + // bold label
        `(?:\\s*<a[^>]*>.*?<\\/a>)?`, // optional anchor tag from literary agent
      "g", // global match flag
    );

    const labelMatches = [...sectionHTML.matchAll(lastStrongPattern)];
    if (labelMatches.length === 0) {
      return "";
    }

    const lastLabelMatch = labelMatches[labelMatches.length - 1];
    const lastLabelHTML = lastLabelMatch[0];
    const lastLabelIndex = lastLabelMatch.index;

    const isResearchLastLabel = researchLabelPattern.test(lastLabelHTML);
    if (!isResearchLastLabel) {
      const biography = sectionHTML.substring(lastLabelIndex + lastLabelHTML.length);
      return this.normalizeBiography(biography);
    }

    let biographyStartIndex = 0;
    if (labelMatches.length > 1) {
      const previousLabelMatch = labelMatches[labelMatches.length - 2];
      const previousLabelHTML = previousLabelMatch[0];
      const previousLabelIndex = previousLabelMatch.index;
      biographyStartIndex = previousLabelIndex + previousLabelHTML.length;
    }
    const biographySection = sectionHTML.substring(biographyStartIndex, lastLabelIndex);
    const breakMatch = paragraphBreakPattern.exec(biographySection);

    if (!breakMatch) {
      return "";
    }

    return this.normalizeBiography(biographySection.substring(breakMatch.index + breakMatch[0].length));
  }

  private parseDates(dateString: string): ParsedDates {
    const { yearBorn, yearDied } = this.parseDateString(dateString, true);
    return { yearBorn, yearDied };
  }
}
