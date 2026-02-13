import { ObjectId } from "mongodb";

import type {
  AuthorDocument,
  InitialMetadata,
  AuthorNameData,
  RawFields,
  AuthorData,
} from "#/db-types/author/author.types";
import type { ObjectId as ObjectIdType } from "mongodb";

import * as dbUtils from "#/utils/dbUtils";
import {
  toTitleCase,
  removeDisambiguationSuffix,
  isAllCaps,
  stringArraysEqual,
} from "#/utils/stringUtils";

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
  private metadata: InitialMetadata;
  private rawFields: RawFields;

  private name: string;
  private displayName: string;
  private isOrganization?: boolean;
  private lastName?: string;
  private firstName?: string;
  private middleNames?: string[];
  private suffixes?: string[];

  private yearBorn?: string;
  private yearDied?: string;
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

  private needsReview = false;
  private needsReviewReason?: string;
  private needsReviewData?: Record<string, Record<string, string>> = {};

  public get authorName(): string {
    return this.name;
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
      yearDied: this.yearDied,
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

  constructor(input: AuthorData) {
    const {
      name,
      displayName,
      isOrganization,
      lastName,
      firstName,
      middleNames,
      suffixes,
    } = this.parseName(input);

    this._id = new ObjectId();

    this.metadata = {
      createdAt: undefined,
      updatedAt: undefined,
      scrapedAt: input.scrapedAt,
      sourceUrl: input.sourceUrl,
    };

    this.rawFields = {
      listingName: input.listingName ?? name,
      headingName: input.headingName,
      altName: input.altName,
    };

    this.name = name;
    this.displayName = displayName;
    this.isOrganization = !!isOrganization;
    this.lastName = lastName;
    this.firstName = firstName;
    this.middleNames = middleNames;
    this.suffixes = suffixes;

    this.yearBorn = input.yearBorn;
    this.yearDied = input.yearDied;
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
  private parseOrganization({
    listingName = "",
    headingName = "",
    altName = "",
  }: RawFields): AuthorNameData {
    const lowercaseListing = listingName
      .normalize("NFC")
      .toLocaleLowerCase()
      .trim();
    const lowercaseHeading = headingName
      .normalize("NFC")
      .toLocaleLowerCase()
      .trim();
    const lowercaseAltName = altName
      .normalize("NFC")
      .toLocaleLowerCase()
      .trim();

    const listingInAllCaps = isAllCaps(listingName);
    const matchesHeading = lowercaseListing === lowercaseHeading;
    const matchesAlt = altName ? lowercaseListing === lowercaseAltName : true;
    const orgName = altName.length > 0 ? altName : toTitleCase(listingName);
    const isOrganization = listingInAllCaps && matchesHeading && matchesAlt;

    this.needsReview = listingName.split(" ").length === 1;
    this.needsReviewReason = this.needsReview
      ? "Single word organization name"
      : undefined;

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
  private parseAuthorName({
    listingName = "",
    headingName = "",
    altName = "",
  }: RawFields): AuthorNameData {
    const listingNames = listingName.split(" ");
    const headingNames = headingName.split(" ");
    const headingFirstName = headingNames[0];
    const listingLastName = listingNames[0];
    const headingLastName = headingNames[headingNames.length - 1];
    const listingFirstName = listingNames[listingNames.length - 1];

    const lastNameHeadingIndex = headingNames.indexOf(listingLastName);
    const firstNameListingIndex = listingNames.indexOf(
      toTitleCase(headingFirstName),
    );

    const headingSuffixes = headingNames.slice(lastNameHeadingIndex + 1);
    const headingMiddleNames = headingNames.slice(1, lastNameHeadingIndex);
    const listingSuffixes = listingNames.slice(1, firstNameListingIndex);
    const listingMiddleNames = listingNames.slice(firstNameListingIndex + 1);

    const sameSuffixes = stringArraysEqual(headingSuffixes, listingSuffixes);
    const sameMiddleNames = stringArraysEqual(
      headingMiddleNames,
      listingMiddleNames,
    );
    const sameFirstNames = stringArraysEqual(
      [headingFirstName],
      [listingFirstName],
    );
    const sameLastNames = stringArraysEqual(
      [listingLastName],
      [headingLastName],
    );

    if (!(sameSuffixes && sameMiddleNames && sameFirstNames && sameLastNames)) {
      this.needsReview = true;
      this.needsReviewReason =
        "Author's listing and heading names are inconsistent.";
      this.needsReviewData = {
        ...this.prepareFlaggedNameData(
          "First Name",
          [headingFirstName],
          [listingFirstName],
        ),
        ...this.prepareFlaggedNameData(
          "Middle Name(s)",
          headingMiddleNames,
          listingMiddleNames,
        ),
        ...this.prepareFlaggedNameData(
          "Last Name",
          [headingLastName],
          [listingLastName],
        ),
        ...this.prepareFlaggedNameData(
          "Suffix(es)",
          headingSuffixes,
          listingSuffixes,
        ),
      };
    }

    const firstName = toTitleCase(headingNames[0]);
    const lastName = toTitleCase(listingNames[0]);
    const middleNames = headingMiddleNames.map((name) => toTitleCase(name));
    const suffixes = headingSuffixes.map((name) => toTitleCase(name));
    const canonicalName = [
      firstName,
      ...middleNames,
      lastName,
      ...suffixes,
    ].join(" ");
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

  private prepareFlaggedNameData(
    label: string,
    headingValues: string[],
    listingValues: string[],
  ) {
    const matching = stringArraysEqual(headingValues, listingValues);
    if (matching) {
      return {};
    }

    return {
      [label]: {
        heading: headingValues.join(" ") || "<empty>",
        listing: listingValues.join(" ") || "<empty>",
      },
    };
  }

  private parseName(input: AuthorData): AuthorNameData {
    const data = {
      listingName: removeDisambiguationSuffix(input.listingName),
      headingName: removeDisambiguationSuffix(input.headingName),
      altName: removeDisambiguationSuffix(input.altName ?? ""),
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
        needsReview: this.needsReview,
        needsReviewReason: this.needsReviewReason,
        needsReviewData: this.needsReviewData,
      },
      rawFields: this.rawFields,
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

    if (!prunedDocument.metadata.needsReview) {
      delete prunedDocument.metadata.needsReview;
      delete prunedDocument.metadata.needsReviewReason;
      delete prunedDocument.metadata.needsReviewData;
    }
    if (!prunedDocument.isOrganization) {
      delete prunedDocument.isOrganization;
    }

    return prunedDocument;
  }
}
