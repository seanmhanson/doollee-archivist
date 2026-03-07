import { promises as fs } from "fs";
import path from "path";

import { jest, describe, beforeEach, expect, afterEach, it } from "@jest/globals";

import ModuleWriter from "../ModuleWriter";

jest.mock("fs", () => ({
  promises: {
    mkdir: jest.fn(),
    writeFile: jest.fn(),
  },
}));

jest.mock("path");

const mockedFs = jest.mocked(fs);
const mockedPath = jest.mocked(path);

describe("core/ModuleWriter", () => {
  beforeEach(() => {
    mockedPath.resolve.mockImplementation((...args) => args.join("/"));
    mockedPath.join.mockImplementation((...args) => args.join("/"));
    mockedFs.mkdir.mockResolvedValue(undefined);
    mockedFs.writeFile.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("when creating an instance", () => {
    it("should create output directory and set isReady flag", async () => {
      const writer = await ModuleWriter.create("test-module");

      expect(mockedFs.mkdir).toHaveBeenCalledWith("output/test-module", { recursive: true });
      expect(writer.isReady).toBe(true);
    });
  });

  describe("when writing files", () => {
    let writer: ModuleWriter;

    beforeEach(async () => {
      writer = await ModuleWriter.create("test-module");
    });

    describe("with valid JSON file", () => {
      it("should write JSON file with stringified data", async () => {
        const data = { key: "value" };

        await writer.writeFile({
          filename: "test.json",
          data,
          stringify: true,
        });

        expect(mockedFs.writeFile).toHaveBeenCalledWith(
          "output/test-module/test.json",
          JSON.stringify(data, null, 2),
          "utf8",
        );
      });

      it("should write JSON file with string data", async () => {
        const data = '{"key": "value"}';

        await writer.writeFile({
          filename: "test.json",
          data,
          stringify: false,
        });

        expect(mockedFs.writeFile).toHaveBeenCalledWith("output/test-module/test.json", data, "utf8");
      });
    });

    describe("with valid TypeScript file", () => {
      it("should write TS file with export default", async () => {
        const data = { key: "value" };

        await writer.writeFile({
          filename: "test.ts",
          data,
          stringify: true,
        });

        expect(mockedFs.writeFile).toHaveBeenCalledWith(
          "output/test-module/test.ts",
          `export default ${JSON.stringify(data, null, 2)};`,
          "utf8",
        );
      });

      it("should infer fileType from extension", async () => {
        const data = { key: "value" };

        await writer.writeFile({
          filename: "test.ts",
          data,
          stringify: true,
        });

        expect(mockedFs.writeFile).toHaveBeenCalledWith(
          "output/test-module/test.ts",
          expect.stringContaining("export default"),
          "utf8",
        );
      });
    });

    describe("with invalid options", () => {
      it("should throw when filename is empty", async () => {
        await expect(
          writer.writeFile({
            filename: "",
            data: {},
            stringify: true,
          }),
        ).rejects.toThrow("Filename must be a non-empty string");
      });

      it("should throw when extension doesn't match fileType", async () => {
        await expect(
          writer.writeFile({
            filename: "test.json",
            data: {},
            stringify: true,
            fileType: "ts",
          }),
        ).rejects.toThrow("Filename extension .json does not match specified fileType ts");
      });

      it("should throw when no extension and no fileType", async () => {
        await expect(
          writer.writeFile({
            filename: "test",
            data: {},
            stringify: true,
          }),
        ).rejects.toThrow("When fileType is not specified, filename must have a .json or .ts extension");
      });

      it("should throw when stringify is true but data is string", async () => {
        await expect(
          writer.writeFile({
            filename: "test.json",
            data: "string data",
            stringify: true,
          }),
        ).rejects.toThrow("Data must be an object when stringify is true");
      });

      it("should throw when stringify is false but data is object", async () => {
        await expect(
          writer.writeFile({
            filename: "test.json",
            data: { key: "value" },
            stringify: false,
          }),
        ).rejects.toThrow("Data must be a string; use the option 'stringify' to write object data");
      });
    });
  });

  describe("when closing", () => {
    let writer: ModuleWriter;

    beforeEach(async () => {
      writer = await ModuleWriter.create("test-module");
    });

    it("should write index file when writeIndex is true", async () => {
      await writer.writeFile({
        filename: "file1.ts",
        data: { key: "value" },
        stringify: true,
      });

      await writer.close(true, false);

      expect(mockedFs.writeFile).toHaveBeenCalledWith(
        "output/test-module/index.ts",
        expect.stringContaining("import file1 from './file1.ts';"),
        "utf8",
      );
    });

    it("should not write index file when writeIndex is false", async () => {
      await writer.writeFile({
        filename: "file1.ts",
        data: { key: "value" },
        stringify: true,
      });

      // Clear the writeFile mock from the file write
      mockedFs.writeFile.mockClear();

      await writer.close(false, false);

      expect(mockedFs.writeFile).not.toHaveBeenCalled();
    });

    it("should handle filenames with special characters in index", async () => {
      await writer.writeFile({
        filename: "test-file.name.ts",
        data: {},
        stringify: true,
      });

      await writer.close(true, false);

      expect(mockedFs.writeFile).toHaveBeenCalledWith(
        "output/test-module/index.ts",
        expect.stringContaining("import test_file_name from './test-file.name.ts';"),
        "utf8",
      );
    });

    it("should handle filenames starting with numbers in index", async () => {
      await writer.writeFile({
        filename: "123-file.ts",
        data: {},
        stringify: true,
      });

      await writer.close(true, false);

      expect(mockedFs.writeFile).toHaveBeenCalledWith(
        "output/test-module/index.ts",
        expect.stringContaining("import _123_file from './123-file.ts';"),
        "utf8",
      );
    });

    it("should set isReady to false after closing", async () => {
      await writer.close(false, false);

      expect(writer.isReady).toBe(false);
    });

    it("should log verbose output when verbose is true", async () => {
      const consoleSpy = jest.spyOn(console, "log");

      await writer.writeFile({
        filename: "file1.ts",
        data: {},
        stringify: true,
      });

      await writer.close(true, true);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("📦 Module created with 1 files written to output/test-module"),
      );
    });
  });
});
