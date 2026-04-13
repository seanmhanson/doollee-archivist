import { describe, it, expect } from "@jest/globals";

import BaseWorksList from "../__BaseWorksList";

import type { Page } from "playwright";

class TestWorksList extends BaseWorksList {
  constructor(page: Page) {
    super(page);
  }

  protected async extractData(): Promise<void> {
    this.data = [];
    return Promise.resolve();
  }

  // Expose protected methods for testing
  public getPlayId(idString: string) {
    return super.getPlayId(idString);
  }

  public normalizeStringFields<T extends Record<string, unknown>>(data: T[]) {
    return super.normalizeStringFields(data);
  }

  public parseProductionDetails(text: string) {
    return super.parseProductionDetails(text);
  }

  public parsePublicationDetails(text: string, includeISBN: boolean) {
    return super.parsePublicationDetails(text, includeISBN);
  }

  public formatPlayId(playId: string, type: "play" | "adaptation") {
    return super.formatPlayId(playId, type);
  }

  public formatISBN(isbn: string) {
    return super.formatISBN(isbn);
  }

  public formatReference(reference: string) {
    return super.formatReference(reference);
  }

  public formatOrganizations(orgs: string) {
    return super.formatOrganizations(orgs);
  }

  public formatDisplayTitle(title: string) {
    return super.formatDisplayTitle(title);
  }

  public formatGenres(genres: string) {
    return super.formatGenres(genres);
  }
}

