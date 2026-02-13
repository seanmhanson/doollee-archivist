import { ObjectId } from "mongodb";

type UnknownArray = unknown[];
type UnknownObject = Record<string, unknown>;

const shouldRemove = (value: unknown) => {
  // special case: preserve null values
  if (value === null) return false;

  // remove undefined values
  if (value === undefined) return true;

  // remove empty trimmed strings and values used as
  // placeholders for missing data in Doollee sources
  if (typeof value === "string") {
    const isEmpty = value.trim() === "";
    const isPlaceholder =
      value.trim() === "-" || value.trim().toLowerCase() === "n/a";
    return isEmpty || isPlaceholder;
  }

  // remove empty arrays
  if (Array.isArray(value)) {
    return value.length === 0;
  }

  // remove plain objects with no keys
  const isObjectType = typeof value === "object";
  const isPlainObject = isObjectType && value.constructor === Object;
  if (isPlainObject) {
    return Object.keys(value).length === 0;
  }

  // preserve other values, including primitives, special objects, etc.
  return false;
};

/**
 * Given a nested object, recusively remove any undefined or empty fields before
 * writing to a database; this is intended only for the data structures we're working
 * with in this project, and so assumes no circular references, no special objects
 * beyond specified exceptions, and has limited edge case testing outside what is
 * expected from the scraped data.
 */
export function removeEmptyFields<T>(obj: T): T {
  const isArrayLike = Array.isArray(obj);
  const isObjectLike = typeof obj === "object";
  const isNullish = obj === null || obj === undefined;
  const isSpecialObject = obj instanceof ObjectId || obj instanceof Date;

  if (isArrayLike) {
    const arrayLike = obj as UnknownArray;
    const arr = arrayLike
      .map((item: unknown) => removeEmptyFields(item))
      .filter((item) => !shouldRemove(item));
    return (arr.length ? arr : undefined) as T;
  }

  if (!isObjectLike || isNullish || isSpecialObject) {
    return obj;
  }

  const objectLike = obj as UnknownObject;
  const result = Object.entries(objectLike).reduce((acc, [key, value]) => {
    const cleaned = removeEmptyFields(value);
    if (!shouldRemove(cleaned)) {
      acc[key] = cleaned;
    }
    return acc;
  }, {} as UnknownObject);
  return (Object.keys(result).length ? result : undefined) as T;
}


