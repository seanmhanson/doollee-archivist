import { jest, describe, it, expect, beforeEach, afterEach } from "@jest/globals";

import { AdaptationBiography, StandardBiography } from "../Biography";
import ProfilePage from "../ProfilePage";
import { AdaptationList, PlaysList } from "../WorksList";

import type { ScrapedAuthorData } from "#/db-types/author/author.types";
import type { ScrapedPlayData } from "#/db-types/play/play.types";
import type { Locator, Page } from "playwright";

import * as Config from "#/core/Config";
import { DEFAULT_TEST_CONFIG } from "#/test-utils/mockConfig";

type StatusFn = () => number;
type MockResponse = { status: StatusFn } | null;
type MockGoto = (url: string, options: unknown) => Promise<MockResponse>;
type FirstFn = () => Locator;
type OrFn = (locator: Locator) => Locator;
type WaitForFn = () => Promise<void>;
type IsVisibleFn = () => Promise<boolean>;
type LocatorFn = (selector: string) => Locator;

const MOCK_BIOGRAPHY_DATA: ScrapedAuthorData = {
  name: "John Doe",
  _archive: {
    name: "John Doe",
  },
};

const MOCK_WORKS_DATA: ScrapedPlayData[] = [
  {
    title: "Test Play 1",
    playId: "test-play-1",
    _archive: { _type: "play" as const, playId: "test-play-1", title: "Test Play 1" },
  },
  {
    title: "Test Play 2",
    playId: "test-play-2",
    _archive: { _type: "play" as const, playId: "test-play-2", title: "Test Play 2" },
  },
];

