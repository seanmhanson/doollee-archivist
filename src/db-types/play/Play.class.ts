import { ObjectId } from "mongodb";

import type { InitialMetadata, RawFields, PlayDocument, PlayData } from "#/db-types/play/play.types";

import * as dbUtils from "#/utils/dbUtils";

export default class Play {
  private _id: ObjectId;
  private playId: string;
  private metadata: InitialMetadata;
  private rawFields: RawFields;
  private author: string;
  private authorId?: ObjectId;
  private genres?: string;
  private adaptingAuthor?: string;
  private publisher?: string;
  private publicationYear?: string;
  private isbn?: string;
  private productionLocation?: string;
  private productionYear?: string;
  private synopsis?: string;
  private notes?: string;
  private organizations?: string;
  private music?: string;
  private reference?: string;
  private partsTextMale?: string;
  private partsTextFemale?: string;
  private partsTextOther?: string;
  private partsCountMale?: number;
  private partsCountFemale?: number;
  private partsCountOther?: number;
  private partsCountTotal?: number;

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

  constructor(input: PlayData) {
    this._id = new ObjectId();
    this.playId = input.playId;

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

    this.title = input.title;
    this.author = input.originalAuthor ?? "";
    this.authorId = input.authorId;
    this.adaptingAuthor = input.adaptingAuthor;
    this.genres = input.genres;
    this.synopsis = input.synopsis;
    this.notes = input.notes;
    this.organizations = input.organizations;
    this.music = input.music;
    this.reference = input.reference;
    this.publisher = input.publisher;
    this.publicationYear = input.publicationYear;
    this.isbn = input.isbn;
    this.productionLocation = input.productionLocation;
    this.productionYear = input.productionYear;

    this.partsTextMale = input.partsTextMale;
    this.partsTextFemale = input.partsTextFemale;
    this.partsTextOther = input.partsTextOther;
    this.partsCountMale = input.partsCountMale;
    this.partsCountFemale = input.partsCountFemale;
    this.partsCountOther = input.partsCountOther;
    this.partsCountTotal = input.partsCountTotal;
  }

  toDocument(): PlayDocument {
    const now = new Date();

    const document: PlayDocument = {
      _id: this._id,
      playId: this.playId,
      metadata: {
        ...this.metadata,
        createdAt: this.metadata.createdAt ?? now,
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
      publisher: this.publisher,
      publicationYear: this.publicationYear,
      isbn: this.isbn,
      productionLocation: this.productionLocation,
      productionYear: this.productionYear,
      partsCountMale: this.partsCountMale,
      partsCountFemale: this.partsCountFemale,
      partsCountOther: this.partsCountOther,
      partsCountTotal: this.partsCountTotal,
      partsTextMale: this.partsTextMale,
      partsTextFemale: this.partsTextFemale,
      partsTextOther: this.partsTextOther,
    };

    // prune undefined/empty fields and manually remove fields added by this class
    const prunedDocument = dbUtils.removeEmptyFields(document);
    if (!prunedDocument) {
      throw new Error("Failed to create play document: all fields are empty or undefined");
    }

    if (!prunedDocument.metadata.needsReview) {
      delete prunedDocument.metadata.needsReview;
    }

    return prunedDocument;
  }
}
