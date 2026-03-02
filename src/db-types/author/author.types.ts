import type { ObjectId } from "mongodb";

/**
 * Type for the archived original content scraped from the page, before transformation,
 * only removing whitespace/html tags.
 * NB: this should be projected out by default for the purposes of search.
 */

export type AuthorArchive = {
  name: string;
  altName?: string;
  dates?: string;
  biography?: string;
  nationality?: string;
  email?: string;
  website?: string;
  literaryAgent?: string;
  research?: string;
  address?: string;
  telephone?: string;
}


/**
 * Document structure for an Author in the database.
 */

export type AuthorDocument = {
  _id: ObjectId;
  _archive: AuthorArchive;

  metadata: {
    createdAt: Date;
    updatedAt: Date;
    scrapedAt: Date;
    sourceUrl: string;
    needsReview?: boolean;
    needsReviewReason?: string;
    needsReviewData?: Record<string, Record<string, string>>;
  };

  rawFields: {
    listingName?: string;
    headingName?: string;
    altName?: string;
  };

  name: string;
  displayName: string;
  isOrganization?: boolean;
  lastName?: string;
  firstName?: string;
  middleNames?: string[];
  suffixes?: string[];

  yearBorn?: string;
  yearDied?: string;
  nationality?: string;
  email?: string;
  website?: string;
  literaryAgent?: string;
  biography?: string;
  research?: string;
  address?: string;
  telephone?: string;

  playIds: ObjectId[];
  adaptationIds: ObjectId[];
  doolleePlayIds: string[];
};

/**
 * Helper types for working with author data prior to writing to the database
 * or for specific subsets of the AuthorDocument fields.
 */

export type Metadata = AuthorDocument["metadata"];

export type RawFields = AuthorDocument["rawFields"];

type OptionalInitialMetadataKeys = "createdAt" | "updatedAt";
export type InitialMetadata = Omit<Metadata, OptionalInitialMetadataKeys> &
  Partial<Pick<Metadata, OptionalInitialMetadataKeys>>;

type OptionalNameKeys = "isOrganization" | "firstName" | "lastName" | "middleNames" | "suffixes";
type RequiredNameKeys = "name" | "displayName";
export type AuthorNameData = Pick<AuthorDocument, RequiredNameKeys> & Partial<Pick<AuthorDocument, OptionalNameKeys>>;

/**
 * Input data from scraping an author page, before being transformed into
 * the Author document structure.
 */

type LabeledKeys = "nationality" | "email" | "website" | "literaryAgent" | "research" | "address" | "telephone";
export type LabeledContents = Partial<Pick<AuthorDocument, LabeledKeys>>;

type RequiredKeys = "name" | "_archive";
type RequiredFields = Pick<AuthorDocument, RequiredKeys>;

type RequiredMetadataKeys = "scrapedAt" | "sourceUrl";
type RequiredMetadata = Pick<Metadata, RequiredMetadataKeys>;

type OptionalKeys =
  | "yearBorn"
  | "yearDied"
  | "nationality"
  | "email"
  | "website"
  | "literaryAgent"
  | "biography"
  | "research"
  | "address"
  | "telephone";
type OptionalFields = Partial<Pick<AuthorDocument, OptionalKeys>>;
type OptionalRawFields = Partial<RawFields>;

export type ScrapedAuthorData = RequiredFields & OptionalFields & OptionalRawFields;
export type AuthorData = RequiredFields & RequiredMetadata & OptionalFields & OptionalRawFields;
