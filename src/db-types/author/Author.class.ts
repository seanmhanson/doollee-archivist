import { ObjectId } from "mongodb";

import type { AuthorArchiveDocument } from "#/db-types/author/author-archive.types";
import type {
  AuthorDocument,
  InitialMetadata,
  AuthorNameData,
  AuthorData,
  AuthorArchive,
} from "#/db-types/author/author.types";
import type { ReviewNote } from "#/review-notes";
import type { ObjectId as ObjectIdType } from "mongodb";

import { REVIEW_NOTES } from "#/review-notes";
import * as dbUtils from "#/utils/dbUtils";
import { toTitleCase, removeDisambiguationSuffix, isAllCaps, stringArraysEqual } from "#/utils/stringUtils";

type NameInputFields = { listingName?: string; headingName?: string; altName?: string };

/**
 * Usage:
 *
 * (1) Instantiate with:
 *  - the data scraped from an author page
 *  - the metadata used in that scraping
 *  - the key/value from the input url listings
 *  - the raw name values from the page
 *  - the provided doollee ids for plays/adaptations on the author's page
 *
 * (2) Update with:
 *  - ObjectIds of plays and adaptations after they are created (if the author is created after, this can be passed in)
 *  - The info of a new adaptation or play from a different list, if applicable, to verify duplicates;
 *    (Note: it may be better to write a script to process adaptations separately instead)
 *
 * (3) Use for formatting output:
 *  - toJSON() for preparing to write to a file as JSON or typescript
 *  - toDocument() for preparing to write to MongoDB as a document
 */

export default class Author {
  private _id: ObjectIdType;
  private _archive: Readonly<AuthorArchive>;
  private metadata: InitialMetadata;

  private name: string;
  private displayName: string;
  private isOrganization?: boolean;
  private lastName?: string;
  private firstName?: string;
  private middleNames?: string[];
  private suffixes?: string[];

  private yearBorn?: number;
  private yearBornUncertain?: boolean;
  private yearDied?: number;
  private yearDiedUncertain?: boolean;
  private nationality?: string;
  private email?: string;
  private website?: string;
  private literaryAgent?: string;
  private biography?: string;
  private research?: string;
  private address?: string;
  private telephone?: string;

  private playIds: ObjectIdType[];
  private adaptationIds: ObjectIdType[];
  private doolleePlayIds: string[];

  private reviewNotes: ReviewNote[] = [];

  public get authorName(): string {
    return this.name;
  }

  public get hasReviewNotes(): boolean {
    return this.reviewNotes.length > 0;
  }

  public get id(): ObjectIdType {
    return this._id;
  }

  public get nameData() {
    return {
      displayName: this.displayName,
      isOrganization: this.isOrganization,
      lastName: this.lastName,
      firstName: this.firstName,
      middleNames: this.middleNames,
      suffixes: this.suffixes,
    };
  }

  public get biographyData() {
    return {
      yearBorn: this.yearBorn,
      yearBornUncertain: this.yearBornUncertain,
      yearDied: this.yearDied,
      yearDiedUncertain: this.yearDiedUncertain,
      nationality: this.nationality,
      email: this.email,
      website: this.website,
      literaryAgent: this.literaryAgent,
      biography: this.biography,
      research: this.research,
      address: this.address,
      telephone: this.telephone,
    };
  }

  public get worksData() {
    return {
      playIds: this.playIds,
      adaptationIds: this.adaptationIds,
      doolleePlayIds: this.doolleePlayIds,
    };
  }

  public get archiveData() {
    return this._archive;
  }

  constructor(input: AuthorData) {
    const { name, displayName, isOrganization, lastName, firstName, middleNames, suffixes } = this.parseName(input);

    this._id = new ObjectId();
    this._archive = Object.freeze({
      ...input._archive,
      ...(input.listingName ? { listingName: input.listingName } : {}),
    });

    this.metadata = {
      createdAt: undefined,
      updatedAt: undefined,
      scrapedAt: input.scrapedAt,
      sourceUrl: input.sourceUrl,
    };

    this.name = name;
    this.displayName = displayName;
    this.isOrganization = !!isOrganization;
    this.lastName = lastName;
    this.firstName = firstName;
    this.middleNames = middleNames;
    this.suffixes = suffixes;

    this.yearBorn = input.yearBorn;
    this.yearBornUncertain = input.yearBornUncertain;
    this.yearDied = input.yearDied;
    this.yearDiedUncertain = input.yearDiedUncertain;
    this.nationality = input.nationality;
    this.email = input.email;
    this.website = input.website;
    this.literaryAgent = input.literaryAgent;
    this.biography = input.biography;
    this.research = input.research;
    this.address = input.address;
    this.telephone = input.telephone;

    this.playIds = [];
    this.adaptationIds = [];
    this.doolleePlayIds = [];
  }

