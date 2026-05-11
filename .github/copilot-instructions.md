# doollee-archivist

A TypeScript/Node.js scraper that archives playwright data from doollee.com into MongoDB. Uses Playwright for browser automation, Jest for testing, and a MongoDB JSON schema validator for document integrity.

## Build and Test

```sh
yarn build:noEmit   # type-check without emitting
yarn build          # compile TypeScript
yarn test           # run unit tests (*.spec.ts)
yarn test:int       # run integration tests (*.int.ts)
yarn test:all       # run all tests
yarn test:coverage  # coverage report
yarn lint           # ESLint
yarn format         # Prettier
```

Database setup (requires running MongoDB):
```sh
yarn db:init        # initialize collections with schema validators
yarn db:reset       # drop and reinitialize
```

## Architecture

### Project Phases

This repository currently implements Phase 1. Subsequent phases are planned but not yet in scope for this codebase.

- **Phase 1 — Scraping**: Fetch author and play data from doollee.com using Playwright; perform first-pass normalization; write normalized documents and archive documents to MongoDB. Flag anomalous data for manual and automatic review.
- **Phase 2 — Normalization**: Refine document structure for MongoDB Atlas Search; build analytical tools for frequency tables and descriptive stats; use review data and proportional analysis to improve normalization rules and build a synonym library.
- **Phase 3 — Database**: Deploy to MongoDB Atlas; configure security and Atlas Search; validate for reliability and correctness.
- **Phase 4 — Web App**: Next.js application with server-facilitated search, filtering, and browsing; archive inspection UI; attribution and information pages.

### Scraping Pipeline

Author data flows through these stages:
1. **HTML** — fetched from doollee.com by Playwright; integration tests use static HTML fixtures stored in `src/page-models/ProfilePage/__test__/fixtures/`
2. **Biography classes** — `StandardBiography` (`#osborne` template) or `AdaptationBiography` (`#table` template), both extending `BaseBiography` — produce `ScrapedAuthorData`
3. **`Author` class** — normalizes `ScrapedAuthorData` into `AuthorData`
4. **`toDocument()`** — produces `AuthorDocument` for the `authors` collection
5. **`toArchiveDocument()`** — produces `AuthorArchiveDocument` for the `author_archives` collection (same `_id` as the author document)

Both methods pass their output through `removeEmptyFields` (`src/utils/dbUtils.ts`) before returning. Plays follow the same pattern.

The optional `id` parameter on `Play.toArchiveDocument(id?)` handles `_id` parity on re-scrapes (the play upsert uses `returnDocument: "after"` to get the persisted `_id` before writing the archive).

Two page templates exist on doollee.com. Template is detected at runtime by locator visibility in `ProfilePage.goto()`.

### Intended Database Usage

The intended workflow is **scrape → write to MongoDB directly**. The database is treated as an append/upsert target, not an editable store. Modifying documents after they are written (outside of re-scraping) is not in scope: the source of truth is doollee.com, and scraping is only repeated until the normalization phase is complete. Do not suggest or implement tooling for manual DB edits, bulk updates, or field migrations unless explicitly requested.

### Key Modules

| Path | Purpose |
|------|---------|
| `src/page-models/ProfilePage/Biography/` | Biography scrapers (see below) |
| `src/db-types/author/` | Author class, schema, types, archive types/schema |
| `src/db-types/play/` | Play class, schema, types, archive types/schema |
| `src/core/` | Config, DatabaseService, WebScraper, ModuleWriter |
| `src/utils/` | dbUtils, isbnUtils, stringUtils, debounce |
| `src/page-models/ProfilePage/__test__/fixtures/` | HTML + expected TS fixtures for integration tests |
| `analysis/` | CSV field-presence and frequency reports from prior scrape runs |

Each `db-types/<entity>/` module contains:
- `<entity>.types.ts` — document and input types
- `<entity>.schema.ts` — MongoDB `$jsonSchema` validator for the main collection
- `<entity>-archive.types.ts` — archive document type
- `<entity>-archive.schema.ts` — MongoDB `$jsonSchema` validator for the archive collection
- `<entity>.class.ts` — class with `toDocument()` and `toArchiveDocument()`

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

