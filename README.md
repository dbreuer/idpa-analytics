# MDLSZ IDPA 2025 Season Analytics

Interactive Next.js dashboard and Python data pipeline for analyzing official Hungarian MDLSZ IDPA 2025 competition results.

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
python -m pip install -r requirements.txt
```

## Development

```bash
npm run dev
```

Open http://localhost:3000.

## Data Pipeline

The pipeline is designed to keep missing data and parsing failures visible instead of silently hiding them.

```bash
python scripts/discover-competitions.py
python scripts/download-results.py
python scripts/extract-pdfs.py
python scripts/normalize-data.py
python scripts/calculate-statistics.py
```

Or run everything in sequence:

```bash
npm run pipeline:all
```

### Pipeline Outputs

- `/home/runner/work/idpa-analytics/idpa-analytics/data/competitions.json`
- `/home/runner/work/idpa-analytics/idpa-analytics/data/raw-extracted-results.json`
- `/home/runner/work/idpa-analytics/idpa-analytics/data/results.json`
- `/home/runner/work/idpa-analytics/idpa-analytics/data/data-quality.json`
- `/home/runner/work/idpa-analytics/idpa-analytics/data/statistics.json`
- `/home/runner/work/idpa-analytics/idpa-analytics/data/club-aliases.json`
- `/home/runner/work/idpa-analytics/idpa-analytics/data/pdfs/`

### Environment

Copy `.env.example` to `.env` if you need to override defaults.

```bash
cp .env.example .env
```

Available settings:

- `MDLSZ_CALENDAR_URL`
- `MDLSZ_REQUEST_TIMEOUT`
- `MDLSZ_USER_AGENT`
- `NEXT_PUBLIC_SITE_NAME`

## Production

```bash
npm run build
npm start
```

## Refreshing Source Data

1. Run the discovery script to rebuild the 2025 IDPA competition list from the official MDLSZ calendar.
2. Run the download script to resolve every `Eredmények` link and fetch available PDFs.
3. Run extraction and normalization to rebuild normalized competitor rows and parsing diagnostics.
4. Run statistics calculation to regenerate leaderboard and insight data.
5. Review `data/data-quality.json` and `data/results.json` for parse errors, missing teams, and ambiguous identities before publishing.

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
npm run lint
npm run build
```
