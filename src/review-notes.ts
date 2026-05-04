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
  NAME_INCONSISTENCY: {
    reason: "Author's listing and heading names are inconsistent",
    className: "Author",
    functionName: "parseAuthorName",
  },
  SINGLE_WORD_ORG_NAME: {
    reason: "Single word organization name",
    className: "Author",
    functionName: "parseOrganization",
  },
} as const satisfies Record<string, ReviewNote>;
