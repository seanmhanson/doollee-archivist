type ClassificationType = "ISBN10" | "ISBN13" | "ISBN10_BAD" | "ISBN13_BAD" | "NEEDS_REVIEW";
type ExtractedISBN = {
  type: ClassificationType;
  raw: string;
  normalized: string;
};

const RE_ISBN13 = /(?<!\d)(97[89][\s-]*(?:\d[\s-]*){10})(?!\d)/g;
const RE_ISBN10 = /(?<![\dA-Z])((?:\d[\s-]*){9}[\dX])(?![\dA-Z])/gi;
const RE_POSSIBLE_ISBN = /(?<!\d)(97[89][\s-]*(?:\d[\s-]*){6,})(?!\d)|(?<!\d)((?:\d[\s-]*){8,}[\dX])(?!\d)/gi;

export function extractIsbn(text = ""): ExtractedISBN | null {
  const isbn13Match = text.match(RE_ISBN13);
  if (isbn13Match) {
    const isbn = isbn13Match[0];
    const isValid = validateIsbn13(isbn);
    return {
      type: isValid ? "ISBN13" : "ISBN13_BAD",
      raw: isbn,
      normalized: normalizeIsbn13(isbn),
    };
  }

  const isbn10Match = text.match(RE_ISBN10);
  if (isbn10Match) {
    const isbn = isbn10Match[0];
    const isValid = validateIsbn10(isbn);
    return {
      type: isValid ? "ISBN10" : "ISBN10_BAD",
      raw: isbn,
      normalized: normalizeIsbn10(isbn),
    };
  }

  const possibleIsbnMatch = RE_POSSIBLE_ISBN.exec(text);
  if (possibleIsbnMatch) {
    const isbn = possibleIsbnMatch[0];
    return {
      type: "NEEDS_REVIEW",
      raw: isbn,
      normalized: isbn.replace(/[\s-]/g, ""),
    };
  }
  return null;
}

function normalizeIsbn10(isbn: string) {
  return isbn.toUpperCase().replace(/[^0-9X]/g, "");
}

function normalizeIsbn13(isbn: string) {
  return isbn.replace(/[^0-9]/g, "");
}

function validateIsbn10(isbn: string) {
  const normalized = normalizeIsbn10(isbn);

  const format = /^\d{9}[\dX]$/;
  if (!format.test(normalized)) {
    return false;
  }

  const checksum = [...normalized].reduce((sum, char, index) => {
    const value = char === "X" ? 10 : parseInt(char, 10);
    return sum + value * (10 - index);
  }, 0);

  return checksum % 11 === 0;
}

function validateIsbn13(isbn: string) {
  const normalized = normalizeIsbn13(isbn);
  const format = /^(978|979)\d{10}$/;
  if (!format.test(normalized)) {
    return false;
  }

  const initialChecksum = [...normalized.slice(0, 12)].reduce((sum, char, index) => {
    const value = parseInt(char, 10);
    const coefficient = index % 2 === 0 ? 1 : 3;
    return sum + value * coefficient;
  }, 0);

  const checksum = (10 - (initialChecksum % 10)) % 10;
  const lastDigit = parseInt(normalized[12], 10);
  return checksum === lastDigit;
}
