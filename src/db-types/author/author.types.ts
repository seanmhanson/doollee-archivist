import type { ObjectId } from "mongodb";

/**
 * Document structure for an Author in the database.
 */

export type AuthorDocument = {
  _id: ObjectId;

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

type OptionalNameKeys =
  | "isOrganization"
  | "firstName"
  | "lastName"
  | "middleNames"
  | "suffixes";
type RequiredNameKeys = "name" | "displayName";
export type AuthorNameData = Pick<AuthorDocument, RequiredNameKeys> &
  Partial<Pick<AuthorDocument, OptionalNameKeys>>;

/**
 * Input data from scraping an author page, before being transformed into
 * the Author document structure.
 */

type RequiredKeys = "name";
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

export type ScrapedAuthorData = RequiredFields &
  OptionalFields &
  OptionalRawFields;
export type AuthorData = RequiredFields &
  RequiredMetadata &
  OptionalFields &
  OptionalRawFields;
