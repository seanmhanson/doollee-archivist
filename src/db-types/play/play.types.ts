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
  publication: {
    publisher?: string;
    publicationYear?: string;
    isbn?: string;
  };
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
      counts: {
        maleParts: number;
        femaleParts: number;
        otherParts: number;
      };
      text: {
        maleParts: string;
        femaleParts: string;
        otherParts: string;
      };
    };
    reference?: string;
  };
};

export type Metadata = PlayDocument["metadata"];
export type RawFields = PlayDocument["rawFields"];
export type Details = PlayDocument["details"];
export type Publication = PlayDocument["publication"];
export type Production = PlayDocument["details"]["production"];
export type Parts = PlayDocument["details"]["partsText"];

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
  ExportDetails & {
    id?: PlayDocument["_id"];
    originalAuthor?: PlayDocument["author"];
    isbn?: Publication["isbn"];
    parts?: Parts;
    production?: {
      location: Production["productionLocation"];
      year: Production["productionYear"];
    };
    publication?: {
      publisher: Publication["publisher"];
      year: Publication["publicationYear"];
    };
  };
