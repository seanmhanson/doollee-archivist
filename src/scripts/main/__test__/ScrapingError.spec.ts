import { describe, it, expect } from "@jest/globals";

import {
  ScrapingError,
  SetupError,
  WriteAuthorError,
  WritePlayError,
  PlayProcessingError,
  AuthorProcessingError,
} from "../ScrapingError";

describe("ScrapingError", () => {
  describe("SetupError", () => {
    it("should create a SetupError with correct properties", () => {
      const error = new SetupError("setup failed");
      expect(error.name).toBe("SetupError");
      expect(error.message).toBe("setup failed");
      expect(error.recoveryStrategy).toBe("fatal");
      expect(error.context).toBe("setup");
      expect(error.cause).toBeUndefined();
      expect(error).toBeInstanceOf(Error);
    });

    it("should include a cause when provided", () => {
      const cause = new Error("root cause");
      const error = new SetupError("setup failed", cause);
      expect(error.cause).toBe(cause);
    });
  });

  describe("ScrapingError", () => {
    it("should create a ScrapingError with correct properties", () => {
      const error = new ScrapingError("scrape failed");
      expect(error.name).toBe("ScrapingError");
      expect(error.message).toBe("scrape failed");
      expect(error.recoveryStrategy).toBe("skip");
      expect(error.context).toBe("scraping");
    });
  });

  describe("PlayProcessingError", () => {
    it("should create a PlayProcessingError with correct properties", () => {
      const error = new PlayProcessingError("play error");
      expect(error.name).toBe("PlayProcessingError");
      expect(error.recoveryStrategy).toBe("skip");
      expect(error.context).toBe("processing-play");
    });
  });

  describe("AuthorProcessingError", () => {
    it("should create an AuthorProcessingError with correct properties", () => {
      const error = new AuthorProcessingError("author error");
      expect(error.name).toBe("AuthorProcessingError");
      expect(error.recoveryStrategy).toBe("skip");
      expect(error.context).toBe("processing-author");
    });
  });

  describe("WriteAuthorError", () => {
    it("should create a WriteAuthorError with correct properties", () => {
      const error = new WriteAuthorError("write author failed");
      expect(error.name).toBe("WriteAuthorError");
      expect(error.recoveryStrategy).toBe("skip");
      expect(error.context).toBe("writing-author");
    });
  });

  describe("WritePlayError", () => {
    it("should create a WritePlayError with correct properties", () => {
      const error = new WritePlayError("write play failed");
      expect(error.name).toBe("WritePlayError");
      expect(error.recoveryStrategy).toBe("skip");
      expect(error.context).toBe("writing-play");
    });
  });

  describe("error hierarchy", () => {
    it("should distinguish between error types by name", () => {
      const errors = [
        new SetupError("a"),
        new ScrapingError("b"),
        new PlayProcessingError("c"),
        new AuthorProcessingError("d"),
        new WriteAuthorError("e"),
        new WritePlayError("f"),
      ];

      const names = errors.map((e) => e.name);
      expect(new Set(names).size).toBe(6);
    });

    it("should be catchable as Error instances", () => {
      const throwAndCatch = (ErrorClass: new (msg: string) => Error) => {
        try {
          throw new ErrorClass("test");
        } catch (e) {
          return e instanceof Error;
        }
      };

      expect(throwAndCatch(SetupError)).toBe(true);
      expect(throwAndCatch(ScrapingError)).toBe(true);
      expect(throwAndCatch(WriteAuthorError)).toBe(true);
      expect(throwAndCatch(WritePlayError)).toBe(true);
      expect(throwAndCatch(PlayProcessingError)).toBe(true);
      expect(throwAndCatch(AuthorProcessingError)).toBe(true);
    });
  });
});
