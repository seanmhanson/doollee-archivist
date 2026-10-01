import { describe, it, expect } from "@jest/globals";

import { TAG_DEFINITIONS } from "../tagMap";

describe("tagMap", () => {
  describe("#TAG_DEFINITIONS", () => {
    it("has a non-empty canonical name and variant list for every tag", () => {
      for (const tag of TAG_DEFINITIONS) {
        expect(tag.canonical.length).toBeGreaterThan(0);
        expect(tag.variants.length).toBeGreaterThan(0);
      }
    });

    it("does not define the same variant under two different canonical tags", () => {
      const seen = new Map<string, string>();
      for (const tag of TAG_DEFINITIONS) {
        for (const variant of tag.variants) {
          const existing = seen.get(variant);
          expect(existing).toBeUndefined();
          seen.set(variant, tag.canonical);
        }
      }
    });

    it("stores every variant in lowercase", () => {
      for (const tag of TAG_DEFINITIONS) {
        for (const variant of tag.variants) {
          expect(variant).toBe(variant.toLowerCase());
        }
      }
    });
  });
});
