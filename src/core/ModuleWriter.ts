import { promises as fs } from "fs";
import path from "path";

type Options = {
  filename: string;
  data: Record<string, unknown> | string;
  stringify?: boolean;
  fileType?: "json" | "ts";
};

type IndexContent = {
  imports: string[];
  exports: string[];
};

type FileType = Options["fileType"];
type InferredFileType = Exclude<FileType, undefined>;

type ValidateFilenameArgs = {
  filename: Options["filename"];
  fileType?: Options["fileType"];
};

type ValidateDataType = {
  stringify: Options["stringify"];
  data: Options["data"];
};

class ModuleWriter {
  private moduleName = "";
  private outputDir = "";
  private filenames: string[] = [];
  private isReadyFlag = false;

  public get isReady() {
    return this.isReadyFlag;
  }

  private constructor() {}

  static async create(moduleName: string) {
    const instance = new ModuleWriter();
    await instance.initialize(moduleName);
    return instance;
  }

  private async initialize(moduleName: string) {
    this.moduleName = moduleName;
    this.outputDir = path.resolve(`output/${this.moduleName}`);
    await fs.mkdir(this.outputDir, { recursive: true });
    this.isReadyFlag = true;
  }

  private validateFilename({ filename, fileType }: ValidateFilenameArgs) {
    if (!filename || filename.trim() === "") {
      throw Error("Filename must be a non-empty string");
    }

    const extension = filename.split(".").pop();
    if (extension && fileType && extension !== fileType) {
      throw Error(
        `Filename extension .${extension} does not match specified fileType ${fileType}`,
      );
    }
  }

  private inferFileType(filename: string): InferredFileType {
    const extension = filename.split(".").pop();
    const isTypescript = extension && extension === "ts";
    const isJson = extension && extension === "json";

    if (!extension || (!isTypescript && !isJson)) {
      throw Error(
        "When fileType is not specified, filename must have a .json or .ts extension",
      );
    }

    return isTypescript ? "ts" : "json";
  }

  private validateDataType({ stringify, data }: ValidateDataType) {
    if (stringify && typeof data !== "object") {
      throw Error(`Data must be an object when stringify is true`);
    }

    if (!stringify && typeof data !== "string") {
      throw Error(
        `Data must be a string; use the option 'stringify' to write object data`,
      );
    }
  }

  private validateOptions(options: Options): Options {
    const { filename, data, fileType, stringify } = options;
    const inferredFileType = fileType ?? this.inferFileType(filename);

    this.validateFilename({ filename, fileType });
    this.validateDataType({ stringify, data });

    return {
      filename: filename.replace(/\.(ts|json)$/, ""),
      fileType: inferredFileType,
      stringify,
      data,
    };
  }

  public async writeFile(options: Options) {
    const { filename, data, fileType, stringify } =
      this.validateOptions(options);
    const stringInput = stringify
      ? JSON.stringify(data, null, 2)
      : (data as string);
    const fullFileName = `${filename}.${fileType}`;
    const outputPath = path.join(this.outputDir, `${fullFileName}`);
    const fileContent =
      fileType === "ts" ? `export default ${stringInput};` : stringInput;

    try {
      await fs.writeFile(outputPath, fileContent, "utf8");
    } catch (error) {
      throw Error(
        `Error writing file ${outputPath}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    this.filenames.push(fullFileName);
  }

  private async writeIndexFile() {
    const statements = this.filenames.reduce(
      (acc, filename): IndexContent => {
        const importPath = `./${filename}`;
        const exportKey = filename.replace(/\.(ts|json)$/, "");
        let reference = exportKey.replace(/[-.]/g, "_");

        // Prefix with underscore if it starts with a number
        if (/^\d/.test(reference)) {
          reference = `_${reference}`;
        }

        acc.imports.push(`import ${reference} from '${importPath}';`);
        acc.exports.push(`  '${exportKey}': ${reference},`);
        return acc;
      },
      { imports: [], exports: [] },
    );

    const timestamp = new Date().toISOString();

    const outputPath = path.join(this.outputDir, "index.ts");
    const indexFileContent =
      `// index.ts - Auto-generated on ${timestamp}\n\n` +
      statements.imports.join("\n") +
      "\n\n" +
      "export default {\n" +
      statements.exports.join("\n") +
      "\n" +
      "};\n";

    try {
      await fs.writeFile(outputPath, indexFileContent, "utf8");
    } catch (error) {
      throw Error(
        `Error writing index file: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  public async close(writeIndex = true, verbose = false) {
    if (writeIndex) {
      await this.writeIndexFile();
    }

    if (verbose) {
      console.log(
        ` 📦 Module created with ${this.filenames.length} files written to ` +
          `output/${this.moduleName}`,
      );
    }
    this.isReadyFlag = false;
  }
}

export default ModuleWriter;
