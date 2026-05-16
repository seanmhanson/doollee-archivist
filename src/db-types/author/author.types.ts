import type { ReviewNotes } from "#/review-notes";
import type { ObjectId } from "mongodb";

/**
 * Type for the archived original content scraped from the page, before transformation,
 * only removing whitespace/html tags.
 * NB: this should be projected out by default for the purposes of search.
 */

export type AuthorArchive = {
  name: string;
  altName?: string;
  listingName?: string;
  dates?: string;
  biography?: string;
  nationality?: string;
  email?: string;
  website?: string;
  literaryAgent?: string;
  research?: string;
  address?: string;
  telephone?: string;
};

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
    reviewNotes?: ReviewNotes;
  };

  name: string;
  displayName: string;
  isOrganization?: boolean;
  lastName?: string;
  firstName?: string;
  middleNames?: string[];
  suffixes?: string[];

  yearBorn?: number;
  yearBornUncertain?: boolean;
  yearDied?: number;
  yearDiedUncertain?: boolean;
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

type RequiredKeys = "name";
type RequiredFields = Pick<AuthorDocument, RequiredKeys> & { _archive: AuthorArchive };

type RequiredMetadataKeys = "scrapedAt" | "sourceUrl";
type RequiredMetadata = Pick<Metadata, RequiredMetadataKeys>;

type OptionalKeys =
  | "yearBorn"
  | "yearBornUncertain"
  | "yearDied"
  | "yearDiedUncertain"
  | "nationality"
  | "email"
  | "website"
  | "literaryAgent"
  | "biography"
  | "research"
  | "address"
  | "telephone";
type OptionalFields = Partial<Pick<AuthorDocument, OptionalKeys>>;

export type ScrapedAuthorData = RequiredFields & OptionalFields & { listingName?: string };
export type AuthorData = RequiredFields & RequiredMetadata & OptionalFields & { listingName?: string };
