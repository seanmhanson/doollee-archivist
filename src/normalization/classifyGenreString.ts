import { extractDuration } from "./extractDuration";
import { extractStructure } from "./extractStructure";
import { TAG_DEFINITIONS } from "./tagMap";

import type { Duration, DurationRange } from "./extractDuration";
import type { TagCategory } from "./tagMap";

export type GenreTags = Partial<Record<TagCategory, string[]>>;

export type ClassifiedGenre = {
  tags: GenreTags;
  duration?: Duration;
  durationRange?: DurationRange;
  actCount?: number;
  collectionSize?: number;
  // leftover, unmatched words - diagnostic only, never stored on the document
  residue: string;
};

type VariantEntry = { words: string[]; canonical: string; category: TagCategory };

// longest phrase first, so e.g. "science fiction" is matched before a stray "science"/"fiction" would be
const VARIANT_ENTRIES: VariantEntry[] = TAG_DEFINITIONS.flatMap((tag) =>
  tag.variants.map((variant) => ({ words: variant.split(/\s+/), canonical: tag.canonical, category: tag.category })),
).sort((a, b) => b.words.length - a.words.length);

// representation tags are parsed from the doollee-specific ". - - gay/lesbian" suffix convention
const REPRESENTATION_SUFFIX_REGEX = /\.\s*-\s*-\s*(.+)$/;

const splitWords = (text: string): string[] =>
  text
    .toLowerCase()
    .split(/[\s/]+/)
    .filter((word) => word.length > 0);

const matchTagsFromWords = (words: string[]): { tags: GenreTags; residue: string[] } => {
  const tags: GenreTags = {};
  const residue: string[] = [];
  const seenCanonical = new Set<string>();

  let index = 0;
  while (index < words.length) {
    const entry = VARIANT_ENTRIES.find(
      (candidate) =>
        index + candidate.words.length <= words.length &&
        candidate.words.every((word, offset) => words[index + offset] === word),
    );

    if (!entry) {
      residue.push(words[index]);
      index += 1;
      continue;
    }

    if (!seenCanonical.has(entry.canonical)) {
      tags[entry.category] = [...(tags[entry.category] ?? []), entry.canonical];
      seenCanonical.add(entry.canonical);
    }
    index += entry.words.length;
  }

  return { tags, residue };
};

export const classifyGenreString = (genreString: string): ClassifiedGenre => {
  const durationResult = extractDuration(genreString);
  const structureResult = extractStructure(durationResult.prunedString);

  const representationMatch = REPRESENTATION_SUFFIX_REGEX.exec(structureResult.prunedString);
  const representationText = representationMatch?.[1] ?? "";
  const mainText = representationMatch
    ? structureResult.prunedString.slice(0, representationMatch.index)
    : structureResult.prunedString;

  const { tags, residue } = matchTagsFromWords(splitWords(mainText));
  if (representationText) {
    const { tags: representationTags, residue: representationResidue } = matchTagsFromWords(
      splitWords(representationText),
    );
    if (representationTags.representation) {
      tags.representation = [...(tags.representation ?? []), ...representationTags.representation];
    }
    residue.push(...representationResidue);
  }

  return {
    tags,
    ...(durationResult.duration ? { duration: durationResult.duration } : {}),
    ...(durationResult.durationRange ? { durationRange: durationResult.durationRange } : {}),
    ...(structureResult.actCount !== undefined ? { actCount: structureResult.actCount } : {}),
    ...(structureResult.collectionSize !== undefined ? { collectionSize: structureResult.collectionSize } : {}),
    residue: residue.join(" "),
  };
};
