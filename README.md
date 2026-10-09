# MDLSZ IDPA Season Analytics

Interactive Next.js dashboard and Python data pipeline for analyzing official Hungarian MDLSZ IDPA competition results, separated by season.

The intended production domain is `https://hero-of-idpa.hu`. Each generated season has
its own page (for example `/2025` or `/2026`), and `/` redirects to the latest available
season. The season navigation preserves the existing dashboard design.

## Stack

- Next.js 16
- TypeScript
- Tailwind CSS 4
- Framer Motion
- Recharts
- Lucide Icons
- Python data pipeline with Requests, BeautifulSoup, pdfplumber, PyMuPDF, and pandas

## Installation

```bash
npm install
python3 -m pip install -r requirements.txt
```

## Development

```bash
npm run dev
```

Open http://localhost:3000.

## Data Pipeline

The pipeline is designed to keep missing data and parsing failures visible instead of silently hiding them.

```bash
python3 scripts/discover-competitions.py --year 2025
python3 scripts/download-results.py --year 2025
python3 scripts/extract-pdfs.py --year 2025
python3 scripts/normalize-data.py --year 2025
python3 scripts/calculate-statistics.py --year 2025
```

Or run everything in sequence:

```bash
npm run pipeline:all -- --year 2025
npm run pipeline:all -- --year 2026
```

Every stage accepts `--year`; omitting it uses the current calendar year. The all-stage
runner forwards the same year to every stage and stops if a stage fails. Individual
npm commands also forward arguments, e.g. `npm run pipeline:stats -- --year 2025`.
Downstream stages require the previous stage's files for that year; they never read
another season's data. Generate all stages before building/publishing a new season.

### Pipeline Outputs

- `data/<year>/competitions.json`
- `data/<year>/raw-extracted-results.json`
- `data/<year>/results.json`
- `data/<year>/data-quality.json`
- `data/<year>/statistics.json`
- `data/<year>/pdfs/` (ignored by Git)
- `data/club-aliases.json` (shared across seasons)

Only complete seasons (competition, results, quality, and statistics files present)
are published. Unknown years return 404. Malformed JSON or mixed-year data fails the
build rather than displaying misleading empty statistics.

Existing root-level JSON remains readable as a legacy season, inferred from its
calendar URL or competition dates. New pipeline runs always use year directories;
once a directory exists for a legacy year, it takes precedence over root-level data.
Existing root-level files and PDFs are not moved or overwritten.

### Environment

Available settings:

- `MDLSZ_CALENDAR_URL` (direct calendar table URL; `--year` replaces its `year` query parameter)
- `MDLSZ_REQUEST_TIMEOUT`
- `MDLSZ_USER_AGENT`

The Python scripts read these from the process environment, not automatically from `.env`.

## Production

```bash
npm run build
npm start
```

Year pages are prerendered at build time from the locally generated JSON, with no
database or API. Rebuild after refreshing or adding seasons. Point the hosting
provider's custom-domain configuration at `hero-of-idpa.hu`; metadata alone does not
configure DNS or deploy the site.

## Refreshing Source Data

1. Run the discovery script with `--year <year>` to rebuild that season's IDPA competition list from the official MDLSZ calendar.
2. Run the download script to resolve every `Eredmények` link and fetch available PDFs.
3. Run extraction and normalization to rebuild normalized competitor rows and parsing diagnostics.
4. Run statistics calculation to regenerate leaderboard and insight data.
5. Review `data/<year>/data-quality.json` and `data/<year>/results.json` for parse errors, missing teams, and ambiguous identities before publishing.

## Notes Parsing

The normalization pipeline parses `Megjegyzések` values such as:

- `HU1018104 / 71,33`
- `HU1018104/71,33`
- `HU1018104 / 71.33`
- `HU1018104`
- `71,33`

The original raw value is preserved. Failed parsing is surfaced via `parseError` and the data quality report.

## Dashboard Features

- Premium dark analytics layout
- Separate season URLs, year navigation, and a latest-season homepage
- Global competition, division, club, and participation filters
- Top competitor leaderboard
- Club power and club strength ranking
- Competitor detail trends
- Competition timeline with source links
- Division, performance, and speed/consistency charts
- Methodology page
- Data quality dashboard

## Validation

Verified in this repository with:

```bash
python3 -m unittest discover -s tests -p 'test_*.py'
node --test tests/year-data.test.mjs
npm run lint
npm run build
```
