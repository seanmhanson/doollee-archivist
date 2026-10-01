import { describe, it, expect } from "@jest/globals";

import { classifyGenres } from "../classifyGenres";

describe("classifyGenres", () => {
  describe("#classifyGenres", () => {
    it("returns empty tags for undefined or empty input", () => {
      expect(classifyGenres(undefined)).toEqual({ tags: {} });
      expect(classifyGenres([])).toEqual({ tags: {} });
    });

    it("merges tags across multiple comma-separated genre entries", () => {
      expect(classifyGenres(["comedy", "one act"])).toEqual({
        tags: { genre: ["comedy"], format: ["one-act"] },
      });
    });

    it("dedupes a tag that appears in more than one entry", () => {
      expect(classifyGenres(["comedy", "comedy drama"])).toEqual({
        tags: { genre: ["comedy", "drama"] },
      });
    });

    it("keeps the first duration/structure signal found across entries", () => {
      expect(classifyGenres(["1h 30m comedy", "2 acts drama"])).toEqual({
        tags: { genre: ["comedy", "drama"] },
        duration: [1, 30, 0],
        actCount: 2,
      });
    });

    it("keeps only the first duration signal, whether it is a duration or a range", () => {
      expect(classifyGenres(["1 hour", "20-30 minutes"])).toEqual({
        tags: {},
        duration: [1, 0, 0],
      });
      expect(classifyGenres(["20-30 minutes", "1 hour"])).toEqual({
        tags: {},
        durationRange: [
          [0, 20, 0],
          [0, 30, 0],
        ],
      });
    });

    it("collects unmatched residue from each entry that has any", () => {
      expect(classifyGenres(["typescript comedy", "jaime hayes"])).toEqual({
        tags: { genre: ["comedy"] },
        residue: ["typescript", "jaime hayes"],
      });
    });
  });
});
