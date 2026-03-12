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
      pageTimeout: 10000,
    };
    const expectedConfig = { ...DEFAULT_TEST_CONFIG, ...overrides };
    const config = mockConfig(overrides);
    expect(config).toEqual(expectedConfig);
  });

  it("should return a config object with all required properties", () => {
    const config = mockConfig();
    expect(config).toHaveProperty("mongoUri");
    expect(config).toHaveProperty("dbName");
    expect(config).toHaveProperty("baseUrl");
    expect(config).toHaveProperty("pageTimeout");
    expect(config).toHaveProperty("elementTimeout");
    expect(config).toHaveProperty("rateLimitDelay");
    expect(config).toHaveProperty("writeTo");
    expect(config).toHaveProperty("batchSize");
    expect(config).toHaveProperty("maxBatches");
    expect(config).toHaveProperty("tailLength");
    expect(config).toHaveProperty("logDirectory");
    expect(config).toHaveProperty("logFile");
    expect(config).toHaveProperty("authorListPath");
  });
});
