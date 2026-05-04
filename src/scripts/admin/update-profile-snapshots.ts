import { readFileSync, writeFileSync } from "fs";
import path from "path";

import { firefox } from "playwright";
import prettier from "prettier";

import ProfilePage from "#/page-models/ProfilePage";

const FIXTURES_DIR = path.join(__dirname, "..", "..", "page-models", "ProfilePage", "__test__", "fixtures");

const FIXTURES = [
  { name: "pinter-harold", template: "standard" as const, htmlFile: "pinter-harold.html" },
  { name: "euripides", template: "adaptations" as const, htmlFile: "euripides.html" },
];

type Fixture = (typeof FIXTURES)[number];
type BrowserInstance = Awaited<ReturnType<typeof firefox.launch>>;

async function generateSnapshot(fixture: Fixture, browser: BrowserInstance): Promise<void> {
  const page = await browser.newPage();
  try {
    let profilePage: ProfilePage;
    try {
      const html = readFileSync(path.join(FIXTURES_DIR, fixture.htmlFile), "utf-8");
      await page.setContent(html, { waitUntil: "domcontentloaded" });
      profilePage = new ProfilePage(page, { url: `fixture://${fixture.name}` });
      profilePage.template = fixture.template;
      await profilePage.extractPage();
    } catch (err) {
      throw new Error("Extraction failed", { cause: err });
    }

    const outputPath = path.join(FIXTURES_DIR, `${fixture.name}-snapshot.ts`);

    let content: string;
    try {
      const raw = [
        `// AUTO-GENERATED — do not manually edit. Run \`yarn snapshots:update-profiles\` to regenerate.`,
        `import type { ScrapedAuthorData } from "#/db-types/author/author.types";`,
        `import type { ScrapedPlayData } from "#/db-types/play/play.types";`,
        ``,
        `export default ${JSON.stringify(profilePage.data, null, 2)} satisfies {`,
        `  biography: ScrapedAuthorData;`,
        `  works: ScrapedPlayData[];`,
        `};`,
        ``,
      ].join("\n");
      const prettierConfig = await prettier.resolveConfig(outputPath);
      content = await prettier.format(raw, { ...(prettierConfig ?? {}), parser: "typescript" });
    } catch (err) {
      throw new Error("Prettier formatting failed", { cause: err });
    }

    try {
      writeFileSync(outputPath, content, "utf-8");
    } catch (err) {
      throw new Error("File write failed", { cause: err });
    }

    console.log(`✅ Snapshot written: ${fixture.name}-snapshot.ts (${profilePage.data.works.length} works)`);
  } finally {
    await page.close();
  }
}

async function main(): Promise<void> {
  const browser = await firefox.launch();
  try {
    const failures: string[] = [];
    for (const fixture of FIXTURES) {
      console.log(`🔄 Generating snapshot for: ${fixture.name}`);
      try {
        await generateSnapshot(fixture, browser);
      } catch (err) {
        console.error(`❌ [${fixture.name}]`, err);
        failures.push(fixture.name);
      }
    }
    if (failures.length > 0) {
      console.error(`\n❌ Snapshots failed for: ${failures.join(", ")}`);
      process.exitCode = 1;
      return;
    }
    console.log("✅ All snapshots updated.");
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error("Failed to generate snapshots:", err);
  process.exit(1);
});
