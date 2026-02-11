import type { Page } from "playwright";
import * as stringUtils from "#/utils/stringUtils";
import { extractISBN } from "#/utils/isbnUtils";
import type { PlayData } from "#/db-types/play/play.types";

type ProductionDetails = { productionLocation: string; productionYear: string };
type PublicationDetails = { publisher: string; publicationYear: string; isbn?: string };

const { hasAlphanumericCharacters, normalizeWhitespace, removeAndNormalize } = stringUtils;

export default abstract class BaseWorksList {
  protected static publisherException = "I don't think it has been published.";

  protected page: Page;

  protected data: PlayData[] = [];

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
      console.error("Error extracting works list data:", error);
    }
    return instance;
  }

  protected abstract extractData(): Promise<void>;

  protected getPlayId(idString: string): string {
    return idString?.trim() || "0000000";
  }

  protected normalizeStringFields(data: any[]) {
    return data.map((work) => {
      const normalizedWork: any = {};
      for (const [key, value] of Object.entries(work)) {
        if (typeof value === "string") {
          normalizedWork[key] = stringUtils.checkScrapedString(value);
        } else {
          normalizedWork[key] = value;
        }
      }
      return normalizedWork;
    });
  }

  protected parseProductionDetails(productionText: string): ProductionDetails {
    if (!hasAlphanumericCharacters(productionText)) {
      return { productionLocation: "", productionYear: "" };
    }

    // Date patterns with optional enclosing parentheses
    const fullDatePattern = /\(?(\d{1,2}\s+[A-Za-z]{3}\s+\d{4})\)?/; // DD MMM YYYY
    const yearOnlyPattern = /\(?(\d{4})\)?/; // YYYY

    const [extractedDate, updatedString] = stringUtils.searchForAndRemove(productionText, [
      fullDatePattern,
      yearOnlyPattern,
    ]);

    return {
      productionLocation: removeAndNormalize(updatedString, ">>>"),
      productionYear: normalizeWhitespace(extractedDate),
    };
  }

  protected parsePublicationDetails(publicationText: string, includeISBN: boolean): PublicationDetails {
    let workingString = publicationText;
    const isbn = includeISBN ? { isbn: "" } : {};

    const isBlank = !hasAlphanumericCharacters(publicationText);
    const isMissing = publicationText.includes(BaseWorksList.publisherException);

    if (isBlank || isMissing) {
      return { publisher: "", publicationYear: "", ...isbn };
    }

    if (includeISBN) {
      const [numericIsbn, matchedIsbn] = extractISBN(publicationText);
      if (numericIsbn && matchedIsbn) {
        isbn.isbn = numericIsbn;
        workingString = publicationText.replace(matchedIsbn[0], "");
      }
    }

    const datePattern = /\(?(\d{4})\)?/; // YYYY with optional enclosing parentheses
    const [extractedDate, updatedString] = stringUtils.searchForAndRemove(workingString, [datePattern]);

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
  protected formatISBN(isbnString: string = ""): string {
    return isbnString.replace(/ISBN\s*[:\-]?\s*/i, "").trim();
  }

  protected formatReference(reference: string): string {
    return removeAndNormalize(reference, ">>>");
  }

  protected formatOrganizations(reference: string): string {
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
        const mainTitle = title.slice(0, -suffix.length).trim();
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
    return isNaN(num) ? 0 : num;
  };
}
