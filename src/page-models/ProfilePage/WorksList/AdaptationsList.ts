import type { Page } from "playwright";
import BaseWorksList from "./__BaseWorksList";
import * as stringUtils from "#/utils/stringUtils";
import type { PlayData } from "#/db-types/play/play.types";

type UnparsedParts = {
  maleParts: string;
  femaleParts: string;
  otherParts: string;
};

export default class AdaptationsList extends BaseWorksList {
  protected data: PlayData[] = [];

  public constructor(page: Page) {
    super(page);
  }

  protected async extractData(): Promise<void> {
    const data = this.normalizeStringFields(await this.scrapeTableData());

    // destructure values we will remove before returning
    this.data = data.map(
      ({ production: productionLocation, productionDate: productionYear, publisher, imgAlt, ...adaptation }) => {
        // scraped values that we will add before returning
        const productionInfo = `${productionLocation || ""} ${productionYear || ""}`.trim();
        const publishingInfo = publisher || "";

        const productionDetails = {
          productionLocation,
          productionYear,
        };
        const publicationDetails = {
          ...this.parsePublicationDetails(publisher, false),
          isbn: this.formatISBN(adaptation.isbn),
        };

        const altTitle = imgAlt || "";

        // scraped values that we will overwrite before returning
        const playId = this.getPlayId(adaptation.playId);

        const parts = this.parseParts(adaptation.parts);
        const organizations = this.formatOrganizations(adaptation.organizations);
        const displayTitle = this.formatDisplayTitle(adaptation.title);
        const originalAuthor = this.parseOriginalAuthor(adaptation.notes);
        const reference = this.formatReference(adaptation.reference);
        const genres = this.formatGenres(adaptation.genres);
        const adaptingAuthor = stringUtils.toTitleCase(adaptation.adaptingAuthor);

        return {
          ...adaptation,
          playId,
          altTitle,
          displayTitle,
          originalAuthor,
          adaptingAuthor,
          productionInfo,
          publishingInfo,
          organizations,
          reference,
          ...parts,
          genres,
          ...productionDetails,
          ...publicationDetails,
        };
      },
    );
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
      const imageContainerSelector = `${bodySelector} ${nthRow(11)} > ${nthCell(1)}`;
      const imageSelector = "p > img";
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
        allImages: document.querySelectorAll(imageContainerSelector),
        allSynopses: document.querySelectorAll(synopsisSelector),
        allReferences: document.querySelectorAll(referenceSelector),
      };

      // Assemble results by index (each index = one adaptation)
      const results = [];
      const adaptationCount = data.allPlayIds.length;

      for (let i = 0; i < adaptationCount; i++) {
        const imageContainer = data.allImages[i];
        const imageElement = imageContainer.querySelector(imageSelector);

        results.push({
          playId: data.allPlayIds[i]?.getAttribute("name")?.trim() || "",
          adaptingAuthor: data.allAuthors[i]?.textContent?.trim() || "",
          title: data.allTitles[i]?.textContent?.trim() || "",
          productionLocation: data.allProductions[i]?.textContent?.trim() || "",
          productionYear: data.allDates[i]?.textContent?.trim() || "",
          organizations: data.allOrgs[i]?.textContent?.trim() || "",
          publisher: data.allPublishers[i]?.textContent?.trim() || "",
          isbn: data.allIsbns[i]?.textContent?.trim() || "",
          music: data.allMusic[i]?.textContent?.trim() || "",
          genres: data.allGenres[i]?.textContent?.trim() || "",
          notes: data.allNotes[i]?.textContent?.trim() || "",
          imgAlt: imageElement?.getAttribute("alt")?.trim() || "",
          synopsis: data.allSynopses[i]?.textContent?.trim() || "",
          reference: data.allReferences[i]?.textContent?.trim() || "",
          parts: {
            maleParts: data.allMaleParts[i]?.textContent?.trim() || "",
            femaleParts: data.allFemaleParts[i]?.textContent?.trim() || "",
            otherParts: data.allOtherParts[i]?.textContent?.trim() || "",
          },
        });
      }

      return results;
    });
  }

  private parseOriginalAuthor(notesString: string): string {
    const regex = /Original Playwright\s*[-:]\s*(.+?)(;|$)/i;
    const match = notesString.match(regex);
    return match?.[1].trim() || "";
  }

  private parseParts({ maleParts, femaleParts, otherParts }: UnparsedParts) {
    const partsTextMale = maleParts.trim();
    const partsTextFemale = femaleParts.trim();
    const partsTextOther = otherParts.trim();

    const isEmpty = (text: string) => {
      return !text || text === "-" || text === "0";
    };
    if ([partsTextMale, partsTextFemale, partsTextOther].every(isEmpty)) {
      return {};
    }

    const partsCountMale = this.parseCount(partsTextMale);
    const partsCountFemale = this.parseCount(partsTextFemale);
    const partsCountOther = this.parseCount(partsTextOther);
    const partsCountTotal = partsCountMale + partsCountFemale + partsCountOther;

    return {
      partsCountMale,
      partsCountFemale,
      partsCountOther,
      partsCountTotal,
      partsTextMale,
      partsTextFemale,
      partsTextOther,
    };
  }
}
