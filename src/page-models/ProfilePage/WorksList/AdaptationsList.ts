import type { Page } from "playwright";
import BaseWorksList from "./__BaseWorksList";

export default class AdaptationsList extends BaseWorksList {
  private static publisherException = "I don't think it has been published.";

  public constructor(page: Page) {
    super(page);
  }

  protected async extractData(): Promise<void> {
    const data = await this.scrapeTableData();

    this.data = data.map((adaptation) => {
      const originalAuthor = this.parseOriginalAuthor(adaptation.notes);
      const maleParts = this.parseParts(adaptation.maleParts);
      const femaleParts = this.parseParts(adaptation.femaleParts);
      const otherParts = this.parseParts(adaptation.otherParts);
      const { publisher, year } = this.parsePublisher(adaptation.publisher);

      // return with correct shape
    });
  }

  protected async scrapeTableData() {
    return await this.page.evaluate(async () => {
      /** Selectors */
      const nthRow = (n: number) => `tr:nth-of-type(${n})`;
      const nthCell = (n: number) => `td:nth-of-type(${n})`;
      const containerSelector = "#table";
      const headerSelector = "> h2 ~ table:nth-of-type(3n-2)";
      const bodySelector = "> h2 ~ table:nth-of-type(3n-1)";
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
        allPlayIds: container.querySelectorAll(playIdSelector),
        allAuthors: container.querySelectorAll(adaptingAuthorSelector),
        allTitles: container.querySelectorAll(titleSelector),
        allProductions: container.querySelectorAll(productionSelector),
        allDates: container.querySelectorAll(productionDateSelector),
        allOrgs: container.querySelectorAll(organizationsSelector),
        allPublishers: container.querySelectorAll(publisherSelector),
        allIsbns: container.querySelectorAll(isbnSelector),
        allMusic: container.querySelectorAll(musicSelector),
        allGenres: container.querySelectorAll(genreSelector),
        allMaleParts: container.querySelectorAll(malePartsSelector),
        allFemaleParts: container.querySelectorAll(femalePartsSelector),
        allOtherParts: container.querySelectorAll(otherPartsSelector),
        allNotes: container.querySelectorAll(notesSelector),
        allImages: container.querySelectorAll(imageSelector),
        allSynopses: container.querySelectorAll(synopsisSelector),
        allReferences: container.querySelectorAll(referenceSelector),
      };

      // Assemble results by index (each index = one adaptation)
      const results = [];
      const adaptationCount = data.allPlayIds.length;

      for (let i = 0; i < adaptationCount; i++) {
        results.push({
          playId: data.allPlayIds[i]?.textContent?.trim() || "",
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
    const regex = /Original Playwright:\s*(.+?)(;|$)/i;
    const match = notesString.match(regex);
    return match?.[1].trim() || "";
  }

  private parseParts(partsString: string): number | null {
    const numericString = /[0-9]+/;
    if (numericString.test(partsString)) {
      return parseInt(partsString, 10);
    }

    if (partsString === "-") {
      return 0;
    }

    return null;
  }

  private parsePublisher(publisherString: string) {
    if (publisherString.includes(AdaptationsList.publisherException)) {
      return { publisher: "", year: "" };
    }

    /**
     * For now, parse this minimally by looking for the first four-digit
     * year. In the future, more detailed parsing may be warranted
     */
    const yearPattern = /\(?[[12][0-9]{3}\)?/;
    const yearMatch = publisherString.match(yearPattern);
    if (!yearMatch) {
      return { publisher: publisherString, year: "" };
    }

    const year = yearMatch[0].replace(/[\(\);]/g, "").trim();
    const publisher = publisherString.replace(yearPattern, "").trim();

    return { publisher, year };
  }
}
