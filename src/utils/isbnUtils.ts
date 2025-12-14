/**
 * Given text that may contain an ISBN value, broadly match against ISBN patterns
 * for ISBN-10 and ISBN-13, then if any are found, filter and select the best
 * candidate, prioritizing ISBN-13 over ISBN-10 due to their clear prefixing.
 */
export function extractISBN(text: string): string | null {
  const isbnPrefixes = ["978", "979"];
  const isbnPattern = /[\d-]{10,}/g;
  const isbnCandidates = text.match(isbnPattern);

  if (!isbnCandidates) {
    return null;
  }

  const isbn10Candidates = [];
  const isbn13Candidates = [];

  for (const isbn of isbnCandidates) {
    const normalizedIsbn = isbn.replace(/-/, "");
    const isbnLength = normalizedIsbn.length;
    const prefix = normalizedIsbn.slice(0, 3);

    if (isbnLength === 13 && isbnPrefixes.includes(prefix)) {
      isbn13Candidates.push(isbn);
    }
    if (isbnLength === 10) {
      isbn10Candidates.push(isbn);
    }
  }

  const totalIsbn10s = isbn10Candidates.length;
  const totalIsbn13s = isbn13Candidates.length;

  if (totalIsbn13s) {
    if (totalIsbn13s >= 1) {
      console.warn(
        `Multiple ISBN-13 candidates found; selecting the first one from: ` +
          isbn13Candidates.join(", ")
      );
    }
    return isbn13Candidates[0];
  }

  if (totalIsbn10s) {
    if (totalIsbn10s >= 1) {
      console.warn(
        `Multiple ISBN-10 candidates found; selecting the first one from: ` +
          isbn10Candidates.join(", ")
      );
    }
    return isbn10Candidates[0];
  }

  return null;
}
