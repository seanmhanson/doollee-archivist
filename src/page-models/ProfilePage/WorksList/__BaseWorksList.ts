import type { Page } from "playwright";
import * as stringUtils from "#/utils/stringUtils";
import { extractISBN } from "#/utils/isbnUtils";

type ProductionDetails = { location: string; date: string };
type PublicationDetails = { publisher: string; year: string; isbn?: string };

const { hasAlphanumericCharacters, normalizeWhitespace, removeAndNormalize } = stringUtils;

export default abstract class BaseWorksList {
  protected page: Page;

  protected data: any[];

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

  protected parseProductionDetails(productionText: string): ProductionDetails {
    if (!hasAlphanumericCharacters(productionText)) {
      return { location: "", date: "" };
    }

    // Date patterns with optional enclosing parentheses
    const fullDatePattern = /\(?(\d{1,2}\s+[A-Za-z]{3}\s+\d{4})\)?/; // DD MMM YYYY
    const yearOnlyPattern = /\(?(\d{4})\)?/; // YYYY

    const [extractedDate, updatedString] = stringUtils.searchForAndRemove(productionText, [
      fullDatePattern,
      yearOnlyPattern,
    ]);

    return {
      location: removeAndNormalize(updatedString, ">>>"),
      date: normalizeWhitespace(extractedDate),
    };
  }

  protected parsePublicationDetails(publicationText: string, includeISBN: boolean): PublicationDetails {
    let workingString = publicationText;
    const isbn = includeISBN ? { isbn: "" } : {};

    if (!hasAlphanumericCharacters(publicationText)) {
      return { publisher: "", year: "", ...isbn };
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
      year: normalizeWhitespace(extractedDate),
      ...isbn,
    };
  }
}
