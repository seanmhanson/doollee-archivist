import { describe, it, expect } from "@jest/globals";

import { classifyGenreString } from "../classifyGenreString";

describe("classifyGenreString", () => {
  describe("#classifyGenreString", () => {
    it("classifies a simple genre/format compound with duration", () => {
      expect(classifyGenreString("comedy drama one act 1h 30m")).toEqual({
        tags: { genre: ["comedy", "drama"], format: ["one-act"] },
        duration: [1, 30, 0],
        residue: "",
      });
    });

    it("dedupes a canonical tag that appears more than once in the same string", () => {
      expect(classifyGenreString("comedy drama comedy")).toEqual({
        tags: { genre: ["comedy", "drama"] },
        residue: "",
      });
    });

    it("prefers the longer 'black comedy' / 'dark comedy' phrase over the bare 'comedy' tag", () => {
      expect(classifyGenreString("black comedy")).toEqual({
        tags: { genre: ["dark-comedy"] },
        residue: "",
      });
    });

    it("extracts act count alongside genre tags", () => {
      expect(classifyGenreString("2 acts comedy drama")).toEqual({
        tags: { genre: ["comedy", "drama"] },
        actCount: 2,
        residue: "",
      });
    });

    it("extracts collection size, consuming the filler words describing the collected format", () => {
      // known simplification: "one act" is consumed as filler by extractStructure and isn't
      // separately tagged as format here - see the comment on COLLECTION_SIZE_REGEX
      expect(classifyGenreString("10 one act plays")).toEqual({
        tags: {},
        collectionSize: 10,
        residue: "",
      });
    });

    it("parses the doollee '. - - ' representation suffix separately from the main tags", () => {
      expect(classifyGenreString("play/drama. - - gay/lesbian")).toEqual({
        tags: { format: ["play"], genre: ["drama"], representation: ["gay", "lesbian"] },
        residue: "",
      });
    });

    it("dedupes a representation tag that appears in both the main text and the suffix", () => {
      expect(classifyGenreString("gay comedy. - - gay")).toEqual({
        tags: { genre: ["comedy"], representation: ["gay"] },
        residue: "",
      });
    });

    it("splits a slash-joined compound word into separate tokens", () => {
      expect(classifyGenreString("comedy/drama")).toEqual({
        tags: { genre: ["comedy", "drama"] },
        residue: "",
      });
    });

    it("leaves unrecognized words as residue without affecting matched tags", () => {
      expect(classifyGenreString("typescript comedy")).toEqual({
        tags: { genre: ["comedy"] },
        residue: "typescript",
      });
    });

    it("returns empty tags and the full residue for a fully unrecognized string", () => {
      expect(classifyGenreString("jaime hayes")).toEqual({
        tags: {},
        residue: "jaime hayes",
      });
    });
  });
});
