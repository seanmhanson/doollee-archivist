import dotenv from "dotenv";
dotenv.config({ quiet: true });

const WRITE_TO_VALUES = ["db", "file", "stage"] as const;
type WriteTo = (typeof WRITE_TO_VALUES)[number];

export class Config {
  private static instance: Config;
  public static defaults: Record<string, string> = {
    MONGO_URI: "mongodb://localhost:27017",
    DB_NAME: "doollee-archive",
    BASE_URL: "https://www.doollee.com",
    PAGE_TIMEOUT: "60000",
    ELEMENT_TIMEOUT: "30000",
    RATE_LIMIT_DELAY: "3000",
    WRITE_TO: "db",
    BATCH_SIZE: "100",
    MAX_BATCHES: "0",
    TAIL_LENGTH: "3",
    AUTHOR_LIST_PATH: "input/authors",
    LOG_DIRECTORY: "output/logs",
    LOG_FILE: "",
  };

  public readonly mongoUri: string;
  public readonly dbName: string;
  public readonly baseUrl: string;
  public readonly pageTimeout: number;
  public readonly elementTimeout: number;
  public readonly rateLimitDelay: number;
  public readonly writeTo: WriteTo;
  public readonly batchSize: number;
  public readonly maxBatches: number;
  public readonly tailLength: number;
  public readonly logDirectory: string;
  public readonly logFile: string;
  public readonly authorListPath: string;

  private constructor() {
    this.mongoUri = this.getEnvOrDefault("MONGO_URI");
    this.dbName = this.getEnvOrDefault("DB_NAME");
    this.baseUrl = this.getEnvOrDefault("BASE_URL");
    this.pageTimeout = this.getIntEnvOrDefault("PAGE_TIMEOUT");
    this.elementTimeout = this.getIntEnvOrDefault("ELEMENT_TIMEOUT");
    this.rateLimitDelay = this.getIntEnvOrDefault("RATE_LIMIT_DELAY");
    this.batchSize = this.getIntEnvOrDefault("BATCH_SIZE");
    this.maxBatches = this.getIntEnvOrDefault("MAX_BATCHES");
    this.logDirectory = this.getEnvOrDefault("LOG_DIRECTORY");
    this.writeTo = this.getWriteTo();
    this.tailLength = this.getTailLength();
    this.logFile = this.getLogFile();
    this.authorListPath = this.getEnvOrDefault("AUTHOR_LIST_PATH");
  }

  private getEnvOrDefault(key: keyof typeof Config.defaults): string {
    const value = process.env[key] || Config.defaults[key];
    if (!value && value !== "") {
      throw new Error(`Missing required configuration for ${key}`);
    }
    return value;
  }

  private getIntEnvOrDefault(key: keyof typeof Config.defaults): number {
    const valueStr = this.getEnvOrDefault(key);
    const valueInt = parseInt(valueStr, 10);
    if (isNaN(valueInt)) {
      throw new Error(`Invalid integer value for ${key}: ${valueStr}`);
    }
    return valueInt;
  }

  private getWriteTo(): WriteTo {
    const writeToValue = this.getEnvOrDefault("WRITE_TO");
    if (!WRITE_TO_VALUES.includes(writeToValue as WriteTo)) {
      throw new Error(`Invalid value for WRITE_TO: ${writeToValue}. Allowed values are "db", "file".`);
    }
    return writeToValue as WriteTo;
  }

  private getTailLength(): number {
    const tailLengthValue = this.getIntEnvOrDefault("TAIL_LENGTH");
    if (tailLengthValue < 1 || tailLengthValue > 50) {
      throw new Error(`Invalid value for TAIL_LENGTH: ${tailLengthValue}. Allowed range is 1 to 50.`);
    }
    return tailLengthValue;
  }

  private getLogFile(): string {
    const logFileValue = this.getEnvOrDefault("LOG_FILE");
    if (logFileValue === "") {
      return logFileValue;
    }
    if (!logFileValue.endsWith(".log")) {
      throw new Error(`Invalid value for LOG_FILE: ${logFileValue}. Log file must have a .log extension.`);
    }
    return logFileValue;
  }

  public static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }
}

export default Config.getInstance();
