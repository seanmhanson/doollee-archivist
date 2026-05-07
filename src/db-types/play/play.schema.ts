import { type Document } from "mongodb";

const PlaySchema: Document = {
  bsonType: "object",
  required: ["_id", "metadata", "playId", "title", "author", "_archive"],
  additionalProperties: false,
  // Discriminate _archive shape by _type so each variant is validated independently.
  oneOf: [
    // _type: "play" — original works
    {
      properties: {
        _archive: {
          bsonType: "object",
          required: ["_type", "playId", "title"],
          additionalProperties: false,
          properties: {
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
        },
      },
    },
    // _type: "adaptation" — adapted works
    {
      properties: {
        _archive: {
          bsonType: "object",
          required: ["_type", "playId", "title"],
          additionalProperties: false,
          properties: {
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
        },
      },
    },
  ],
  properties: {
    _id: { bsonType: "objectId" },
    // _archive shape is validated by the oneOf discriminator above; bsonType enforces it is an object.
    _archive: { bsonType: "object" },
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

    rawFields: {
      bsonType: "object",
      additionalProperties: false,
      properties: {
        altTitle: { bsonType: "string" },
        publishingInfo: { bsonType: "string" },
        productionInfo: { bsonType: "string" },
      },
    },

    title: { bsonType: "string" },
    displayTitle: { bsonType: "string" },
    author: { bsonType: "string" },
    authorId: { bsonType: "objectId" },
    adaptingAuthor: { bsonType: "string" },
    genres: { bsonType: "string" },
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
    partsCountMale: { bsonType: "number" },
    partsCountFemale: { bsonType: "number" },
    partsCountOther: { bsonType: "number" },
    partsCountTotal: { bsonType: "number" },
    partsTextMale: { bsonType: "string" },
    partsTextFemale: { bsonType: "string" },
    partsTextOther: { bsonType: "string" },
  },
};

export default PlaySchema;
