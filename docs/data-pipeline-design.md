# Data Pipeline Design

Notes on the non-obvious parts of the `scripts/` pipeline. Read this before changing
`extract-pdfs.py`, `normalize-data.py`, or `common.py`.

## Stages

1. `discover-competitions.py` — scrapes the MDLSZ calendar table and writes `data/<year>/competitions.json`.
2. `download-results.py` — resolves each competition's `Eredmények` link and downloads the result PDF into `data/<year>/pdfs/`.
3. `extract-pdfs.py` — extracts raw tables from each PDF into `data/<year>/raw-extracted-results.json`.
4. `normalize-data.py` — turns raw tables into per-competitor rows in `data/<year>/results.json`, plus `data/<year>/data-quality.json`.
5. `calculate-statistics.py` — aggregates `results.json` into `data/<year>/statistics.json` for the dashboard.

All stages accept `--year <year>` (default: current year). `common.parse_pipeline_args()`
resolves year-specific paths and the calendar URL; `run-pipeline.py` runs all five
stages with the same year. Club aliases remain shared in `data/club-aliases.json`.
PDF paths in competition JSON are relative to the season directory (`pdfs/<id>.pdf`).
Missing required inputs stop downstream stages rather than generating empty output.
Generated JSON includes a top-level `year`.

## Calendar source

The public page `https://mdlsz.com/versenynaptar-2025/` does not contain the calendar
table itself — the table is rendered inside an `<iframe src="https://portal.mdlsz.com/racecalendar?year=2025">`.
The URL built by `common.pipeline_paths()` must point at that iframe endpoint directly,
since the scraper does not execute JavaScript or render iframes. `MDLSZ_CALENDAR_URL`
can override the endpoint, but the requested year's query parameter always takes
precedence. Discovery only accepts calendar rows from that year.

## Result PDF table layout

Each result PDF prints **one table per division**, and each table has a metadata block
above the real column header:

```
Szervező:   <club>          Szakág:        IDPA
Helyszín:   <location>      Verseny típus: <type>
Dátum:      <date>          Divízió:       SSP - Gyári szolgálati pisztoly
Sorszám  Név  V.eng.  Egyesület  Eredmény  Találatok száma  %  Megjegyzés
1        ...
2        ...
```

The division only appears in that metadata block — there is no per-row division column.
`common.split_table_rows()` splits a raw extracted table into:

- `metadata` — label/value pairs (`organizer`, `location`, `date`, `discipline`,
  `competitionType`, `division`) parsed via `parse_metadata_row` / `METADATA_KEYS`.
- `header` / `headerMap` — the real column header row, detected as the first row where
  `identify_header()` finds both a `name` and a `placement` column.
- `rows` — everything after the header row.

`parse_division_code()` turns the raw division text into a short code: text before
`-` is used verbatim (`"SSP - Gyári szolgálati pisztoly"` → `SSP`), except a few
divisions that only print an English name with no code, which are mapped explicitly in
`DIVISION_NAME_TO_CODE` (e.g. `"Carry Optic"` → `CO`).

## Continuation pages

When a division's table spans multiple PDF pages, only the **first** page repeats the
metadata block and header row — continuation pages start directly with data rows, and
have no header of their own. `extract_with_pdfplumber` / `extract_with_pymupdf` track
`last_header` / `last_header_map` / `last_metadata` across pages of the same PDF and
reuse them whenever a page's table has no detected header, so continuation rows aren't
misread as a header (which used to silently drop the first row of every continuation
page) and keep the correct division/column mapping.

## Why `category` can be `None`

`normalize-data.py` only fills `category` when `identify_header()` actually finds a
category-like column (`kategoria`/`kategória`) in that PDF's header row. Earlier code
guessed a fixed column index as a fallback, which — combined with the metadata-block bug
above — silently pulled in unrelated values (e.g. `"IDPA"` from the `Szakág:` metadata
row). Most current result PDFs have no category column, so `None` here is expected, not
a bug.
