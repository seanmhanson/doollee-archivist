import { describe, expect, it, beforeEach } from "@jest/globals";
import { ObjectId } from "mongodb";

import Author from "../Author.class";

import {
  getAuthorFixture,
  getExpectedArchive,
  getExpectedWorksData,
  getExpectedBiographyData,
  getExpectedRawFields,
} from "./Author.fixture";

import type { AuthorData } from "../author.types";

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
      const { name, altName } = fixture;
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
      expect(biographyData).toEqual(getExpectedBiographyData(fixture));
      expect(worksData).toEqual(getExpectedWorksData());
      expect(archiveData).toEqual(getExpectedArchive(fixture));
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
      const rawFields = getExpectedRawFields(fixture);
      const biographyData = getExpectedBiographyData(fixture);
      const metadata = {
        scrapedAt: fixture.scrapedAt,
        sourceUrl: fixture.sourceUrl,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      };
      const nameData = {
        name: fixture.name,
        displayName: fixture.altName,
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
        rawFields,
        ...nameData,
        ...biographyData,
        ...worksData,
      };

      const omittedFields = [
        "metadata.needsReview",
        "metadata.needsReviewReason",
        "metadata.needsReviewData",
        "isOrganization",
        "middleNames",
        "suffixes",
      ];

      const document = author.toDocument();
      omittedFields.forEach(expect(document).not.toHaveProperty);
      expect(document).toEqual(expectedDocument);
    });
  });
});
