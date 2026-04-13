import type { PlayData, PlayArchive } from "../play.types";

const defaults = {
  playId: "27977",
  title: "Betrayal",
  altTitle: "",
  scrapedAt: new Date(),
  sourceUrl: "https://www.doollee.com/PlaywrightsP/pinter-harold.php",
  originalAuthor: "Harold Pinter",
  genres: "Drama 9 scenes",
  synopsis:
    "the play begins in the present, with the meeting of Emma and Jerry, whose adulterous affair of seven years ended two years earlier.",
  notes: "",
  organizations: "",
  music: "",
  reference: "",
  publisher: "Eyre Methuen, London, 1978 -",
  publicationYear: "",
  containingWork: "",
  isbn: "",
  productionLocation: "National Theatre, London 15 Nov 1978",
  productionYear: "",
  publishingInfo: "Eyre Methuen, London, 1978 -",
  productionInfo: "National Theatre, London 15 Nov 1978",
  partsTextMale: "3",
  partsTextFemale: "1",
  partsTextOther: "-",
  partsCountMale: 3,
  partsCountFemale: 1,
  partsCountOther: 0,
  partsCountTotal: 4,
};

function getPlayArchive(overrides: Partial<PlayData> = {}): PlayArchive {
  const data = { ...defaults, ...overrides };
  return {
    _type: "play",
    playId: data.playId,
    title: data.title,
    altTitle: data.altTitle,
    synopsis: data.synopsis,
    notes: data.notes,
    production: data.productionInfo,
    organizations: data.organizations,
    publisher: data.publishingInfo,
    music: data.music,
    genres: data.genres,
    parts: `Male: ${data.partsTextMale} Female: ${data.partsTextFemale} Other: ${data.partsTextOther}`,
    reference: data.reference,
  };
}

function getPlayFixture(overrides: Partial<PlayData> = {}): PlayData {
  const data = { ...defaults, ...overrides };
  const _archive = overrides._archive ?? getPlayArchive(overrides);

  return {
    _archive,
    ...data,
  };
}

function getAdaptationFixture(overrides: Partial<PlayData> = {}): PlayData {
  const adaptationDefaults: Partial<PlayData> = {
    playId: "133441",
    title: "A Bacchae",
    originalAuthor: "Euripides",
    adaptingAuthor: "Jay Miller",
    genres: "adaptation",
    synopsis: "A free adaptation of The Bacchae.",
    notes: "Original Playwright - Euripides",
  };

  const data = { ...defaults, ...adaptationDefaults, ...overrides };
  const _archive: PlayArchive = overrides._archive ?? {
    _type: "adaptation",
    playId: data.playId,
    title: data.title,
    adaptingAuthor: data.adaptingAuthor,
    productionLocation: data.productionLocation,
    productionYear: data.productionYear,
    organizations: data.organizations,
    publisher: data.publisher,
    isbn: data.isbn,
    music: data.music,
    genres: data.genres,
    notes: data.notes,
    synopsis: data.synopsis,
    reference: data.reference,
  };

  return {
    _archive,
    ...data,
  };
}

function getExpectedAuthorData(fixture: PlayData) {
  return {
    author: fixture.originalAuthor ?? "",
    authorId: fixture.authorId,
    adaptingAuthor: fixture.adaptingAuthor,
  };
}

function getExpectedMainData(fixture: PlayData) {
  return {
    genres: fixture.genres,
    synopsis: fixture.synopsis,
    notes: fixture.notes,
    organizations: fixture.organizations,
    music: fixture.music,
    reference: fixture.reference,
  };
}

function getExpectedPublicationData(fixture: PlayData) {
  return {
    publisher: fixture.publisher,
    publicationYear: fixture.publicationYear,
    containingWork: fixture.containingWork,
    isbn: fixture.isbn,
  };
}

function getExpectedProductionData(fixture: PlayData) {
  return {
    productionLocation: fixture.productionLocation,
    productionYear: fixture.productionYear,
  };
}

function getExpectedPartsData(fixture: PlayData) {
  return {
    partsTextMale: fixture.partsTextMale,
    partsTextFemale: fixture.partsTextFemale,
    partsTextOther: fixture.partsTextOther,
    partsCountMale: fixture.partsCountMale,
    partsCountFemale: fixture.partsCountFemale,
    partsCountOther: fixture.partsCountOther,
    partsCountTotal: fixture.partsCountTotal,
  };
}

export {
  getPlayFixture,
  getAdaptationFixture,
  getPlayArchive,
  getExpectedAuthorData,
  getExpectedMainData,
  getExpectedPublicationData,
  getExpectedProductionData,
  getExpectedPartsData,
};
