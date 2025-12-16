import type { Page } from "playwright";
import BaseBiography from "./__BaseBiography";

export default class StandardBiography extends BaseBiography {
  public constructor(page: Page) {
    super(page);
  }

  protected async extractData(): Promise<void> {
    const { altName, name, dateString, innerHTML } = await this.scrapeData();
    const { born, died } = this.parseDates(dateString);

    const labeledContent = this.parseLabeledContent(innerHTML);

    const bio = this.parseBiography(innerHTML);
    const biography = this.normalizeBiography(bio);

    this.data = {
      ...this.data,
      ...labeledContent,
      name,
      altName,
      born,
      died,
      biography,
    };
  }

  protected async scrapeData() {
    return await this.page.evaluate(async () => {
      const sectionSelector = "#osborne";
      const nameSelector = "#osborne > .welcome > h1";
      const datesSelector = "#osborne > .welcome";
      const imageSelector = "#osborne > img";

      const name = document.querySelector(nameSelector)?.textContent?.trim() || "";
      const altName = document.querySelector(imageSelector)?.getAttribute("alt")?.trim() || "";
      const dateString = document.querySelector(datesSelector)?.textContent?.trim() || "";
      const innerHTML = document.querySelector(sectionSelector)?.innerHTML || "";

      return {
        altName,
        name,
        dateString,
        innerHTML,
      };
    });
  }

  private parseBiography(sectionHTML: string): string {
    const lastStrongPattern = new RegExp(
      `<strong[^>]*>.*?<\\/strong>` + // bold label
        `(?:\\s*<a[^>]*>.*?<\\/a>)?`, // optional anchor tag from literary agent
      "g" // global match flag
    );
    const labelMatches = [...sectionHTML.matchAll(lastStrongPattern)];

    if (labelMatches.length === 0) {
      return "";
    }

    const lastMatch = labelMatches[labelMatches.length - 1];
    return sectionHTML.substring(lastMatch.index + lastMatch[0].length);
  }

  private parseDates(dateString: string) {
    const datePattern = /\s*\(([^-]+?)\s*-\s*([^)]+?)\)$/;
    const match = dateString.match(datePattern);

    return {
      born: match?.[1]?.trim() || "",
      died: match?.[2]?.trim() || "",
    };
  }
}
