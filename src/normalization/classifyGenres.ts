import { classifyGenreString } from "./classifyGenreString";

import type { GenreTags } from "./classifyGenreString";
import type { Duration, DurationRange } from "./extractDuration";
import type { TagCategory } from "./tagMap";

export type GenreClassification = {
  tags: GenreTags;
  duration?: Duration;
  durationRange?: DurationRange;
  actCount?: number;
  collectionSize?: number;
  // non-empty leftover text, one entry per genre string that had unmatched words - diagnostic only
  residue?: string[];
};

// aggregates classifyGenreString across every comma-separated genre entry for a play,
// merging/deduping tags per category and keeping the first duration/structure signal found
export const classifyGenres = (genres: string[] | undefined): GenreClassification => {
  const tags: GenreTags = {};
  let duration: Duration | undefined;
  let durationRange: DurationRange | undefined;
  let actCount: number | undefined;
  let collectionSize: number | undefined;
  const residue: string[] = [];

  for (const genre of genres ?? []) {
    const result = classifyGenreString(genre);

    for (const category of Object.keys(result.tags) as TagCategory[]) {
      const values = result.tags[category];
      if (!values?.length) continue;
      tags[category] = [...new Set([...(tags[category] ?? []), ...values])];
    }

    if (duration === undefined && durationRange === undefined) {
      duration = result.duration;
      durationRange = result.durationRange;
    }
    actCount ??= result.actCount;
    collectionSize ??= result.collectionSize;
    if (result.residue.trim().length > 0) {
      residue.push(result.residue);
    }
  }

  return {
    tags,
    ...(duration ? { duration } : {}),
    ...(durationRange ? { durationRange } : {}),
    ...(actCount !== undefined ? { actCount } : {}),
    ...(collectionSize !== undefined ? { collectionSize } : {}),
    ...(residue.length > 0 ? { residue } : {}),
  };
};
