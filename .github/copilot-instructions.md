# IDPA Analytics — Project Guidelines

## Architecture

Two independent parts in one repo:

- **Dashboard**: Next.js 16 + TypeScript app (`app/`, `components/`, `lib/`) that reads static JSON from `data/` — it does not talk to a database or API.
- **Data pipeline**: Python scripts (`scripts/`) that scrape the MDLSZ IDPA calendar, download result PDFs, extract tables, normalize them, and compute statistics. Each stage writes its output JSON into `data/` for the next stage (and for the dashboard) to consume.

See `docs/data-pipeline-design.md` for the PDF table layout and parsing design — read it before touching `scripts/extract-pdfs.py` or `scripts/normalize-data.py`.

## Build and Test

```bash
npm install
python3 -m pip install -r requirements.txt
npm run dev            # dashboard dev server
npm run lint
npm run build
```

Run the full data pipeline:

```bash
npm run pipeline:all
```

Or individual stages, in order (each depends on the previous stage's output in `data/`):

```bash
python3 scripts/discover-competitions.py
python3 scripts/download-results.py
python3 scripts/extract-pdfs.py
python3 scripts/normalize-data.py
python3 scripts/calculate-statistics.py
```

## Conventions

- Use `python3`, not `python` — `python` is not guaranteed to be on `PATH` in this environment (the `npm run pipeline:*` scripts use `python` and may need a shim/alias locally).
- Shared helpers (paths, HTTP session, text/key normalization, header/metadata parsing) live in `scripts/common.py` — add reusable pipeline logic there rather than duplicating it per script.
- The pipeline favors surfacing bad data over silently dropping it: parsing failures go into `parsingErrors` / `data-quality.json` rather than being skipped quietly. Keep this behavior when editing normalization logic.
- `CALENDAR_URL` must point directly at the calendar table endpoint (`https://portal.mdlsz.com/racecalendar?year=<year>`), not the wrapper page that embeds it in an iframe.
