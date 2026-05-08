import type { PlayArchive } from "#/db-types/play/play.types";
import type { ObjectId } from "mongodb";

export type PlayArchiveDocument = { _id: ObjectId } & PlayArchive;
