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

    it("collects unmatched residue from each entry that has any", () => {
      expect(classifyGenres(["typescript comedy", "jaime hayes"])).toEqual({
        tags: { genre: ["comedy"] },
        residue: ["typescript", "jaime hayes"],
      });
    });
  });
});
