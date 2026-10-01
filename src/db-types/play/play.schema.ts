import { type Document } from "mongodb";

const PlaySchema: Document = {
  bsonType: "object",
  required: ["_id", "metadata", "playId", "title", "author", "displayAuthor", "isAdaptation"],
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
        reviewNotes: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["reason"],
            additionalProperties: false,
            properties: {
              reason: { bsonType: "string" },
              functionName: { bsonType: "string" },
              className: { bsonType: "string" },
            },
          },
        },
      },
    },

    title: { bsonType: "string" },
    displayTitle: { bsonType: "string" },
    author: { bsonType: "string" },
    displayAuthor: { bsonType: "string" },
    authorId: { bsonType: "objectId" },
    adaptingAuthor: { bsonType: "string" },
    isAdaptation: { bsonType: "bool" },
    genres: { bsonType: "array", items: { bsonType: "string" } },
    genreTags: {
      bsonType: "object",
      additionalProperties: false,
      properties: {
        genre: { bsonType: "array", items: { bsonType: "string" } },
        format: { bsonType: "array", items: { bsonType: "string" } },
        audience: { bsonType: "array", items: { bsonType: "string" } },
        representation: { bsonType: "array", items: { bsonType: "string" } },
      },
    },
    duration: { bsonType: "array", items: { bsonType: "int" }, minItems: 3, maxItems: 3 },
    durationRange: {
      bsonType: "array",
      items: { bsonType: "array", items: { bsonType: "int" }, minItems: 3, maxItems: 3 },
      minItems: 2,
      maxItems: 2,
    },
    actCount: { bsonType: "int" },
    collectionSize: { bsonType: "int" },
    synopsis: { bsonType: "string" },
    notes: { bsonType: "string" },
    organizations: { bsonType: "string" },
    music: { bsonType: "string" },
    reference: { bsonType: "string" },
    publisher: { bsonType: "string" },
    publicationYear: { bsonType: "string" },
    containingWork: { bsonType: "string" },
    isbn: { bsonType: "string" },
    productionLocation: { bsonType: "string" },
    productionYear: { bsonType: "string" },
    productionYearInt: { bsonType: "int" },
    publicationYearInt: { bsonType: "int" },
    partsCountMale: { bsonType: "number" },
    partsCountFemale: { bsonType: "number" },
    partsCountOther: { bsonType: "number" },
    partsCountTotal: { bsonType: "number" },
  },
};

export default PlaySchema;
