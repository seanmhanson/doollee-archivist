import type { Page } from "playwright";
import BaseWorksList from "./__BaseWorksList";

export default class PlaysList extends BaseWorksList {
  public constructor(page: Page) {
    super(page);
  }

  protected async extractData(): Promise<void> {
    const data = await this.scrapeData();

    this.data = data.map(
      ({ playId: playIdText, publisher: publishingInfo, production: productionInfo, parts: partsText, ...rest }) => {
        const publicationDetails = this.parsePublicationDetails(publishingInfo, true);
        const productionDetails = this.parseProductionDetails(productionInfo);
        const playId = this.getPlayId(playIdText);
        const parts = this.parseParts(partsText);
        const production = {
          location: productionDetails.location,
          year: productionDetails.date,
        };
        const publication = {
          publisher: publicationDetails.publisher,
          year: publicationDetails.year,
        };
        const isbn = publicationDetails.isbn;

        return {
          publishingInfo,
          productionInfo,
          playId,
          production,
          publication,
          isbn,
          parts,
          ...rest,
        };
      }
    );
  }

  protected async scrapeData() {
    return await this.page.evaluate(async () => {
      const containerSelector = ".gridContainer > strong";
      const playIdSelector = "#playwrightTable > a";
      const titleSelector = "#playTable";
      const imageContainerSelector = "#synopsisTitle";
      const imageSelector = "center > img";
      const synopsisSelector = "#synopsisName";
      const notesSelector = "#notesName";
      const productionSelector = "#producedPlace";
      const organizationsSelector = "#companyName";
      const publisherSelector = "#publishedName";
      const musicSelector = "#musicName";
      const genreSelector = "#genreName";
      const partsSelector = "#partsMaletitle";
      const referencesSelector = "#refname";

      const container = document.querySelector(containerSelector);
      if (!container) return [];

      const data = {
        allPlayIds: container.querySelectorAll(playIdSelector),
        allTitles: container.querySelectorAll(titleSelector),
        allImages: container.querySelectorAll(imageContainerSelector),
        allSynopses: container.querySelectorAll(synopsisSelector),
        allNotes: container.querySelectorAll(notesSelector),
        allProductions: container.querySelectorAll(productionSelector),
        allOrganizations: container.querySelectorAll(organizationsSelector),
        allPublishers: container.querySelectorAll(publisherSelector),
        allMusic: container.querySelectorAll(musicSelector),
        allGenres: container.querySelectorAll(genreSelector),
        allParts: container.querySelectorAll(partsSelector),
        allReferences: container.querySelectorAll(referencesSelector),
      };

      const results = [];
      const playCount = data.allPlayIds.length;

      for (let i = 0; i < playCount; i++) {
        const imageContainer = data.allImages[i];
        const imageElement = imageContainer.querySelector(imageSelector);

        results.push({
          playId: data.allPlayIds[i]?.getAttribute("name") || "",
          title: data.allTitles[i]?.textContent?.trim() || "",
          altTitle: imageElement?.getAttribute("title")?.trim() || "",
          synopsis: data.allSynopses[i]?.textContent?.trim() || "",
          notes: data.allNotes[i]?.textContent?.trim() || "",
          production: data.allProductions[i]?.textContent?.trim() || "",
          organizations: data.allOrganizations[i]?.textContent?.trim() || "",
          publisher: data.allPublishers[i]?.textContent?.trim() || "",
          music: data.allMusic[i]?.textContent?.trim() || "",
          genres: data.allGenres[i]?.textContent?.trim() || "",
          parts: data.allParts[i]?.textContent?.trim() || "",
          reference: data.allReferences[i]?.textContent?.trim() || "",
        });
      }
      return results;
    });
  }

  private parseParts(partsText: string) {
    if (!partsText.match(/\d/)) {
      return null;
    }

    const normalizedText = partsText
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const pattern = /Male:\s*(.+?)\s+Female:\s*(.+?)\s+Other:\s*(.+)$/;
    const match = normalizedText.match(pattern);

    if (!match) {
      throw new Error(`Parts text does not match expected format: ${partsText}`);
    }

    const maleText = match[1].trim();
    const femaleText = match[2].trim();
    const otherText = match[3].trim();

    // Helper function to parse numeric values
    const parseCount = (text: string): number => {
      if (text === "-" || text === "") return 0;
      const num = parseInt(text, 10);
      return isNaN(num) ? 0 : num;
    };

    return {
      counts: {
        maleParts: parseCount(maleText),
        femaleParts: parseCount(femaleText),
        otherParts: parseCount(otherText),
      },
      text: {
        maleParts: maleText,
        femaleParts: femaleText,
        otherParts: otherText,
      },
    };
  }
}
