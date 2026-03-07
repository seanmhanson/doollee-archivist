import { describe, it, expect } from "@jest/globals";

import * as stringUtils from "../stringUtils";

describe("utils/stringUtils", () => {
  describe("#hasAlphanumericCharacters", () => {
    const { hasAlphanumericCharacters } = stringUtils;

    it("should return true if the string contains only alphabetic characters", () => {
      expect(hasAlphanumericCharacters("HelloWorld")).toBe(true);
    });

    it("should return true if the string contains only numeric characters", () => {
      expect(hasAlphanumericCharacters("123456")).toBe(true);
    });

    it("should return true if the string contains alphanumeric characters", () => {
      expect(hasAlphanumericCharacters("Hello123")).toBe(true);
    });

    it("should return false if the string does not contain alphanumeric characters", () => {
      expect(hasAlphanumericCharacters("!@#$%^&*()")).toBe(false);
    });

    it("should return false for an empty string", () => {
      expect(hasAlphanumericCharacters("")).toBe(false);
    });
  });

  describe("#normalizeWhitespace", () => {
    const { normalizeWhitespace } = stringUtils;

    it("should replace multiple whitespace characters with a single space", () => {
      expect(normalizeWhitespace("This   is  a   test.")).toBe("This is a test.");
    });

    it("should replace non-space whitespace characters with a single space", () => {
      expect(normalizeWhitespace("Line1\nLine2\tLine3")).toBe("Line1 Line2 Line3");
    });

    it("should trim leading and trailing whitespace", () => {
      expect(normalizeWhitespace("   Hello World!   ")).toBe("Hello World!");
    });

    it("should return an empty string if the input is only whitespace", () => {
      expect(normalizeWhitespace("     ")).toBe("");
    });
  });

  describe("#removeAndNormalize", () => {
    const { removeAndNormalize } = stringUtils;
    it("should remove the specified string and normalize whitespace", () => {
      expect(removeAndNormalize("This   is    a test\tstring.", "test")).toBe("This is a string.");
    });

    it("should handle multiple occurrences of the removal string", () => {
      expect(removeAndNormalize("  Remove this and this.  ", "this")).toBe("Remove and .");
    });

    it("should return the original string if the removal string is not found", () => {
      expect(removeAndNormalize("No match here.", "absent")).toBe("No match here.");
    });
  });

  describe("#searchForAndRemove", () => {
    const { searchForAndRemove } = stringUtils;

    it("should return the first matched string and the updated string with the match removed", () => {
      const patterns = [/\((\d{4})\)/, /\[(\d{4})\]/];
      const result = searchForAndRemove("The event happened in (2020).", patterns);
      expect(result).toEqual(["2020", "The event happened in ."]);
    });

    it("should return an empty string and the original string if no patterns match", () => {
      const patterns = [/\((\d{4})\)/, /\[(\d{4})\]/];
      const result = searchForAndRemove("No dates here.", patterns);
      expect(result).toEqual(["", "No dates here."]);
    });

    it("should throw an error if a pattern matches more than once", () => {
      const patterns = [/\((\d{4})\)/];
      const expectedErrorMessage =
        'Multiple date matches found in input: "Multiple dates (2020) and (2021).". Pattern /\\((\\d{4})\\)/ matched 2 times.';
      expect(() => searchForAndRemove("Multiple dates (2020) and (2021).", patterns)).toThrow(expectedErrorMessage);
    });
  });

  describe("#checkScrapedString", () => {
    const { checkScrapedString } = stringUtils;

    it("should return an empty string for null or undefined input", () => {
      expect(checkScrapedString(null)).toBe("");
      expect(checkScrapedString(undefined)).toBe("");
    });

    it("should return an empty string for strings that are only whitespace or dashes", () => {
      expect(checkScrapedString("   ")).toBe("");
      expect(checkScrapedString("\t\t")).toBe("");
      expect(checkScrapedString(" - ")).toBe("");
      expect(checkScrapedString("---")).toBe("");
    });

    it("should return an empty string for strings that are 'n/a' (case-insensitive)", () => {
      expect(checkScrapedString("n/a")).toBe("");
      expect(checkScrapedString("N/A")).toBe("");
      expect(checkScrapedString("  n/A  ")).toBe("");
    });

    it("should normalize whitespace for valid strings", () => {
      expect(checkScrapedString("  Hello   World!  ")).toBe("Hello World!");
    });

    it("should return the original string if it is valid and does not require normalization", () => {
      expect(checkScrapedString("Valid String")).toBe("Valid String");
    });
  });

  describe("#toTitleCase", () => {
    const { toTitleCase } = stringUtils;

    it("should convert a string to title case", () => {
      expect(toTitleCase("hello world")).toBe("Hello World");
    });

    it("should handle mixed case input", () => {
      expect(toTitleCase("hELLO wORLD")).toBe("Hello World");
    });

    it("should handle strings with non-alphabetic characters", () => {
      expect(toTitleCase("hello-world!")).toBe("Hello-world!");
    });

    it("should return an empty string if the input is empty", () => {
      expect(toTitleCase("")).toBe("");
    });

    it("should replace accented characters with their title case equivalents", () => {
      expect(toTitleCase("café")).toBe("Café");
    });

    it("should normalize Unicode characters before converting to title case", () => {
      expect(toTitleCase("cafe\u0301")).toBe("Café"); // "cafe" + combining acute accent
    });
  });

  describe("#removeDisambiguationSuffix", () => {
    const { removeDisambiguationSuffix } = stringUtils;

    it('should remove single digit disambiguation suffixes like " (1)"', () => {
      expect(removeDisambiguationSuffix("Example (1)")).toBe("Example");
      expect(removeDisambiguationSuffix("Test (2)")).toBe("Test");
    });

    it('should remove double digit disambiguation suffixes like " (10)"', () => {
      expect(removeDisambiguationSuffix("Example (10)")).toBe("Example");
      expect(removeDisambiguationSuffix("Test (99)")).toBe("Test");
    });

    it("should not remove parentheses that do not match the disambiguation pattern", () => {
      expect(removeDisambiguationSuffix("Example (A)")).toBe("Example (A)");
      expect(removeDisambiguationSuffix("Test (2020)")).toBe("Test (2020)");
    });

    it("should return the original string if there is no disambiguation suffix", () => {
      expect(removeDisambiguationSuffix("Example")).toBe("Example");
      expect(removeDisambiguationSuffix("Test")).toBe("Test");
    });

    it("should handle strings with multiple parentheses but only remove the final suffix if it is a disambiguation suffix", () => {
      expect(removeDisambiguationSuffix("Test (B) (2)")).toBe("Test (B)");
      expect(removeDisambiguationSuffix("Example (1) (A)")).toBe("Example (1) (A)");
    });

    it("should trim extra whitespace after removing the disambiguation suffix", () => {
      expect(removeDisambiguationSuffix("Example (1)   ")).toBe("Example");
      expect(removeDisambiguationSuffix("   Test (2)")).toBe("Test");
    });
  });

  describe("#isAllCaps", () => {
    const { isAllCaps } = stringUtils;

    it("should return true for a string that is all uppercase", () => {
      expect(isAllCaps("HELLO WORLD")).toBe(true);
    });

    it("should return false for a string that contains lowercase letters", () => {
      expect(isAllCaps("Hello World")).toBe(false);
    });

    it("should return false for an empty string", () => {
      expect(isAllCaps("")).toBe(false);
    });

    it("should return true for a string with non-alphabetic characters but all uppercase letters", () => {
      expect(isAllCaps("HELLO WORLD! 123")).toBe(true);
    });

    it("should return true for a string with only non-alphabetic characters", () => {
      expect(isAllCaps("!@#$%^&*()")).toBe(true);
    });
  });

  describe("#stringArraysEqual", () => {
    const { stringArraysEqual } = stringUtils;

    it("should return true for two identical arrays", () => {
      expect(stringArraysEqual(["a", "b", "c"], ["a", "b", "c"])).toBe(true);
    });

    it("should return false for arrays of different lengths", () => {
      expect(stringArraysEqual(["a", "b"], ["a", "b", "c"])).toBe(false);
    });

    it("should return false for arrays with the same elements in different orders", () => {
      expect(stringArraysEqual(["a", "b", "c"], ["c", "b", "a"])).toBe(false);
    });

    it("should return false for arrays with different elements", () => {
      expect(stringArraysEqual(["a", "b", "c"], ["x", "y", "z"])).toBe(false);
    });

    it("should return true for two empty arrays", () => {
      expect(stringArraysEqual([], [])).toBe(true);
    });

    it("should return true for arrays that are equal ignoring case and Unicode normalization", () => {
      expect(stringArraysEqual(["café", "naïve"], ["Café", "Naïve"])).toBe(true);
      expect(stringArraysEqual(["cafe\u0301", "nai\u0308ve"], ["Café", "Naïve"])).toBe(true); // using combining characters
    });
  });
});
