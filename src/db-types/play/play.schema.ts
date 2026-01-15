import type { Document } from "mongodb";

const PlaySchema: Document = {
  bsonType: "object",
  required: ["_id", "metadata", "playId", "title"],
  additionalProperties: false,
  properties: {
    _id: { bsonType: "objectId" },
    metadata: {
      bsonType: "object",
      required: ["scrapedAt", "sourceUrl"],
      additionalProperties: false,
      properties: {
        scrapedAt: { bsonType: "date" },
        sourceUrl: { bsonType: "string" },
      },
    },
    playId: { bsonType: "string" },
    title: { bsonType: "string" },
    rawFields: {
      bsonType: "object",
      additionalProperties: true,
    },
    author: {
      bsonType: "object",
      additionalProperties: false,
      properties: {
        adaptingAuthor: { bsonType: "string" },
        author: { bsonType: "string" },
      },
    },
    publication: {
      bsonType: "object",
      additionalProperties: false,
      properties: {
        firstProduction: {
          bsonType: "object",
          additionalProperties: false,
          properties: {
            location: { bsonType: "string" },
            year: { bsonType: "string" },
          },
        },
        firstPublished: {
          bsonType: "object",
          additionalProperties: false,
          properties: {
            publisher: { bsonType: "string" },
            year: { bsonType: "string" },
          },
        },
        isbn: { bsonType: "string" },
      },
    },
    details: {
      bsonType: "object",
      additionalProperties: false,
      properties: {
        altTitle: { bsonType: "string" },
        synopsis: { bsonType: "string" },
        notes: { bsonType: "string" },
        organizations: { bsonType: "string" },
        music: { bsonType: "string" },
        genres: { bsonType: "string" },
        partsText: {
          bsonType: "object",
          additionalProperties: false,
          properties: {
            maleParts: { bsonType: "number" },
            femaleParts: { bsonType: "number" },
            otherParts: { bsonType: "number" },
          },
        },
        reference: { bsonType: "string" },
      },
    },
  },
};

export default PlaySchema;