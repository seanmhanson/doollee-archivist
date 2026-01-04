import { Document, ObjectId } from "mongodb";
import type * as AuthorTypes from "./author.types";
import * as dbUtils from "../../utils/dbUtils";
import { toTitleCase, removeDisambiguationSuffix, isAllCaps, stringArraysEqual } from "../../utils/stringUtils";

type AuthorMetadata = Omit<AuthorTypes.Metadata, "createdAt" | "updatedAt"> & {
  createdAt?: Date;
  updatedAt?: Date;
};

type ParsedNameData = AuthorTypes.NameData & {
  name: string;
  isOrganization?: boolean;
  needsReview: boolean;
};

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
  private _id: ObjectId;
  private metadata: AuthorMetadata;
  private rawFields: AuthorTypes.RawFields;
  private nameData: AuthorTypes.NameData;
  private biography: AuthorTypes.Biography;
  private works: AuthorTypes.Works;
  public name: string;

  public get id(): ObjectId {
    return this._id;
  }

  constructor(input: AuthorTypes.Input) {
    const authorId = new ObjectId();
    const { name, needsReview, ...nameData } = this.parseName(input);

    this._id = authorId;
    this.name = name;

    this.metadata = {
      createdAt: undefined,
      updatedAt: undefined,
      scrapedAt: input.scrapedAt,
      sourceUrl: input.sourceUrl,
      needsReview: needsReview,
    };

    this.rawFields = {
      listingName: input.listingName || name,
      headingName: input.headingName,
      altName: input.altName,
    };

    this.nameData = nameData;

    this.biography = {
      born: input.born,
      died: input.died,
      nationality: input.nationality,
      email: input.email,
      website: input.website,
      literaryAgent: input.literaryAgent,
      biography: input.biography,
      research: input.research,
      address: input.address,
      telephone: input.telephone,
    };

    this.works = {
      plays: [],
      adaptations: [],
      doolleeIds: [],
    };
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
  private parseOrganization({ listingName, headingName, altName = "" }: AuthorTypes.RawFields): ParsedNameData {
    const lowercaseListing = listingName.normalize("NFC").toLocaleLowerCase();
    const lowercaseHeading = headingName.normalize("NFC").toLocaleLowerCase();
    const lowercaseAltName = altName.normalize("NFC").toLocaleLowerCase();

    const listingInAllCaps = isAllCaps(listingName);
    const matchesHeading = lowercaseListing === lowercaseHeading;
    const matchesAlt = altName ? lowercaseListing === lowercaseAltName : true;
    const orgName = altName.length > 0 ? altName : toTitleCase(listingName);
    const isOrganization = listingInAllCaps && matchesHeading && matchesAlt;
    const needsReview = listingName.split(" ").length === 1;

    return {
      name: orgName,
      displayName: orgName,
      firstName: orgName,
      isOrganization,
      needsReview,
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
  private parseAuthorName({ listingName, headingName, altName = "" }: AuthorTypes.RawFields): ParsedNameData {
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
    const needsReview = !(sameSuffixes && sameMiddleNames && sameFirstNames && sameLastNames);

    const firstName = toTitleCase(headingNames[0]);
    const lastName = toTitleCase(listingNames[0]);
    const middleName = headingMiddleNames.map((name) => toTitleCase(name));
    const suffix = headingSuffixes.map((name) => toTitleCase(name));
    const canonicalName = [firstName, ...middleName, lastName, ...suffix].join(" ");
    const displayName = altName || canonicalName;

    return {
      name: canonicalName,
      isOrganization: false,
      displayName,
      firstName,
      lastName,
      middleName,
      suffix,
      needsReview,
    };
  }

  private parseName(input: AuthorTypes.Input): ParsedNameData {
    const data = {
      listingName: removeDisambiguationSuffix(input.listingName),
      headingName: removeDisambiguationSuffix(input.headingName),
      altName: removeDisambiguationSuffix(input.altName || ""),
    };

    const organizationData = this.parseOrganization(data);
    if (organizationData.isOrganization) {
      return organizationData;
    }

    return this.parseAuthorName(data);
  }

  public addPlays(playIds: ObjectId[]): void {
    this.works.plays.push(...playIds);
  }
  public addAdaptations(adaptationIds: ObjectId[]): void {
    this.works.adaptations.push(...adaptationIds);
  }

  public addDoolleeIds(doolleeIds: string[]): void {
    this.works.doolleeIds.push(...doolleeIds);
  }

  public toDocument(): AuthorTypes.AuthorDocument {
    const now = new Date();

    const document: Document = {
      _id: this._id,
      metadata: {
        ...this.metadata,
        createdAt: this.metadata.createdAt || now,
        updatedAt: now,
      },
      rawFields: this.rawFields,
      name: this.name,
      nameData: this.nameData,
      biography: this.biography,
      works: this.works,
    };

    // prune undefined/empty fields and manually remove fields added by this class
    const prunedDocument = dbUtils.removeEmptyFields(document);
    if (!prunedDocument.metadata.needsReview) {
      delete prunedDocument.metadata.needsReview;
    }
    if (!prunedDocument.nameData.isOrganization) {
      delete prunedDocument.nameData.isOrganization;
    }

    return prunedDocument;
  }
}
