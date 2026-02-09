import { ObjectId } from "mongodb";
import type { Document } from "mongodb";
import * as PlayTypes from "./play.types";
import * as dbUtils from "../../utils/dbUtils";

type PlayMetadata = Omit<PlayTypes.Metadata, "createdAt" | "updatedAt"> & {
  createdAt?: Date;
  updatedAt?: Date;
};

export default class Play {
  private _id: ObjectId;
  private playId: string;
  private author: string;
  private authorId?: ObjectId;
  private genres?: string;
  private adaptingAuthor?: string;
  private metadata: PlayMetadata;
  private rawFields: PlayTypes.RawFields;
  private publication: PlayTypes.Publication;
  private production: PlayTypes.Production;
  private synopsis?: string;
  private notes?: string;
  private organizations?: string;
  private music?: string;
  private reference?: string;
  private partsText?: {
    maleParts: number;
    femaleParts: number;
    otherParts: number;
  };

  public title: string;

  public get id(): ObjectId {
    return this._id;
  }

  public get doolleeId(): string {
    return this.playId;
  }

  public get isAdaptation(): boolean {
    return !!this.adaptingAuthor;
  }

  constructor(input: PlayTypes.Input) {
    const documentId = new ObjectId();

    this._id = documentId;
    this.playId = input.playId;
    this.title = input.title;
    this.author = input.originalAuthor || "";
    this.authorId = input.authorId;
    this.adaptingAuthor = input.adaptingAuthor;
    this.genres = input.genres;
    this.synopsis = input.synopsis;
    this.notes = input.notes;
    this.organizations = input.organizations;
    this.music = input.music;

    this.metadata = {
      createdAt: undefined,
      updatedAt: undefined,
      scrapedAt: input.scrapedAt,
      sourceUrl: input.sourceUrl,
      needsReview: undefined, // TODO: determine if needs review
    };

    this.rawFields = {
      altTitle: input.altTitle,
      publishingInfo: input.publishingInfo,
      productionInfo: input.productionInfo,
    };

    this.publication = {
      publisher: input.publisher,
      publicationYear: input.publicationYear,
      isbn: input.isbn,
    };

    this.production = {
      productionLocation: input.productionLocation,
      productionYear: input.productionYear,
    };

    this.partsText = input.parts;
  }

  toDocument(): PlayTypes.PlayDocument {
    const now = new Date();

    const document: Document = {
      _id: this._id,
      playId: this.playId,
      metadata: {
        ...this.metadata,
        createdAt: this.metadata.createdAt || now,
        updatedAt: now,
      },
      rawFields: this.rawFields,
      title: this.title,
      author: this.author,
      authorId: this.authorId,
      adaptingAuthor: this.adaptingAuthor,
      genres: this.genres,
      synopsis: this.synopsis,
      notes: this.notes,
      organizations: this.organizations,
      music: this.music,
      reference: this.reference,
      partsText: this.partsText,
      ...this.production,
      ...this.publication,
    };

    // prune undefined/empty fields and manually remove fields added by this class
    const prunedDocument = dbUtils.removeEmptyFields(document);
    if (!prunedDocument.metadata.needsReview) {
      delete prunedDocument.metadata.needsReview;
    }

    return prunedDocument;
  }
}
