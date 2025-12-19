import type { Page } from "playwright";
import BaseWorksList from "./__BaseWorksList";
import { normalizeWhitespace, removeAndNormalize } from "#/utils/stringUtils";

export default class AdaptationsList extends BaseWorksList {
  public constructor(page: Page) {
    super(page);
  }

  protected async extractData(): Promise<void> {
    const data = this.normalizeStringFields(await this.scrapeTableData());

    this.data = data.map(
      ({
        notes,
        maleParts,
        femaleParts,
        otherParts,
        publisher,
        production: productionText,
        productionDate,
        ...rest
      }) => {
        const originalAuthor = this.parseOriginalAuthor(notes);
        const parts = this.parseParts({ maleParts, femaleParts, otherParts });
        const publicationDetails = this.parsePublicationDetails(publisher, false);
        const publication = {
          publisher: publicationDetails.publisher,
          year: publicationDetails.year,
        };
        const production = {
          publisher: removeAndNormalize(productionText, ">>>"),
          year: normalizeWhitespace(productionDate),
        };

        return {
          ...rest,
          originalAuthor,
          production,
          publication,
          parts,
        };
      }
    );

    console.log(`${this.data.length} adaptations processed.`);
  }

  protected async scrapeTableData() {
    return await this.page.evaluate(async () => {
      /** Selectors */
      const nthRow = (n: number) => `tr:nth-of-type(${n})`;
      const nthCell = (n: number) => `td:nth-of-type(${n})`;
      const containerSelector = "#table";
      const headerSelector = "#table > h2 ~ table:nth-of-type(3n-1)";
      const bodySelector = "#table > h2 ~ table:nth-of-type(3n)";
      const playIdSelector = `${headerSelector} ${nthRow(1)} > ${nthCell(1)} > p > strong > a:first-child`;
      const adaptingAuthorSelector = `${headerSelector} ${nthRow(1)} > ${nthCell(1)} > p > strong > a:nth-child(2)`;
      const titleSelector = `${headerSelector} ${nthRow(1)} > ${nthCell(2)}`;
      const productionSelector = `${bodySelector} ${nthRow(1)} > ${nthCell(2)}`;
      const productionDateSelector = `${bodySelector} ${nthRow(1)} > ${nthCell(3)}`;
      const organizationsSelector = `${bodySelector} ${nthRow(2)} > ${nthCell(2)}`;
      const publisherSelector = `${bodySelector} ${nthRow(3)} > ${nthCell(2)}`;
      const isbnSelector = `${bodySelector} ${nthRow(3)} > ${nthCell(4)}`;
      const musicSelector = `${bodySelector} ${nthRow(4)} > ${nthCell(2)}`;
      const genreSelector = `${bodySelector} ${nthRow(7)} > ${nthCell(2)}`;
      const malePartsSelector = `${bodySelector} ${nthRow(8)} > ${nthCell(3)}`;
      const femalePartsSelector = `${bodySelector} ${nthRow(8)} > ${nthCell(5)}`;
      const otherPartsSelector = `${bodySelector} ${nthRow(9)} > ${nthCell(2)}`;
      const notesSelector = `${bodySelector} ${nthRow(10)} > ${nthCell(2)}`;
      const imageSelector = `${bodySelector} ${nthRow(11)} > ${nthCell(1)} > p > img`;
      const synopsisSelector = `${bodySelector} ${nthRow(11)} > ${nthCell(2)}`;
      const referenceSelector = `${bodySelector} ${nthRow(12)} > ${nthCell(2)}`;

      const container = document.querySelector(containerSelector);
      if (!container) return [];

      const data = {
        allPlayIds: document.querySelectorAll(playIdSelector),
        allAuthors: document.querySelectorAll(adaptingAuthorSelector),
        allTitles: document.querySelectorAll(titleSelector),
        allProductions: document.querySelectorAll(productionSelector),
        allDates: document.querySelectorAll(productionDateSelector),
        allOrgs: document.querySelectorAll(organizationsSelector),
        allPublishers: document.querySelectorAll(publisherSelector),
        allIsbns: document.querySelectorAll(isbnSelector),
        allMusic: document.querySelectorAll(musicSelector),
        allGenres: document.querySelectorAll(genreSelector),
        allMaleParts: document.querySelectorAll(malePartsSelector),
        allFemaleParts: document.querySelectorAll(femalePartsSelector),
        allOtherParts: document.querySelectorAll(otherPartsSelector),
        allNotes: document.querySelectorAll(notesSelector),
        allImages: document.querySelectorAll(imageSelector),
        allSynopses: document.querySelectorAll(synopsisSelector),
        allReferences: document.querySelectorAll(referenceSelector),
      };

      // Assemble results by index (each index = one adaptation)
      const results = [];
      const adaptationCount = data.allPlayIds.length;

      for (let i = 0; i < adaptationCount; i++) {
        results.push({
          playId: data.allPlayIds[i]?.getAttribute("name")?.trim() || "",
          adaptingAuthor: data.allAuthors[i]?.textContent?.trim() || "",
          title: data.allTitles[i]?.textContent?.trim() || "",
          production: data.allProductions[i]?.textContent?.trim() || "",
          productionDate: data.allDates[i]?.textContent?.trim() || "",
          organizations: data.allOrgs[i]?.textContent?.trim() || "",
          publisher: data.allPublishers[i]?.textContent?.trim() || "",
          isbn: data.allIsbns[i]?.textContent?.trim() || "",
          music: data.allMusic[i]?.textContent?.trim() || "",
          genres: data.allGenres[i]?.textContent?.trim() || "",
          maleParts: data.allMaleParts[i]?.textContent?.trim() || "",
          femaleParts: data.allFemaleParts[i]?.textContent?.trim() || "",
          otherParts: data.allOtherParts[i]?.textContent?.trim() || "",
          notes: data.allNotes[i]?.textContent?.trim() || "",
          imgAlt: data.allImages[i]?.getAttribute("alt")?.trim() || "",
          synopsis: data.allSynopses[i]?.textContent?.trim() || "",
          reference: data.allReferences[i]?.textContent?.trim() || "",
        });
      }

      return results;
    });
  }

  private parseOriginalAuthor(notesString: string): string {
    const regex = /Original Playwright\s*[:\-]\s*(.+?)(;|$)/i;
    const match = notesString.match(regex);
    return match?.[1].trim() || "";
  }

  private parseParts({
    maleParts,
    femaleParts,
    otherParts,
  }: {
    maleParts: string;
    femaleParts: string;
    otherParts: string;
  }) {
    const parsedMaleParts = this.parsePartsString(maleParts);
    const parsedFemaleParts = this.parsePartsString(femaleParts);
    const parsedOtherParts = this.parsePartsString(otherParts);

    // If all parts are either 0, null, or both, we treat the entire
    // parts section as missing and return nulls for all.
    if (
      (parsedMaleParts === 0 || parsedMaleParts === null) &&
      (parsedFemaleParts === 0 || parsedFemaleParts === null) &&
      (parsedOtherParts === 0 || parsedOtherParts === null)
    ) {
      return {
        maleParts: null,
        femaleParts: null,
        otherParts: null,
      };
    }

    return {
      maleParts: parsedMaleParts,
      femaleParts: parsedFemaleParts,
      otherParts: parsedOtherParts,
    };
  }

  private parsePartsString(partsString: string): number | null {
    const numericString = /[0-9]+/;
    if (numericString.test(partsString)) {
      return parseInt(partsString, 10);
    }

    if (partsString === "-") {
      return 0;
    }

    return null;
  }
}
