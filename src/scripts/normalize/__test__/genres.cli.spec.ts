import { spawnSync } from "node:child_process";

import { describe, expect, it } from "@jest/globals";

describe("normalize:genres CLI", () => {
  it("parses arguments through the package script", () => {
    const yarnExecutable = process.env.npm_execpath;
    if (!yarnExecutable) {
      throw new Error("The test must run through Yarn to exercise the normalize:genres package script.");
    }

    const result = spawnSync(yarnExecutable, ["normalize:genres", "--bad", "--worse"], { encoding: "utf8" });

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Unknown arguments: bad, worse");
  });
});
