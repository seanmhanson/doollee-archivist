export function hasAlphanumericCharacters(str: string): boolean {
  return /[a-zA-Z0-9]/.test(str);
}

export function normalizeWhitespace(str: string): string {
  return (str = str.replace(/\s+/g, " ").trim());
}

export function removeAndNormalize(str: string, removalString: string): string {
  return normalizeWhitespace(str.replaceAll(removalString, ""));
}

type SearchAndRemoveResult = [matchedString: string, updatedString: string];

/**
 * NB: the returned value is the first capture group (without optional values)
 * the updated string removes the full match (with optional values)
 * Ex: "(2020)" returns "2020" and removes "(2020)" from the string
 */
export function searchForAndRemove(input: string, patterns: RegExp[]): SearchAndRemoveResult {
  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) {
      return [match[1], input.replace(match[0], "")];
    }
  }
  return ["", input];
}

export function checkScrapedString(scrapedString: string | null | undefined): string {
  // null-check values:
  if (scrapedString === null || scrapedString === undefined) return "";

  // check for strings like " - ", "   ", " -  - ", "---" etc.
  if (/^[\s-]+$/.test(scrapedString)) return "";

  // check for "n/a, N/A, etc"
  if (scrapedString.trim().toLowerCase() === "n/a") return "";

  return normalizeWhitespace(scrapedString);
}

export function toTitleCase(str: string): string {
  return str.normalize("NFC").replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toLocaleUpperCase() + txt.slice(1).toLocaleLowerCase();
  });
}

export function removeDisambiguationSuffix(name = ""): string {
  return name
    .replace(/^\(\d{1,2}\)$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function isAllCaps(str: string): boolean {
  const allCapsPattern = /^(?!.*\p{Ll}).+$/u;
  return allCapsPattern.test(str);
}

export function stringArraysEqual(arr1: string[], arr2: string[]): boolean {
  const sameLength = arr1.length === arr2.length;
  if (!sameLength) return false;

  return arr1.every((name, index) => {
    const normalizedStr1 = name.normalize("NFC").toLocaleLowerCase();
    const normalizedStr2 = arr2[index].normalize("NFC").toLocaleLowerCase();
    return normalizedStr1 === normalizedStr2;
  });
}
