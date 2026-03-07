import { ObjectId } from "mongodb";

<<<<<<< HEAD
import type { InitialMetadata, RawFields, PlayDocument, PlayData } from "#/db-types/play/play.types";

import * as dbUtils from "#/utils/dbUtils";
=======
import type { InitialMetadata, RawFields, PlayDocument, PlayData, PlayArchive } from "#/db-types/play/play.types";

import { DATE_PATTERNS } from "#/patterns";
import * as dbUtils from "#/utils/dbUtils";
import { extractIsbn } from "#/utils/isbnUtils";
import * as stringUtils from "#/utils/stringUtils";

const publisherException = "I don't think it has been published.";
>>>>>>> eslint

export default class Play {
  private _id: ObjectId;
  private _archive: PlayArchive;
  private metadata: InitialMetadata;
  private rawFields: RawFields;
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

  private needsReview = false;
  private needsReviewReason?: string;
  private needsReviewData?: Record<string, Record<string, string>> = {};

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

  public get authorData() {
    return {
      author: this.author,
      authorId: this.authorId,
      adaptingAuthor: this.adaptingAuthor,
    };
  }

  public get mainData() {
    return {
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
    this._archive = input._archive;
    this.playId = input.playId;
    this.metadata = {
      createdAt: undefined,
      updatedAt: undefined,
      scrapedAt: input.scrapedAt,
      sourceUrl: input.sourceUrl,
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
  }

  private parseProductionDetails(productionText: string) {
    const isBlank = !stringUtils.hasAlphanumericCharacters(productionText);
    if (isBlank) {
      this.productionLocation = "";
      this.productionYear = "";
      return;
    }

    try {
      const [extractedDate, updatedString] = stringUtils.searchForAndRemove(productionText, [
        DATE_PATTERNS.DAY_MONTH_YEAR,
        DATE_PATTERNS.MONTH_YEAR,
        DATE_PATTERNS.YEAR,
      ]);
      this.productionLocation = stringUtils.removeAndNormalize(updatedString, ">>>");
      this.productionYear = stringUtils.normalizeWhitespace(extractedDate);
    } catch (error) {
      console.error("Error parsing production details, multiple matches found:", error);
    }
  }

  private parsePublicationDetails(publicationText: string) {
    let workingString = publicationText;

    const isBlank = !stringUtils.hasAlphanumericCharacters(publicationText);
    const isMissing = publicationText.includes(publisherException);

    if (isBlank || isMissing) {
      this.publisher = "";
      this.publicationYear = "";
      return;
    }

    if (!this.isbn) {
      workingString = this.extractIsbn(workingString);
    }

    const [extractedDate, updatedString] = stringUtils.searchForAndRemove(workingString, [
      DATE_PATTERNS.MONTH_YEAR,
      DATE_PATTERNS.YEAR,
    ]);

    this.publisher = stringUtils.removeAndNormalize(updatedString, ">>>");
    this.publicationYear = stringUtils.normalizeWhitespace(extractedDate);
  }

  private extractIsbn(publicationText: string): string {
    const extractedIsbn = extractIsbn(publicationText);
    if (extractedIsbn) {
      const { type, normalized, raw } = extractedIsbn;

      if (type === "ISBN10" || type === "ISBN13") {
        this.isbn = normalized;
        return publicationText.replace(raw, "");
      }

      // flag needs review and provide data for manual review
      console.warn(`Extracted ISBN is invalid (${type}): "${raw}" from publication text: "${publicationText}"`);
      this.needsReview = true;
      this.needsReviewReason = "Invalid ISBN extracted from publication details";
      this.needsReviewData = {
        publicationDetails: {
          extractedIsbn: raw,
          extractedIsbnType: type,
        },
      };
      return publicationText.replace(raw, "");
    }
    return publicationText;
  }

  private processPartsString(partsString: string) {
    if (!/\d/.exec(partsString)) {
      return null;
    }

    const normalizedText = partsString
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const pattern = /Male:\s*(.+?)\s+Female:\s*(.+?)\s+Other:\s*(.+)$/;
    const match = pattern.exec(normalizedText);

    if (!match) {
      throw new Error(`Parts text does not match expected format: ${partsString}`);
    }

    return [match[1], match[2], match[3]];
  }

  private extractParts(partsMale: string, partsFemale: string, partsOther: string): void {
    function isEmpty(text: string) {
      return !text || text === "-" || text === "0";
    }

    function parseCount(text: string): number {
      if (text === "-" || text === "") return 0;
      const num = parseInt(text, 10);
      return isNaN(num) ? 0 : num;
    }

    const partsTextMale = partsMale?.trim() ?? "";
    const partsTextFemale = partsFemale?.trim() ?? "";
    const partsTextOther = partsOther?.trim() ?? "";

    if ([partsTextMale, partsTextFemale, partsTextOther].every(isEmpty)) {
      return;
    }

    this.partsTextMale = partsTextMale;
    this.partsTextFemale = partsTextFemale;
    this.partsTextOther = partsTextOther;
    this.partsCountMale = parseCount(partsTextMale);
    this.partsCountFemale = parseCount(partsTextFemale);
    this.partsCountOther = parseCount(partsTextOther);
    this.partsCountTotal = this.partsCountMale + this.partsCountFemale + this.partsCountOther;
  }

  toDocument(): PlayDocument {
    const now = new Date();

    const document: PlayDocument = {
      _id: this._id,
      _archive: this._archive,
      metadata: {
        ...this.metadata,
        createdAt: this.metadata.createdAt ?? now,
        updatedAt: now,
        needsReview: this.needsReview,
        needsReviewReason: this.needsReviewReason,
        needsReviewData: this.needsReviewData,
      },
      rawFields: this.rawFields,
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

    if (!prunedDocument.metadata.needsReview) {
      delete prunedDocument.metadata.needsReview;
      delete prunedDocument.metadata.needsReviewReason;
      delete prunedDocument.metadata.needsReviewData;
    }

    return prunedDocument;
  }
}
