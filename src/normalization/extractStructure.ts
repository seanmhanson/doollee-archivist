import { NUMBER_OR_WORD, SEP, parseAmount } from "./numberWords";

export type ExtractedStructure = {
  actCount?: number;
  collectionSize?: number;
  prunedString: string;
};

type TryResult = { match: RegExpMatchArray; actCount?: number; collectionSize?: number } | null;

// require the unit not be a prefix of a longer word (e.g. reject "act" inside "acting"/"action"/"actor")
const UNIT_BOUNDARY = `(?!\\w)`;

// "2 acts", "3 act play", "in three acts", "two-act"
const ACT_COUNT_REGEX = new RegExp(`(?:in\\s+)?(${NUMBER_OR_WORD})${SEP}acts?${UNIT_BOUNDARY}`, "i");

// nouns describing a single constituent piece within an anthology/collection of short works
const COLLECTION_NOUN = `(?:plays?|monologues?|sketches?|playlets?|pieces?|scenes?|vignettes?|shorts?|comedies|comedy|dramas?)${UNIT_BOUNDARY}`;
// up to 3 filler words between the leading count and the collection noun (e.g. "one act", "x ten minute");
// plural "acts" is never consumed as filler so "2 acts play" is left for ACT_COUNT_REGEX instead
const COLLECTION_SIZE_REGEX = new RegExp(
  `(${NUMBER_OR_WORD})${SEP}(?:(?!acts${UNIT_BOUNDARY})[a-z]+${SEP}){0,3}${COLLECTION_NOUN}`,
  "i",
);

const cleanupPrunedString = (text: string): string =>
  text
    .replace(/\s{2,}/g, " ")
    .replace(/^[\s.,-]+|[\s.,-]+$/g, "")
    .trim();

// a bundle of 2+ separate short works, e.g. "10 one act plays", "3 x ten minute plays"
const tryCollectionSize = (text: string): TryResult => {
  const match = text.match(COLLECTION_SIZE_REGEX);
  if (!match) return null;
  const size = parseAmount(match[1]);
  if (Number.isNaN(size) || size < 2) return null;
  return { match, collectionSize: size };
};

// structural act count of a single play, e.g. "2 acts". A count of 1 ("one act"/"1 act") is
// deliberately left unmatched here - it's handled as the "one-act" FORMAT tag instead, since that's
// the dominant real-world reading of that phrase, not a literal structural-act fact worth storing
const tryActCount = (text: string): TryResult => {
  const match = text.match(ACT_COUNT_REGEX);
  if (!match) return null;
  const count = parseAmount(match[1]);
  if (Number.isNaN(count) || count < 2) return null;
  return { match, actCount: count };
};

// intended to run after extractDuration, so embedded durations (e.g. "5 min play")
// have already been pruned and can't be mistaken for a collection count
export const extractStructure = (genreString: string): ExtractedStructure => {
  const collection = tryCollectionSize(genreString);
  const act = collection ? null : tryActCount(genreString);
  const result = collection ?? act;
  if (!result) return { prunedString: genreString };

  const index = result.match.index ?? 0;
  const prunedString = cleanupPrunedString(
    genreString.slice(0, index) + genreString.slice(index + result.match[0].length),
  );

  return {
    ...(result.actCount !== undefined ? { actCount: result.actCount } : {}),
    ...(result.collectionSize !== undefined ? { collectionSize: result.collectionSize } : {}),
    prunedString,
  };
};
