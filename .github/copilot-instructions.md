# doollee-archivist

A TypeScript/Node.js scraper that archives playwright data from doollee.com into MongoDB. Uses Playwright for browser automation, Jest for testing, and a MongoDB JSON schema validator for document integrity.

## Build and Test

```sh
npm run build:noEmit   # type-check without emitting
npm run build          # compile TypeScript
npm test               # run unit tests (*.spec.ts)
npm run test:int       # run integration tests (*.int.ts)
npm run test:all       # run all tests
npm run test:coverage  # coverage report
npm run lint           # ESLint
npm run format         # Prettier
```

Database setup (requires running MongoDB):
```sh
npm run db:init        # initialize collections with schema validators
npm run db:reset       # drop and reinitialize
```

## Architecture

See `docs/cli-design.md` for the scraping pipeline overview.

### Scraping Pipeline

Author data flows through these stages:
1. **HTML** — fetched by Playwright, stored as fixture HTML in `src/page-models/ProfilePage/__test__/fixtures/`
2. **Biography classes** — `StandardBiography` (`#osborne` template) or `AdaptationBiography` (`#table` template), both extending `BaseBiography` — produce `ScrapedAuthorData`
3. **`Author` class** — normalizes `ScrapedAuthorData` into `AuthorData`
4. **`toDocument()`** — produces `AuthorDocument` for MongoDB, pruned by `removeEmptyFields` (`src/utils/dbUtils.ts`)

Two page templates exist on doollee.com. Template is detected at runtime by locator visibility in `ProfilePage.goto()`.

### Key Modules

| Path | Purpose |
|------|---------|
| `src/page-models/ProfilePage/Biography/` | Biography scrapers (see below) |
| `src/db-types/author/` | Author class, schema, types |
| `src/db-types/play/` | Play class, schema, types |
| `src/core/` | Config, DatabaseService, WebScraper, ModuleWriter |
| `src/utils/` | dbUtils, isbnUtils, stringUtils, debounce |
| `src/page-models/ProfilePage/__test__/fixtures/` | HTML + expected TS fixtures for integration tests |
| `analysis/` | CSV field-presence and frequency reports from prior scrape runs |

### Biography Module Structure

```
Biography/
  __BaseBiography.ts       — abstract base; parseLabeledContent, normalizeBiography, normalizeHtmlString, parseDateString
  StandardBiography.ts     — #osborne template; parseBiography, parseDates
  AdaptationBiography.ts   — #table template; parseAdaptationNameAndDates, getAltName
  index.ts
  __test__/
    __BaseBiography.spec.ts
    StandardBiography.spec.ts
    AdaptationBiography.spec.ts
```

## Conventions

### Naming
See `docs/naming.md`. Key points:
- DB collection entries use `displayName` (normalized) and `name` (raw scraped heading)
- Author file slugs follow doollee's own URL convention

### File Structure
- Co-located `__test__/` directories alongside source files, with `.spec.ts` suffix
- Integration tests use `.int.ts` suffix and live alongside unit tests
- `index.ts` barrel exports at module boundaries

### Testing Patterns
- Subclass-based test helpers (e.g. `TestBiography extends BaseBiography`) to expose `protected` methods
- Private methods that need testing are promoted to `protected`
- Mock pages use `jest.fn<EvaluateFn>().mockResolvedValue(...)` to simulate `page.evaluate()`
- Shared fixture variables declared at `describe` scope; `beforeEach` for instance setup
- `#MethodName` convention for describe block names when testing a specific method

### TypeScript
- Exported types for scraped/parsed data shapes that tests need to import (e.g. `ScrapedData`, `ParsedDates` from `StandardBiography.ts`)
- `removeEmptyFields` prunes `undefined`, `""`, `"n/a"`, and `"-"` before DB writes — don't defensively set fields to these values expecting them to persist
- Path alias `#/` maps to `src/` (configured in `tsconfig.json` and `jest.config.js`)

## Known Data Quality Issues

See `analysis/` CSVs for field-presence reports from the last scrape run (February 2026, ~2154 authors).

- **ISBN corpus**: Many ISBNs on doollee are malformed, truncated, or contain adjacent non-ISBN text. Logged as `ISBN13_BAD`, `ISBN10_BAD`, or `NEEDS_REVIEW`; suspect values go to `output/review-queue/`.
- **`address` / `telephone`**: Present in the HTML label map but no author in the corpus had a real value — all `n/a`. Fields are retained defensively.
- **`yearBorn` sparsity**: Only ~326/2154 authors have `yearBorn`. Many living authors have no date or a single year without a dash range — `parseDateString` handles both range `(1950 - 2008)` and single-year `(1950)` formats.
- **`_archive` fidelity**: Currently `_archive` stores processed (normalized) values, not raw scraped HTML. Deferred decision — do not add normalization to `_archive` fields without resolving this intentionally.
- **HTML entities in biography**: `normalizeBiography` strips tags and decodes `&nbsp;` but does not decode other HTML entities (e.g. `&gt;&gt;&gt;`). Deferred — intentional archival behavior vs. human-readable text is unresolved.
- **Parts text format variants**: Parser expects `Male: N Female: N Other: N`; partial formats (e.g. `Male: 3` only) cause logged scraping errors.
