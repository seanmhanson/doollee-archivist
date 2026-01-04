import { ObjectId } from "mongodb";

const shouldRemove = (value: any) => {
  // special case: preserve null values
  if (value === null) return false;

  // remove undefined values
  if (value === undefined) return true;

  // remove empty trimmed strings and values used as
  // placeholders for missing data in Doollee sources
  if (typeof value === "string") {
    const isEmpty = value.trim() === "";
    const isPlaceholder = value.trim() === "-" || value.trim().toLowerCase() === "n/a";
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
export function removeEmptyFields(obj: any): any {
  if (Array.isArray(obj)) {
    const arr = obj.map((item) => removeEmptyFields(item)).filter((item) => !shouldRemove(item));
    return arr.length ? arr : undefined;
  }
  if (typeof obj === "object" && obj !== null) {
    if (obj instanceof ObjectId || obj instanceof Date) {
      return obj;
    }

    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const cleaned = removeEmptyFields(value);
      if (!shouldRemove(cleaned)) {
        result[key] = cleaned;
      }
    }
    return Object.keys(result).length ? result : undefined;
  }
  return obj;
}
