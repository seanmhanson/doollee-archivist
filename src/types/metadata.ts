import type { ObjectId } from "mongodb";

export type Metadata = {
  _id?: ObjectId;
  scrapedAt?: Date;
  sourceUrl?: string;
};

export const requiredMetadataFields = ["_id", "scrapedAt", "sourceUrl"];

export const metadataProperties = {
  _id: { bsonType: "objectId" },
  scrapedAt: { bsonType: "date" },
  sourceUrl: { bsonType: "string" },
};
