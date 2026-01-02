import WebScraper from "#/core/WebScraper";
import ModuleWriter from "#/core/ModuleWriter";
import ProfilePage from "#/page-models/ProfilePage";
import profileUrls from "#/input/profileUrls";
import Author from "#/db-types/author/Author.class";

function constructUrl([, profileSlug]: [string, string]): string {
  const firstLetter = profileSlug.charAt(0).toUpperCase();
  return `https://www.doollee.com/Playwrights${firstLetter}/${profileSlug}.php`;
}

async function main() {
  /** Configuration for debugging/testing locally */
  console.debug = () => {};
  const timestamp = new Date().toTimeString().slice(0, 8).replace(/:/g, "");
  const playwrightDir = `${timestamp}-playwrights`;

  const scraper = await WebScraper.create();
  const playwrightModuleWriter = await ModuleWriter.create(playwrightDir);

  for (const [profileName, profileSlug] of Object.entries(profileUrls)) {
    const url = constructUrl([profileName, profileSlug]);
    console.log(`🔄 Scraping playwright page for ${profileName}, profile slug ${profileSlug}...`);
    const profilePage = new ProfilePage(scraper.getPage(), { url });
    await profilePage.goto();
    await profilePage.extractPage();

    const authorData = {
      ...profilePage.biographyData,
      scrapedAt: new Date(),
      sourceUrl: url,
    };

    const authorDocument = new Author(authorData).toDocument();

    await playwrightModuleWriter.writeFile({
      filename: `${profileSlug}.ts`,
      stringify: true,
      fileType: "ts",
      data: authorDocument,
    });

    console.log(`✅ bio data written to file: ${profileName}`);
  }
  await playwrightModuleWriter.close();
  await scraper.close();
}

main().catch(console.error);