describe("ProfilePage", () => {
  const originalLog = console.log;
  const originalDebug = console.debug;
  const originalWarn = console.warn;

  beforeEach(() => {
    console.log = jest.fn();
    console.debug = jest.fn();
    console.warn = jest.fn();
    jest.spyOn(Config, "getConfig").mockReturnValue(DEFAULT_TEST_CONFIG as Config.Config);
  });

  afterEach(() => {
    console.log = originalLog;
    console.debug = originalDebug;
    console.warn = originalWarn;
    jest.restoreAllMocks();
  });

  function getMockLocator(options: { isVisible?: boolean } = {}): Locator {
    const { isVisible = true } = options;
    return {
      isVisible: jest.fn<IsVisibleFn>().mockResolvedValue(isVisible),
      waitFor: jest.fn<WaitForFn>().mockResolvedValue(undefined),
      first: jest.fn<FirstFn>(),
      or: jest.fn<OrFn>(),
    } as unknown as Locator;
  }

  function getMockPage(overrides: Record<string, unknown> = {}): Page {
    return {
      goto: jest.fn(),
      locator: jest.fn(),
      waitForSelector: jest.fn(),
      ...overrides,
    } as unknown as Page;
  }

  function setupTest({
    regularVisible = true,
    tableVisible = false,
  }: { regularVisible?: boolean; tableVisible?: boolean } = {}) {
    const mockGoto = jest.fn<MockGoto>().mockResolvedValue({
      status: () => 200,
    });

    const regularLocator = getMockLocator({ isVisible: regularVisible });
    const tableLocator = getMockLocator({ isVisible: tableVisible });

    // Setup the or() and first() chain
    const firstLocator = {
      waitFor: jest.fn<WaitForFn>().mockResolvedValue(undefined),
    } as unknown as Locator;

    regularLocator.or = jest.fn<OrFn>().mockReturnValue({
      first: jest.fn<FirstFn>().mockReturnValue(firstLocator),
    } as unknown as Locator);

    const mockPage = getMockPage({
      goto: mockGoto,
      locator: jest.fn<LocatorFn>().mockImplementation((selector) => {
        if (selector.includes("#osborne")) {
          return regularLocator;
        }
        return {
          first: jest.fn<FirstFn>().mockReturnValue(tableLocator),
        } as unknown as Locator;
      }),
    });

    return { mockPage, mockGoto };
  }

  function setupMockCreateMethods({
    useNullBiography,
    useNullWorksList,
  }: { useNullBiography?: boolean; useNullWorksList?: boolean } = {}) {
    const biography = useNullBiography ? null : { biographyData: MOCK_BIOGRAPHY_DATA };
    const worksList = useNullWorksList ? null : { worksData: MOCK_WORKS_DATA };

    const mockStandardBiography = biography as unknown as StandardBiography;
    const mockAdaptationBiography = biography as unknown as AdaptationBiography;
    const mockAdaptationList = worksList as unknown as AdaptationList;
    const mockPlaysList = worksList as unknown as PlaysList;

    jest.spyOn(StandardBiography, "create").mockResolvedValue(mockStandardBiography);
    jest.spyOn(AdaptationBiography, "create").mockResolvedValue(mockAdaptationBiography);
    jest.spyOn(AdaptationList, "create").mockResolvedValue(mockAdaptationList);
    jest.spyOn(PlaysList, "create").mockResolvedValue(mockPlaysList);
  }

  describe("constructUrl", () => {
    it("should construct the correct URL from slug and letter", () => {
      const { mockPage } = setupTest();
      const page = new ProfilePage(mockPage, { slug: "shakespeare-william", letter: "s" });
      const expectedUrl = "https://www.doollee.com/PlaywrightsS/shakespeare-william.php";
      expect(page.url).toBe(expectedUrl);
    });

    it("should uppercase the letter in the directory name", () => {
      const { mockPage } = setupTest();
      const page = new ProfilePage(mockPage, { slug: "kane-sarah", letter: "k" });
      const expectedUrl = "https://www.doollee.com/PlaywrightsK/kane-sarah.php";
      expect(page.constructUrl({ slug: "kane-sarah", letter: "k" })).toBe(expectedUrl);
    });

    it("should handle different letter cases identically", () => {
      const { mockPage } = setupTest();
      const upperCasePage = new ProfilePage(mockPage, { slug: "mamet-david", letter: "M" });
      const lowerCasePage = new ProfilePage(mockPage, { slug: "mamet-david", letter: "m" });
      expect(upperCasePage.url).toBe(lowerCasePage.url);
    });
  });

  describe("goto", () => {
    it("should call super.goto", async () => {
      const { mockPage, mockGoto } = setupTest();
      const page = new ProfilePage(mockPage, { slug: "test-playwright", letter: "t" });
      await page.goto();

      expect(mockGoto).toHaveBeenCalledWith(page.url, expect.objectContaining({ waitUntil: "domcontentloaded" }));
    });

    it("should identify standard template when regular locator is visible", async () => {
      const { mockPage } = setupTest();
      const page = new ProfilePage(mockPage, { slug: "test-playwright", letter: "t" });

      expect(page.template).toBeNull();
      await page.goto();
      expect(page.template).toBe("standard");
    });

    it("should identify adaptations template when table locator is visible", async () => {
      const { mockPage } = setupTest({ regularVisible: false, tableVisible: true });
      const page = new ProfilePage(mockPage, { slug: "test-playwright", letter: "t" });

      expect(page.template).toBeNull();
      await page.goto();
      expect(page.template).toBe("adaptations");
    });
  });

  describe("extractPage", () => {
    it("should extract data using StandardBiography and PlaysList for standard template", async () => {
      const { mockPage } = setupTest();
      setupMockCreateMethods();

      const page = new ProfilePage(mockPage, { slug: "test-playwright", letter: "t" });
      await page.goto();
      await page.extractPage();

      expect(StandardBiography.create).toHaveBeenCalledWith(mockPage);
      expect(PlaysList.create).toHaveBeenCalledWith(mockPage);
      expect(page.biographyData).toMatchObject(MOCK_BIOGRAPHY_DATA);
      expect(page.worksData).toEqual(MOCK_WORKS_DATA);
    });

    it("should extract data using AdaptationBiography and AdaptationList for adaptations template", async () => {
      const { mockPage } = setupTest({ regularVisible: false, tableVisible: true });
      setupMockCreateMethods();

      const page = new ProfilePage(mockPage, { slug: "test-playwright", letter: "t" });
      await page.goto();
      await page.extractPage();

      expect(AdaptationBiography.create).toHaveBeenCalledWith(mockPage);
      expect(AdaptationList.create).toHaveBeenCalledWith(mockPage);
      expect(page.biographyData).toMatchObject(MOCK_BIOGRAPHY_DATA);
      expect(page.worksData).toEqual(MOCK_WORKS_DATA);
    });

    it("should log a warning if biographyComponent is null", async () => {
      const { mockPage } = setupTest();
      setupMockCreateMethods({ useNullBiography: true });

      const page = new ProfilePage(mockPage, { slug: "test-playwright", letter: "t" });
      await page.goto();
      await page.extractPage();

      expect(console.warn).toHaveBeenCalledWith("No biography component available for data extraction.");
    });

    it("should log a warning if worksListComponent is null", async () => {
      const { mockPage } = setupTest();
      setupMockCreateMethods({ useNullWorksList: true });

      const page = new ProfilePage(mockPage, { slug: "test-playwright", letter: "t" });
      await page.goto();
      await page.extractPage();

      expect(console.warn).toHaveBeenCalledWith("No works list component available for data extraction.");
    });
  });

  describe("identifyTemplate", () => {
    it("should throw an error if both templates are visible", async () => {
      const { mockPage } = setupTest({ regularVisible: true, tableVisible: true });
      const page = new ProfilePage(mockPage, { slug: "test-playwright", letter: "t" });
      await expect(page.goto()).rejects.toThrow("Both regular and table templates are visible.");
    });

    it("should throw an error if neither template is visible", async () => {
      const { mockPage } = setupTest({ regularVisible: false, tableVisible: false });
      const page = new ProfilePage(mockPage, { slug: "test-playwright", letter: "t" });
      await expect(page.goto()).rejects.toThrow("Neither regular nor table templates are visible.");
    });
  });

  describe("data properties", () => {
    it("should initialize with empty biography and works data", () => {
      const { mockPage } = setupTest();
      const page = new ProfilePage(mockPage, { slug: "test-playwright", letter: "t" });
      expect(page.biographyData).toEqual({});
      expect(page.worksData).toEqual([]);
    });

    it("should provide access to biography data through getter", () => {
      const { mockPage } = setupTest();
      const page = new ProfilePage(mockPage, { slug: "test-playwright", letter: "t" });
      expect(page.biographyData).toBe(page.data.biography);
    });

    it("should provide access to works data through getter", () => {
      const { mockPage } = setupTest();
      const page = new ProfilePage(mockPage, { slug: "test-playwright", letter: "t" });
      expect(page.worksData).toBe(page.data.works);
    });
  });
});
