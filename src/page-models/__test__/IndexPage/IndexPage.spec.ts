import { jest, describe, it, expect } from "@jest/globals";

import IndexPage from "../../IndexPage";

import type { Page } from "playwright";

const mockPage = {
  goto: jest.fn(),
  locator: jest.fn(),
  waitForSelector: jest.fn(),
} as unknown as Page;

describe("IndexPage", () => {
  it("should construct the correct URL for the given letter", () => {
    const letter = "G";
    const expectedUrl = "https://www.doollee.com/PlaywrightsG/3PlaywrightsGdata.php";
    const page = new IndexPage(mockPage, { letter });
    expect(page.constructUrl({ letter })).toBe(expectedUrl);
  });

  it("should return null for links without text or href", () => {
    expect(IndexPage.parseLink({ text: "", href: "https://example.com" })).toBeNull();
    expect(IndexPage.parseLink({ text: "Playwright Name (aa - zz)", href: "" })).toBeNull();
  });

  it("should return null for links that do not match the expected format", () => {
    expect(IndexPage.parseLink({ text: "Playwright Name", href: "https://example.com" })).toBeNull();
  });

  it("should correctly parse valid links", () => {
    const result = IndexPage.parseLink({ text: "Playwright Name (aa - zz)", href: "https://example.com" });
    expect(result).toEqual({ key: "aa-zz", url: "https://example.com" });
  });
});
