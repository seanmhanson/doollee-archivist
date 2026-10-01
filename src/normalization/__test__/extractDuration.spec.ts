import { describe, it, expect } from "@jest/globals";

import { extractDuration } from "../extractDuration";

describe("extractDuration", () => {
  describe("#extractDuration", () => {
    it("parses compact hour/minute notation", () => {
      expect(extractDuration("0h 30m comedy solo show")).toEqual({
        duration: [0, 30, 0],
        prunedString: "comedy solo show",
      });
      expect(extractDuration("1h 0m")).toEqual({
        duration: [1, 0, 0],
        prunedString: "",
      });
    });

    it("parses plain numeric minutes, with trailing punctuation cleaned up", () => {
      expect(extractDuration("105 min. - - gay")).toEqual({
        duration: [0, 105, 0],
        prunedString: "gay",
      });
    });

    it("parses hyphenated minute notation", () => {
      expect(extractDuration("10-minute play")).toEqual({
        duration: [0, 10, 0],
        prunedString: "play",
      });
    });

    it("parses word-number durations", () => {
      expect(extractDuration("one hour ten minutes")).toEqual({
        duration: [1, 10, 0],
        prunedString: "",
      });
      expect(extractDuration("one hour and twenty minutes")).toEqual({
        duration: [1, 20, 0],
        prunedString: "",
      });
    });

    it("parses half hour and hour-long phrasing", () => {
      expect(extractDuration("half hour play one act")).toEqual({
        duration: [0, 30, 0],
        prunedString: "play one act",
      });
      expect(extractDuration("hour-long drama")).toEqual({
        duration: [1, 0, 0],
        prunedString: "drama",
      });
    });

    it("parses explicit ranges", () => {
      expect(extractDuration("20 to 25 minutes")).toEqual({
        durationRange: [
          [0, 20, 0],
          [0, 25, 0],
        ],
        prunedString: "",
      });
      expect(extractDuration("45 mins/20 min versions one act")).toEqual({
        durationRange: [
          [0, 20, 0],
          [0, 45, 0],
        ],
        prunedString: "versions one act",
      });
    });

    it("splits glued 4-digit minute ranges", () => {
      expect(extractDuration("5070 min drama")).toEqual({
        durationRange: [
          [0, 50, 0],
          [0, 70, 0],
        ],
        prunedString: "drama",
      });
    });

    it("tolerates observed typos", () => {
      expect(extractDuration("120 mindrama comedy")).toEqual({
        duration: [0, 120, 0],
        prunedString: "drama comedy",
      });
      expect(extractDuration("45 mi one act")).toEqual({
        duration: [0, 45, 0],
        prunedString: "one act",
      });
    });

    it("parses bare minute notation", () => {
      expect(extractDuration("8m")).toEqual({ duration: [0, 8, 0], prunedString: "" });
    });

    it("returns the original string unchanged when no duration is present", () => {
      expect(extractDuration("comedy")).toEqual({ prunedString: "comedy" });
      expect(extractDuration("someone minute")).toEqual({ prunedString: "someone minute" });
    });
  });
});
