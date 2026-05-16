import { describe, expect, it, beforeEach } from "@jest/globals";
import { ObjectId } from "mongodb";

import Play from "../Play.class";

import type { PlayData } from "../play.types";

import { REVIEW_NOTES } from "#/review-notes";

function getPlayFixture(overrides: Partial<PlayData> = {}): PlayData {
  return {
    playId: "12345",
    title: "Test Play",
    originalAuthor: "Test Author",
    _archive: {
      _type: "play",
      playId: "12345",
      title: "Test Play",
      altTitle: "An Alternate Title",
      synopsis: "A test synopsis.",
      notes: "Some notes.",
      production: "National Theatre Oct 2010",
      organizations: "Test Org",
      publisher: "Samuel French 1972",
      music: "Original Score",
      genres: "Comedy Drama",
      parts: "Male: 2 Female: 3 Other: -",
      reference: "ref123",
    },
    scrapedAt: new Date("2026-01-01"),
    sourceUrl: "https://example.com",
    ...overrides,
  };
}

describe("Play.class", () => {
  describe("when initialized with valid data", () => {
    let play: Play;

    beforeEach(() => {
      play = new Play(getPlayFixture());
    });

    it("should create a Play instance with the expected id", () => {
      expect(play.id).toBeInstanceOf(ObjectId);
    });

    it("should not be an adaptation when adaptingAuthor is absent", () => {
      expect(play.isAdaptation).toBe(false);
    });

    it("should be an adaptation when adaptingAuthor is present", () => {
      const adaptationPlay = new Play(getPlayFixture({ adaptingAuthor: "Adaptor Name" }));
      expect(adaptationPlay.isAdaptation).toBe(true);
    });
  });

  describe("#archiveData", () => {
    it("should return the archive data", () => {
      const fixture = getPlayFixture();
      const play = new Play(fixture);
      expect(play.archiveData).toEqual(fixture._archive);
      expect(play.archiveData).not.toBe(fixture._archive);
      expect(Object.isFrozen(fixture._archive)).toBe(false);
    });

    it("should return a frozen archive object", () => {
      const play = new Play(getPlayFixture());
      expect(Object.isFrozen(play.archiveData)).toBe(true);
    });
  });

  describe("#addReviewNote", () => {
    let play: Play;

    beforeEach(() => {
      play = new Play(getPlayFixture());
    });

    it("should add a note to reviewNotes in the document metadata", () => {
      play.addReviewNote(REVIEW_NOTES.MULTIPLE_PUBLICATION_DATES);
      const doc = play.toDocument();
      expect(doc.metadata.reviewNotes).toEqual([REVIEW_NOTES.MULTIPLE_PUBLICATION_DATES]);
    });

    it("should accumulate multiple review notes in order", () => {
      play.addReviewNote(REVIEW_NOTES.MULTIPLE_PUBLICATION_DATES);
      play.addReviewNote(REVIEW_NOTES.MULTIPLE_PRODUCTION_DATES);
      const doc = play.toDocument();
      expect(doc.metadata.reviewNotes).toEqual([
        REVIEW_NOTES.MULTIPLE_PUBLICATION_DATES,
        REVIEW_NOTES.MULTIPLE_PRODUCTION_DATES,
      ]);
    });

    it("should omit reviewNotes from the document when none have been added", () => {
      const doc = play.toDocument();
      expect(doc.metadata).not.toHaveProperty("reviewNotes");
    });

    it("should expose hasReviewNotes as false before notes are added", () => {
      expect(play.hasReviewNotes).toBe(false);
    });

    it("should expose hasReviewNotes as true after a note is added", () => {
      play.addReviewNote(REVIEW_NOTES.MULTIPLE_PUBLICATION_DATES);
      expect(play.hasReviewNotes).toBe(true);
    });
  });

  describe("constructor reviewNotes hydration", () => {
    it("should hydrate reviewNotes from input when provided", () => {
      const play = new Play(
        getPlayFixture({
          reviewNotes: [REVIEW_NOTES.MULTIPLE_PUBLICATION_DATES, REVIEW_NOTES.MULTIPLE_PRODUCTION_DATES],
        }),
      );
      expect(play.hasReviewNotes).toBe(true);
      expect(play.toDocument().metadata.reviewNotes).toEqual([
        REVIEW_NOTES.MULTIPLE_PUBLICATION_DATES,
        REVIEW_NOTES.MULTIPLE_PRODUCTION_DATES,
      ]);
    });

    it("should initialize with no reviewNotes when none are provided", () => {
      const play = new Play(getPlayFixture());
      expect(play.hasReviewNotes).toBe(false);
      expect(play.toDocument().metadata).not.toHaveProperty("reviewNotes");
    });
  });

  describe("#toArchiveDocument", () => {
    it("should return an archive document with _id matching play.id by default", () => {
      const play = new Play(getPlayFixture());
      const archiveDocument = play.toArchiveDocument();
      expect(archiveDocument._id).toEqual(play.id);
    });

    it("should return an archive document with archive fields matching play.archiveData", () => {
      const fixture = getPlayFixture();
      const play = new Play(fixture);
      const archiveDocument = play.toArchiveDocument();
      const { _id, ...archiveFields } = archiveDocument;
      expect(archiveFields).toEqual(fixture._archive);
    });

    it("should use the provided id override when supplied", () => {
      const play = new Play(getPlayFixture());
      const overrideId = new ObjectId();
      const archiveDocument = play.toArchiveDocument(overrideId);
      expect(archiveDocument._id).toEqual(overrideId);
      expect(archiveDocument._id).not.toEqual(play.id);
    });
  });

  describe("#toDocument", () => {
    it("should include isAdaptation: false for a standard play", () => {
      const play = new Play(getPlayFixture());
      const doc = play.toDocument();
      expect(doc.isAdaptation).toBe(false);
    });

    it("should include isAdaptation: true when adaptingAuthor is present", () => {
      const play = new Play(getPlayFixture({ adaptingAuthor: "Adaptor Name" }));
      const doc = play.toDocument();
      expect(doc.isAdaptation).toBe(true);
    });

    it("should include productionYearInt when productionYear is a pure 4-digit year", () => {
      const play = new Play(getPlayFixture({ productionYear: "1965" }));
      const doc = play.toDocument();
      expect(doc.productionYearInt).toBe(1965);
    });

    it("should not include productionYearInt when productionYear is not a pure 4-digit year", () => {
      const play = new Play(getPlayFixture({ productionYear: "Oct 2010" }));
      const doc = play.toDocument();
      expect(doc).not.toHaveProperty("productionYearInt");
    });

    it("should include publicationYearInt when publicationYear is a pure 4-digit year", () => {
      const play = new Play(getPlayFixture({ publicationYear: "1972" }));
      const doc = play.toDocument();
      expect(doc.publicationYearInt).toBe(1972);
    });

    it("should not include publicationYearInt when publicationYear is absent", () => {
      const play = new Play(getPlayFixture());
      const doc = play.toDocument();
      expect(doc).not.toHaveProperty("publicationYearInt");
    });
  });
});
