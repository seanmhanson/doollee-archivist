import { jest, describe, it, expect } from "@jest/globals";

import AdaptationsList from "../AdaptationsList";

import type { Page } from "playwright";

type ScrapedAdaptation = {
  playId: string;
  adaptingAuthor: string;
  title: string;
  productionLocation: string;
  productionYear: string;
  organizations: string;
  publisher: string;
  isbn: string;
  music: string;
  genres: string;
  notes: string;
  imgAlt: string;
  synopsis: string;
  reference: string;
  parts: {
    maleParts: string;
    femaleParts: string;
    otherParts: string;
  };
};

function getMockPage(data: ScrapedAdaptation[] = []): Page {
  return {
    evaluate: jest.fn<() => Promise<ScrapedAdaptation[]>>().mockResolvedValue(data),
  } as unknown as Page;
}

function getDefaultScrapedAdaptation(overrides: Partial<ScrapedAdaptation> = {}): ScrapedAdaptation {
  return {
    playId: "133441",
    adaptingAuthor: "JAY MILLER",
    title: "A Bacchae",
    productionLocation: "The Yard, London >>>",
    productionYear: "18 Oct 2011",
    organizations: "",
    publisher: "I don't think it has been published. Try emailing Playwright or Agent where listed at top of page.",
    isbn: "",
    music: "",
    genres: "adaptation",
    notes: "Original Playwright - Euripides; A free adaptation of The Bacchae.",
    imgAlt: "",
    synopsis: "A play that explores a moment when beliefs erode and reconstruct.",
    reference: "Theatre Record >>> Volume XXXI",
    parts: {
      maleParts: "3",
      femaleParts: "-",
      otherParts: "6 m/f",
    },
    ...overrides,
  };
}

