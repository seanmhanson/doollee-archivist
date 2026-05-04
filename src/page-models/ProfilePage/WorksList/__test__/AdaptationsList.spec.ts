import { describe, it, expect, jest, beforeEach } from "@jest/globals";

import AdaptationsList from "../AdaptationsList";

import type { ScrapedAdaptationRow, UnparsedParts } from "../AdaptationsList";
import type { Page } from "playwright";

type EvaluateFn = <T>(fn: () => T) => Promise<T>;

function createMockPage(rows: ScrapedAdaptationRow[]): Page {
  return {
    evaluate: jest.fn<EvaluateFn>().mockResolvedValue(rows),
  } as unknown as Page;
}

class TestAdaptationsList extends AdaptationsList {
  constructor(page: Page) {
    super(page);
  }

  public parseOriginalAuthor(notesString: string): string {
    return super.parseOriginalAuthor(notesString);
  }

  public parseParts(rawParts: UnparsedParts) {
    return super.parseParts(rawParts);
  }
}

const emptyParts: UnparsedParts = { maleParts: "-", femaleParts: "-", otherParts: "-" };

const minimalRow: ScrapedAdaptationRow = {
  playId: "12345",
  adaptingAuthor: "TEST AUTHOR",
  title: "Test Play",
  productionLocation: "",
  productionYear: "",
  organizations: "",
  publisher: "",
  isbn: "",
  music: "",
  genres: "",
  notes: "",
  imgAlt: "",
  synopsis: "",
  reference: "",
  parts: emptyParts,
};

