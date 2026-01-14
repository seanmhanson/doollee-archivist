import type { Document } from "mongodb";

const PlaySchema: Document = {
  bsonType: "object",
  required: ["_id", "scrapedAt", "sourceUrl", "playId", "title"],
  additionalProperties: false,
  properties: {
    _id: { bsonType: "objectId" },
    scrapedAt: { bsonType: "date" },
    sourceUrl: { bsonType: "string" },
    playId: { bsonType: "string" },
    title: { bsonType: "string" },
    altTitle: { bsonType: "string" },
    adaptingAuthor: { bsonType: "string" },
    originalAuthor: { bsonType: "string" },
    synopsis: { bsonType: "string" },
    notes: { bsonType: "string" },
    firstProduction: {
      location: { bsonType: "string" },
      year: { bsonType: "string" },
    },
    organizations: { bsonType: "string" },
    firstPublished: {
      publisher: { bsonType: "string" },
      year: { bsonType: "string" },
    },
    isbn: { bsonType: "string" },
    music: { bsonType: "string" },
    genres: { bsonType: "string" },
    partsText: {
      maleParts: { bsonType: "number" },
      femaleParts: { bsonType: "number" },
      otherParts: { bsonType: "number" },
    },
    reference: { bsonType: "string" },
  },
};

export default PlaySchema;