describe("AdaptationsList", () => {
  describe("when created with adaptation data", () => {
    it("should extract and transform adaptation data", async () => {
      const scrapedData = [getDefaultScrapedAdaptation()];
      const mockPage = getMockPage(scrapedData);
      const adaptationsList = await AdaptationsList.create(mockPage);

      expect(adaptationsList.worksData).toHaveLength(1);
      const adaptation = adaptationsList.worksData[0];
      expect(adaptation.playId).toBe("133441");
      expect(adaptation.title).toBe("A Bacchae");
    });

    it("should title-case the adapting author", async () => {
      const scrapedData = [getDefaultScrapedAdaptation()];
      const mockPage = getMockPage(scrapedData);
      const adaptationsList = await AdaptationsList.create(mockPage);

      const adaptation = adaptationsList.worksData[0];
      expect(adaptation.adaptingAuthor).toBe("Jay Miller");
    });

    it("should parse the original author from notes", async () => {
      const scrapedData = [getDefaultScrapedAdaptation()];
      const mockPage = getMockPage(scrapedData);
      const adaptationsList = await AdaptationsList.create(mockPage);

      const adaptation = adaptationsList.worksData[0];
      expect(adaptation.originalAuthor).toBe("Euripides");
    });

    it("should parse parts from separate male/female/other fields", async () => {
      const scrapedData = [getDefaultScrapedAdaptation()];
      const mockPage = getMockPage(scrapedData);
      const adaptationsList = await AdaptationsList.create(mockPage);

      const adaptation = adaptationsList.worksData[0];
      expect(adaptation.partsCountMale).toBe(3);
      expect(adaptation.partsCountFemale).toBe(0);
      expect(adaptation.partsCountOther).toBe(6);
      expect(adaptation.partsCountTotal).toBe(9);
      expect(adaptation.partsTextMale).toBe("3");
      expect(adaptation.partsTextFemale).toBe("-");
      expect(adaptation.partsTextOther).toBe("6 m/f");
    });

    it("should handle empty parts as no parts data", async () => {
      const scrapedData = [
        getDefaultScrapedAdaptation({
          parts: { maleParts: "-", femaleParts: "-", otherParts: "-" },
        }),
      ];
      const mockPage = getMockPage(scrapedData);
      const adaptationsList = await AdaptationsList.create(mockPage);

      const adaptation = adaptationsList.worksData[0];
      expect(adaptation.partsCountMale).toBeUndefined();
      expect(adaptation.partsCountFemale).toBeUndefined();
      expect(adaptation.partsCountOther).toBeUndefined();
    });

    it("should set _archive with type adaptation", async () => {
      const scrapedData = [getDefaultScrapedAdaptation()];
      const mockPage = getMockPage(scrapedData);
      const adaptationsList = await AdaptationsList.create(mockPage);

      const adaptation = adaptationsList.worksData[0];
      expect(adaptation._archive._type).toBe("adaptation");
    });

    it("should format genres with title case", async () => {
      const scrapedData = [getDefaultScrapedAdaptation()];
      const mockPage = getMockPage(scrapedData);
      const adaptationsList = await AdaptationsList.create(mockPage);

      const adaptation = adaptationsList.worksData[0];
      expect(adaptation.genres).toBe("Adaptation");
    });

    it("should format reference by removing >>> markers", async () => {
      const scrapedData = [getDefaultScrapedAdaptation()];
      const mockPage = getMockPage(scrapedData);
      const adaptationsList = await AdaptationsList.create(mockPage);

      const adaptation = adaptationsList.worksData[0];
      expect(adaptation.reference).toBe("Theatre Record Volume XXXI");
    });

    it("should format ISBN by stripping prefix", async () => {
      const scrapedData = [getDefaultScrapedAdaptation({ isbn: "ISBN: 978-0571288403" })];
      const mockPage = getMockPage(scrapedData);
      const adaptationsList = await AdaptationsList.create(mockPage);

      const adaptation = adaptationsList.worksData[0];
      expect(adaptation.isbn).toBe("978-0571288403");
    });

    it("should set altTitle to empty when no image alt", async () => {
      const scrapedData = [getDefaultScrapedAdaptation({ imgAlt: "" })];
      const mockPage = getMockPage(scrapedData);
      const adaptationsList = await AdaptationsList.create(mockPage);

      const adaptation = adaptationsList.worksData[0];
      expect(adaptation.altTitle).toBe("");
    });

    it("should handle publisher exception text", async () => {
      const scrapedData = [getDefaultScrapedAdaptation()];
      const mockPage = getMockPage(scrapedData);
      const adaptationsList = await AdaptationsList.create(mockPage);

      const adaptation = adaptationsList.worksData[0];
      expect(adaptation.publisher).toBe("");
      expect(adaptation.publicationYear).toBe("");
    });

    it("should construct productionInfo and publishingInfo fields", async () => {
      const scrapedData = [getDefaultScrapedAdaptation()];
      const mockPage = getMockPage(scrapedData);
      const adaptationsList = await AdaptationsList.create(mockPage);

      const adaptation = adaptationsList.worksData[0];
      expect(adaptation.productionInfo).toBe("The Yard, London >>> 18 Oct 2011");
      expect(adaptation.publishingInfo).toBeDefined();
    });
  });

  describe("when created with empty data", () => {
    it("should return empty works data", async () => {
      const mockPage = getMockPage([]);
      const adaptationsList = await AdaptationsList.create(mockPage);
      expect(adaptationsList.worksData).toEqual([]);
    });
  });

  describe("when created with multiple adaptations", () => {
    it("should handle multiple entries", async () => {
      const scrapedData = [
        getDefaultScrapedAdaptation({ playId: "133441", title: "A Bacchae" }),
        getDefaultScrapedAdaptation({ playId: "133442", title: "Medea" }),
      ];
      const mockPage = getMockPage(scrapedData);
      const adaptationsList = await AdaptationsList.create(mockPage);

      expect(adaptationsList.worksData).toHaveLength(2);
    });
  });
});
