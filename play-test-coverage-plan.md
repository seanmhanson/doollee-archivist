## Plan: Unit Tests for WorksList

Add unit test coverage for `WorksList` following the `Biography` pattern exactly: test helper subclasses, `createMockPage` factories, and private→protected promotions for method-level access. Iterative — write tests, confirm bugs, fix source.

---

### Phase 1 — Source Modifications *(prerequisite for Phases 2b and 2c)*

1. `PlaysList.ts` — promote `parseParts` `private` → `protected`; export `ScrapedPlayRow` type; change throw on malformed parts text to `console.warn` + `return null` so a single bad-format string does not silently empty the entire author's play list
2. `AdaptationsList.ts` — promote `parseOriginalAuthor` and `parseParts` `private` → `protected`; export `ScrapedAdaptationRow` type and `UnparsedParts` type
3. `__BaseWorksList.ts` — no changes
4. `Play.class.ts` — remove 5 dead private methods: `parseProductionDetails`, `parsePublicationDetails`, `extractIsbn`, `processPartsString`, `extractParts` — all unreachable; the constructor assigns pre-parsed fields directly from `input`. Before removing, note that `extractIsbn` set `needsReview: true` for invalid ISBNs (vs. only warning in `__BaseWorksList`) — deferred decision in Phase 3 bug 6

### Phase 2a — `__BaseWorksList.spec.ts` *(no source dependencies)*

`class TestWorksList extends BaseWorksList` exposing all protected methods publicly.

- `constructor / create` — `worksData` starts empty; `create()` calls `extractData()`
- `#getPlayId` — trims id; falls back to `"0000000"` for falsy
- `#normalizeStringFields` — applies `checkScrapedString` on strings; preserves non-string values
- `#parseProductionDetails`:
  - empty/blank → `{ productionLocation: "", productionYear: "" }`
  - text with `>>>` → `>>>` removed from `productionLocation`
  - phrase with embedded date (e.g. `"National Theatre, London 15 Nov 1978"`) → year **not** extracted; date stays in `productionLocation` verbatim *(confirms critical bug)*
  - bare year only (e.g. `"1978"`) → extracted into `productionYear`; `productionLocation` empty
  - bare day-month-year (e.g. `"17 Dec 1968"`) → extracted into `productionYear`
- `#parsePublicationDetails`:
  - blank → empty fields
  - `publisherException` text → empty fields
  - valid ISBN13 → extracted into `isbn`; removed from publisher string
  - invalid ISBN → warns; removed from string; `isbn` not set
  - `includeISBN: false` → `isbn` field absent from result
  - publisher with embedded year (e.g. `"Nick Hern Books, London, 1998 -"`) → year **not** extracted; `publicationYear` is `""` *(confirms critical bug)*
  - publisher that is only a year after ISBN removal → extracted into `publicationYear`
- `#formatPlayId` — `"A"` prefix for adaptations; no prefix for plays; fallback `"0000000"`
- `#formatISBN` — strips `"ISBN"`, `"ISBN-"`, `"ISBN:"` prefixes; trims
- `#formatReference` / `#formatOrganizations` — removes `>>>`, normalizes whitespace
- `#formatDisplayTitle` — `", The"` / `", A"` / `", An"` moved to front with title case; plain title → title case
- `#formatGenres` — title case; empty → empty; multi-value strings with `. - -` separators (e.g. `"Play/drama. - - Gay, Full Length"`) → title case applied wholesale *(documents behavior)*
- `#parseCount` — `"-"` → `0`; `""` → `0`; integer string → integer; `"extras"` / `"doubling"` → `0`; `"6 m/f"` → `6` (parseInt truncation — real corpus values)

### Phase 2b — `PlaysList.spec.ts` *(depends on Phase 1 step 1)*

`createMockPage(rows: ScrapedPlayRow[])` factory; `class TestPlaysList extends PlaysList` exposing `parseParts`, `scrapeData`, `extractData`.

- `#extractData / #scrapeData` — 1-2 real rows from DB (`_archive._type: "play"` with `isbn`, `productionLocation`, and parts all present); verifies full transformation pipeline including `_archive` shape
- `#parseParts`:
  - standard `"Male: N Female: N Other: N"` → correct counts and texts
  - no digits → `null`
  - all zero/dash/empty → `{}`
  - digits but wrong pattern → returns `null` and logs warning *(verifies Phase 1 step 1 fix)*

### Phase 2c — `AdaptationsList.spec.ts` *(depends on Phase 1 step 2)*

`createMockPage(rows: ScrapedAdaptationRow[])` factory; `class TestAdaptationsList extends AdaptationsList` exposing `parseParts`, `parseOriginalAuthor`, `scrapeTableData`, `extractData`.

