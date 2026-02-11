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
    listingName: string;
    headingName: string;
    altName: string;
  };

  name: string;
  displayName: string;
  isOrganization: boolean;
  lastName?: string;
  firstName?: string;
  middleNames?: string[];
  suffixes?: string[];
  biography: {
    // flatten
    born?: string; // yearBorn
    died?: string; // yearDied
    nationality?: string;
    email?: string;
    website?: string;
    literaryAgent?: string;
    biography?: string;
    research?: string;
    address?: string;
    telephone?: string;
  };
  playIds: ObjectId[];
  adaptationIds: ObjectId[];
  doolleePlayIds: string[];
};

export type Metadata = AuthorDocument["metadata"];
export type RawFields = AuthorDocument["rawFields"];
export type Biography = AuthorDocument["biography"];

/**
 * Input data from scraping an author page, before being transformed into
 * the Author document structure.
 */

export type Input = RawFields &
  Biography &
  Pick<Metadata, "scrapedAt" | "sourceUrl"> & { name: AuthorDocument["name"] };
