import { describe, it, expect, beforeEach } from "@jest/globals";
import { ObjectId } from "mongodb";

import { AnalyzeOrchestrator } from "../AnalyzeOrchestrator";

import type DatabaseService from "#/core/DatabaseService";

class TestOrchestrator extends AnalyzeOrchestrator {
  public flattenForXlsx(doc: Record<string, unknown>): Record<string, unknown> {
    return super.flattenForXlsx(doc);
  }
}

describe("scripts/normalize/AnalyzeOrchestrator", () => {
  let instance: TestOrchestrator;

  beforeEach(() => {
    instance = new TestOrchestrator({ dbService: {} as unknown as DatabaseService });
  });

  describe("#flattenForXlsx", () => {
    it("stores primitive values directly at their key", () => {
      expect(instance.flattenForXlsx({ str: "hello", num: 42, bool: true })).toEqual({
        str: "hello",
        num: 42,
        bool: true,
      });
    });

    it("stores null and undefined directly", () => {
      expect(instance.flattenForXlsx({ a: null, b: undefined })).toEqual({ a: null, b: undefined });
    });

    it("stores Date values directly without recursing", () => {
      const d = new Date("2024-01-01");
      expect(instance.flattenForXlsx({ created: d })).toEqual({ created: d });
    });

    it("JSON.stringify's arrays", () => {
      expect(instance.flattenForXlsx({ tags: ["a", "b"] })).toEqual({ tags: '["a","b"]' });
    });

    it("calls toString() on BSON ObjectId values and stores the hex string", () => {
      const id = new ObjectId();
      expect(instance.flattenForXlsx({ _id: id })).toEqual({
        _id: id.toString(),
      });
    });

    it("flattens nested plain objects using dot-notation keys", () => {
      expect(instance.flattenForXlsx({ a: { b: { c: 1 } } })).toEqual({ "a.b.c": 1 });
    });

    it("JSON.stringify's empty plain objects", () => {
      expect(instance.flattenForXlsx({ x: {} })).toEqual({ x: "{}" });
    });

    it("handles a mix of field types at the top level", () => {
      const doc = {
        _id: new ObjectId(),
        name: "Test",
        count: 0,
        tags: ["x"],
        meta: { active: true },
      };
      expect(instance.flattenForXlsx(doc)).toEqual({
        _id: doc._id.toString(),
        name: "Test",
        count: 0,
        tags: '["x"]',
        "meta.active": true,
      });
    });
  });
});
