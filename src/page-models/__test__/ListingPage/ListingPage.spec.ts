import { jest, describe, it, expect } from "@jest/globals";

import ListingPage from "../../ListingPage";

import type { UrlArgs } from "../../ListingPage";
import type { Page } from "playwright";

import { Config } from "#/core/Config";

const mockPage = {
  goto: jest.fn(),
  locator: jest.fn(),
  waitForSelector: jest.fn(),
} as unknown as Page;

const { baseUrl } = Config.getInstance();
describe("ListingPage", () => {
  it("should construct the correct URL for the given arguments", () => {
    const args: UrlArgs = {
      indexLetter: "g",
      firstLetter: "A",
      lastLetter: "D",
    };

    const page = new ListingPage(mockPage, args);
    const expectedUrl = `${baseUrl}/PlaywrightsG/G_playwrights_a-d.php`;
    expect(page.constructUrl(args)).toBe(expectedUrl);
  });

  it("should throw an error if any required URL arguments are missing", () => {
    const args: UrlArgs = {
      indexLetter: "g",
      firstLetter: "A",
      lastLetter: "",
    };

    expect(() => new ListingPage(mockPage, args)).toThrow("Missing required URL arguments");
  });

  it("should throw an error if any URL arguments are invalid", () => {
    const args: UrlArgs = {
      indexLetter: "g",
      firstLetter: "A",
      lastLetter: "1",
    };

    expect(() => new ListingPage(mockPage, args)).toThrow("Invalid URL arguments");
  });

  it("should throw an error if any URL argument is the incorrect length", () => {
    const args: UrlArgs = {
      indexLetter: "gg",
      firstLetter: "A",
      lastLetter: "D",
    };

    expect(() => new ListingPage(mockPage, args)).toThrow("Invalid URL arguments");
  });
});
