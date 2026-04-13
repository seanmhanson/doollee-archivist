import { describe, expect, it, beforeEach } from "@jest/globals";
import { ObjectId } from "mongodb";

import Play from "../Play.class";

import {
  getPlayFixture,
  getAdaptationFixture,
  getExpectedAuthorData,
  getExpectedMainData,
  getExpectedPublicationData,
  getExpectedProductionData,
  getExpectedPartsData,
} from "./Play.fixture";

import type { PlayData } from "../play.types";

describe("Play.class", () => {
  describe("when initialized with valid play data", () => {
    let play: Play;
    let fixture: PlayData;

    beforeEach(() => {
      fixture = getPlayFixture();
      play = new Play(fixture);
    });

    it("should create a Play instance with the expected properties", () => {
      expect(play).toBeInstanceOf(Play);
      expect(play.id).toBeInstanceOf(ObjectId);
      expect(play.title).toBe(fixture.title);
      expect(play.doolleeId).toBe(fixture.playId);
      expect(play.isAdaptation).toBe(false);
    });

    it("should expose authorData getter with correct values", () => {
      expect(play.authorData).toEqual(getExpectedAuthorData(fixture));
    });

    it("should expose mainData getter with correct values", () => {
      expect(play.mainData).toEqual(getExpectedMainData(fixture));
    });

    it("should expose publicationData getter with correct values", () => {
      expect(play.publicationData).toEqual(getExpectedPublicationData(fixture));
    });

    it("should expose productionData getter with correct values", () => {
      expect(play.productionData).toEqual(getExpectedProductionData(fixture));
    });

    it("should expose partsData getter with correct values", () => {
      expect(play.partsData).toEqual(getExpectedPartsData(fixture));
    });

    it("should output a valid play document structure with toDocument()", () => {
      const document = play.toDocument();

      expect(document._id).toBeInstanceOf(ObjectId);
      // _archive gets pruned of empty fields by removeEmptyFields
      expect(document._archive._type).toBe(fixture._archive._type);
      expect(document._archive.playId).toBe(fixture._archive.playId);
      expect(document._archive.title).toBe(fixture._archive.title);
      expect(document.playId).toBe(fixture.playId);
      expect(document.title).toBe(fixture.title);
      expect(document.author).toBe(fixture.originalAuthor);

      expect(document.metadata.createdAt).toBeInstanceOf(Date);
      expect(document.metadata.updatedAt).toBeInstanceOf(Date);
      expect(document.metadata.scrapedAt).toBe(fixture.scrapedAt);
      expect(document.metadata.sourceUrl).toBe(fixture.sourceUrl);

      // needsReview should be pruned when false
      expect(document.metadata).not.toHaveProperty("needsReview");
      expect(document.metadata).not.toHaveProperty("needsReviewReason");
      expect(document.metadata).not.toHaveProperty("needsReviewData");
    });

    it("should prune empty/undefined fields from the document", () => {
      const emptyFixture = getPlayFixture({
        notes: "",
        organizations: "",
        music: "",
        reference: "",
        isbn: "",
        containingWork: "",
        altTitle: "",
      });
      const emptyPlay = new Play(emptyFixture);
      const document = emptyPlay.toDocument();

      expect(document).not.toHaveProperty("notes");
      expect(document).not.toHaveProperty("organizations");
      expect(document).not.toHaveProperty("music");
      expect(document).not.toHaveProperty("reference");
      expect(document).not.toHaveProperty("isbn");
      expect(document).not.toHaveProperty("containingWork");
    });
  });

  describe("when initialized with adaptation data", () => {
    let play: Play;
    let fixture: PlayData;

    beforeEach(() => {
      fixture = getAdaptationFixture();
      play = new Play(fixture);
    });

    it("should identify as an adaptation", () => {
      expect(play.isAdaptation).toBe(true);
    });

    it("should have the adapting author in authorData", () => {
      const authorData = play.authorData;
      expect(authorData.adaptingAuthor).toBe(fixture.adaptingAuthor);
      expect(authorData.author).toBe(fixture.originalAuthor);
    });

    it("should produce a document with adaptingAuthor field", () => {
      const document = play.toDocument();
      expect(document.adaptingAuthor).toBe(fixture.adaptingAuthor);
    });
  });

  describe("when initialized with no optional fields", () => {
    it("should produce a minimal valid document", () => {
      const minimalFixture = getPlayFixture({
        genres: undefined,
        synopsis: undefined,
        notes: undefined,
        organizations: undefined,
        music: undefined,
        reference: undefined,
        publisher: undefined,
        publicationYear: undefined,
        containingWork: undefined,
        isbn: undefined,
        productionLocation: undefined,
        productionYear: undefined,
        partsTextMale: undefined,
        partsTextFemale: undefined,
        partsTextOther: undefined,
        partsCountMale: undefined,
        partsCountFemale: undefined,
        partsCountOther: undefined,
        partsCountTotal: undefined,
      });
      const play = new Play(minimalFixture);
      const document = play.toDocument();

      expect(document._id).toBeInstanceOf(ObjectId);
      expect(document.title).toBe(minimalFixture.title);
      expect(document.playId).toBe(minimalFixture.playId);
      expect(document.author).toBe(minimalFixture.originalAuthor);
    });
  });

  describe("when initialized with authorId", () => {
    it("should include authorId in the document", () => {
      const authorId = new ObjectId();
      const fixture = getPlayFixture({ authorId });
      const play = new Play(fixture);
      const document = play.toDocument();

      expect(document.authorId).toEqual(authorId);
    });
  });

  describe("rawFields", () => {
    it("should preserve raw fields in the document", () => {
      const fixture = getPlayFixture({
        altTitle: "The Betrayal",
        publishingInfo: "Some publisher info",
        productionInfo: "Some production info",
      });
      const play = new Play(fixture);
      const document = play.toDocument();

      expect(document.rawFields).toEqual({
        altTitle: "The Betrayal",
        publishingInfo: "Some publisher info",
        productionInfo: "Some production info",
      });
    });
  });
});
