/**
 * Given text that may contain an ISBN value, broadly match against ISBN patterns
 * for ISBN-10 and ISBN-13, then if any are found, filter and select the best
 * candidate, prioritizing ISBN-13 over ISBN-10 due to their clear prefixing.
 */

type ISBNResult = [
  numericFormatted: string, // numeric value for database storage
  originalFormatted: string, // original value with hyphens for reference
];

export function extractISBN(text: string): ISBNResult {
  const isbnPrefixes = ["978", "979"];
  const isbnPattern = /\b\d[\d-]{9,}(?<!--)\b/g;
  const isbnMatches = text.match(isbnPattern);

  if (!isbnMatches) {
    return ["", ""];
  }

  const isbn10Candidates: ISBNResult[] = [];
  const isbn13Candidates: ISBNResult[] = [];

  for (const isbn of isbnMatches) {
    const numericFormatIsbn = isbn.replace(/-/g, "");
    const prefix = numericFormatIsbn.slice(0, 3);

    if (numericFormatIsbn.length === 13 && isbnPrefixes.includes(prefix)) {
      isbn13Candidates.push([numericFormatIsbn, isbn]);
    }
    if (numericFormatIsbn.length === 10) {
      isbn10Candidates.push([numericFormatIsbn, isbn]);
    }
  }

  const totalIsbn10s = isbn10Candidates.length;
  const totalIsbn13s = isbn13Candidates.length;

  if (totalIsbn13s) {
    if (totalIsbn13s > 1) {
      const originals = isbn13Candidates.map(([original]) => original);
      console.warn(`Multiple ISBN-13 candidates found; selecting the first one from: ` + originals.join(", "));
    }
    return isbn13Candidates[0]; // [formatted (numbers-only), original (with hyphens)]
  }

  if (totalIsbn10s) {
    if (totalIsbn10s > 1) {
      const originals = isbn10Candidates.map(([original]) => original);
      console.warn(`Multiple ISBN-10 candidates found; selecting the first one from: ` + originals.join(", "));
    }
    return isbn10Candidates[0]; // [formatted (numbers-only), original (with hyphens)]
  }

  return ["", ""];
}