  /**
   *  Determine if the name of the author corresponds to an organization.
   *
   *  The criteria for this are:
   *    - the listing name must be in all caps
   *    - the listing name must match the heading name, ignoring/independent of case
   *    - the listing name must match the alt name if present, ignoring case
   *
   *  If the name is a single word, it may still be a mononym, and will
   *  require manual review.
   */
  private parseOrganization({ listingName = "", headingName = "", altName = "" }: NameInputFields): AuthorNameData {
    const lowercaseListing = listingName.normalize("NFC").toLocaleLowerCase().trim();
    const lowercaseHeading = headingName.normalize("NFC").toLocaleLowerCase().trim();
    const lowercaseAltName = altName.normalize("NFC").toLocaleLowerCase().trim();

    const listingInAllCaps = isAllCaps(listingName);
    const matchesHeading = lowercaseListing === lowercaseHeading;
    const matchesAlt = altName ? lowercaseListing === lowercaseAltName : true;
    const orgName = altName.length > 0 ? altName : toTitleCase(listingName);
    const isOrganization = listingInAllCaps && matchesHeading && matchesAlt;

    if (listingName.split(" ").length === 1) {
      this.reviewNotes.push(REVIEW_NOTES.SINGLE_WORD_AUTHOR_NAME);
    }

    return {
      name: orgName,
      displayName: orgName,
      firstName: orgName,
      isOrganization,
    };
  }

  /**
   *  Make a best-effort parsing of personal names based off the word order of
   *  available fields. These are formatted as follows:
   *
   *  Listing:   LAST  • [Suffix...]? • First • [Middle...]?
   *  Heading:   FIRST • [MIDDLE...]? • LAST  • [SUFFIX...]?
   *  Alt:       First • [Middle...]? • Last  • [Suffix...]?
   *
   *  If any discrepancies are found between the fields, flag the author
   *  as needing manual review. String comparisons are made after normalizing
   *  for unicode and using locale-sensitive case.
   */
  private parseAuthorName({ listingName = "", headingName = "", altName = "" }: NameInputFields): AuthorNameData {
    const listingNames = listingName.split(" ");
    const headingNames = headingName.split(" ");
    const headingFirstName = headingNames[0];
    const listingLastName = listingNames[0];
    const headingLastName = headingNames[headingNames.length - 1];
    const listingFirstName = listingNames[listingNames.length - 1];

    const lastNameHeadingIndex = headingNames.indexOf(listingLastName);
    const firstNameListingIndex = listingNames.indexOf(toTitleCase(headingFirstName));

    const headingSuffixes = headingNames.slice(lastNameHeadingIndex + 1);
    const headingMiddleNames = headingNames.slice(1, lastNameHeadingIndex);
    const listingSuffixes = listingNames.slice(1, firstNameListingIndex);
    const listingMiddleNames = listingNames.slice(firstNameListingIndex + 1);

    const sameSuffixes = stringArraysEqual(headingSuffixes, listingSuffixes);
    const sameMiddleNames = stringArraysEqual(headingMiddleNames, listingMiddleNames);
    const sameFirstNames = stringArraysEqual([headingFirstName], [listingFirstName]);
    const sameLastNames = stringArraysEqual([listingLastName], [headingLastName]);

    if (!(sameSuffixes && sameMiddleNames && sameFirstNames && sameLastNames)) {
      this.reviewNotes.push(REVIEW_NOTES.NAME_INCONSISTENCY);
    }

    const firstName = toTitleCase(headingNames[0]);
    const lastName = toTitleCase(listingNames[0]);
    const middleNames = headingMiddleNames.map((name) => toTitleCase(name));
    const suffixes = headingSuffixes.map((name) => toTitleCase(name));
    const canonicalName = [firstName, ...middleNames, lastName, ...suffixes].join(" ");
    const displayName = altName || canonicalName;

    return {
      name: canonicalName,
      isOrganization: false,
      displayName,
      firstName,
      lastName,
      middleNames,
      suffixes,
    };
  }

  private parseName(input: AuthorData): AuthorNameData {
    const data = {
      listingName: removeDisambiguationSuffix(input.listingName),
      headingName: removeDisambiguationSuffix(input._archive.name),
      altName: removeDisambiguationSuffix(input._archive.altName ?? ""),
    };

    const organizationData = this.parseOrganization(data);
    if (organizationData.isOrganization) {
      return organizationData;
    }

    return this.parseAuthorName(data);
  }

  public addPlays(playIds: ObjectIdType[]): void {
    this.playIds.push(...playIds);
  }

  public addAdaptations(adaptationIds: ObjectIdType[]): void {
    this.adaptationIds.push(...adaptationIds);
  }

  public addDoolleeIds(doolleeIds: string[]): void {
    this.doolleePlayIds.push(...doolleeIds);
  }

  public toDocument(): AuthorDocument {
    const now = new Date();

    const document: AuthorDocument = {
      _id: this._id,
      metadata: {
        ...this.metadata,
        createdAt: this.metadata.createdAt ?? now,
        updatedAt: now,
        reviewNotes: this.reviewNotes,
      },
      name: this.name,
      ...this.nameData,
      ...this.biographyData,
      ...this.worksData,
    };

    // prune undefined/empty fields and manually remove fields added by this class
    const prunedDocument = dbUtils.removeEmptyFields(document);
    if (!prunedDocument) {
      throw new Error("Failed to create author document: all fields are empty or undefined");
    }

    if (!prunedDocument.isOrganization) {
      delete prunedDocument.isOrganization;
    }

    return prunedDocument;
  }

  public toArchiveDocument(): AuthorArchiveDocument {
    const archiveDocument: AuthorArchiveDocument = {
      _id: this._id,
      ...this._archive,
    };

    const pruned = dbUtils.removeEmptyFields(archiveDocument);
    const invalidDocument = !pruned;
    const requiredFields: (keyof AuthorArchiveDocument)[] = ["name"] as const;
    const missingRequiredFields = requiredFields.some((field) => !pruned?.[field]);

    if (invalidDocument || missingRequiredFields) {
      throw new Error(`Failed to create author archive document: missing required field (name)`);
    }

    return pruned;
  }
}
