---
name: mongodb-query
description: 'Query, inspect, or analyze the doollee-archivist MongoDB database. Use when asked to look up documents, run aggregations, check field values, verify data quality, or investigate what is stored in the authors or plays collections.'
argument-hint: 'Describe what to query or inspect in the database'
---

# MongoDB Query

## When to Use
- Looking up specific author or play documents
- Running aggregations or field-presence analysis
- Verifying data quality or investigating stored values
- Checking what was written to the DB after a scrape run

## Connection

The project connects via `MONGO_URI` and `DB_NAME` environment variables loaded from `.env` by `src/core/Config.ts`. The `DatabaseService` class (`src/core/DatabaseService.ts`) wraps the MongoClient and manages the connection lifecycle.

**Do not connect directly** — use `DatabaseService` or write a short `ts-node` script using the project's existing config pattern (see below).

## Procedure

### 1. Check `.env` is present and MongoDB is running

```sh
cat .env | grep -E "MONGO_URI|DB_NAME"
```

### 2. Write a short query script

Use `ts-node` with the path alias register. Template:

```ts
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const client = new MongoClient(process.env.MONGO_URI!);
await client.connect();
const db = client.db(process.env.DB_NAME);

// --- your query here ---
const result = await db.collection("authors").find({ yearBorn: { $exists: true } }).limit(5).toArray();
console.log(JSON.stringify(result, null, 2));
// ---

await client.close();
```

Run with:
```sh
ts-node -r tsconfig-paths/register <script-path>.ts
```

### 3. Prefer existing scripts when available

| Task | Command |
|------|---------|
| Re-initialize schema validators | `npm run db:init` |
| Drop and reinitialize | `npm run db:reset` |

## Collections

| Collection | Document type | Key fields |
|------------|--------------|------------|
| `authors` | `AuthorDocument` | `displayName`, `name`, `yearBorn`, `yearDied`, `nationality`, `biography`, `literaryAgent`, `website`, `email`, `playIds`, `_archive` |
| `plays` | `PlayDocument` | `title`, `authorId`, `genres`, `parts`, `publishingInfo`, `productionInfo`, `isbn`, `_archive` |

## Notes
- `removeEmptyFields` (`src/utils/dbUtils.ts`) strips `undefined`, `""`, `"n/a"`, and `"-"` before writes — absent fields were empty at scrape time
- `_archive` stores processed (not raw HTML) values — a known deferred issue, do not assume it is raw
- Schema validators are defined in `src/db-types/author/author.schema.ts` and `src/db-types/play/play.schema.ts`
