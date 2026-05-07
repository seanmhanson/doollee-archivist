import { describe, it, expect, jest } from "@jest/globals";

import AdaptationBiography from "../AdaptationBiography";

import type { ScrapedData, ParsedNameAndDates } from "../AdaptationBiography";
import type { Page } from "playwright";

type EvaluateFn = <T>(fn: () => T) => Promise<T>;

function createMockPage(scrapedData: Partial<ScrapedData> = {}): Page {
  return {
    evaluate: jest.fn<EvaluateFn>().mockResolvedValue(scrapedData),
  } as unknown as Page;
}

class TestAdaptationBiography extends AdaptationBiography {
  constructor(page: Page) {
    super(page);
  }

  public async extractData(): Promise<void> {
    return super.extractData();
  }

  public parseAdaptationNameAndDates(dateString: string): ParsedNameAndDates {
    return super.parseAdaptationNameAndDates(dateString);
  }

  public getAltName(imageSrc: string, imageAlt: string): string {
    return super.getAltName(imageSrc, imageAlt);
  }
}

describe("AdaptationBiography", () => {
  const name = "EURIPIDES";
  const altName = "Euripides";
  const dates = "EURIPIDES   (480 BC? - 406 BC)";
  const imageSrc = "/Images-playwrights/euripides.jpg";
  const biography =
    'Euripides was the son of a retailer - Mnesarchus. When he was a boy the Oracle predicted that he would "win crowns of victory" - so his father had him enrolled in a school for athletics.';
  const labeledHTML = `
    <strong>Nationality:</strong> Greek&nbsp;&nbsp;&nbsp;&nbsp;<strong>Email:</strong> n/a
    <strong>Website:</strong> n/a&nbsp;&nbsp;&nbsp;&nbsp;<strong>Literary Agent:</strong> n/a
  `;

  describe("#extractData / #scrapeData", () => {
    it("should populate the biographyData property with the extracted and parsed data", async () => {
      const mockPage = createMockPage({
        bio: biography,
        dates,
        imageSrc,
        imageAlt: altName,
        innerHTML: labeledHTML,
      });

      const bio = new TestAdaptationBiography(mockPage);
      await bio.extractData();

      expect(bio.biographyData).toEqual({
        _archive: {
          name,
          altName,
          biography,
          dates,
          nationality: "Greek",
          email: "",
          website: "",
          literaryAgent: "",
        },
        name,
        altName,
        yearBorn: "480 BC?",
        yearDied: "406 BC",
        biography,
        nationality: "Greek",
        email: "",
        website: "",
        literaryAgent: "",
      });
    });

    it("should include all AuthorArchive fields in the _archive", async () => {
      // AdaptationBiography parses biography from the `bio` string directly, so
      // all labeled fields can be freely placed in innerHTML without affecting biography.
      const fullLabelHTML = `
        <strong>Nationality:</strong> Greek
        <strong>Email:</strong> <a href="mailto:test@example.com">test@example.com</a>
        <strong>Website:</strong> <a href="https://example.com">Website</a>
        <strong>Literary Agent:</strong> <a href="/agents/test.php">Test Agent</a>
        <strong>Address:</strong> 1 Test Street, Athens, Greece
        <strong>Telephone:</strong> +30-1234-5678
        <strong>Research: </strong> Ancient sources and modern scholarship
      `;

      const mockPage = createMockPage({
        bio: biography,
        dates,
        imageSrc,
        imageAlt: altName,
        innerHTML: fullLabelHTML,
      });
      const bio = new TestAdaptationBiography(mockPage);
      await bio.extractData();

      expect(bio.biographyData._archive).toEqual({
        name,
        altName,
        dates,
        biography,
        nationality: "Greek",
        email: "test@example.com",
        website: "https://example.com",
        literaryAgent: "Test Agent",
        address: "1 Test Street, Athens, Greece",
        telephone: "+30-1234-5678",
        research: "Ancient sources and modern scholarship",
      });
    });
  });

  describe("#parseAdaptationNameAndDates", () => {
    it("should return the name, yearBorn, and yearDied parsed from a combined date string", () => {
      const bio = new TestAdaptationBiography(createMockPage());
      const result = bio.parseAdaptationNameAndDates(dates);
      expect(result).toEqual({ name, yearBorn: "480 BC?", yearDied: "406 BC" });
    });
  });

  describe("#getAltName", () => {
    it("should return the image alt text when a real image src is present", () => {
      const bio = new TestAdaptationBiography(createMockPage());
      expect(bio.getAltName(imageSrc, altName)).toBe(altName);
    });

    it("should return an empty string when the image src is empty", () => {
      const bio = new TestAdaptationBiography(createMockPage());
      expect(bio.getAltName("", altName)).toBe("");
    });

    it("should return an empty string when the image src contains the blank image prefix", () => {
      const bio = new TestAdaptationBiography(createMockPage());
      expect(bio.getAltName("/Images-playwrights/Blank-author.gif", altName)).toBe("");
    });
  });
});
