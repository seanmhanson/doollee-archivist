import { describe, it, expect, beforeEach } from "@jest/globals";

import BaseWorksList from "../__BaseWorksList";

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
      },
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
  let worksList: TestBaseWorksList;

  beforeEach(() => {
    worksList = new TestBaseWorksList(mockPage);
  });

  describe("constructor", () => {
    it("should initialize with a Page instance without extracting data", () => {
      expect(worksList).toBeInstanceOf(BaseWorksList);
      expect(worksList.getPage()).toBe(mockPage);
      expect(worksList.worksData).toEqual([]);
    });

    it("when created via the static create method, it should extract and populate worksData", async () => {
      const worksList = await TestBaseWorksList.create(mockPage);
      expect(worksList).toBeInstanceOf(BaseWorksList);
      expect(worksList.worksData).toHaveLength(1);
      expect(worksList.worksData[0].playId).toBe("123");
    });
  });

  describe("#getPlayId", () => {
    it("should return the trimmed id string", () => {
      expect(worksList.getPlayId("  12345  ")).toBe("12345");
    });

    it("should return '0000000' when given an empty string", () => {
      expect(worksList.getPlayId("")).toBe("0000000");
    });
  });

  describe("#normalizeStringFields", () => {
    it("should apply checkScrapedString to all string fields", () => {
      const data = [{ title: "  Hello World  ", count: 3 }];
      const result = worksList.normalizeStringFields(data);
      expect(result[0].title).toBe("Hello World");
      expect(result[0].count).toBe(3);
    });

    it("should pass through non-string values unchanged", () => {
      const nested = { foo: "bar" };
      const data = [{ title: "Test", nested }];
      const result = worksList.normalizeStringFields(data);
      expect(result[0].nested).toBe(nested);
    });
  });

  describe("#parseProductionDetails", () => {
    const emptyResult = { productionLocation: "", productionYear: "" };

    it("should return empty strings for blank input", () => {
      expect(worksList.parseProductionDetails("")).toEqual(emptyResult);
    });

    it("should return empty strings for input with no alphanumeric characters", () => {
      expect(worksList.parseProductionDetails("---")).toEqual(emptyResult);
    });

    it("should extract a day-month-year date and the remaining text as location", () => {
      const result = worksList.parseProductionDetails("National Theatre, London 18 Oct 2011");
      expect(result.productionYear).toBe("18 Oct 2011");
      expect(result.productionLocation).toBe("National Theatre, London");
    });

    it("should extract a month-year date and the remaining text as location", () => {
      const result = worksList.parseProductionDetails("RSC Stratford Oct 2010");
      expect(result.productionYear).toBe("Oct 2010");
      expect(result.productionLocation).toBe("RSC Stratford");
    });

    it("should extract a year-only date and the remaining text as location", () => {
      const result = worksList.parseProductionDetails("Broadway 1965");
      expect(result.productionYear).toBe("1965");
      expect(result.productionLocation).toBe("Broadway");
    });

    it("should strip '>>>' from the location and still extract the year", () => {
      const result = worksList.parseProductionDetails("The Yard >>> 18 Oct 2011");
      expect(result.productionLocation).toBe("The Yard");
      expect(result.productionYear).toBe("18 Oct 2011");
    });
  });

  describe("#parsePublicationDetails", () => {
    const emptyResult = { publisher: "", publicationYear: "" };
    it("should return empty strings for blank input", () => {
      expect(worksList.parsePublicationDetails("", false)).toEqual(emptyResult);
    });

    it("should return empty strings when text contains the publisher exception phrase", () => {
      const result = worksList.parsePublicationDetails(TestBaseWorksList.publisherExceptionString, false);
      expect(result).toEqual(emptyResult);
    });

    it("should extract publisher and year from publication text", () => {
      const result = worksList.parsePublicationDetails("Samuel French Ltd 1972", false);
      expect(result.publisher).toBe("Samuel French Ltd");
      expect(result.publicationYear).toBe("1972");
    });

    it("should include an empty isbn field when includeISBN is true", () => {
      const result = worksList.parsePublicationDetails("Samuel French 1972", true);
      expect(result).toHaveProperty("isbn");
    });

    it("should extract a valid ISBN13 when includeISBN is true", () => {
      const result = worksList.parsePublicationDetails("Samuel French ISBN: 9780573016509 1972", true);
      expect(result.isbn).toBe("9780573016509");
      expect(result.publisher).toBe("Samuel French");
      expect(result.publicationYear).toBe("1972");
    });

    it("should not include isbn when includeISBN is false", () => {
      const result = worksList.parsePublicationDetails("Samuel French 1972", false);
      expect(result).not.toHaveProperty("isbn");
    });

    it("should extract a year concatenated directly to a publisher name (e.g. '1973Methuen')", () => {
      const result = worksList.parsePublicationDetails("1973Methuen", false);
      expect(result.publicationYear).toBe("1973");
      expect(result.publisher).toBe("Methuen");
    });

    it("should extract the last year from a multi-year string and set needsReview", () => {
      const result = worksList.parsePublicationDetails("Aris & Phillips (Nick Hern Books, London, 2001), 1995", false);
      expect(result.needsReview).toBe(true);
      expect(result.needsReviewReason).toBe("Multiple date matches found in publication details");
      expect(result.publicationYear).toBe("1995");
    });
  });

  describe("#formatPlayId", () => {
    it("should return the playId unchanged for a standard play", () => {
      expect(worksList.formatPlayId("12345", "play")).toBe("12345");
    });

    it("should prefix the playId with 'A' for adaptations", () => {
      expect(worksList.formatPlayId("12345", "adaptation")).toBe("A12345");
    });

    it("should return '0000000' for an empty string play id", () => {
      expect(worksList.formatPlayId("", "play")).toBe("0000000");
    });

    it("should return 'A0000000' for an empty string adaptation id", () => {
      expect(worksList.formatPlayId("", "adaptation")).toBe("A0000000");
    });
  });

  describe("#formatISBN", () => {
    it("should strip an 'ISBN:' prefix", () => {
      expect(worksList.formatISBN("ISBN: 9780573016509")).toBe("9780573016509");
    });

    it("should strip an 'ISBN-13:' prefix", () => {
      expect(worksList.formatISBN("ISBN-13: 9780573016509")).toBe("9780573016509");
    });

    it("should return an already-clean ISBN unchanged", () => {
      expect(worksList.formatISBN("9780573016509")).toBe("9780573016509");
    });

    it("should return an empty string for empty input", () => {
      expect(worksList.formatISBN("")).toBe("");
    });
  });

  describe("#formatReference", () => {
    it("should strip '>>>' from a reference string", () => {
      expect(worksList.formatReference("Theatre Record >>> Volume XXXI")).toBe("Theatre Record Volume XXXI");
    });

    it("should return an empty string for empty input", () => {
      expect(worksList.formatReference("")).toBe("");
    });
  });

  describe("#formatOrganizations", () => {
    it("should strip '>>>' from an organizations string", () => {
      expect(worksList.formatOrganizations("RSC >>> National Theatre")).toBe("RSC National Theatre");
    });

    it("should return an empty string for empty input", () => {
      expect(worksList.formatOrganizations("")).toBe("");
    });
  });

  describe("#formatDisplayTitle", () => {
    it("should move trailing suffixes to the front and return in title case", () => {
      expect(worksList.formatDisplayTitle("bacchae, the")).toBe("The Bacchae");
      expect(worksList.formatDisplayTitle("BACCHAE, A")).toBe("A Bacchae");
      expect(worksList.formatDisplayTitle("aNNual baCChanal, An")).toBe("An Annual Bacchanal");
      expect(worksList.formatDisplayTitle("Bacchae, The")).toBe("The Bacchae");
    });

    it("should return titles without suffixes in title case, unaltered", () => {
      expect(worksList.formatDisplayTitle("the bacchae")).toBe("The Bacchae");
      expect(worksList.formatDisplayTitle("tHe baCChae")).toBe("The Bacchae");
      expect(worksList.formatDisplayTitle("THE BACCHAE")).toBe("The Bacchae");
      expect(worksList.formatDisplayTitle("The Bacchae")).toBe("The Bacchae");
    });

    it("should move trailing suffixes to the front and title-case the result", () => {
      expect(worksList.formatDisplayTitle("bacchaE, The")).toBe("The Bacchae");
      expect(worksList.formatDisplayTitle("Baccha, A")).toBe("A Baccha");
      expect(worksList.formatDisplayTitle("annual bacchanal, An")).toBe("An Annual Bacchanal");
    });
  });

  describe("#formatGenres", () => {
    it("should title-case valid genre strings", () => {
      expect(worksList.formatGenres("adaptation")).toBe("Adaptation");
      expect(worksList.formatGenres("COMEDY DRAMA")).toBe("Comedy Drama");
      expect(worksList.formatGenres("tragedy/one-act")).toBe("Tragedy/one-act");
      expect(worksList.formatGenres("hisTORIcal comedy")).toBe("Historical Comedy");
    });

    it("should return an empty string for empty input after trimming", () => {
      expect(worksList.formatGenres("")).toBe("");
      expect(worksList.formatGenres("   ")).toBe("");
    });
  });

  describe("#parseCount", () => {
    it("should return the parsed integer for a numeric parts string", () => {
      expect(worksList.exposedParseCount("3")).toBe(3);
    });

    it("should return the leading integer for a parts string like '6 m/f'", () => {
      expect(worksList.exposedParseCount("6 m/f")).toBe(6);
    });

    it("should return 0 for empty or non-numeric strings", () => {
      expect(worksList.exposedParseCount("")).toBe(0);
      expect(worksList.exposedParseCount("-")).toBe(0);
      expect(worksList.exposedParseCount("abc")).toBe(0);
    });
  });
});
