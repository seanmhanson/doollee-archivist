import type { ScrapedPlayData } from "#/db-types/play/play.types";
import type { Page } from "playwright";

import { DATE_PATTERNS } from "#/patterns";
import { extractIsbn } from "#/utils/isbnUtils";
import * as stringUtils from "#/utils/stringUtils";

type ProductionDetails = {
  productionLocation: string;
  productionYear: string;
  needsReview?: boolean;
  needsReviewReason?: string;
};
type PublicationDetails = {
  publisher: string;
  publicationYear: string;
  isbn?: string;
  needsReview?: boolean;
  needsReviewReason?: string;
};

const { hasAlphanumericCharacters, normalizeWhitespace, removeAndNormalize } = stringUtils;

export default abstract class BaseWorksList {
  protected static publisherException = "I don't think it has been published.";

  protected page: Page;

  protected data: ScrapedPlayData[] = [];

  public get worksData() {
    return this.data;
  }

  protected constructor(page: Page) {
    this.page = page;
    this.data = [];
  }

  public static async create<T extends BaseWorksList>(this: new (page: Page) => T, page: Page): Promise<T> {
    const instance = new this(page);
    try {
      await instance.extractData();
    } catch (error) {
      // [TODO] - flag "needsReview" and details due to this error, if enough data was extracted for usage
      // and otherwise, possibly re-throw the error for the scraping process to catch and handle
      console.error("Error extracting works list data:", error);
    }
    return instance;
  }

  protected abstract extractData(): Promise<void>;

  protected getPlayId(idString: string): string {
    return idString?.trim() || "0000000";
  }

  protected normalizeStringFields<T extends Record<string, unknown>>(data: T[]): T[] {
    return data.map((work) => {
      return Object.entries(work).reduce(
        (acc, [key, value]) => {
          if (typeof value === "string") {
            acc[key] = stringUtils.checkScrapedString(value);
          } else {
            acc[key] = value;
          }
          return acc;
        },
        {} as Record<string, unknown>,
      ) as T;
    });
  }

  protected parseProductionDetails(productionText: string): ProductionDetails {
    if (!hasAlphanumericCharacters(productionText)) {
      return { productionLocation: "", productionYear: "" };
    }

    let extractedDate = "";
    let updatedString = productionText;

    try {
      [extractedDate, updatedString] = stringUtils.searchForAndRemove(productionText, [
        DATE_PATTERNS.DAY_MONTH_YEAR,
        DATE_PATTERNS.MONTH_YEAR,
        DATE_PATTERNS.YEAR,
      ]);
    } catch (error) {
      console.error("Error parsing production details, multiple matches found:", error);
      return {
        productionLocation: removeAndNormalize(updatedString, ">>>"),
        productionYear: normalizeWhitespace(extractedDate),
        needsReview: true,
        needsReviewReason: "Multiple date matches found in production details",
      };
    }

    return {
      productionLocation: removeAndNormalize(updatedString, ">>>"),
      productionYear: normalizeWhitespace(extractedDate),
    };
  }

