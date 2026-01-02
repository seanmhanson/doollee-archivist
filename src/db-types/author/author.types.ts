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
  };
  rawFields: {
    listingName: string;
    headingName: string;
    altName: string;
  };
  name: string;
  nameData: {
    displayName: string;
    isOrganization: boolean;
    lastName?: string;
    firstName?: string;
    middleName?: string[];
    suffix?: string[];
  };
  biography: {
    born?: string;
    died?: string;
    nationality?: string;
    email?: string;
    website?: string;
    literaryAgent?: string;
    biography?: string;
    research?: string;
    address?: string;
    telephone?: string;
  };
  works: {
    plays: ObjectId[];
    adaptations: ObjectId[];
    doolleeIds: string[];
  };
};

export type Metadata = AuthorDocument["metadata"];
export type RawFields = AuthorDocument["rawFields"];
export type NameData = AuthorDocument["nameData"];
export type Biography = AuthorDocument["biography"];
export type Works = AuthorDocument["works"];

/**
 * Input data from scraping an author page, before being transformed into
 * the Author document structure.
 */

export type Input = RawFields &
  Biography &
  Pick<Metadata, "scrapedAt" | "sourceUrl"> & { name: AuthorDocument["name"] };