- `#extractData / #scrapeTableData` — 1-2 real rows from DB (`_archive._type: "adaptation"` with `originalAuthor`, `productionLocation` with `>>>`, and parts); verifies `displayTitle`, `adaptingAuthor` title case, `_archive`, and that `productionLocation` retains `>>>` *(confirms moderate bug)*
- `#parseOriginalAuthor`:
  - `"Original Playwright - Name"` → `"Name"`
  - `"Original Playwright - Name; extra info"` → `"Name"` (stops at `;`)
  - `"Original Playwright - Name. Extra sentence; more info"` → exposes greedy-match bug *(captures through period)*
  - no match → `""`
- `#parseParts`:
  - standard counts → correct fields
  - all empty → `{}`
  - `"6 m/f"` → `partsCountOther: 6`; `"extras"` → `partsCountOther: 0`

### Phase 3 — Iterative Bug Resolution *(after each spec file)*

Confirmed bugs, in priority order:
1. **Critical** — `publicationYear` never extracted (0/7,643): anchored `^YEAR$` pattern in `parsePublicationDetails` fails on embedded years
2. **Critical** — `productionYear` rarely extracted (270/7,643): same anchored-pattern issue in `parseProductionDetails` for location-prefixed strings
3. **Moderate** — `productionLocation` retains `>>>` in `AdaptationsList` (confirmed by CSV)
4. **Moderate** — `parseOriginalAuthor` greedy regex captures beyond the author name
5. **Fixture** — `pinter-harold-expected.ts` has `isbn: ""` where `"9780571288403"` should be extracted
6. **Decision** — `__BaseWorksList.parsePublicationDetails` only warns for invalid ISBNs; deleted `Play.class.ts` `extractIsbn` set `needsReview: true`. Decide whether to carry `needsReview` forward (likely yes)

---

**Relevant files**
- `__BaseWorksList.ts` — base methods under test; no changes needed
- `PlaysList.ts` — promote `parseParts`; export `ScrapedPlayRow`; fix throw → warn+null
- `AdaptationsList.ts` — promote 2 methods; export `ScrapedAdaptationRow`, `UnparsedParts`
- `Play.class.ts` — remove 5 dead methods
- `__BaseBiography.spec.ts` — reference: `TestBiography` helper class pattern
- `StandardBiography.spec.ts` — reference: `createMockPage` + subclass pattern
- `pinter-harold-expected.ts` — fix `isbn` field
- `euripides-expected.ts` — may update `productionLocation` after bug fix

**Verification**
1. `npm run build:noEmit` — no type errors after Phase 1
2. `npm test` — all 207 existing tests pass before new spec files are added
3. New tests pass, or expose bugs fixed in Phase 3
4. `npm run lint` — clean

**Decisions**
- Integration tests and `ProfilePage` out of scope
- `*-expected.ts` fixtures not assumed accurate; updated as bugs are confirmed
- Both critical date-extraction bugs confirmed by tests before source is changed
- `PlaysList.parseParts` malformed-format path: throw → warn + `return null`
- `Play.class.ts` dead methods removed without replacement

---

## Outcome Summary
All 277 tests passing across 19 suites

### Phase 1 — Source Prep

- `PlaysList.ts`: promoted `parseParts` to protected, exported `ScrapedPlayRow`, changed `throw → console.warn + return null`
- `AdaptationsList.ts`: promoted `parseOriginalAuthor`/`parseParts` to protected, exported `UnparsedParts`/`ScrapedAdaptationRow`
- `Play.class.ts`: removed 5 dead methods + unused imports; added `displayTitle` field (previously silently dropped)
`play.types.ts`: added `displayTitle?: string` to `PlayDocument`

### Phase 2 — Spec File Creation

- `__BaseWorksList.spec.ts` — tests `TestBaseWorksList` helper class covering all 10 protected methods
- `PlaysList.spec.ts` — tests `parseParts` and `extractData` end-to-end via `createMockPage`
- `AdaptationsList.spec.ts` — tests `parseOriginalAuthor`, `parseParts`, and `extractData` end-to-end

### Phase 3 — Bugs Fixed

- `AdaptationsList.extractData()`: raw parts: `UnparsedParts` leaked through `...adaptation` — fixed by destructuring it as `parts: rawParts` and spreading flat into `_archive` instead
- `DATE_PATTERNS`: all anchored with `^/$` — patterns only matched when the entire string was a date, never extracted from within production/publication text — fixed with `\b` word boundaries
- `formatISBN`: didn't handle ISBN-13: / ISBN-10: prefix format — fixed regex to `/ISBN(?:-\d+)?\s*:?\s*/i`
- `parsePublicationDetails`: removed ISBN digits but left the `ISBN:` label text in the publisher string — fixed by also stripping the label after digit removal