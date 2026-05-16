import type { AuthorData } from "../author.types";

const defaults = {
  headingName: "DAVID MAMET",
  altName: "David Mamet",
};

const commonData = {
  name: "David Mamet",
  nationality: "USA",
  email: "damnitmamet@example.co.uk",
  website: "https://damnitmamet.co.uk",
  literaryAgent: "Abrams Artists Agency  UK representative the Agency (London) Ltd",
  biography: `BA. English Literature, Goddard College, VT, 1969. Special Lecturer, Drama, Marlboro College, VT.`,
  research: "Member of the Dramatists Guild of America (as at 2015)",
  address: "Mr. David Mamet, 275 Doollee Avenue, LONDON, NW10 1JN, UNITED KINGDOM",
  telephone: "020-7946-0111",
};

const authorOnlyData = {
  yearBorn: 1947,
  yearDied: 2047,
  scrapedAt: new Date(),
  sourceUrl: "https://www.doollee.com/PlaywrightsM/mamet-david.php",
  listingName: "MAMET David",
};

function getAuthorFixture(
  overrides: Partial<AuthorData> & { headingName?: string; altName?: string } = {},
): AuthorData {
  const { headingName: nameOverride, altName: altNameOverride, ...authorOverrides } = overrides;
  const authorData = { ...commonData, ...authorOnlyData, ...authorOverrides };
  const altName = altNameOverride ?? defaults.altName;
  const _archive = {
    ...commonData,
    dates: `(${authorData.yearBorn} - ${authorData.yearDied})`,
    name: nameOverride ?? defaults.headingName,
    ...(altName !== undefined ? { altName } : {}),
  };

  return {
    _archive,
    ...authorData,
  };
}

function getExpectedArchive(fixture: AuthorData) {
  return {
    dates: `(${fixture.yearBorn} - ${fixture.yearDied})`,
    name: fixture._archive.name,
    altName: fixture._archive.altName,
    listingName: fixture.listingName,
    biography: fixture.biography,
    nationality: fixture.nationality,
    email: fixture.email,
    website: fixture.website,
    literaryAgent: fixture.literaryAgent,
    research: fixture.research,
    address: fixture.address,
    telephone: fixture.telephone,
  };
}

function getExpectedBiographyData(fixture: AuthorData) {
  return {
    yearBorn: fixture.yearBorn,
    yearDied: fixture.yearDied,
    nationality: fixture.nationality,
    email: fixture.email,
    website: fixture.website,
    literaryAgent: fixture.literaryAgent,
    biography: fixture.biography,
    research: fixture.research,
    address: fixture.address,
    telephone: fixture.telephone,
  };
}

function getExpectedWorksData() {
  return {
    playIds: [],
    adaptationIds: [],
    doolleePlayIds: [],
  };
}

function getFixtureMetadata(fixture: AuthorData) {
  return {
    scrapedAt: fixture.scrapedAt,
    sourceUrl: fixture.sourceUrl,
    createdAt: fixture.scrapedAt,
    updatedAt: fixture.scrapedAt,
  };
}

export { getAuthorFixture, getExpectedArchive, getExpectedWorksData, getExpectedBiographyData, getFixtureMetadata };