describe("BaseWorksList", () => {
  const mockPage = {} as Page;

  describe("constructor and create", () => {
    it("should initialize with empty data array", () => {
      const worksList = new TestWorksList(mockPage);
      expect(worksList.worksData).toEqual([]);
    });

    it("should call extractData via static create", async () => {
      const worksList = await TestWorksList.create(mockPage);
      expect(worksList).toBeInstanceOf(BaseWorksList);
      expect(worksList.worksData).toEqual([]);
    });
  });

  describe("getPlayId", () => {
    it("should return trimmed play ID", () => {
      const worksList = new TestWorksList(mockPage);
      expect(worksList.getPlayId("  27977  ")).toBe("27977");
    });

    it("should return default ID for empty string", () => {
      const worksList = new TestWorksList(mockPage);
      expect(worksList.getPlayId("")).toBe("0000000");
    });

    it("should return default ID for undefined-like input", () => {
      const worksList = new TestWorksList(mockPage);
      expect(worksList.getPlayId(undefined as unknown as string)).toBe("0000000");
    });
  });

  describe("formatPlayId", () => {
    it("should return plain ID for play type", () => {
      const worksList = new TestWorksList(mockPage);
      expect(worksList.formatPlayId("27977", "play")).toBe("27977");
    });

    it("should prefix with A for adaptation type", () => {
      const worksList = new TestWorksList(mockPage);
      expect(worksList.formatPlayId("133441", "adaptation")).toBe("A133441");
    });

    it("should use default ID when empty", () => {
      const worksList = new TestWorksList(mockPage);
      expect(worksList.formatPlayId("", "play")).toBe("0000000");
    });
  });

  describe("formatISBN", () => {
    it("should strip ISBN prefix and whitespace", () => {
      const worksList = new TestWorksList(mockPage);
      expect(worksList.formatISBN("ISBN: 978-0571288403")).toBe("978-0571288403");
    });

    it("should handle ISBN with dash separator", () => {
      const worksList = new TestWorksList(mockPage);
      expect(worksList.formatISBN("ISBN-978-0571288403")).toBe("978-0571288403");
    });

    it("should handle empty string", () => {
      const worksList = new TestWorksList(mockPage);
      expect(worksList.formatISBN("")).toBe("");
    });

    it("should handle undefined by defaulting to empty string", () => {
      const worksList = new TestWorksList(mockPage);
      expect(worksList.formatISBN(undefined as unknown as string)).toBe("");
    });
  });

  describe("formatDisplayTitle", () => {
    it("should move trailing 'The' article to the front", () => {
      const worksList = new TestWorksList(mockPage);
      expect(worksList.formatDisplayTitle("Birthday Party, The")).toBe("The Birthday Party");
    });

    it("should move trailing 'A' article to the front", () => {
      const worksList = new TestWorksList(mockPage);
      expect(worksList.formatDisplayTitle("Midsummer Night's Dream, A")).toBe("A Midsummer Night's Dream");
    });

    it("should move trailing 'An' article to the front", () => {
      const worksList = new TestWorksList(mockPage);
      expect(worksList.formatDisplayTitle("Inspector Calls, An")).toBe("An Inspector Calls");
    });

    it("should title-case the result", () => {
      const worksList = new TestWorksList(mockPage);
      expect(worksList.formatDisplayTitle("betrayal")).toBe("Betrayal");
    });

    it("should handle titles without trailing articles", () => {
      const worksList = new TestWorksList(mockPage);
      expect(worksList.formatDisplayTitle("Betrayal")).toBe("Betrayal");
    });
  });

  describe("formatGenres", () => {
    it("should title-case genre text", () => {
      const worksList = new TestWorksList(mockPage);
      expect(worksList.formatGenres("radio sketch")).toBe("Radio Sketch");
    });

    it("should return empty string for blank input", () => {
      const worksList = new TestWorksList(mockPage);
      expect(worksList.formatGenres("")).toBe("");
      expect(worksList.formatGenres("  ")).toBe("");
    });
  });

  describe("formatReference", () => {
    it("should remove >>> markers and normalize whitespace", () => {
      const worksList = new TestWorksList(mockPage);
      expect(worksList.formatReference("Theatre Record >>> Volume XII")).toBe("Theatre Record Volume XII");
    });
  });

  describe("formatOrganizations", () => {
    it("should remove >>> markers and normalize whitespace", () => {
      const worksList = new TestWorksList(mockPage);
      expect(worksList.formatOrganizations("Company A >>> Company B")).toBe("Company A Company B");
    });
  });

  describe("normalizeStringFields", () => {
    it("should normalize strings and leave non-strings untouched", () => {
      const worksList = new TestWorksList(mockPage);
      const data = [
        { title: "  A Play  ", count: 42, notes: "n/a" },
        { title: " - ", count: 0, notes: "  some text  " },
      ];
      const result = worksList.normalizeStringFields(data);
      expect(result[0].title).toBe("A Play");
      expect(result[0].count).toBe(42);
      expect(result[0].notes).toBe("");
      expect(result[1].title).toBe("");
      expect(result[1].notes).toBe("some text");
    });
  });

  describe("parseProductionDetails", () => {
    it("should parse location and year from production text", () => {
      const worksList = new TestWorksList(mockPage);
      const result = worksList.parseProductionDetails("National Theatre, London >>> 15 Nov 1978");
      expect(result.productionLocation).toBe("National Theatre, London 15 Nov 1978");
      expect(result.productionYear).toBe("");
    });

    it("should return empty strings for blank input", () => {
      const worksList = new TestWorksList(mockPage);
      const result = worksList.parseProductionDetails("   ");
      expect(result.productionLocation).toBe("");
      expect(result.productionYear).toBe("");
    });

    it("should handle input with standalone year", () => {
      const worksList = new TestWorksList(mockPage);
      const result = worksList.parseProductionDetails("1978");
      expect(result.productionYear).toBe("1978");
      expect(result.productionLocation).toBe("");
    });
  });

  describe("parsePublicationDetails", () => {
    it("should return empty strings for blank input", () => {
      const worksList = new TestWorksList(mockPage);
      const result = worksList.parsePublicationDetails("   ", false);
      expect(result.publisher).toBe("");
      expect(result.publicationYear).toBe("");
    });

    it("should handle the publisher exception text", () => {
      const worksList = new TestWorksList(mockPage);
      const result = worksList.parsePublicationDetails(
        "I don't think it has been published. Try emailing Playwright.",
        false,
      );
      expect(result.publisher).toBe("");
      expect(result.publicationYear).toBe("");
    });

    it("should include isbn field when includeISBN is true", () => {
      const worksList = new TestWorksList(mockPage);
      const result = worksList.parsePublicationDetails("Faber and Faber, London, 1996 -", true);
      expect(result).toHaveProperty("isbn");
    });

    it("should not include isbn field when includeISBN is false", () => {
      const worksList = new TestWorksList(mockPage);
      const result = worksList.parsePublicationDetails("Faber and Faber, London, 1996 -", false);
      expect(result).not.toHaveProperty("isbn");
    });

    it("should extract a valid ISBN13 from publication text", () => {
      const worksList = new TestWorksList(mockPage);
      const result = worksList.parsePublicationDetails("Faber and Faber Ltd, London >>> 9780571288403", true);
      expect(result.isbn).toBe("9780571288403");
    });
  });
});
