import { jest, describe, it, expect } from "@jest/globals";

import PlaysList from "../PlaysList";

import type { Page } from "playwright";

type ScrapedPlay = {
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

function getMockPage(data: ScrapedPlay[] = []): Page {
  return {
    evaluate: jest.fn<() => Promise<ScrapedPlay[]>>().mockResolvedValue(data),
  } as unknown as Page;
}

function getDefaultScrapedPlay(overrides: Partial<ScrapedPlay> = {}): ScrapedPlay {
  return {
    playId: "27977",
    title: "Betrayal",
    altTitle: "",
    synopsis: "A story about betrayal.",
    notes: "",
    production: "National Theatre, London 1978",
    organizations: "",
    publisher: "Eyre Methuen, London, 1978 -",
    music: "",
    genres: "drama",
    parts: "Male: 3 Female: 1 Other: -",
    reference: "",
    ...overrides,
  };
}

describe("PlaysList", () => {
  describe("when created with plays data", () => {
    it("should extract and transform play data", async () => {
      const scrapedData = [getDefaultScrapedPlay()];
      const mockPage = getMockPage(scrapedData);
      const playsList = await PlaysList.create(mockPage);

      expect(playsList.worksData).toHaveLength(1);
      const play = playsList.worksData[0];
      expect(play.playId).toBe("27977");
      expect(play.title).toBe("Betrayal");
      expect(play.genres).toBe("Drama");
    });

    it("should parse parts correctly", async () => {
      const scrapedData = [getDefaultScrapedPlay({ parts: "Male: 3 Female: 1 Other: -" })];
      const mockPage = getMockPage(scrapedData);
      const playsList = await PlaysList.create(mockPage);

      const play = playsList.worksData[0];
      expect(play.partsCountMale).toBe(3);
      expect(play.partsCountFemale).toBe(1);
      expect(play.partsCountOther).toBe(0);
      expect(play.partsCountTotal).toBe(4);
      expect(play.partsTextMale).toBe("3");
      expect(play.partsTextFemale).toBe("1");
      expect(play.partsTextOther).toBe("-");
    });

    it("should handle plays with no numeric parts", async () => {
      const scrapedData = [getDefaultScrapedPlay({ parts: "No parts info" })];
      const mockPage = getMockPage(scrapedData);
      const playsList = await PlaysList.create(mockPage);

      const play = playsList.worksData[0];
      expect(play.partsCountMale).toBeUndefined();
      expect(play.partsCountFemale).toBeUndefined();
      expect(play.partsCountOther).toBeUndefined();
    });

    it("should handle all-zero parts as empty", async () => {
      const scrapedData = [getDefaultScrapedPlay({ parts: "Male: 0 Female: 0 Other: 0" })];
      const mockPage = getMockPage(scrapedData);
      const playsList = await PlaysList.create(mockPage);

      const play = playsList.worksData[0];
      expect(play.partsCountMale).toBeUndefined();
    });

    it("should set _archive with type play", async () => {
      const scrapedData = [getDefaultScrapedPlay()];
      const mockPage = getMockPage(scrapedData);
      const playsList = await PlaysList.create(mockPage);

      const play = playsList.worksData[0];
      expect(play._archive._type).toBe("play");
      expect(play._archive.playId).toBe("27977");
    });

    it("should include publication and production details", async () => {
      const scrapedData = [getDefaultScrapedPlay()];
      const mockPage = getMockPage(scrapedData);
      const playsList = await PlaysList.create(mockPage);

      const play = playsList.worksData[0];
      expect(play.publishingInfo).toBe("Eyre Methuen, London, 1978 -");
      expect(play.productionInfo).toBe("National Theatre, London 1978");
    });

    it("should handle multiple plays", async () => {
      const scrapedData = [
        getDefaultScrapedPlay({ playId: "27977", title: "Betrayal" }),
        getDefaultScrapedPlay({ playId: "27978", title: "Birthday Party, The" }),
      ];
      const mockPage = getMockPage(scrapedData);
      const playsList = await PlaysList.create(mockPage);

      expect(playsList.worksData).toHaveLength(2);
      expect(playsList.worksData[0].title).toBe("Betrayal");
      expect(playsList.worksData[1].title).toBe("Birthday Party, The");
    });
  });

  describe("when created with empty data", () => {
    it("should return empty works data", async () => {
      const mockPage = getMockPage([]);
      const playsList = await PlaysList.create(mockPage);
      expect(playsList.worksData).toEqual([]);
    });
  });

  describe("when created with ISBN in publisher text", () => {
    it("should extract valid ISBN13", async () => {
      const scrapedData = [
        getDefaultScrapedPlay({
          publisher: "Faber and Faber Ltd, London >>> 9780571288403",
        }),
      ];
      const mockPage = getMockPage(scrapedData);
      const playsList = await PlaysList.create(mockPage);

      const play = playsList.worksData[0];
      expect(play.isbn).toBe("9780571288403");
    });
  });
});
