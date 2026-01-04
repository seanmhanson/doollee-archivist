import type { ObjectId } from "mongodb";

export type PlayData = {
  _id?: ObjectId;
  scrapedAt?: Date;
  sourceUrl?: string;
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
