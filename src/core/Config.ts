import dotenv from "dotenv";
dotenv.config();

export class Config {
  private static instance: Config;
  static defaults = {
    MONGO_URI: "mongodb://localhost:27017",
    DB_NAME: "doollee-archive",
    BASE_URL: "https://www.doollee.com",
    PAGE_TIMEOUT: "60000",
    ELEMENT_TIMEOUT: "30000",
    RATE_LIMIT_DELAY: "3000",
  };

  public readonly mongoUri: string;
  public readonly dbName: string;
  public readonly baseUrl: string;
  public readonly pageTimeout: number;
  public readonly elementTimeout: number;
  public readonly rateLimitDelay: number;

  private constructor() {
    dotenv.config();
    this.mongoUri = this.required("MONGO_URI", Config.defaults.MONGO_URI);
    this.dbName = this.required("DB_NAME", Config.defaults.DB_NAME);
    this.baseUrl = this.required("BASE_URL", Config.defaults.BASE_URL);
    this.pageTimeout = parseInt(this.required("PAGE_TIMEOUT", Config.defaults.PAGE_TIMEOUT), 10);
    this.elementTimeout = parseInt(this.required("ELEMENT_TIMEOUT", Config.defaults.ELEMENT_TIMEOUT), 10);
    this.rateLimitDelay = parseInt(this.required("RATE_LIMIT_DELAY", Config.defaults.RATE_LIMIT_DELAY), 10);
  }

  static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }

  private required(key: string, defaultValue?: string): string {
    const value = process.env[key] || defaultValue;
    if (!value) {
      throw new Error(`Configuration environment variable ${key} is not set`);
    }
    return value;
  }
}

export default Config.getInstance();
