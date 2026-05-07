import { describe, expect, it, beforeEach } from "@jest/globals";
import { ObjectId } from "mongodb";

import Author from "../Author.class";

import { getAuthorFixture, getExpectedArchive, getExpectedWorksData, getExpectedBiographyData } from "./Author.fixture";

import type { AuthorData } from "../author.types";

import { REVIEW_NOTES } from "#/review-notes";

describe("Author.class", () => {
  describe("when initialized with valid data", () => {
    let author: Author;
    let fixture: AuthorData;

    beforeEach(() => {
      fixture = getAuthorFixture();
      author = new Author(fixture);
    });

    it("should create an Author instance with the expected properties", () => {
      const { authorName, id, nameData, biographyData, worksData, archiveData } = author;
      const { name } = fixture;
      const { altName } = fixture._archive;
      expect(author).toBeInstanceOf(Author);
      expect(id).toBeInstanceOf(ObjectId);

      expect(authorName).toBe(name);
      expect(nameData).toEqual({
        displayName: altName,
        isOrganization: false,
        lastName: "Mamet",
        firstName: "David",
        middleNames: [],
        suffixes: [],
      });
      expect(fixture._archive).not.toHaveProperty("listingName");
      expect(biographyData).toEqual(getExpectedBiographyData(fixture));
      expect(worksData).toEqual(getExpectedWorksData());
      expect(archiveData).toEqual(getExpectedArchive(fixture));
      expect(Object.isFrozen(author.archiveData)).toBe(true);
      expect(Object.isFrozen(fixture._archive)).toBe(false);
      expect(author.archiveData).not.toBe(fixture._archive);
    });

    it("should initialize with no associated works and allow additions", () => {
      expect(author.worksData).toEqual({
        playIds: [],
        adaptationIds: [],
        doolleePlayIds: [],
      });

      const playIds = [new ObjectId(), new ObjectId()];
      const adaptationIds = [new ObjectId()];
      const doolleePlayIds = [...playIds, ...adaptationIds].map((id) => id.toHexString());

      author.addPlays(playIds);
      author.addAdaptations(adaptationIds);
      author.addDoolleeIds(doolleePlayIds);

      expect(author.worksData).toEqual({
        playIds,
        adaptationIds,
        doolleePlayIds,
      });
    });

    it("should output a valid play document structure with toDocument()", () => {
      const playIds = [new ObjectId(), new ObjectId()];
      const adaptationIds = [new ObjectId()];
      const doolleePlayIds = [...playIds, ...adaptationIds].map((id) => id.toHexString());
      author.addPlays(playIds);
      author.addAdaptations(adaptationIds);
      author.addDoolleeIds(doolleePlayIds);

      const _archive = getExpectedArchive(fixture);
      const biographyData = getExpectedBiographyData(fixture);
      const metadata = {
        scrapedAt: fixture.scrapedAt,
        sourceUrl: fixture.sourceUrl,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      };
      const nameData = {
        name: fixture.name,
        displayName: fixture._archive.altName,
        lastName: "Mamet",
        firstName: "David",
      };
      const worksData = {
        playIds,
        adaptationIds,
        doolleePlayIds,
      };

      const expectedDocument = {
        _id: expect.any(ObjectId),
        _archive,
        metadata,
        ...nameData,
        ...biographyData,
        ...worksData,
      };

      const omittedFields = ["metadata.reviewNotes", "isOrganization", "middleNames", "suffixes"];

      const document = author.toDocument();
      omittedFields.forEach(expect(document).not.toHaveProperty);
      expect(document).toEqual(expectedDocument);
    });
  });

  describe("#reviewNotes", () => {
    it("should add NAME_INCONSISTENCY when listing and heading names do not match", () => {
      const author = new Author(getAuthorFixture({ listingName: "SMITH John", headingName: "JANE SMITH" }));
      expect(author.hasReviewNotes).toBe(true);
      expect(author.toDocument().metadata.reviewNotes).toEqual([REVIEW_NOTES.NAME_INCONSISTENCY]);
    });

    it("should add SINGLE_WORD_AUTHOR_NAME when the listing name is a single word", () => {
      const author = new Author(
        getAuthorFixture({ listingName: "SHAKESPEARE", headingName: "SHAKESPEARE", altName: "" }),
      );
      expect(author.hasReviewNotes).toBe(true);
      expect(author.toDocument().metadata.reviewNotes).toEqual([REVIEW_NOTES.SINGLE_WORD_AUTHOR_NAME]);
    });

    it("should accumulate both SINGLE_WORD_AUTHOR_NAME and NAME_INCONSISTENCY when applicable", () => {
      const author = new Author(getAuthorFixture({ listingName: "Shakespeare", headingName: "WILLIAM SHAKESPEARE" }));
      expect(author.hasReviewNotes).toBe(true);
      expect(author.toDocument().metadata.reviewNotes).toEqual([
        REVIEW_NOTES.SINGLE_WORD_AUTHOR_NAME,
        REVIEW_NOTES.NAME_INCONSISTENCY,
      ]);
    });

    it("should omit reviewNotes from the document when no flags are set", () => {
      const author = new Author(getAuthorFixture());
      expect(author.hasReviewNotes).toBe(false);
      expect(author.toDocument().metadata).not.toHaveProperty("reviewNotes");
    });
  });
});
