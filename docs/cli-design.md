# CLI Design

## Mock

```
╒═══════════════════════════════════════════════════════════════════════╕
│ Doollee Archivist Author & Works Scraper                              │
╘═══════════════════════════════════════════════════════════════════════╛
┌─ Time Started:  HH:MM:SS       ┌─ Batch Size:     4444
└─ Duration:     HHH:MM:SS       └─ Total Batches:  3333

┌─ Current Batch:    333 /  333  (lastname10 - lastname10)
├─ Current Author:  4444 / 4444  (/Playwrights1/slugname10)
└─ Current Play:     333 /  333

          ┌─────── Current Batch ───────┐ ┌─────── All Batches ─────────┐
          │ Written │ Skipped │ Flagged │ │ Written │ Skipped │ Flagged │
┌─────────┼─────────┼─────────┼─────────┤ ├─────────┼─────────┼─────────┤
│ Authors │   4444  │   4444  │   4444  │ │   55555 │   55555 │   55555 │
│ Plays   │   55555 │   55555 │   55555 │ │  666666 │  666666 │  666666 │
└─────────┴─────────┴─────────┴─────────┘ └─────────┴─────────┴─────────┘

┌─ Log Output: output/2026-01-15T17:31:25.869Z.log
├─ 55555 Warnings  /  55555 Errors
└─ Tail:
  [23:59:59] WARN: ProfilePage extraction failed for author-name
  [23:59:59] ERROR: Cannot locate biography section on page
  [23:59:59] INFO: Retrying with fallback template detection
```

### Sizing Note

- **75** column max, **23** row max including three line tailed log meets conservative console size constraints

## Data Required

#### Global Scope

- start time
- time elapsed
- global batch size (i.e. authors per batch)
- batch count

#### Current Status

- current batch index
- current author index (for current batch)
- author count (for current batch)
- current play index (for current author)
- play count (for current author)
- first author's name
- last author's name
- current author's slug (or url)

#### Author Reporting

- total authors written per batch
- total authors skipped per batch
- total authors written with "needs review" flag per batch
- total authors written
- total authors skipped
- total authors written with "needs review" flag

#### Plays Reporting

- total plays written per batch
- total plays skipped per batch
- total plays written with "needs review" flag per batch
- total plays with "adaptation" flag per batch
- total plays written
- total plays skipped
- total plays written with "needs review" flag
- total plays with "adaptation" flag

#### Logging

- log directory
- warnings logged count
- errors logged count
- last logged line(s)
- tail length if configurable
