import type { PlayArchive } from "#/db-types/play/play.types";
import type { Page } from "playwright";

import BaseWorksList from "#/page-models/ProfilePage/WorksList/__BaseWorksList";

export type ScrapedPlayRow = {
  playId: string;
  title: string;
  altTitle: string;
  synopsis: string;
  notes: string;
  production: string;
  organizations: string;
  publisher: string;
  music: string;
  genres: string;
  parts: string;
  reference: string;
};

export default class PlaysList extends BaseWorksList {
  public constructor(page: Page) {
    super(page);
  }

  protected async extractData(): Promise<void> {
    const rawData = await this.scrapeData();
    const data = this.normalizeStringFields(rawData);

    this.data = data.map(
      ({ playId: playIdText, parts: partsText, genres: rawGenres, publisher, production, ...rest }) => {
        const publicationDetails = this.parsePublicationDetails(publisher, true);
        const productionDetails = this.parseProductionDetails(production);
        const playId = this.formatPlayId(playIdText, "play");
        const parts = this.parseParts(partsText);
        const genres = this.formatGenres(rawGenres);
        const displayTitle = this.formatDisplayTitle(rest.title);

        const reviewNotes = [...(publicationDetails.reviewNotes ?? []), ...(productionDetails.reviewNotes ?? [])];
        const { reviewNotes: _pubNotes, ...publicationRest } = publicationDetails;
        const { reviewNotes: _prodNotes, ...productionRest } = productionDetails;

        const _archive: PlayArchive = {
          _type: "play",
          playId: playIdText,
          parts: partsText,
          genres: rawGenres,
          publisher,
          production,
          ...rest,
        };

        const { altTitle, ...restWithoutAltTitle } = rest;

        return {
          _archive,
          playId,
          genres,
          displayTitle,
          ...publicationRest,
          ...productionRest,
          ...parts,
          ...restWithoutAltTitle,
          ...(reviewNotes.length ? { reviewNotes } : {}),
        };
      },
    );
  }

  protected async scrapeData() {
    return await this.page.evaluate(() => {
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
          playId: data.allPlayIds[i]?.getAttribute("name") ?? "",
          title: data.allTitles[i]?.textContent?.trim() ?? "",
          altTitle: imageElement?.getAttribute("title")?.trim() ?? "",
          synopsis: data.allSynopses[i]?.textContent?.trim() ?? "",
          notes: data.allNotes[i]?.textContent?.trim() ?? "",
          production: data.allProductions[i]?.textContent?.trim() ?? "",
          organizations: data.allOrganizations[i]?.textContent?.trim() ?? "",
          publisher: data.allPublishers[i]?.textContent?.trim() ?? "",
          music: data.allMusic[i]?.textContent?.trim() ?? "",
          genres: data.allGenres[i]?.textContent?.trim() ?? "",
          parts: data.allParts[i]?.textContent?.trim() ?? "",
          reference: data.allReferences[i]?.textContent?.trim() ?? "",
        });
      }
      return results;
    });
  }

  protected parseParts(partsText: string) {
    if (!/\d/.exec(partsText)) {
      return null;
    }

    const normalizedText = partsText
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const pattern = /Male:\s*(.+?)\s+Female:\s*(.+?)\s+Other:\s*(.+)$/;
    const match = pattern.exec(normalizedText);

    if (!match) {
      // [TODO] - flag "needsReview", needsReviewReason, and needsReviewData
      // and then downgrade to info-level logging
      console.warn(`Parts text does not match expected format: ${partsText}`);
      return null;
    }

    const isEmpty = (text: string) => {
      return !text || text === "-" || text === "0";
    };
    if ([match[1], match[2], match[3]].map((s) => s.trim()).every(isEmpty)) {
      return {};
    }

    const partsCountMale = this.parseCount(match[1].trim());
    const partsCountFemale = this.parseCount(match[2].trim());
    const partsCountOther = this.parseCount(match[3].trim());
    const partsCountTotal = partsCountMale + partsCountFemale + partsCountOther;

    return {
      partsCountMale,
      partsCountFemale,
      partsCountOther,
      partsCountTotal,
    };
  }
}