  protected parsePublicationDetails(publicationText: string, includeISBN: boolean): PublicationDetails {
    const isBlank = !hasAlphanumericCharacters(publicationText);
    const isMissing = publicationText.includes(BaseWorksList.publisherException);
    const isbn = includeISBN ? { isbn: "" } : {};

    if (isBlank || isMissing) {
      return { publisher: "", publicationYear: "", ...isbn };
    }

    let workingString = publicationText;

    if (includeISBN) {
      const extractedIsbn = extractIsbn(publicationText);

      if (extractedIsbn) {
        const isbnLabelPattern = /ISBN(?:-\d+)?\s*:?\s*/i;
        const { type, normalized, raw } = extractedIsbn;

        if (type === "ISBN10" || type === "ISBN13") {
          isbn.isbn = normalized;
        } else {
          // flag needs review and provide data for manual review
          console.warn(`Extracted ISBN is invalid (${type}): "${raw}" from publication text: "${publicationText}"`);
        }
        workingString = publicationText.replace(raw, "").replace(isbnLabelPattern, "");
      }
    }

    let extractedDate = "";

    // Pre-process: insert space between a year and an adjacent letter so that
    // word-boundary anchors (\b) in date patterns can match (e.g. "1973Methuen" → "1973 Methuen")
    const ADJACENT_YEAR_LETTER = /(\d{4})([A-Za-z])/g;
    const preprocessed = workingString.replace(ADJACENT_YEAR_LETTER, "$1 $2");
    let updatedString = preprocessed;

    try {
      [extractedDate, updatedString] = stringUtils.searchForAndRemove(preprocessed, [
        DATE_PATTERNS.MONTH_YEAR,
        DATE_PATTERNS.YEAR,
      ]);
    } catch (error) {
      // Multiple years in the string — fall back to the last year match and flag for review
      console.error("Error parsing publication details, multiple matches found:", error);
      const YEAR_GLOBAL = new RegExp(DATE_PATTERNS.YEAR.source, "gi");
      const allYears = Array.from(preprocessed.matchAll(YEAR_GLOBAL));
      const lastYear = allYears.at(-1);
      const fallbackYear = lastYear ? lastYear[0] : "";
      const fallbackString = lastYear ? preprocessed.replace(lastYear[0], "") : preprocessed;
      return {
        publisher: removeAndNormalize(fallbackString, ">>>"),
        publicationYear: normalizeWhitespace(fallbackYear),
        needsReview: true,
        needsReviewReason: "Multiple date matches found in publication details",
        ...isbn,
      };
    }

    return {
      publisher: removeAndNormalize(updatedString, ">>>"),
      publicationYear: normalizeWhitespace(extractedDate),
      ...isbn,
    };
  }

  /**
   * Formats the play ID to include an adaptation prefix if applicable,
   * to avoid duplicate values and collisions with original play IDs, and
   * to collate files easily.
   */
  protected formatPlayId(playId: string, type: "play" | "adaptation"): string {
    const prefix = type === "adaptation" ? "A" : "";
    const base = playId?.trim() || "0000000";
    return `${prefix}${base}`;
  }

  /**
   * Strips the ISBN value of any ISBN prefixes, whitespace, or dashes
   */
  protected formatISBN(isbnString = ""): string {
    return isbnString.replace(/ISBN(?:-\d+)?\s*:?\s*/i, "").trim();
  }

  protected formatReference(reference: string): string {
    // [TODO] - removing ">>>" typically indicates we needed to find this earlier when parsing and parse an anchor tag
    // and consider its inclusion instead or in addition to the string following >>>
    return removeAndNormalize(reference, ">>>");
  }

  protected formatOrganizations(reference: string): string {
    // [TODO] - ibid, see `formatReference`
    return removeAndNormalize(reference, ">>>");
  }

  /**
   * If the title ends with ", The", "A", or "An", moves that to the front of the title
   * for display purposes, and ensures title capitalization
   */
  protected formatDisplayTitle(title: string): string {
    const initialWords = ["the", "a", "an"];

    let displayTitle = title.toLowerCase();
    for (const word of initialWords) {
      const suffix = `, ${word}`;
      if (displayTitle.endsWith(suffix)) {
        const mainTitle = displayTitle.slice(0, -suffix.length).trim();
        displayTitle = `${word} ${mainTitle}`;
      }
    }

    return displayTitle.split(" ").reduce((acc, word) => {
      const capitalizedWord = word.charAt(0).toUpperCase() + word.slice(1);
      const divider = acc ? " " : "";
      return `${acc}${divider}${capitalizedWord}`;
    }, "");
  }

  protected formatGenres(genres: string): string {
    if (!genres || genres.trim() === "") {
      return "";
    }

    // Only apply title case and trim - preserve original structure
    return this.toTitleCaseGenre(genres.trim());
  }

  private toTitleCaseGenre(genre: string): string {
    return genre
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  protected parseCount = (text: string): number => {
    if (text === "-" || text === "") return 0;
    const num = parseInt(text, 10);

    // [TODO] - flag needsReview/needsReviewReason/needsReviewData on failure, to indicate a non-numeric value for a parts count
    return isNaN(num) ? 0 : num;
  };
}
