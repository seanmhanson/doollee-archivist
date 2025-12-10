import type { Document } from "mongodb";
import type { Metadata } from "./metadata";
import { requiredMetadataFields, metadataProperties } from "./metadata";

export type PlayData = Metadata & {
  playId: string; // the id used by doollee, not our internal id
  title: string;
  altTitle?: string;
  adaptingAuthor?: string;
  originalAuthor?: string;
  synopsis?: string;
  notes?: string;
  firstProduction?: {
    location: string;
    year: string;
  };
  organizations?: string; // this might need verification
  firstPublished?: {
    publisher: string;
    year: string;
  };
  isbn?: string;
  music?: string;
  genres?: string;
  partsText?: {
    maleParts: number;
    femaleParts: number;
    otherParts: number;
  };
  reference?: string;
};

export type ProductionData = PlayData["firstProduction"];
export type PublicationData = PlayData["firstPublished"];
export type PartsData = PlayData["partsText"];

export const PlaySchema: Document = {
  bsonType: "object",
  required: [...requiredMetadataFields, "playId", "title"],
  additionalProperties: false,
  properties: {
    ...metadataProperties,
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
