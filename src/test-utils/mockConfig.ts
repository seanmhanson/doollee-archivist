import { jest } from "@jest/globals";

import { defaults } from "#/core/Config";

type DefaultsType = typeof defaults;

export const DEFAULT_TEST_CONFIG: DefaultsType = {
  mongoUri: "mongodb://localhost:27017",
  ...defaults,
};

export function mockConfig(overrides: DefaultsType = {}): DefaultsType {
  const mockConfigObject = { ...DEFAULT_TEST_CONFIG, ...overrides };

  jest.mock("#/core/Config", () => ({
    __esModule: true,
    default: jest.fn(() => mockConfigObject),
  }));

  return mockConfigObject;
}
