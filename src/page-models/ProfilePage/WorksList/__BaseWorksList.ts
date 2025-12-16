import type { Page } from "playwright";

export default abstract class BaseWorksList {
  protected page: Page;

  protected data: any[];

  public get worksData() {
    return this.data;
  }

  protected constructor(page: Page) {
    this.page = page;
    this.data = [];
  }

  public static async create<T extends BaseWorksList>(this: new (page: Page) => T, page: Page): Promise<T> {
    const instance = new this(page);
    try {
      await instance.extractData();
    } catch (error) {
      console.error("Error extracting works list data:", error);
    }
    return instance;
  }

  protected abstract extractData(): Promise<void>;

  protected getPlayId(idString: string): string {
    return idString?.trim() || "0000000";
  }
}
