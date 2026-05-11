import { type Document } from "mongodb";

const PlayArchiveSchema: Document = {
  bsonType: "object",
  required: ["_id", "_type", "playId", "title"],
  // Discriminate top-level shape by _type so each variant is validated independently.
  oneOf: [
    // _type: "play" — original works
    {
      properties: {
        _id: { bsonType: "objectId" },
        _type: { bsonType: "string", enum: ["play"] },
        playId: { bsonType: "string" },
        title: { bsonType: "string" },
        altTitle: { bsonType: "string" },
        synopsis: { bsonType: "string" },
        notes: { bsonType: "string" },
        production: { bsonType: "string" },
        organizations: { bsonType: "string" },
        publisher: { bsonType: "string" },
        music: { bsonType: "string" },
        genres: { bsonType: "string" },
        parts: { bsonType: "string" },
        reference: { bsonType: "string" },
      },
      additionalProperties: false,
    },
    // _type: "adaptation" — adapted works
    {
      properties: {
        _id: { bsonType: "objectId" },
        _type: { bsonType: "string", enum: ["adaptation"] },
        playId: { bsonType: "string" },
        title: { bsonType: "string" },
        adaptingAuthor: { bsonType: "string" },
        productionLocation: { bsonType: "string" },
        productionYear: { bsonType: "string" },
        organizations: { bsonType: "string" },
        publisher: { bsonType: "string" },
        isbn: { bsonType: "string" },
        music: { bsonType: "string" },
        genres: { bsonType: "string" },
        notes: { bsonType: "string" },
        imgAlt: { bsonType: "string" },
        synopsis: { bsonType: "string" },
        reference: { bsonType: "string" },
        maleParts: { bsonType: "string" },
        femaleParts: { bsonType: "string" },
        otherParts: { bsonType: "string" },
      },
      additionalProperties: false,
    },
  ],
};

export default PlayArchiveSchema;
