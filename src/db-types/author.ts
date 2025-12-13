import type { ObjectId, Document } from "mongodb";
import type { Metadata } from "./metadata";
import { requiredMetadataFields, metadataProperties } from "./metadata";

export type AuthorData = Metadata & {
  name: string;
  altName?: string;
  born?: string;
  died?: string;
  nationality?: string;
  email?: string;
  website?: string;
  literaryAgent?: string;
  biography?: string;
  research?: string;
  address?: string;
  telephone?: string;
  plays: ObjectId[];
};

export const AuthorSchema: Document = {
  bsonType: "object",
  required: [...requiredMetadataFields, "name", "plays"],
  additionalProperties: false,
  properties: {
    ...metadataProperties,
    name: { bsonType: "string" },
    altName: { bsonType: "string" },
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
    plays: {
      bsonType: "array",
      items: { bsonType: "objectId" },
    },
  },
};
