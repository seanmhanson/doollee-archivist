import { readFileSync } from "fs";
import { join } from "path";

export default function loadFixture(filename: string): string {
  const filePath = join(__dirname, "fixtures", filename);
  return readFileSync(filePath, "utf-8");
}
