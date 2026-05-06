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
});
