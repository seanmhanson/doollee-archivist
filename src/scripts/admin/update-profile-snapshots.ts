import { readFileSync, writeFileSync } from "fs";
import path from "path";

import { firefox } from "playwright";
import prettier from "prettier";

import type { ReviewNote } from "#/review-notes";

import ProfilePage from "#/page-models/ProfilePage";
import { REVIEW_NOTES } from "#/review-notes";

const FIXTURES_DIR = path.join(__dirname, "..", "..", "page-models", "ProfilePage", "__test__", "fixtures");

const FIXTURES = [
  { name: "pinter-harold", template: "standard" as const, htmlFile: "pinter-harold.html" },
  { name: "euripides", template: "adaptations" as const, htmlFile: "euripides.html" },
];

type Fixture = (typeof FIXTURES)[number];
type BrowserInstance = Awaited<ReturnType<typeof firefox.launch>>;

// Build a reverse lookup: compact JSON fingerprint -> "REVIEW_NOTES.KEY"
const REVIEW_NOTE_REFS = Object.entries(REVIEW_NOTES).reduce<Record<string, string>>((acc, [key, note]) => {
  acc[JSON.stringify(note)] = `REVIEW_NOTES.${key}`;
  return acc;
}, {});

const PLACEHOLDER_PREFIX = "__REVIEW_NOTE__";

/**
 * JSON replacer that substitutes known ReviewNote objects with placeholder strings.
 * The placeholders are later replaced with REVIEW_NOTES.* constant references so
 * that the generated snapshot file imports and references the shared registry.
 */
function reviewNoteReplacer(_key: string, value: unknown): unknown {
  if (value && typeof value === "object" && !Array.isArray(value) && "reason" in (value as ReviewNote)) {
    const ref = REVIEW_NOTE_REFS[JSON.stringify(value)];
    if (ref) return `${PLACEHOLDER_PREFIX}${ref}`;
  }
  return value;
}

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
      const serialized = JSON.stringify(profilePage.data, reviewNoteReplacer, 2);
      // Replace quoted placeholder strings with bare REVIEW_NOTES.* constant references
      const withConstants = serialized.replace(/"__REVIEW_NOTE__(REVIEW_NOTES\.[^"]+)"/g, "$1");
      const hasReviewNotes = withConstants.includes("REVIEW_NOTES.");

      const raw = [
        `// AUTO-GENERATED — do not manually edit. Run \`yarn snapshots:update-profiles\` to regenerate.`,
        `import type { ScrapedAuthorData } from "#/db-types/author/author.types";`,
        `import type { ScrapedPlayData } from "#/db-types/play/play.types";`,
        ...(hasReviewNotes ? [`import { REVIEW_NOTES } from "#/review-notes";`] : []),
        ``,
        `export default ${withConstants} satisfies {`,
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
