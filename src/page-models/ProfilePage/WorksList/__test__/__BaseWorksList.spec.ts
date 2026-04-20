import { describe, it, expect, beforeEach } from "@jest/globals";

import BaseWorksList from "../__BaseWorksList";

import type { ScrapedPlayData } from "#/db-types/play/play.types";
import type { Page } from "playwright";

class TestBaseWorksList extends BaseWorksList {
  constructor(page: Page) {
    super(page);
  }

  protected async extractData(): Promise<void> {
    this.data = [
      {
        playId: "123",
        title: "Test Play",
        _archive: { _type: "play", playId: "123", title: "Test Play" },
      } as ScrapedPlayData,
    ];
    return Promise.resolve();
  }

  public getPage(): Page {
    return this.page;
  }

  public getPlayId(idString: string): string {
    return super.getPlayId(idString);
  }

  public normalizeStringFields<T extends Record<string, unknown>>(data: T[]): T[] {
    return super.normalizeStringFields(data);
  }

  public parseProductionDetails(text: string) {
    return super.parseProductionDetails(text);
  }

  public parsePublicationDetails(text: string, includeISBN: boolean) {
    return super.parsePublicationDetails(text, includeISBN);
  }

  public formatPlayId(playId: string, type: "play" | "adaptation"): string {
    return super.formatPlayId(playId, type);
  }

  public formatISBN(isbn: string): string {
    return super.formatISBN(isbn);
  }

  public formatReference(ref: string): string {
    return super.formatReference(ref);
  }

  public formatOrganizations(org: string): string {
    return super.formatOrganizations(org);
  }

  public formatDisplayTitle(title: string): string {
    return super.formatDisplayTitle(title);
  }

  public formatGenres(genres: string): string {
    return super.formatGenres(genres);
  }

  public exposedParseCount(text: string): number {
    return this.parseCount(text);
  }

  public static readonly publisherExceptionString = BaseWorksList.publisherException;
}

