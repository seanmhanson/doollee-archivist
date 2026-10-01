export const ONES_WORDS: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  tem: 10, // observed typo for "ten"
};

export const TENS_WORDS: Record<string, number> = {
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
  twent: 20, // observed typo for "twenty"
  thirt: 30, // observed typo for "thirty"
};

// longest-first alternation so e.g. "seventeen" isn't swallowed by "seven"
const wordAlternation = (words: string[]): string =>
  words
    .slice()
    .sort((a, b) => b.length - a.length)
    .join("|");

const ONE_WORD_ALT = wordAlternation(Object.keys(ONES_WORDS));
const TEN_WORD_ALT = wordAlternation(Object.keys(TENS_WORDS));

// matches "twenty-five", "twenty five", "fifteen", "ten", "one", etc.
export const NUMBER_WORD = `(?:(?:${TEN_WORD_ALT})[\\s-](?:${ONE_WORD_ALT})|${TEN_WORD_ALT}|${ONE_WORD_ALT})`;
export const NUMBER_OR_WORD = `\\b(?:\\d+|${NUMBER_WORD})`;

// zero or more spaces/hyphens between a number and its unit (handles "10-minute", "one-hour")
export const SEP = `[\\s-]*`;

export const parseWordNumber = (text: string): number => {
  const cleaned = text.toLowerCase().replace(/-/g, " ").trim();
  const [first, second] = cleaned.split(/\s+/);
  if (second !== undefined) {
    return (TENS_WORDS[first] ?? 0) + (ONES_WORDS[second] ?? 0);
  }
  return TENS_WORDS[first] ?? ONES_WORDS[first] ?? NaN;
};

export const parseAmount = (text: string): number => (/^\d+$/.test(text) ? parseInt(text, 10) : parseWordNumber(text));
