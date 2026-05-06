export type ReviewNote = {
  reason: string;
  functionName?: string;
  className?: string;
};

export type ReviewNotes = ReviewNote[];

export const REVIEW_NOTES = {
  MULTIPLE_PRODUCTION_DATES: {
    reason: "Multiple date matches found in production details",
    className: "BaseWorksList",
    functionName: "parseProductionDetails",
  },
  MULTIPLE_PUBLICATION_DATES: {
    reason: "Multiple date matches found in publication details",
    className: "BaseWorksList",
    functionName: "parsePublicationDetails",
  },
  INVALID_ISBN: {
    reason: "Extracted ISBN failed validation",
    className: "BaseWorksList",
    functionName: "parsePublicationDetails",
  },
  POSSIBLE_ISBN: {
    reason: "Possible ISBN found but could not be classified",
    className: "BaseWorksList",
    functionName: "parsePublicationDetails",
  },
  NAME_INCONSISTENCY: {
    reason: "Author's listing and heading names are inconsistent",
    className: "Author",
    functionName: "parseAuthorName",
  },
  SINGLE_WORD_AUTHOR_NAME: {
    reason: "The author name is a single word, and may also represent an organization",
    className: "Author",
    functionName: "parseOrganization",
  },
} as const satisfies Record<string, ReviewNote>;
