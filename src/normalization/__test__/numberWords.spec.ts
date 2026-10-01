import { describe, it, expect } from "@jest/globals";

import { parseAmount, parseWordNumber } from "../numberWords";

describe("numberWords", () => {
  describe("#parseAmount", () => {
    it("parses plain digit strings", () => {
      expect(parseAmount("12")).toBe(12);
      expect(parseAmount("0")).toBe(0);
    });

    it("parses single word numbers", () => {
      expect(parseAmount("ten")).toBe(10);
      expect(parseAmount("eight")).toBe(8);
    });

    it("parses compound tens-and-ones word numbers with a space or hyphen", () => {
      expect(parseAmount("twenty five")).toBe(25);
      expect(parseAmount("twenty-five")).toBe(25);
    });

    it("parses observed typo number words", () => {
      expect(parseAmount("tem")).toBe(10);
      expect(parseAmount("thirt")).toBe(30);
      expect(parseAmount("twent")).toBe(20);
    });
  });

  describe("#parseWordNumber", () => {
    it("returns NaN for unrecognized words", () => {
      expect(parseWordNumber("banana")).toBeNaN();
    });
  });
});
