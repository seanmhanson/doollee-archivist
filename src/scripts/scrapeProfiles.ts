import WebScraper from "#/core/WebScraper";
import ModuleWriter from "#/core/ModuleWriter";

/** page models */
import ProfilePage from "#/page-models/ProfilePage";

/** input data */
import profileUrls from "#/input/profileUrls";

function constructUrl([, profileSlug]: [string, string]): string {
  const firstLetter = profileSlug.charAt(0).toUpperCase();
  return `https://www.doollee.com/Playwrights${firstLetter}/${profileSlug}.php`;
}

async function main() {
  // for local only testing
  console.debug = () => {};

  const playwrightDir = "playwrights";
  const playDir = "plays";
  const scraper = await WebScraper.create();

  // const allMetadata: any = {};
  // let totalFiles = 0;
  // let totalPlaywrights = 0;
  // let totalPlays = 0;

  const playwrightModuleWriter = await ModuleWriter.create(playwrightDir);
  const playModuleWriter = await ModuleWriter.create(playDir);

  for (const [profileName, profileSlug] of Object.entries(profileUrls)) {
    const url = constructUrl([profileName, profileSlug]);
    console.log(
      `🔄 Scraping playwright page for ${profileName}, profile slug ${profileSlug}...`
    );
    const profilePage = new ProfilePage(scraper.getPage(), { url });
    await profilePage.goto();
    await profilePage.extractPage();
    const { biographyData } = profilePage;
    const { worksData } = profilePage;

    // write author
    const profileFilename = `${profileSlug}.ts`;
    const profileData = {
      metadata: {
        timeStamp: new Date().toISOString(),
        url,
      },
      data: { biographyData },
    };
    await playwrightModuleWriter.writeFile({
      filename: profileFilename,
      data: profileData,
      stringify: true,
      fileType: "ts",
    });

    // write plays
    for (const work of worksData) {
      const playId = work.playId || "000000";
      const truncatedName = work.title
        .substring(0, 12)
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9\-]/g, "");
      const playFilename = `${playId}-${truncatedName}.json`;

      const playFileData = {
        metadata: {
          timeStamp: new Date().toISOString(),
          url,
        },
        data: { worksData },
      };
      await playModuleWriter.writeFile({
        filename: playFilename,
        data: playFileData,
        stringify: true,
        fileType: "json",
      });
    }
  }
  await playModuleWriter.close();
  await playwrightModuleWriter.close();
}

main().catch(console.error);
