import type { AuthorData } from "../author.types";

const defaults = {
  name: "David Mamet",
  scrapedAt: new Date(),
  sourceUrl: "https://www.doollee.com/PlaywrightsM/mamet-david.php",
  listingName: "MAMET David",
  headingName: "DAVID MAMET",
  altName: "David Mamet",
  nationality: "USA",
  email: "damnitmamet@example.co.uk",
  website: "https://damnitmamet.co.uk",
  literaryAgent: "Abrams Artists Agency  UK representative the Agency (London) Ltd",
  biography: `BA. English Literature, Goddard College, VT, 1969. Special Lecturer, Drama, Marlboro College, VT.`,
  research: "Member of the Dramatists Guild of America (as at 2015)",
  address: "Mr. David Mamet, 275 Doollee Avenue, LONDON, NW10 1JN, UNITED KINGDOM",
  telephone: "020-7946-0111",
  yearBorn: "1947",
  yearDied: "2047",
};

function getAuthorFixture(overrides: Partial<AuthorData> = {}): AuthorData {
  const authorData = { ...defaults, ...overrides };
  const { yearBorn, yearDied, scrapedAt, sourceUrl, listingName, headingName, ...archiveData } = authorData;
  return {
    _archive: {
      dates: `(${yearBorn ?? ""} - ${yearDied ?? ""})`,
      ...archiveData,
    },
    ...authorData,
  };
}

function getExpectedArchive(fixture: AuthorData) {
  return {
    dates: `(${fixture.yearBorn} - ${fixture.yearDied})`,
    name: fixture.name,
    altName: fixture.altName,
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

function getExpectedRawFields({ listingName, headingName, altName }: AuthorData) {
  return {
    listingName,
    headingName,
    altName,
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

export {
  getAuthorFixture,
  getExpectedArchive,
  getExpectedWorksData,
  getExpectedBiographyData,
  getExpectedRawFields,
  getFixtureMetadata,
};
