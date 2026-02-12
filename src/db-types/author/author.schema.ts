import type { Document } from "mongodb";

const AuthorSchema: Document = {
  bsonType: "object",
  additionalProperties: false,
  required: ["_id", "metadata", "rawFields", "name", "displayName", "playIds", "adaptationIds", "doolleePlayIds"],
  properties: {
    _id: { bsonType: "objectId" },
    metadata: {
      bsonType: "object",
      additionalProperties: false,
      required: ["createdAt", "updatedAt", "scrapedAt", "sourceUrl"],
      properties: {
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" },
        scrapedAt: { bsonType: "date" },
        sourceUrl: { bsonType: "string" },
        needsReview: { bsonType: "bool" },
        needsReviewReason: { bsonType: "string" },
        needsReviewData: {
          bsonType: "object",
          additionalProperties: true,
        },
      },
    },
    rawFields: {
      bsonType: "object",
      additionalProperties: false,
      properties: {
        listingName: { bsonType: "string" },
        headingName: { bsonType: "string" },
        altName: { bsonType: "string" },
      },
    },
    name: { bsonType: "string" },
    displayName: { bsonType: "string" },
    isOrganization: { bsonType: "bool" },
    lastName: { bsonType: "string" },
    firstName: { bsonType: "string" },
    middleNames: { bsonType: "array", items: { bsonType: "string" } },
    suffixes: { bsonType: "array", items: { bsonType: "string" } },
    yearBorn: { bsonType: "string" },
    yearDied: { bsonType: "string" },
    nationality: { bsonType: "string" },
    email: { bsonType: "string" },
    website: { bsonType: "string" },
    literaryAgent: { bsonType: "string" },
    biography: { bsonType: "string" },
    research: { bsonType: "string" },
    address: { bsonType: "string" },
    telephone: { bsonType: "string" },
    playIds: {
      bsonType: "array",
      items: { bsonType: "objectId" },
    },
    adaptationIds: {
      bsonType: "array",
      items: { bsonType: "objectId" },
    },
    doolleePlayIds: {
      bsonType: "array",
      items: { bsonType: "string" },
    },
  },
};

export default AuthorSchema;
