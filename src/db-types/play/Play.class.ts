import { ObjectId } from "mongodb";

import type { PlayArchiveDocument } from "#/db-types/play/play-archive.types";
import type { InitialMetadata, PlayDocument, PlayData, PlayArchive } from "#/db-types/play/play.types";
import type { ReviewNote } from "#/review-notes";

import * as dbUtils from "#/utils/dbUtils";

export default class Play {
  private _id: ObjectId;
  private _archive: Readonly<PlayArchive>;
  private metadata: InitialMetadata;
  private playId: string;

  private author: string;
  private authorId?: ObjectId;
  private adaptingAuthor?: string;

  private genres?: string;
  private synopsis?: string;
  private notes?: string;
  private organizations?: string;
  private music?: string;
  private reference?: string;

  private publisher?: string;
  private publicationYear?: string;
  private containingWork?: string;
  private isbn?: string;

  private productionLocation?: string;
  private productionYear?: string;

  private partsTextMale?: string;
  private partsTextFemale?: string;
  private partsTextOther?: string;
  private partsCountMale?: number;
  private partsCountFemale?: number;
  private partsCountOther?: number;
  private partsCountTotal?: number;

  private reviewNotes: ReviewNote[] = [];

  public title: string;
  private displayTitle?: string;

  public get id(): ObjectId {
    return this._id;
  }

  public get hasReviewNotes(): boolean {
    return this.reviewNotes.length > 0;
  }

  public getReviewNotes(): readonly ReviewNote[] {
    return [...this.reviewNotes];
  }

  public addReviewNote(note: ReviewNote): void {
    this.reviewNotes.push(note);
  }

  public get archiveData() {
    return this._archive;
  }

  public get doolleeId(): string {
    return this.playId;
  }

  public get isAdaptation(): boolean {
    return !!this.adaptingAuthor;
  }

  public get authorData() {
    return {
      author: this.author,
      authorId: this.authorId,
      adaptingAuthor: this.adaptingAuthor,
    };
  }

  public get mainData() {
    return {
      displayTitle: this.displayTitle,
      genres: this.genres,
      synopsis: this.synopsis,
      notes: this.notes,
      organizations: this.organizations,
      music: this.music,
      reference: this.reference,
    };
  }

  public get publicationData() {
    return {
      publisher: this.publisher,
      publicationYear: this.publicationYear,
      containingWork: this.containingWork,
      isbn: this.isbn,
    };
  }

  public get productionData() {
    return {
      productionLocation: this.productionLocation,
      productionYear: this.productionYear,
    };
  }

  public get partsData() {
    return {
      partsTextMale: this.partsTextMale,
      partsTextFemale: this.partsTextFemale,
      partsTextOther: this.partsTextOther,
      partsCountMale: this.partsCountMale,
      partsCountFemale: this.partsCountFemale,
      partsCountOther: this.partsCountOther,
      partsCountTotal: this.partsCountTotal,
    };
  }

  constructor(input: PlayData) {
    this._id = new ObjectId();
    this._archive = Object.freeze({ ...input._archive });
    this.playId = input.playId;
    this.metadata = {
      createdAt: undefined,
      updatedAt: undefined,
      scrapedAt: input.scrapedAt,
      sourceUrl: input.sourceUrl,
    };

    this.title = input.title;
    this.displayTitle = input.displayTitle;
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
    this.containingWork = input.containingWork;
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

    if (input.reviewNotes?.length) {
      this.reviewNotes = [...input.reviewNotes];
    }
  }

  toDocument(): PlayDocument {
    const now = new Date();

    const document: PlayDocument = {
      _id: this._id,
      metadata: {
        ...this.metadata,
        createdAt: this.metadata.createdAt ?? now,
        updatedAt: now,
        reviewNotes: this.reviewNotes,
      },
      playId: this.playId,
      title: this.title,
      ...this.authorData,
      ...this.mainData,
      ...this.publicationData,
      ...this.productionData,
      ...this.partsData,
    };

    // prune undefined/empty fields and manually remove fields added by this class
    const prunedDocument = dbUtils.removeEmptyFields(document);
    if (!prunedDocument) {
      throw new Error("Failed to create play document: all fields are empty or undefined");
    }

    return prunedDocument;
  }

  toArchiveDocument(id?: ObjectId): PlayArchiveDocument {
    const archiveDocument: PlayArchiveDocument = {
      _id: id ?? this._id,
      ...this._archive,
    };

    const pruned = dbUtils.removeEmptyFields(archiveDocument);
    const requiredFields: (keyof PlayArchiveDocument)[] = ["_type", "playId", "title"] as const;
    const invalidDocument = !pruned;
    const missingRequiredFields = requiredFields.some((field) => !pruned?.[field]);

    if (invalidDocument || missingRequiredFields) {
      throw new Error(`Failed to create play archive document: missing required fields (_type, playId, and/or title)`);
    }

    return pruned;
  }
}
