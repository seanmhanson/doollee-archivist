#!/usr/bin/env python3
"""
Generate a retry input JSON file from the scraper error log CSV.

Usage:
    python3 src/scripts/admin/generate-retry-list.py [OPTIONS]

Options:
    --csv PATH         Path to the summary CSV (default: downloads the last one from ~/Downloads)
    --filter CATEGORY  Error category to filter on. One or more of:
                         write-author-error, scraping-error, write-play-error,
                         page-eval-error, gif-loading-error, pool-cleared-error,
                         304, 404, all-errors
                       (default: all-errors, excluding 404s)
    --output PATH      Output JSON file path (default: output/retry-<timestamp>.json)
    --exclude-404      Exclude 404 slugs even when using all-errors (default: True)

Examples:
    # All recoverable errors (default), excluding 404s
    python3 src/scripts/admin/generate-retry-list.py --csv ~/Downloads/Scraper\ Error\ Logs\ -\ SUMMARY.csv

    # Only write-author-errors
    python3 src/scripts/admin/generate-retry-list.py --csv ... --filter write-author-error

    # Scraping errors (strict mode violations only, not 404s)
    python3 src/scripts/admin/generate-retry-list.py --csv ... --filter scraping-error --exclude-404

Then run the scraper with:
    RETRY_FILE=output/retry-<timestamp>.json yarn scrape
"""

import argparse
import csv
import json
import os
import sys
from datetime import datetime, timezone

FILTER_COLUMNS = {
    "write-author-error": "WRITE_AUTHOR_ERROR",
    "scraping-error": "SCRAPING_ERROR",
    "write-play-error": "WRITE_PLAY_ERROR",
    "page-eval-error": "PAGE_EVAL_ERROR",
    "gif-loading-error": "GIF_LOADING_ERROR",
    "pool-cleared-error": "POOL_CLEARED_ERROR",
    "304": "304_NOT_MODIFIED",
    "404": "404_NOT_FOUND",
}


def parse_args():
    parser = argparse.ArgumentParser(description="Generate retry input JSON from error log CSV.")
    parser.add_argument("--csv", required=True, help="Path to the summary CSV file")
    parser.add_argument(
        "--filter",
        dest="filters",
        nargs="+",
        choices=list(FILTER_COLUMNS.keys()) + ["all-errors"],
        default=["all-errors"],
        help="Error categories to include",
    )
    parser.add_argument("--output", help="Output JSON file path")
    parser.add_argument(
        "--exclude-404",
        action="store_true",
        default=True,
        help="Exclude 404 slugs (default: True)",
    )
    return parser.parse_args()


def slug_to_key(slug: str) -> str:
    """Strip .php suffix if present."""
    return slug.removesuffix(".php")


def main():
    args = parse_args()

    if not os.path.isfile(args.csv):
        print(f"Error: CSV file not found: {args.csv}", file=sys.stderr)
        sys.exit(1)

    use_all = "all-errors" in args.filters
    active_columns = (
        list(FILTER_COLUMNS.values())
        if use_all
        else [FILTER_COLUMNS[f] for f in args.filters]
    )

    result: dict[str, str] = {}
    skipped_404 = 0
    seen: set[str] = set()

    with open(args.csv, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            slug = row["PROFILE_SLUG"]
            if slug in seen:
                continue
            seen.add(slug)

            is_404 = row.get("404_NOT_FOUND") == "TRUE"
            if args.exclude_404 and is_404:
                skipped_404 += 1
                continue

            matches = any(row.get(col) == "TRUE" for col in active_columns)
            if not matches:
                continue

            name = row.get("REF_PROFILE_NAME", "").strip()
            clean_slug = slug_to_key(slug)

            if not name:
                # Fall back to slug-derived name if REF_PROFILE_NAME is empty
                name = clean_slug

            result[name] = clean_slug

    if not result:
        print("No matching entries found.", file=sys.stderr)
        sys.exit(1)

    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H-%M-%S")
    output_path = args.output or f"output/retry-{timestamp}.json"
    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)

    print(f"Written {len(result)} entries to {output_path}")
    if skipped_404:
        print(f"Skipped {skipped_404} entries with 404_NOT_FOUND=TRUE")
    print(f"\nTo re-scrape, run:")
    print(f"  RETRY_FILE={output_path} yarn scrape")


if __name__ == "__main__":
    main()