### Verification Standards

Before considering any changeset complete, run these steps in order and confirm each passes:

1. **Unit tests** — `yarn test` — all `.spec.ts` tests must pass
2. **Type check** — `yarn build:noEmit` — no TypeScript errors
3. **Lint** — `yarn lint` — no ESLint errors
4. **Format** — `yarn format` — run Prettier over all changed files
5. **Integration tests** — run the integration tests relevant to the changeset (see below)

**Determining relevant integration tests:**
For each changed file, walk up the directory tree from that file toward the project root. At each level, check for a `__test__/` directory and collect any `*.int.ts` files found there. Run all collected integration tests.

Example: a change to `src/page-models/ProfilePage/WorksList/PlaysList.ts` should run:
- `src/page-models/ProfilePage/WorksList/__test__/*.int.ts`
- `src/page-models/ProfilePage/__test__/*.int.ts`
- `src/page-models/__test__/*.int.ts`
- `src/__test__/*.int.ts`

GitHub Actions enforces the full integration test suite (`yarn test:int`) on every push. Local verification only requires the traversal-scoped subset.

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
- When a suite broadly shares one test instance, declare it as `let instance: T` at the root `describe` scope and assign it in a single root-level `beforeEach`; do not repeat `beforeEach` in nested `describe` blocks or construct instances inline
- When an instance needs to be created in many different configurations across tests, define a factory function that accepts override props and spreads them after defaults, rather than repeating construction logic
- Group multiple `expect` calls into a single `it` block when they test the same behavior across trivially similar inputs
- `#MethodName` convention for describe block names when testing a specific method

### TypeScript
- Regex patterns are declared as named constants at the top of the relevant block, not used inline. This gives them semantic meaning at the call site. Patterns shared across multiple files belong in `src/patterns.ts`; single-use patterns are declared locally.
- Exported types for scraped/parsed data shapes that tests need to import (e.g. `ScrapedData`, `ParsedDates` from `StandardBiography.ts`)
- `removeEmptyFields` prunes `undefined`, `""`, `"n/a"`, and `"-"` from all document output — applied by `toDocument()` and `toArchiveDocument()` on both author and play classes. Don't defensively set fields to these values expecting them to persist
- Path alias `#/` maps to `src/` (configured in `tsconfig.json` and `jest.config.js`)

### Post-Plan Execution
When a plan is approved and ready to execute, follow the git/GitHub workflow defined in `.github/instructions/plan-execution.instructions.md` — branch setup before execution, staged commits, self-review, and opening a pull request.

## Known Data Quality Issues

See `analysis/` CSVs for field-presence reports from the last scrape run (February 2026, ~2154 authors).

- **ISBN corpus**: Many ISBNs on doollee are malformed, truncated, or contain adjacent non-ISBN text. Logged as `ISBN13_BAD`, `ISBN10_BAD`, or `NEEDS_REVIEW`; suspect values go to `output/review-queue/`.
- **`address` / `telephone`**: Present in the HTML label map but no author in the corpus had a real value — all `n/a`. Fields are retained defensively.
- **`yearBorn` sparsity**: Only ~326/2154 authors have `yearBorn`. Many living authors have no date or a single year without a dash range — `parseDateString` handles both range `(1950 - 2008)` and single-year `(1950)` formats.
- **Archive fidelity**: `author_archives` and `play_archives` store processed (normalized) values, not raw scraped HTML. This was a deferred decision that remains unresolved — do not add normalization to archive fields without resolving this intentionally.
- **HTML entities in biography**: `normalizeBiography` strips tags and decodes `&nbsp;` but does not decode other HTML entities (e.g. `&gt;&gt;&gt;`). Deferred — intentional archival behavior vs. human-readable text is unresolved.
- **Parts text format variants**: Parser expects `Male: N Female: N Other: N`; partial formats (e.g. `Male: 3` only) cause logged scraping errors.