describe("AdaptationsList", () => {
  describe("#parseOriginalAuthor", () => {
    let adaptations: TestAdaptationsList;

    beforeEach(() => {
      adaptations = new TestAdaptationsList({} as Page);
    });

    it("should extract the author after 'Original Playwright -'", () => {
      expect(adaptations.parseOriginalAuthor("Original Playwright - Euripides.")).toBe("Euripides");
    });

    it("should extract the author after 'Original Playwright:'", () => {
      expect(adaptations.parseOriginalAuthor("Original Playwright: Euripides.")).toBe("Euripides");
    });

    it("should extract only up to a semicolon when present", () => {
      const notes = "Original Playwright - Euripides. A free adaptation; Directed by Jay Miller";
      expect(adaptations.parseOriginalAuthor(notes)).toBe("Euripides. A free adaptation");
    });

    it("should return an empty string when the notes have no 'Original Playwright' label", () => {
      expect(adaptations.parseOriginalAuthor("A free adaptation of the Greek myth.")).toBe("");
    });

    it("should return an empty string for empty input", () => {
      expect(adaptations.parseOriginalAuthor("")).toBe("");
    });

    it("should be case-insensitive for the label", () => {
      expect(adaptations.parseOriginalAuthor("ORIGINAL PLAYWRIGHT - Euripides.")).toBe("Euripides");
    });
  });

  describe("#parseParts", () => {
    let adaptations: TestAdaptationsList;

    beforeEach(() => {
      adaptations = new TestAdaptationsList({} as Page);
    });

    it("should return an empty object when all parts are empty/dash/zero", () => {
      expect(adaptations.parseParts({ maleParts: "-", femaleParts: "0", otherParts: "-" })).toEqual({});
    });

    it("should return an empty object when all parts are empty strings", () => {
      expect(adaptations.parseParts({ maleParts: "", femaleParts: "", otherParts: "" })).toEqual({});
    });

    it("should parse parts into counts and text when values are present", () => {
      const result = adaptations.parseParts({ maleParts: "3", femaleParts: "-", otherParts: "6 m/f" });
      expect(result).toEqual({
        partsCountMale: 3,
        partsCountFemale: 0,
        partsCountOther: 6,
        partsCountTotal: 9,
        partsTextMale: "3",
        partsTextFemale: "-",
        partsTextOther: "6 m/f",
      });
    });

    it("should include a field in the output when only one part value is non-empty", () => {
      const result = adaptations.parseParts({ maleParts: "5", femaleParts: "-", otherParts: "-" });
      expect(result).toHaveProperty("partsCountMale", 5);
      expect(result).toHaveProperty("partsCountTotal", 5);
    });
  });

  describe("extractData", () => {
    it("should return an empty array when the page returns no rows", async () => {
      const page = createMockPage([]);
      const adaptationsList = await AdaptationsList.create(page);
      expect(adaptationsList.worksData).toEqual([]);
    });

    it("should title-case the adaptingAuthor name", async () => {
      const page = createMockPage([{ ...minimalRow, adaptingAuthor: "JAY MILLER" }]);
      const adaptationsList = await AdaptationsList.create(page);
      expect(adaptationsList.worksData[0].adaptingAuthor).toBe("Jay Miller");
    });

    it("should title-case the genre", async () => {
      const page = createMockPage([{ ...minimalRow, genres: "adaptation" }]);
      const adaptationsList = await AdaptationsList.create(page);
      expect(adaptationsList.worksData[0].genres).toBe("Adaptation");
    });

    it("should prefix playId with 'A' for adaptations", async () => {
      const page = createMockPage([{ ...minimalRow, playId: "12345" }]);
      const adaptationsList = await AdaptationsList.create(page);
      expect(adaptationsList.worksData[0].playId).toBe("A12345");
    });

    it("should use 'A0000000' for a missing playId", async () => {
      const page = createMockPage([{ ...minimalRow, playId: "" }]);
      const adaptationsList = await AdaptationsList.create(page);
      expect(adaptationsList.worksData[0].playId).toBe("A0000000");
    });

    it("should extract originalAuthor from the notes field", async () => {
      const page = createMockPage([{ ...minimalRow, notes: "Original Playwright - Euripides. A free adaptation" }]);
      const adaptationsList = await AdaptationsList.create(page);
      expect(adaptationsList.worksData[0].originalAuthor).toBe("Euripides. A free adaptation");
    });

    it("should omit originalAuthor when notes have no 'Original Playwright' label", async () => {
      const page = createMockPage([{ ...minimalRow, notes: "A free adaptation of the Greek myth." }]);
      const adaptationsList = await AdaptationsList.create(page);
      expect(adaptationsList.worksData[0]).not.toHaveProperty("originalAuthor");
    });

    it("should omit originalAuthor when notes is empty", async () => {
      const page = createMockPage([{ ...minimalRow, notes: "" }]);
      const adaptationsList = await AdaptationsList.create(page);
      expect(adaptationsList.worksData[0]).not.toHaveProperty("originalAuthor");
    });

    it("should spread parts count fields into the output when parts are non-empty", async () => {
      const page = createMockPage([
        { ...minimalRow, parts: { maleParts: "3", femaleParts: "-", otherParts: "6 m/f" } },
      ]);
      const adaptationsList = await AdaptationsList.create(page);
      expect(adaptationsList.worksData[0].partsCountMale).toBe(3);
      expect(adaptationsList.worksData[0].partsCountOther).toBe(6);
      expect(adaptationsList.worksData[0].partsCountTotal).toBe(9);
    });

    it("should omit parts count fields when all parts values are empty", async () => {
      const page = createMockPage([{ ...minimalRow, parts: emptyParts }]);
      const adaptationsList = await AdaptationsList.create(page);
      expect(adaptationsList.worksData[0]).not.toHaveProperty("partsCountMale");
    });

    it("should not include a raw 'parts' field in the output", async () => {
      const page = createMockPage([{ ...minimalRow }]);
      const adaptationsList = await AdaptationsList.create(page);
      expect(adaptationsList.worksData[0]).not.toHaveProperty("parts");
    });

    it("should parse productionLocation and productionYear via parseProductionDetails", async () => {
      const page = createMockPage([
        { ...minimalRow, productionLocation: "National Theatre", productionYear: "Oct 2010" },
      ]);
      const adaptationsList = await AdaptationsList.create(page);
      expect(adaptationsList.worksData[0].productionLocation).toBe("National Theatre");
      expect(adaptationsList.worksData[0].productionYear).toBe("Oct 2010");
    });

    it("should strip '>>>' from productionLocation via parseProductionDetails", async () => {
      const page = createMockPage([{ ...minimalRow, productionLocation: ">>> Donmar Warehouse", productionYear: "" }]);
      const adaptationsList = await AdaptationsList.create(page);
      expect(adaptationsList.worksData[0].productionLocation).toBe("Donmar Warehouse");
    });

    it("should extract a date from productionLocation to productionYear when productionYear is empty", async () => {
      const page = createMockPage([
        { ...minimalRow, productionLocation: "Donmar Warehouse Oct 2010", productionYear: "" },
      ]);
      const adaptationsList = await AdaptationsList.create(page);
      expect(adaptationsList.worksData[0].productionLocation).toBe("Donmar Warehouse");
      expect(adaptationsList.worksData[0].productionYear).toBe("Oct 2010");
    });

    it("should build productionInfo by joining productionLocation and productionYear", async () => {
      const page = createMockPage([
        { ...minimalRow, productionLocation: "National Theatre", productionYear: "Oct 2010" },
      ]);
      const adaptationsList = await AdaptationsList.create(page);
      expect(adaptationsList.worksData[0].productionInfo).toBe("National Theatre Oct 2010");
    });

    it("should store flat maleParts/femaleParts/otherParts in the _archive", async () => {
      const page = createMockPage([
        { ...minimalRow, parts: { maleParts: "3", femaleParts: "-", otherParts: "6 m/f" } },
      ]);
      const adaptationsList = await AdaptationsList.create(page);
      const archive = adaptationsList.worksData[0]._archive;
      expect(archive._type).toBe("adaptation");
      if (archive._type === "adaptation") {
        expect(archive.maleParts).toBe("3");
        expect(archive.femaleParts).toBe("-");
        expect(archive.otherParts).toBe("6 m/f");
      }
    });
  });
});
