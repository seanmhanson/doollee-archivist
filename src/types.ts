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

export type AuthorData = Partial<{
  image: string;
  name: string;
  altName: string;
  born: string;
  died: string;
  nationality: string;
  email: string;
  website: string;
  literaryAgent: string;
  biography: string;
  research: string;
  address: string;
  telephone: string;
}>;
