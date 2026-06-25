import type { ReviewNotes } from "#/review-notes";
import type { ObjectId } from "mongodb";

/**
 * Type for the archived original content scraped from the page, before transformation.
 * NB: this should be projected out by default for the purposes of search.
 */

type PlayArchiveData = {
  playId: string;
  title: string;
  altTitle?: string;
  synopsis?: string;
  notes?: string;
  production?: string;
  organizations?: string;
  publisher?: string;
  music?: string;
  genres?: string;
  parts?: string;
  reference?: string;
};

type AdaptationArchiveData = {
  playId: string;
  title: string;
  adaptingAuthor?: string;
  productionLocation?: string;
  productionYear?: string;
  organizations?: string;
  publisher?: string;
  isbn?: string;
  music?: string;
  genres?: string;
  notes?: string;
  imgAlt?: string;
  synopsis?: string;
  reference?: string;
  maleParts?: string;
  femaleParts?: string;
  otherParts?: string;
};

export type PlayArchive = ({ _type: "play" } & PlayArchiveData) | ({ _type: "adaptation" } & AdaptationArchiveData);

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
    reviewNotes?: ReviewNotes;
  };

  title: string;
  displayTitle?: string;
  author: string;
  displayAuthor: string;
  authorId?: ObjectId;
  adaptingAuthor?: string;
  isAdaptation: boolean;
  genres?: string[];
  synopsis?: string;
  notes?: string;
  organizations?: string;
  music?: string;
  reference?: string;
  publisher?: string;
  publicationYear?: string;
  containingWork?: string;
  isbn?: string;
  productionLocation?: string;
  productionYear?: string;
  productionYearInt?: number;
  publicationYearInt?: number;
  partsCountMale?: number;
  partsCountFemale?: number;
  partsCountOther?: number;
  partsCountTotal?: number;
};

/**
 * Helper types for working with play data prior to writing to the database
 * or for specific subsets of the PlayDocument fields.
 */

export type Metadata = PlayDocument["metadata"];

type OptionalInitialMetadataKeys = "createdAt" | "updatedAt";
export type InitialMetadata = Omit<Metadata, OptionalInitialMetadataKeys> &
  Partial<Pick<Metadata, OptionalInitialMetadataKeys>>;

/**
 * Input data retrieved from scraping a play page, before being transformed into
 * the Play document structure
 */

type RequiredKeys = "playId" | "title";
type RequiredFields = Pick<PlayDocument, RequiredKeys> & { _archive: PlayArchive };

type RequiredMetadataKeys = "scrapedAt" | "sourceUrl";
type RequiredMetadata = Pick<Metadata, RequiredMetadataKeys>;

type OmittedKeys =
  | "_id"
  | "author"
  | "displayAuthor"
  | "metadata"
  | "isAdaptation"
  | "productionYearInt"
  | "publicationYearInt";
type OptionalCoreFields = Partial<Omit<PlayDocument, OmittedKeys | RequiredKeys>>;

type RenamedFields = {
  id?: PlayDocument["_id"];
  originalAuthor?: PlayDocument["author"];
  reviewNotes?: ReviewNotes;
};

export type ScrapedPlayData = RequiredFields & OptionalCoreFields & RenamedFields;
export type PlayData = RequiredFields & RequiredMetadata & OptionalCoreFields & RenamedFields;
