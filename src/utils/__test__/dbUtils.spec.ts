import { describe, it, expect } from "@jest/globals";

import * as dbUtils from "../dbUtils";

describe("utils/dbUtils", () => {
  describe("#removeEmptyFields", () => {
    const { removeEmptyFields } = dbUtils;

    describe("for non-object, non-array values", () => {
      it("should return primitive types and special objects (Date, ObjectId) unchanged", () => {
        expect(removeEmptyFields(42)).toBe(42);
        expect(removeEmptyFields("test")).toBe("test");
        expect(removeEmptyFields(true)).toBe(true);

        const date = new Date();
        expect(removeEmptyFields(date)).toBe(date);
        const objectId = { $oid: "507f1f77bcf86cd799439011" };
        expect(removeEmptyFields(objectId)).toStrictEqual(objectId);
      });

      it("should return null unchanged", () => {
        expect(removeEmptyFields(null)).toBeNull();
      });

      it("should return undefined unchanged", () => {
        expect(removeEmptyFields(undefined)).toBeUndefined();
      });
    });

    describe("for flat arrays", () => {
      it("should remove empty values (undefined, empty strings, empty arrays/objects) from arrays", () => {
        const input = [1, undefined, "", [], {}, "valid"];
        const expectedOutput = [1, "valid"];
        expect(removeEmptyFields(input)).toEqual(expectedOutput);
      });

      it("should return undefined for an empty array after removing all empty values", () => {
        const input = [undefined, "", [], {}];
        expect(removeEmptyFields(input)).toBeUndefined();
      });

      it("should handle special objects (Date, ObjectId) and not modify the original array", () => {
        const date = new Date();
        const objectId = { $oid: "507f1f77bcf86cd799439011" };
        const input = [1, undefined, date, objectId, "valid"];
        const inputCopy = [...input];
        const expectedOutput = [1, date, objectId, "valid"];

        expect(removeEmptyFields(input)).toEqual(expectedOutput);
        expect(input).toEqual(inputCopy);
      });
    });

    describe("for nested arrays", () => {
      it("should remove empty values from nested arrays and objects", () => {
        const input = [1, [undefined, "test", [], null], { a: undefined, b: "valid" }, "valid"];
        const expectedOutput = [1, ["test", null], { b: "valid" }, "valid"];
        expect(removeEmptyFields(input)).toEqual(expectedOutput);
      });

      it("should handle deeply nested structures with multiple empty value types", () => {
        const input = [1, [undefined, "test", [], { a: "" }], { b: undefined, c: "valid" }, "valid"];
        const expectedOutput = [1, ["test"], { c: "valid" }, "valid"];
        expect(removeEmptyFields(input)).toEqual(expectedOutput);
      });

      it("should remove empty fields from arrays of objects", () => {
        const input = [
          { a: 1, b: undefined },
          { c: "", d: "valid" },
          { e: [], f: {} },
        ];
        const expectedOutput = [{ a: 1 }, { d: "valid" }];
        expect(removeEmptyFields(input)).toEqual(expectedOutput);
      });

      it("should remove all types of empty fields from nested objects", () => {
        const input = [1, { a: undefined, b: "", c: [], d: {}, e: "valid" }];
        const expectedOutput = [1, { e: "valid" }];
        expect(removeEmptyFields(input)).toEqual(expectedOutput);
      });

      it("should preserve null values while removing undefined and empty strings", () => {
        const input = [1, { a: null, b: undefined, c: "", d: "valid" }];
        const expectedOutput = [1, { a: null, d: "valid" }];
        expect(removeEmptyFields(input)).toEqual(expectedOutput);
      });
    });

    describe("for flat objects", () => {
      it("should remove all types of empty values (undefined, empty strings, placeholders, empty arrays/objects)", () => {
        const input = {
          a: 1,
          b: undefined,
          c: "test",
          d: "",
          e: "   ",
          f: "-",
          g: "N/A",
          h: [],
          i: {},
          j: [1, 2],
          k: { key: "value" },
        };
        const expectedOutput = {
          a: 1,
          c: "test",
          j: [1, 2],
          k: { key: "value" },
        };
        expect(removeEmptyFields(input)).toEqual(expectedOutput);
      });

      it("should preserve null values while removing other empty types", () => {
        const input = { a: null, b: undefined, c: "test", d: "" };
        const expectedOutput = { a: null, c: "test" };
        expect(removeEmptyFields(input)).toEqual(expectedOutput);
      });

      it("should handle special types (Date, ObjectId) and not modify the original object", () => {
        const input = {
          a: 1,
          b: undefined,
          c: "test",
          d: new Date(),
          e: { $oid: "507f1f77bcf86cd799439011" },
        };
        const inputCopy = { ...input };
        const result = removeEmptyFields(input);

        expect(result).toEqual({
          a: 1,
          c: "test",
          d: input.d,
          e: input.e,
        });
        expect(input).toEqual(inputCopy);
      });
    });

    describe("for nested objects", () => {
      it("should handle nested objects with multiple empty value types", () => {
        const input = {
          a: 1,
          b: {
            c: undefined,
            d: "",
            e: [],
            f: {},
            g: "valid",
            h: [undefined, "test", []],
          },
        };
        const expectedOutput = {
          a: 1,
          b: {
            g: "valid",
            h: ["test"],
          },
        };
        expect(removeEmptyFields(input)).toEqual(expectedOutput);
      });

      it("should handle deeply nested structures with arrays of objects", () => {
        const input = {
          a: 1,
          b: undefined,
          c: {
            d: "",
            e: "valid",
            f: [undefined, "test", [], { g: "" }],
          },
          h: [{ i: undefined }, { j: "valid" }],
        };
        const expectedOutput = {
          a: 1,
          c: {
            e: "valid",
            f: ["test"],
          },
          h: [{ j: "valid" }],
        };
        expect(removeEmptyFields(input)).toEqual(expectedOutput);
      });
    });
  });
});