describe("BaseWorksList", () => {
  const mockPage = {} as Page;

  describe("constructor", () => {
    it("should initialize with a Page instance without extracting data", () => {
      const works = new TestBaseWorksList(mockPage);
      expect(works).toBeInstanceOf(BaseWorksList);
      expect(works.getPage()).toBe(mockPage);
      expect(works.worksData).toEqual([]);
    });

    it("when created via the static create method, it should extract and populate worksData", async () => {
      const works = await TestBaseWorksList.create(mockPage);
      expect(works).toBeInstanceOf(BaseWorksList);
      expect(works.worksData).toHaveLength(1);
      expect(works.worksData[0].playId).toBe("123");
    });
  });

  describe("worksData getter", () => {
    it("should return an empty array before extractData is called", () => {
      const works = new TestBaseWorksList(mockPage);
      expect(works.worksData).toEqual([]);
    });

    it("should return the extracted data after create is called", async () => {
      const works = await TestBaseWorksList.create(mockPage);
      expect(works.worksData).toHaveLength(1);
    });
  });

  describe("#getPlayId", () => {
    let works: TestBaseWorksList;

    beforeEach(() => {
      works = new TestBaseWorksList(mockPage);
    });

    it("should return the trimmed id string", () => {
      expect(works.getPlayId("  12345  ")).toBe("12345");
    });

    it("should return '0000000' when given an empty string", () => {
      expect(works.getPlayId("")).toBe("0000000");
    });
  });

  describe("#normalizeStringFields", () => {
    let works: TestBaseWorksList;

    beforeEach(() => {
      works = new TestBaseWorksList(mockPage);
    });

    it("should apply checkScrapedString to all string fields", () => {
      const data = [{ title: "  Hello World  ", count: 3 }];
      const result = works.normalizeStringFields(data);
      expect(result[0].title).toBe("Hello World");
      expect(result[0].count).toBe(3);
    });

    it("should pass through non-string values unchanged", () => {
      const nested = { foo: "bar" };
      const data = [{ title: "Test", nested }];
      const result = works.normalizeStringFields(data);
      expect(result[0].nested).toBe(nested);
    });
  });

  describe("#parseProductionDetails", () => {
    let works: TestBaseWorksList;

    beforeEach(() => {
      works = new TestBaseWorksList(mockPage);
    });

    it("should return empty strings for blank input", () => {
      expect(works.parseProductionDetails("")).toEqual({
        productionLocation: "",
        productionYear: "",
      });
    });

    it("should return empty strings for input with no alphanumeric characters", () => {
      expect(works.parseProductionDetails("---")).toEqual({
        productionLocation: "",
        productionYear: "",
      });
    });

    it("should extract a day-month-year date and the remaining text as location", () => {
      const result = works.parseProductionDetails("National Theatre, London 18 Oct 2011");
      expect(result.productionYear).toBe("18 Oct 2011");
      expect(result.productionLocation).toBe("National Theatre, London");
    });

    it("should extract a month-year date and the remaining text as location", () => {
      const result = works.parseProductionDetails("RSC Stratford Oct 2010");
      expect(result.productionYear).toBe("Oct 2010");
      expect(result.productionLocation).toBe("RSC Stratford");
    });

    it("should extract a year-only date and the remaining text as location", () => {
      const result = works.parseProductionDetails("Broadway 1965");
      expect(result.productionYear).toBe("1965");
      expect(result.productionLocation).toBe("Broadway");
    });

    it("should strip '>>>' from the location", () => {
      const result = works.parseProductionDetails("The Yard >>> 18 Oct 2011");
      expect(result.productionLocation).toBe("The Yard");
    });
  });

  describe("#parsePublicationDetails", () => {
    let works: TestBaseWorksList;

    beforeEach(() => {
      works = new TestBaseWorksList(mockPage);
    });

    it("should return empty strings for blank input", () => {
      expect(works.parsePublicationDetails("", false)).toEqual({
        publisher: "",
        publicationYear: "",
      });
    });

    it("should return empty strings when text contains the publisher exception phrase", () => {
      const result = works.parsePublicationDetails(TestBaseWorksList.publisherExceptionString, false);
      expect(result).toEqual({ publisher: "", publicationYear: "" });
    });

    it("should extract publisher and year from publication text", () => {
      const result = works.parsePublicationDetails("Samuel French Ltd 1972", false);
      expect(result.publisher).toBe("Samuel French Ltd");
      expect(result.publicationYear).toBe("1972");
    });

    it("should include an empty isbn field when includeISBN is true", () => {
      const result = works.parsePublicationDetails("Samuel French 1972", true);
      expect(result).toHaveProperty("isbn");
    });

    it("should extract a valid ISBN13 when includeISBN is true", () => {
      const result = works.parsePublicationDetails("Samuel French ISBN: 9780573016509 1972", true);
      expect(result.isbn).toBe("9780573016509");
      expect(result.publisher).toBe("Samuel French");
      expect(result.publicationYear).toBe("1972");
    });

    it("should not include isbn when includeISBN is false", () => {
      const result = works.parsePublicationDetails("Samuel French 1972", false);
      expect(result).not.toHaveProperty("isbn");
    });
  });

  describe("#formatPlayId", () => {
    let works: TestBaseWorksList;

    beforeEach(() => {
      works = new TestBaseWorksList(mockPage);
    });

    it("should return the playId unchanged for a standard play", () => {
      expect(works.formatPlayId("12345", "play")).toBe("12345");
    });

    it("should prefix the playId with 'A' for adaptations", () => {
      expect(works.formatPlayId("12345", "adaptation")).toBe("A12345");
    });

    it("should return '0000000' for an empty string play id", () => {
      expect(works.formatPlayId("", "play")).toBe("0000000");
    });

    it("should return 'A0000000' for an empty string adaptation id", () => {
      expect(works.formatPlayId("", "adaptation")).toBe("A0000000");
    });
  });

  describe("#formatISBN", () => {
    let works: TestBaseWorksList;

    beforeEach(() => {
      works = new TestBaseWorksList(mockPage);
    });

    it("should strip an 'ISBN:' prefix", () => {
      expect(works.formatISBN("ISBN: 9780573016509")).toBe("9780573016509");
    });

    it("should strip an 'ISBN-13:' prefix", () => {
      expect(works.formatISBN("ISBN-13: 9780573016509")).toBe("9780573016509");
    });

    it("should return an already-clean ISBN unchanged", () => {
      expect(works.formatISBN("9780573016509")).toBe("9780573016509");
    });

    it("should return an empty string for empty input", () => {
      expect(works.formatISBN("")).toBe("");
    });
  });

  describe("#formatReference", () => {
    let works: TestBaseWorksList;

    beforeEach(() => {
      works = new TestBaseWorksList(mockPage);
    });

    it("should strip '>>>' from a reference string", () => {
      expect(works.formatReference("Theatre Record >>> Volume XXXI")).toBe("Theatre Record Volume XXXI");
    });

    it("should return an empty string for empty input", () => {
      expect(works.formatReference("")).toBe("");
    });
  });

  describe("#formatOrganizations", () => {
    let works: TestBaseWorksList;

    beforeEach(() => {
      works = new TestBaseWorksList(mockPage);
    });

    it("should strip '>>>' from an organizations string", () => {
      expect(works.formatOrganizations("RSC >>> National Theatre")).toBe("RSC National Theatre");
    });

    it("should return an empty string for empty input", () => {
      expect(works.formatOrganizations("")).toBe("");
    });
  });

  describe("#formatDisplayTitle", () => {
    let works: TestBaseWorksList;

    beforeEach(() => {
      works = new TestBaseWorksList(mockPage);
    });

    it("should move a trailing ', The' suffix to the front", () => {
      expect(works.formatDisplayTitle("Basement, The")).toBe("The Basement");
    });

    it("should move a trailing ', A' suffix to the front", () => {
      expect(works.formatDisplayTitle("Trip, A")).toBe("A Trip");
    });

    it("should move a trailing ', An' suffix to the front", () => {
      expect(works.formatDisplayTitle("Annual Trip, An")).toBe("An Annual Trip");
    });

    it("should title-case a title without a suffix", () => {
      expect(works.formatDisplayTitle("hello world")).toBe("Hello World");
    });

    it("should return a normal title unchanged (except for casing)", () => {
      expect(works.formatDisplayTitle("The Bacchae")).toBe("The Bacchae");
    });
  });

  describe("#formatGenres", () => {
    let works: TestBaseWorksList;

    beforeEach(() => {
      works = new TestBaseWorksList(mockPage);
    });

    it("should title-case a lowercase genre string", () => {
      expect(works.formatGenres("adaptation")).toBe("Adaptation");
    });

    it("should title-case a multi-word genre string", () => {
      expect(works.formatGenres("COMEDY DRAMA")).toBe("Comedy Drama");
    });

    it("should return an empty string for empty input", () => {
      expect(works.formatGenres("")).toBe("");
    });

    it("should return an empty string for whitespace-only input", () => {
      expect(works.formatGenres("   ")).toBe("");
    });
  });

  describe("#parseCount", () => {
    let works: TestBaseWorksList;

    beforeEach(() => {
      works = new TestBaseWorksList(mockPage);
    });

    it("should return 0 for a dash", () => {
      expect(works.exposedParseCount("-")).toBe(0);
    });

    it("should return 0 for an empty string", () => {
      expect(works.exposedParseCount("")).toBe(0);
    });

    it("should return the parsed integer for a numeric string", () => {
      expect(works.exposedParseCount("3")).toBe(3);
    });

    it("should return the leading integer for a string like '6 m/f'", () => {
      expect(works.exposedParseCount("6 m/f")).toBe(6);
    });

    it("should return 0 for a non-numeric string", () => {
      expect(works.exposedParseCount("abc")).toBe(0);
    });
  });
});
