import { type Document } from "mongodb";

const PlaySchema: Document = {
  bsonType: "object",
  required: ["_id", "metadata", "rawFields", "playId", "title", "author"],
  additionalProperties: false,
  properties: {
    _id: { bsonType: "objectId" },
    playId: { bsonType: "string" },

    metadata: {
      bsonType: "object",
      required: ["createdAt", "updatedAt", "scrapedAt", "sourceUrl"],
      additionalProperties: false,
      properties: {
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" },
        scrapedAt: { bsonType: "date" },
        sourceUrl: { bsonType: "string" },
      },
    },

    rawFields: {
      bsonType: "object",
      additionalProperties: false,
      properties: {
        altTitle: { bsonType: "string" },
        publishingInfo: { bsonType: "string" },
        productionInfo: { bsonType: "string" },
      },
    },

    title: { bsonType: "string" },
    author: { bsonType: "string" },
    authorId: { bsonType: "objectId" },
    adaptingAuthor: { bsonType: "string" },
    genres: { bsonType: "string" },
    synopsis: { bsonType: "string" },
    notes: { bsonType: "string" },
    organizations: { bsonType: "string" },
    music: { bsonType: "string" },
    reference: { bsonType: "string" },
    publisher: { bsonType: "string" },
    publicationYear: { bsonType: "string" },
    isbn: { bsonType: "string" },
    productionLocation: { bsonType: "string" },
    productionYear: { bsonType: "string" },
    partsCountMale: { bsonType: "number" },
    partsCountFemale: { bsonType: "number" },
    partsCountOther: { bsonType: "number" },
    partsCountTotal: { bsonType: "number" },
    partsTextMale: { bsonType: "string" },
    partsTextFemale: { bsonType: "string" },
    partsTextOther: { bsonType: "string" },
  },
};

export default PlaySchema;
