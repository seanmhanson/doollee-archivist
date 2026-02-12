export type WaitUntilConditions =
  | "load"
  | "domcontentloaded"
  | "networkidle"
  | "commit";

/**
 * Metadata gathered during page extraction to facilitate error handling
 * and debugging across multiple calls to the same script.
 */
export type PageMetadata = Partial<{
  statusCode: number;
  error: string;
  timestamp: string;
  results: number;
  url: string;
}>;

export type IndexUrlsData = {
  [letter: string]: {
    url: string;
    metadata: PageMetadata;
    links: {
      [range: string]: string;
    };
  };
};
