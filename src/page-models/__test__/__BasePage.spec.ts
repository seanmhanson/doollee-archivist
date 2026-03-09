import { jest, describe, it, expect } from "@jest/globals";

import BasePage from "../__BasePage";

import type { Page } from "playwright";

import { mockConfig } from "#/test-utils/mockConfig";

const mockPage = {
  goto: jest.fn(),
  locator: jest.fn(),
  waitForSelector: jest.fn(),
} as unknown as Page;

class TestBasePage extends BasePage<{ id: string }, { title: string }> {
  public data = { title: "" };

  constructUrl(args: { id: string }): string {
    return `${BasePage.baseUrl}/test/${args.id}`;
  }

  async extractPage(): Promise<void> {
    this.data.title = await this.getTextContent("h1");
  }
}

mockConfig();

describe("BasePage", () => {
  it("should initialize with URL from arguments", () => {
    const page = new TestBasePage(mockPage, { url: "https://custom.url/test" });
    expect(page.url).toBe("https://custom.url/test");
  });

  it("should construct URL from arguments", () => {
    const page = new TestBasePage(mockPage, { id: "123" });
    expect(page.url).toBe("https://www.doollee.com/test/123");
  });
});
