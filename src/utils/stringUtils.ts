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
