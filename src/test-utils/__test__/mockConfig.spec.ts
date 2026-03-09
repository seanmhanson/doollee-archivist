import { describe, expect, it } from "@jest/globals";

import { mockConfig, DEFAULT_TEST_CONFIG } from "../mockConfig";

describe("test-utils/mockConfig", () => {
  it("should return default test config when no overrides are provided", () => {
    const config = mockConfig();
    expect(config).toEqual(DEFAULT_TEST_CONFIG);
  });

  it("should override default values with provided overrides", () => {
    const overrides = {
      baseUrl: "https://custom.url",
      pageTimeout: "10000",
    };
    const expectedConfig = { ...DEFAULT_TEST_CONFIG, ...overrides };
    const config = mockConfig(overrides);
    expect(config).toEqual(expectedConfig);
  });
});
