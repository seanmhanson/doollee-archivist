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

export type Publication = {
  publisher?: string;
  publicationYear?: string;
  isbn?: string;
};

export type Production = {
  productionLocation?: string;
  productionYear?: string;
};

export type Details = {
  synopsis?: string;
  notes?: string;
  organizations?: string;
  music?: string;
  partsText?: {
    maleParts: number;
    femaleParts: number;
    otherParts: number;
  };
  reference?: string;
  production?: Production;
};

export type Parts = {
  maleParts: number;
  femaleParts: number;
  otherParts: number;
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
  publisher?: string;
  publicationYear?: string;
  isbn?: string;
  genres?: string;

  details: {
    synopsis?: string;
    notes?: string;
    production: {
      productionLocation?: string;
      productionYear?: string;
    };
    organizations?: string;
    music?: string;
    partsText?: {
      maleParts: number;
      femaleParts: number;
      otherParts: number;
    };
    reference?: string;
  };
};


/**
 * Input data retreived from scraping a play page, before being transformed into
 * the Play document structure
 */

type RootKeys = "playId" | "title" | "adaptingAuthor" | "genres" | "authorId";
type DetailsKeys = "synopsis" | "notes" | "organizations" | "reference" | "music";
type MetadataKeys = "scrapedAt" | "sourceUrl";
type ExportRootFields = Pick<PlayDocument, RootKeys>;
type ExportMetadata = Pick<Metadata, MetadataKeys>;
type ExportDetails = Pick<Details, DetailsKeys>;

export type Input = ExportRootFields &
  ExportMetadata &
  RawFields &
  Publication &
  ExportDetails & {
    id?: PlayDocument["_id"];
    originalAuthor?: PlayDocument["author"];
    parts?: Parts;
    production?: {
      location: Production["productionLocation"];
      year: Production["productionYear"];
    };
  };
