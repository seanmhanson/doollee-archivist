import type { Document } from "mongodb";

const AuthorArchiveSchema: Document = {
  bsonType: "object",
  additionalProperties: false,
  required: ["_id", "name"],
  properties: {
    _id: { bsonType: "objectId" },
    name: { bsonType: "string" },
    altName: { bsonType: "string" },
    listingName: { bsonType: "string" },
    dates: { bsonType: "string" },
    biography: { bsonType: "string" },
    nationality: { bsonType: "string" },
    email: { bsonType: "string" },
    website: { bsonType: "string" },
    literaryAgent: { bsonType: "string" },
    research: { bsonType: "string" },
    address: { bsonType: "string" },
    telephone: { bsonType: "string" },
  },
};

export default AuthorArchiveSchema;
