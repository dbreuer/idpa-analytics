# Data Pipeline Design

Notes on the non-obvious parts of the `scripts/` pipeline. Read this before changing
`extract-pdfs.py`, `normalize-data.py`, or `common.py`.

## Stages

1. `discover-competitions.py` — scrapes the selected discipline calendar rows into `data/<discipline>/<year>/competitions.json`.
2. `download-results.py` — resolves each competition's `Eredmények` link and downloads the result PDF into `data/<discipline>/<year>/pdfs/`.
3. `extract-pdfs.py` — extracts raw tables from each PDF into `data/<discipline>/<year>/raw-extracted-results.json`.
4. `normalize-data.py` — turns raw tables into per-competitor rows in `data/<discipline>/<year>/results.json`, plus `data/<discipline>/<year>/data-quality.json`.
5. `calculate-statistics.py` — aggregates `results.json` into `data/<discipline>/<year>/statistics.json`.

All stages accept `--discipline <slug>` and `--year <year>` (defaults: IDPA and current
year). Discovery, downloads, extraction, and normalization support all seven MDLSZ
discipline slugs. `common.parse_pipeline_args()` resolves discipline- and year-specific
paths; `run-pipeline.py` runs the first four stages for every discipline. It runs
`calculate-statistics.py` only for IDPA; other disciplines finish with
`validate-ingestion.py` and do not get scoring output. Club aliases remain shared in
`data/club-aliases.json`.
PDF paths in competition JSON are relative to the season directory (`pdfs/<id>.pdf`).
Missing required inputs stop downstream stages rather than generating empty output.
Every generated JSON payload includes top-level `discipline`, `year`, and
`schemaVersion`. Stage inputs must match the selected discipline/year and supported
schema before processing.

The public dashboard has discipline-specific IDPA and IPSC analytics; only IDPA
uses the `statistics.json` scoring artifact. `validate-season.py` is the publication gate for refreshed IDPA data:
it checks source errors, valid matching
discipline/year metadata, non-empty competitions/results, result-to-competition
references, quality counters, and the pipeline summary before a staged snapshot can
replace the build's copy. Parsing errors and individual missing/failed result PDFs
remain in the quality data for review; an empty or mis-scoped snapshot cannot replace
the published season.

For non-IDPA disciplines, `scripts/validate-ingestion.py` checks source, extraction,
normalized result, and quality payload scope and references. It does not write a
`statistics.json`. IPSC standings are computed separately from normalized source
rows at page generation; no IDPA or cross-sport score is inferred.

Historical IDPA files live in `data/idpa/<year>/`. Run
`scripts/migrate-discipline-data.py --dry-run` before repeating the scoped layout
migration. The legacy root-level snapshot that overlapped 2026 is archived under
`data/idpa/legacy-root/` and is deliberately excluded from published season lookup.

## Calendar source

The public page `https://mdlsz.com/versenynaptar-2025/` does not contain the calendar
table itself — the table is rendered inside an `<iframe src="https://portal.mdlsz.com/racecalendar?year=2025">`.
The URL built by `common.pipeline_paths()` must point at that iframe endpoint directly,
since the scraper does not execute JavaScript or render iframes. `MDLSZ_CALENDAR_URL`
can override the endpoint, but the requested year's query parameter always takes
precedence. Discovery only accepts rows from that year whose official discipline
label matches the selected slug's exact or normalized aliases.

## Result PDF table layout

The PyMuPDF fallback uses the supported `pymupdf` import rather than the deprecated
`fitz` alias.

The shared Hungarian result format used by IDPA, IMSSU, GyorsPont, Steel Challenge,
IPRF, and Gyorskombinált prints **one table per division**, with metadata above the
real column header. This layout is shared by the current IDPA, IMSSU, GyorsPont,
Steel Challenge, Gyorskombinált és Precíziós, and IPRF result PDFs. Those normalized
records preserve their source result values but do not inherit the IDPA scoring model.

```
Szervező:   <club>          Szakág:        IDPA
Helyszín:   <location>      Verseny típus: <type>
Dátum:      <date>          Divízió:       SSP - Gyári szolgálati pisztoly
Sorszám  Név  V.eng.  Egyesület  Eredmény  Találatok száma  %  Megjegyzés
1        ...
2        ...
```

IPSC PDFs may use either `Match Results - <division>` tables or the Hungarian
metadata/header layout. `extract_ipsc_with_pdfplumber()` detects the relevant header,
maps divisions from the heading or metadata, carries them across continuation pages,
and records a diagnostic rather than treating metadata rows as competitor results.
Normalized records preserve official placements, license identifiers, match points,
percentage, classification, power factor and raw columns; these values do not become
IDPA score components.

The IPSC page ranks each competitor separately in each division. It uses only
Level 1–3 matches with at least two unique competitor identities and an official
placement. For a field of `n` competitors, a placement `r` receives
`100 × (n − r) / (n − 1)`, clamped to 0–100; tied positions use their average
rank. A season value is the arithmetic mean of these match percentiles. Official
license IDs are preferred for identity matching, with normalized names as fallback.
License exams, missing divisions/placements, and single-competitor fields are
excluded from standings and reported separately.

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
