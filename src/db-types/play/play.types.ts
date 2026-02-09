import type { ObjectId } from "mongodb";

/**
 * Document structure for a Play in the database.
 */

export type Metadata = {
  createdAt: Date;
  updatedAt: Date;
  scrapedAt: Date;
  sourceUrl: string;
  needsReview?: boolean;
};

export type RawFields = {
  altTitle?: string;
  publishingInfo?: string;
  productionInfo?: string;
};

export type PlayDocument = {
  _id: ObjectId;
  playId: string; // the id used by doollee, not our internal id

  metadata: Metadata;
  rawFields: RawFields;

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

/** Selected types from PlayDocument to use when typing the values maintained by the Play class */

export type InitialMetadata = Omit<Metadata, "createdAt" | "updatedAt"> & {
  createdAt?: Date;
  updatedAt?: Date;
};


/**
 * Input data retreived from scraping a play page, before being transformed into
 * the Play document structure
 */

type RequiredKeys = "playId" | "title";
type RequiredFields = Pick<PlayDocument, RequiredKeys>;

type RequiredMetadataKeys = "scrapedAt" | "sourceUrl";
type RequiredMetadata = Pick<Metadata, RequiredMetadataKeys>;

type OmittedKeys = "_id" | "author" | "metadata" | "rawFields";
type OptionalCoreFields = Partial<Omit<PlayDocument, OmittedKeys | RequiredKeys>>;
type OptionalRawFields = Partial<RawFields>;

type RenamedFields = {
  id?: PlayDocument["_id"];
  originalAuthor?: PlayDocument["author"];
};

export type Input = RequiredFields & RequiredMetadata & OptionalCoreFields & OptionalRawFields & RenamedFields;
