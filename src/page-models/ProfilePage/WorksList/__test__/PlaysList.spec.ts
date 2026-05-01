import { describe, it, expect, jest, beforeEach } from "@jest/globals";

import PlaysList from "../PlaysList";

import type { ScrapedPlayRow } from "../PlaysList";
import type { Page } from "playwright";

type EvaluateFn = <T>(fn: () => T) => Promise<T>;

function createMockPage(rows: ScrapedPlayRow[]): Page {
  return {
    evaluate: jest.fn<EvaluateFn>().mockResolvedValue(rows),
  } as unknown as Page;
}

class TestPlaysList extends PlaysList {
  constructor(page: Page) {
    super(page);
  }

  public parseParts(partsText: string) {
    return super.parseParts(partsText);
  }
}

const minimalRow: ScrapedPlayRow = {
  playId: "12345",
  title: "Test Play",
  altTitle: "",
  synopsis: "",
  notes: "",
  production: "",
  organizations: "",
  publisher: "",
  music: "",
  genres: "",
  parts: "",
  reference: "",
};

describe("PlaysList", () => {
  describe("#parseParts", () => {
    let plays: TestPlaysList;

    beforeEach(() => {
      plays = new TestPlaysList({} as Page);
    });

    it("should return null when the parts text has no digits", () => {
      expect(plays.parseParts("")).toBeNull();
      expect(plays.parseParts("-")).toBeNull();
      expect(plays.parseParts("n/a")).toBeNull();
    });

    it("should return an empty object when all parts values are empty/dash/zero", () => {
      expect(plays.parseParts("Male: - Female: 0 Other: -")).toEqual({});
    });

    it("should parse a well-formed parts string into counts and text", () => {
      const result = plays.parseParts("Male: 4 Female: 3 Other: -");
      expect(result).toEqual({
        partsCountMale: 4,
        partsCountFemale: 3,
        partsCountOther: 0,
        partsCountTotal: 7,
        partsTextMale: "4",
        partsTextFemale: "3",
        partsTextOther: "-",
      });
    });

    it("should parse 'm/f' other values into a count using the leading digit", () => {
      const result = plays.parseParts("Male: 3 Female: 2 Other: 6 m/f");
      expect(result).not.toBeNull();
      expect((result as Record<string, unknown>)?.partsCountOther).toBe(6);
      expect((result as Record<string, unknown>)?.partsCountTotal).toBe(11);
    });

    it("should return null and warn when the parts text has digits but does not match the expected format", () => {
      const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {
        /** no-op mock */
      });
      try {
        const result = plays.parseParts("3 Male 2 Female");
        expect(result).toBeNull();
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("does not match expected format"));
      } finally {
        warnSpy.mockRestore();
      }
    });
  });

  describe("extractData", () => {
    it("should return an empty array when the page returns no rows", async () => {
      const page = createMockPage([]);
      const plays = await PlaysList.create(page);
      expect(plays.worksData).toEqual([]);
    });

    it("should set playId from the scraped row", async () => {
      const page = createMockPage([{ ...minimalRow, playId: "99999" }]);
      const plays = await PlaysList.create(page);
      expect(plays.worksData[0].playId).toBe("99999");
    });

    it("should assign '0000000' for a missing playId", async () => {
      const page = createMockPage([{ ...minimalRow, playId: "" }]);
      const plays = await PlaysList.create(page);
      expect(plays.worksData[0].playId).toBe("0000000");
    });

    it("should title-case the genre", async () => {
      const page = createMockPage([{ ...minimalRow, genres: "comedy drama" }]);
      const plays = await PlaysList.create(page);
      expect(plays.worksData[0].genres).toBe("Comedy Drama");
    });

    it("should compute displayTitle by moving a trailing article to the front", async () => {
      const page = createMockPage([{ ...minimalRow, title: "Bacchae, The" }]);
      const plays = await PlaysList.create(page);
      expect(plays.worksData[0].displayTitle).toBe("The Bacchae");
    });

    it("should extract publicationYear from the publisher text", async () => {
      const page = createMockPage([{ ...minimalRow, publisher: "Samuel French 1972" }]);
      const plays = await PlaysList.create(page);
      expect(plays.worksData[0].publicationYear).toBe("1972");
    });

    it("should extract productionYear from the production text", async () => {
      const page = createMockPage([{ ...minimalRow, production: "National Theatre Oct 2010" }]);
      const plays = await PlaysList.create(page);
      expect(plays.worksData[0].productionYear).toBe("Oct 2010");
    });

    it("should spread parts count fields into the output when parts are present", async () => {
      const page = createMockPage([{ ...minimalRow, parts: "Male: 4 Female: 3 Other: -" }]);
      const plays = await PlaysList.create(page);
      expect(plays.worksData[0].partsCountMale).toBe(4);
      expect(plays.worksData[0].partsCountFemale).toBe(3);
      expect(plays.worksData[0].partsCountTotal).toBe(7);
    });

    it("should omit parts count fields when parts text has no digits", async () => {
      const page = createMockPage([{ ...minimalRow, parts: "" }]);
      const plays = await PlaysList.create(page);
      expect(plays.worksData[0]).not.toHaveProperty("partsCountMale");
    });

    it("should store publishingInfo and productionInfo as raw values", async () => {
      const page = createMockPage([
        { ...minimalRow, publisher: "Samuel French 1972", production: "National Theatre Oct 2010" },
      ]);
      const plays = await PlaysList.create(page);
      expect(plays.worksData[0].publishingInfo).toBe("Samuel French 1972");
      expect(plays.worksData[0].productionInfo).toBe("National Theatre Oct 2010");
    });

    it("should include an _archive entry with the raw scraped values", async () => {
      const page = createMockPage([
        { ...minimalRow, playId: "42", genres: "comedy", parts: "Male: 1 Female: 1 Other: -" },
      ]);
      const plays = await PlaysList.create(page);
      const archive = plays.worksData[0]._archive;
      expect(archive._type).toBe("play");
      expect(archive.genres).toBe("comedy");
    });
  });
});
