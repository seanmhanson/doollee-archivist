import { describe, it, expect } from "@jest/globals";

import { extractStructure } from "../extractStructure";

describe("extractStructure", () => {
  describe("#extractStructure", () => {
    it("parses numeric act counts", () => {
      expect(extractStructure("2 acts play/drama")).toEqual({ actCount: 2, prunedString: "play/drama" });
      expect(extractStructure("drama in three acts")).toEqual({ actCount: 3, prunedString: "drama" });
    });

    it("parses one-act as an act count of 1", () => {
      expect(extractStructure("one act comedy")).toEqual({ actCount: 1, prunedString: "comedy" });
    });

    it("parses collections of multiple short works", () => {
      expect(extractStructure("10 one act plays")).toEqual({ collectionSize: 10, prunedString: "" });
      expect(extractStructure("six short plays")).toEqual({ collectionSize: 6, prunedString: "" });
      expect(extractStructure("17 plays one act")).toEqual({ collectionSize: 17, prunedString: "one act" });
    });

    it("parses an 'x' separated collection count", () => {
      expect(extractStructure("3 x ten monologues")).toEqual({ collectionSize: 3, prunedString: "" });
    });

    it("does not treat a single act/play as a collection", () => {
      expect(extractStructure("one act play")).toEqual({ actCount: 1, prunedString: "play" });
    });

    it("does not match 'act' inside unrelated words", () => {
      expect(extractStructure("interactive comedy")).toEqual({ prunedString: "interactive comedy" });
    });

    it("returns the original string unchanged when no structure is present", () => {
      expect(extractStructure("comedy drama")).toEqual({ prunedString: "comedy drama" });
    });
  });
});
