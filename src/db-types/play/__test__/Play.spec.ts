import { describe, expect, it, beforeEach } from "@jest/globals";
import { ObjectId } from "mongodb";

import Play from "../Play.class";

import type { PlayData } from "../play.types";

function getPlayFixture(overrides: Partial<PlayData> = {}): PlayData {
  return {
    playId: "12345",
    title: "Test Play",
    originalAuthor: "Test Author",
    _archive: { _type: "play", playId: "12345", title: "Test Play" },
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

  describe("#setNeedsReview", () => {
    let play: Play;

    beforeEach(() => {
      play = new Play(getPlayFixture());
    });

    it("should set needsReview to true in the document metadata", () => {
      play.setNeedsReview("Test reason");
      const doc = play.toDocument();
      expect(doc.metadata.needsReview).toBe(true);
    });

    it("should set needsReviewReason in the document metadata", () => {
      play.setNeedsReview("Multi-year publication string");
      const doc = play.toDocument();
      expect(doc.metadata.needsReviewReason).toBe("Multi-year publication string");
    });

    it("should set needsReviewData when provided", () => {
      const data = { field: { raw: "1973Methuen", extracted: "1973" } };
      play.setNeedsReview("Test reason", data);
      const doc = play.toDocument();
      expect(doc.metadata.needsReviewData).toEqual(data);
    });

    it("should omit needsReviewData from the document when not provided", () => {
      play.setNeedsReview("Test reason");
      const doc = play.toDocument();
      expect(doc.metadata).not.toHaveProperty("needsReviewData");
    });

    it("should not set needsReview-related fields before setNeedsReview is called", () => {
      const doc = play.toDocument();
      expect(doc.metadata).not.toHaveProperty("needsReview");
      expect(doc.metadata).not.toHaveProperty("needsReviewReason");
      expect(doc.metadata).not.toHaveProperty("needsReviewData");
    });
  });
});
