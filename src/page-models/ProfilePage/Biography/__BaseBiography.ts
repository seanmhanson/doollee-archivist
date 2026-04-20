import type { LabeledContents, ScrapedAuthorData } from "#/db-types/author/author.types";
import type { Page } from "playwright";

export default abstract class BaseBiography {
  private static readonly labelMap: Record<string, keyof LabeledContents> = {
    nationality: "nationality",
    email: "email",
    website: "website",
    "literary agent": "literaryAgent",
    research: "research",
    address: "address",
    telephone: "telephone",
  };
  private static readonly labelString = Object.keys(BaseBiography.labelMap).join("|");

  protected static readonly placeholders = [
    "including biography, theatres, agent, synopses, cast sizes, production and published dates",
    "please send me a biography and information about this playwright",
    "i do not have a biography of this playwright",
    "please help doollee to become even more complete",
  ];

  protected page: Page;

  protected abstract data: ScrapedAuthorData;

  public get biographyData(): ScrapedAuthorData {
    return this.data;
  }

  protected constructor(page: Page) {
    this.page = page;
  }

  public static async create<T extends BaseBiography>(this: new (page: Page) => T, page: Page): Promise<T> {
    const instance = new this(page);
    try {
      await instance.extractData();
    } catch (error) {
      console.error("Error extracting biographical data:", error);
    }
    return instance;
  }

  protected abstract extractData(): Promise<void>;

  /**
   * Given HTML content that contains:
   *  - label content wrapped in <strong> tags
   *  - possible biography text following labeled content, separated by two <br> tags
   *  - possible anchor tags within labeled content (e.g. literary agent)
   * This method parses these sections and normalizes the text or attributes corresponding
   * to the biographical fields.
   * @param sectionHTML the HTML content that should be parsed into biography fields.
   * @returns an object containing the parsed biography fields as key-value pairs.
   */
  protected parseLabeledContent(sectionHTML: string): LabeledContents {
    const strongOpenTagPattern = `<strong\\b[^>]*>`;
    const labelTextPattern = `${strongOpenTagPattern}(${BaseBiography.labelString})[^<]*</strong>`;
    const htmlContentPattern = `(.*?)`;
    const delimiterPattern = `(?=<br\\s*/?>\\s*<br|${strongOpenTagPattern}|$)`;

    const labelRegExp = new RegExp(labelTextPattern + htmlContentPattern + delimiterPattern, "gis");

    const matches = sectionHTML.matchAll(labelRegExp);
    const results: LabeledContents = {};

    for (const match of matches) {
      const label = match[1].toLowerCase();
      const htmlContent = match[2] || "";

      // If the label doesn't map to a known key, defensively skip this match
      const key = BaseBiography.labelMap[label];
      if (!key) {
        continue;
      }

      // for author websites and emails, we capture the href value rather than display text;
      // if no href is found, we fall back to parsing the text content
      if (key === "website" || key === "email") {
        const hrefPattern = /href="([^"]+)"/i;
        const href = hrefPattern.exec(htmlContent)?.[1];
        if (href) {
          if (key === "email") {
            results[key] = href.replace(/^mailto:/i, "");
          } else {
            results[key] = href;
          }
          continue;
        }
      }

      const textValue = this.normalizeHtmlString(htmlContent);
      const hasValue = textValue && textValue.toLowerCase() !== "n/a";
      results[key] = hasValue ? textValue : "";
    }

    return results;
  }

  protected normalizeBiography(bio: string): string {
    const bioText = this.normalizeHtmlString(bio);

    const isPlaceholderText = BaseBiography.placeholders.some((placeholder) => {
      return bioText.toLowerCase().includes(placeholder);
    });

    return isPlaceholderText ? "" : bioText;
  }

  /**
   * Strip out HTML tags, decode non-breaking spaces, and normalize/trim whitespace characters in a given HTML string.
   * @param html the HTML string to be normalized
   * @returns the normalized string
   */
  protected normalizeHtmlString(html: string): string {
    const htmlTagPattern = /<[^>]*>/g;
    const nbspPattern = /&nbsp;/g;
    const whitespacePattern = /\s+/g;
    return html
      .replace(htmlTagPattern, "") // remove all tags
      .replace(nbspPattern, " ") // decode non-breaking spaces
      .replace(whitespacePattern, " ") // normalize internal whitespace
      .trim();
  }

  protected parseDateString(dateString: string, includeName = false) {
    const rangePattern = /\s*\(([^-)]+?)\s*-\s*([^)]*?)\)$/;
    const singleYearPattern = /\s*\(([^)]+?)\)$/;
    const rangeMatch = rangePattern.exec(dateString);
    if (rangeMatch) {
      return {
        name: includeName ? dateString.replace(rangePattern, "").trim() : "",
        yearBorn: rangeMatch[1].trim(),
        yearDied: rangeMatch[2].trim(),
      };
    }

    const singleYearMatch = singleYearPattern.exec(dateString);
    return {
      name: includeName ? (singleYearMatch ? dateString.replace(singleYearPattern, "").trim() : dateString) : "",
      yearBorn: singleYearMatch?.[1]?.trim() ?? "",
      yearDied: "",
    };
  }
}
