import { describe, expect, it } from "@jest/globals";

import { extractIsbn } from "../isbnUtils";

describe("utils/isbnUtils", () => {
  describe("for ISBN10 formats", () => {
    it("should extract and classify valid ISBN10", () => {
      const result = extractIsbn("This is a book with ISBN 0-306-40615-2.");
      expect(result).toEqual({
        type: "ISBN10",
        raw: "0-306-40615-2",
        normalized: "0306406152",
      });
    });

    it("should include uppercase X in normalized ISBN10 if it is the check digit", () => {
      const result = extractIsbn("This is a book with ISBN 1-55860-832-X.");
      expect(result).toEqual({
        type: "ISBN10",
        raw: "1-55860-832-X",
        normalized: "155860832X",
      });
    });

    it("should extract and classify invalid ISBN10", () => {
      const result = extractIsbn("This is a book with ISBN 0-306-40615-3.");
      expect(result).toEqual({
        type: "ISBN10_BAD",
        raw: "0-306-40615-3",
        normalized: "0306406153",
      });
    });

    it('should extract and classify invalid ISBN10 with bad "X" check digit', () => {
      const result = extractIsbn("This is a book with ISBN 1-55860-831-X.");
      expect(result).toEqual({
        type: "ISBN10_BAD",
        raw: "1-55860-831-X",
        normalized: "155860831X",
      });
    });
  });

  describe("for ISBN13 formats", () => {
    it("should extract and classify valid ISBN13 with check digit 0", () => {
      const result = extractIsbn("This is a book with ISBN 978-3-16-148410-0.");
      expect(result).toEqual({
        type: "ISBN13",
        raw: "978-3-16-148410-0",
        normalized: "9783161484100",
      });
    });

    it("should extract and classify valid ISBN13 with non-zero check digit", () => {
      const result = extractIsbn("Published by Faber >>> 978-0-571-28840-3");
      expect(result).toEqual({
        type: "ISBN13",
        raw: "978-0-571-28840-3",
        normalized: "9780571288403",
      });
    });

    it("should extract and classify invalid ISBN13", () => {
      const result = extractIsbn("This is a book with ISBN 978-3-16-148410-1.");
      expect(result).toEqual({
        type: "ISBN13_BAD",
        raw: "978-3-16-148410-1",
        normalized: "9783161484101",
      });
    });
  });

  describe("for other inputs", () => {
    it("should return null if no ISBN is found", () => {
      const result = extractIsbn("This string does not contain an ISBN.");
      expect(result).toBeNull();
    });

    it("should classify and normalize possible ISBNs that do not match valid formats", () => {
      const result = extractIsbn("This is a book with a possible ISBN 123-456-789.");
      expect(result).toEqual({
        type: "NEEDS_REVIEW",
        raw: "123-456-789",
        normalized: "123456789",
      });
    });

    it("should return null for strings that look like ISBNs but have invalid characters", () => {
      const result = extractIsbn("This is a book with ISBN 978-X-16-148410-0.");
      expect(result).toBeNull();
    });
  });
});
