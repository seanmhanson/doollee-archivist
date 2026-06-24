import { describe, expect, it } from "@jest/globals";

import {
  AuthorProcessingError,
  createErrorLogPayload,
  serializeError,
  SetupError,
  WritePlayError,
} from "#/scripts/scrape/ScrapingErrors";

describe("scripts/scrape/ScrapingErrors", () => {
  describe("serializeError", () => {
    it("includes context and strategy for typed scraping errors", () => {
      const error = new SetupError("setup failed");

      const result = serializeError(error);

      expect(result.name).toBe("SetupError");
      expect(result.message).toBe("setup failed");
      expect(result.context).toBe("setup");
      expect(result.recoveryStrategy).toBe("fatal");
      expect(result.causeChain).toEqual([]);
    });

    it("serializes nested causes", () => {
      const inner = new Error("inner failure");
      const middle = new Error("middle failure", { cause: inner });
      const error = new WritePlayError("write failed", middle);

      const result = serializeError(error);

      expect(result.name).toBe("WritePlayError");
      expect(result.context).toBe("writing-play");
      expect(result.recoveryStrategy).toBe("skip");
      expect(result.causeChain).toHaveLength(2);
      expect(result.causeChain[0]).toEqual(expect.objectContaining({ message: "middle failure" }));
      expect(result.causeChain[1]).toEqual(expect.objectContaining({ message: "inner failure" }));
    });

    it("handles non-Error values", () => {
      const result = serializeError("bad things happened");
      expect(result.name).toBe("UnknownError");
      expect(result.message).toBe("bad things happened");
      expect(result.causeChain).toEqual([]);
    });
  });

  describe("createErrorLogPayload", () => {
    it("adds context and timestamp", () => {
      const error = new AuthorProcessingError("missing source data");
      const payload = createErrorLogPayload(error, {
        profileName: "Test Author",
        authorUrl: "/PlaywrightsA/test-author.php",
        playTitle: "Test Play",
      });

      expect(payload.context.profileName).toBe("Test Author");
      expect(payload.context.authorUrl).toBe("/PlaywrightsA/test-author.php");
      expect(payload.context.playTitle).toBe("Test Play");
      expect(payload.error.name).toBe("AuthorProcessingError");
      expect(payload.timestamp).toEqual(expect.any(String));
    });
  });
});
