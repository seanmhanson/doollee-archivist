import type { ObjectId } from "mongodb";

/**
 * Document structure for a Play in the database.
 */

export type PlayDocument = {
  _id: ObjectId;
  playId: string; // the id used by doollee, not our internal id

  metadata: {
    createdAt: Date;
    updatedAt: Date;
    scrapedAt: Date;
    sourceUrl: string;
    needsReview?: boolean;
  };

  rawFields: {
    altTitle?: string;
    publishingInfo?: string;
    productionInfo?: string;
  };

  title: string;
  author: string;
  authorId?: ObjectId;
  adaptingAuthor?: string;
  genres?: string;
  synopsis?: string;
  notes?: string;
  organizations?: string;
  music?: string;
  reference?: string;
  publisher?: string;
  publicationYear?: string;
  isbn?: string;
  productionLocation?: string;
  productionYear?: string;
  partsCountMale?: number;
  partsCountFemale?: number;
  partsCountOther?: number;
  partsCountTotal?: number;
  partsTextMale?: string;
  partsTextFemale?: string;
  partsTextOther?: string;
};

/**
 * Helper types for working with play data prior to writing to the database
 * or for specific subsets of the PlayDocument fields.
 */

export type Metadata = PlayDocument["metadata"];
export type RawFields = PlayDocument["rawFields"];

type OptionalInitialMetadataKeys = "createdAt" | "updatedAt";
export type InitialMetadata = Omit<Metadata, OptionalInitialMetadataKeys> &
  Partial<Pick<Metadata, OptionalInitialMetadataKeys>>;

/**
 * Input data retreived from scraping a play page, before being transformed into
 * the Play document structure
 */

type RequiredKeys = "playId" | "title";
type RequiredFields = Pick<PlayDocument, RequiredKeys>;

type RequiredMetadataKeys = "scrapedAt" | "sourceUrl";
type RequiredMetadata = Pick<Metadata, RequiredMetadataKeys>;

type OmittedKeys = "_id" | "author" | "metadata" | "rawFields";
type OptionalCoreFields = Partial<
  Omit<PlayDocument, OmittedKeys | RequiredKeys>
>;
type OptionalRawFields = Partial<RawFields>;

type RenamedFields = {
  id?: PlayDocument["_id"];
  originalAuthor?: PlayDocument["author"];
};

export type ScrapedPlayData = RequiredFields &
  OptionalCoreFields &
  OptionalRawFields &
  RenamedFields;
export type PlayData = RequiredFields &
  RequiredMetadata &
  OptionalCoreFields &
  OptionalRawFields &
  RenamedFields;
