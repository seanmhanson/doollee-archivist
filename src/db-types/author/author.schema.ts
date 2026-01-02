import type { Document } from "mongodb";

const AuthorSchema: Document = {
  bsonType: "object",
  additionalProperties: false,
  required: ["_id", "metadata", "rawFields", "name", "nameData", "biography", "works"],
  properties: {
    _id: { bsonType: "objectId" },
    metadata: {
      bsonType: "object",
      properties: {
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" },
        scrapedAt: { bsonType: "date" },
        sourceUrl: { bsonType: "string" },
      },
      required: ["createdAt", "updatedAt", "scrapedAt", "sourceUrl"],
    },
    rawFields: {
      bsonType: "object",
      properties: {
        listingName: { bsonType: "string" },
        headingName: { bsonType: "string" },
        altName: { bsonType: "string" },
      },
      required: ["listingName", "headingName"],
    },
    name: { bsonType: "string" },
    nameData: {
      bsonType: "object",
      properties: {
        displayName: { bsonType: "string" },
        isOrganization: { bsonType: "bool" },
        lastName: { bsonType: "string" },
        firstName: { bsonType: "string" },
        middleName: { bsonType: "string" },
        suffix: { bsonType: "string" },
      },
      required: ["displayName", "isOrganization"],
    },
    biography: {
      bsonType: "object",
      properties: {
        born: { bsonType: "string" },
        died: { bsonType: "string" },
        nationality: { bsonType: "string" },
        email: { bsonType: "string" },
        website: { bsonType: "string" },
        literaryAgent: { bsonType: "string" },
        biography: { bsonType: "string" },
        research: { bsonType: "string" },
        address: { bsonType: "string" },
        telephone: { bsonType: "string" },
      },
    },
    works: {
      bsonType: "object",
      properties: {
        plays: {
          bsonType: "array",
          items: { bsonType: "objectId" },
        },
        adaptations: {
          bsonType: "array",
          items: { bsonType: "objectId" },
        },
        doolleeIds: {
          bsonType: "array",
          items: { bsonType: "string" },
        },
      },
      required: ["plays", "adaptations", "doolleeIds"],
    },
  },
};

export default AuthorSchema;
