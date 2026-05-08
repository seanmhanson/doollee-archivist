import type { AuthorArchive } from "#/db-types/author/author.types";
import type { ObjectId } from "mongodb";

export type AuthorArchiveDocument = { _id: ObjectId } & AuthorArchive;
