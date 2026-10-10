# Lövésznapló sportlövészeti statisztika

Next.js dashboard and Python data pipeline for Hungarian MDLSZ sportlövészeti
eredmények. The platform is designed for seven MDLSZ disciplines; only IDPA
currently has a validated parser, scoring model, and public season pages.

The planned canonical domain is `https://statisztika.lovesznaplo.hu`. Public IDPA
pages use `/idpa` and `/idpa/<year>` (for example `/idpa/2026`). The root page
introduces the platform and links only to published disciplines. Existing
`hero-of-idpa.hu/<year>` URLs permanently redirect to their `/idpa/<year>`
counterparts. DNS and Vercel domain configuration are not changed by this repository.

The public interface is in Hungarian (`lang="hu"`), with Hungarian date and number
formatting. Sporting terminology uses *divízió*, *egyesület*, *helyezés*, and
*dobogós helyezés*. Club Power is displayed as *egyesületi összpontszám* and
Club Strength as *tagok átlagpontszáma*. Missing values display *Nincs adat*.
Official names, division codes, source records, and original technical diagnostics
remain unchanged.

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
python3 scripts/discover-competitions.py --discipline idpa --year 2025
python3 scripts/download-results.py --discipline idpa --year 2025
python3 scripts/extract-pdfs.py --discipline idpa --year 2025
python3 scripts/normalize-data.py --discipline idpa --year 2025
python3 scripts/calculate-statistics.py --discipline idpa --year 2025
```

Or run everything in sequence:

```bash
npm run pipeline:all -- --discipline idpa --year 2025
npm run pipeline:all -- --discipline idpa --year 2026
```

Every stage accepts `--discipline` and `--year`; omitted values default to `idpa`
and the current local calendar year for CLI compatibility. Automation passes both
explicitly. The all-stage runner forwards both values and stops on failure.
Downstream stages reject missing or mismatched discipline/year/schema metadata.
Non-IDPA pipeline adapters are intentionally unavailable until their own result
parsers and analytics have been validated.

### Pipeline Outputs

- `data/<discipline>/<year>/competitions.json`
- `data/<discipline>/<year>/raw-extracted-results.json`
- `data/<discipline>/<year>/results.json`
- `data/<discipline>/<year>/data-quality.json`
- `data/<discipline>/<year>/statistics.json`
- `data/<discipline>/<year>/pdfs/` (ignored by Git)
- `data/club-aliases.json` (shared across seasons)

Each artifact records its discipline, season, and schema version. Only complete
seasons under a published discipline are prerendered. The repository currently
publishes IDPA seasons only; other registered sports and unknown years return 404.
Malformed JSON, mixed seasons, mixed disciplines, and unsupported schemas fail
instead of producing misleading empty statistics.

Historical season directories have been migrated into `data/idpa/<year>/`. Use
`python3 scripts/migrate-discipline-data.py --dry-run` to inspect future migrations.
Root-level legacy JSON/PDF files that overlap a published year are preserved in
`data/idpa/legacy-root/` and are never treated as a public season.

### Environment

Available settings:

- `MDLSZ_CALENDAR_URL` (direct calendar table URL; `--year` replaces its `year` query parameter)
- `MDLSZ_REQUEST_TIMEOUT`
- `MDLSZ_USER_AGENT`

The Python scripts read these from the process environment, not automatically from `.env`.

### Design assets

The wordmark and display fonts use locally hosted Barlow Condensed and DM Sans font
files distributed under the Open Font License; their license notices are in
`public/licenses/`. Official MDLSZ and IDPA organization marks and the seven MDLSZ
discipline logos in `public/logos/` are locally hosted source artwork linked to
official federation pages. Their file-to-source mapping is recorded in
`docs/asset-sources.md`. They are not endorsements or sponsorship claims.

## Production

```bash
npm run build
npm start
```

Discipline and season pages are prerendered from local JSON, with no database or API.
Rebuild after refreshing or adding seasons. Canonical metadata is configured for
`statisztika.lovesznaplo.hu`; a Vercel domain and DNS cutover still require
configuration in Vercel and at the DNS provider.

### Vercel domain cutover

1. In the existing Vercel project, add `statisztika.lovesznaplo.hu` and apply the
   exact DNS record value shown by Vercel. Do not change the `lovesznaplo.hu`
   apex or its mail records.
2. Keep `hero-of-idpa.hu` and, if used, `www.hero-of-idpa.hu` assigned to the
   same project so `proxy.ts` can map legacy IDPA URLs directly to their new
   canonical paths. Do not configure a blanket domain redirect; it would lose
   the discipline path mapping.
3. Verify TLS, `/idpa`, `/idpa/2026`, `/idpa/methodology`, sitemap and robots on
   the new host. Verify legacy home, methodology, and each old season path return
   a single `308` to the exact new-host destination. Unknown old paths remain 404.
4. Configure the GitHub Actions secrets/variable listed under [Scheduled refresh](#scheduled-refresh).
   Only then enable the monthly data publisher and its production smoke check.
5. Verify the old and new hosts in Search Console, submit the canonical sitemap,
   and retain the old-host redirects for at least one year, preferably indefinitely.

The host/domain and DNS cutover is an operator action; the code does not change
Vercel project settings, DNS, Search Console, or certificates.

## Refreshing Source Data

### Scheduled refresh

The `Refresh current season` GitHub Actions workflow runs on the **1st of every
month at 04:00 UTC**, within the first week of the month. On `main`, it can also
be run manually for the IDPA adapter with an optional season year.

The workflow selects the current year in the `Europe/Budapest` time zone, runs the
pipeline in an isolated staging directory, validates the results, runs regression
tests and a production build, and only then commits the five generated JSON files
under `data/idpa/<year>/` to `main`. If the fetch, extraction, validation, tests, or
build fail, the prior published season data is unchanged. Diagnostic PDF/result
parsing issues remain visible; empty, mixed-season, or mixed-discipline snapshots
are not promoted.

Before enabling the workflow, configure these GitHub Actions secrets and variable:

- Secret `VERCEL_DEPLOY_HOOK_URL`: Deploy Hook URL for the production project and `main`.
- Secret `VERCEL_TOKEN`: read-only-capable Vercel API token to inspect deployment status.
- Secret `VERCEL_PROJECT_ID`: Vercel project ID for this application.
- Optional secret `VERCEL_TEAM_ID`: Vercel team ID for team-scoped projects.
- Variable `PUBLIC_SITE_URL`: `https://statisztika.lovesznaplo.hu`.

After publishing data, the action first checks whether the Git push already caused a
production deployment. If not, it triggers the Deploy Hook, waits for a `READY`
deployment associated with the published commit, and smoke-tests the canonical
season URL. Missing configuration, failed builds, and failed smoke tests are
reported as workflow failures. No hook URL or token is stored in the repository.
No deployment is triggered when generated data has not changed.

Keep Vercel's Git integration connected because Deploy Hooks depend on it. The
workflow detects a Git-triggered deployment before requesting a hook, to avoid
duplicate production builds. GitHub schedule execution can be delayed; the first
day's run uses Budapest local time to select the year.

### Manual refresh

1. Run the discovery script with `--discipline idpa --year <year>` to rebuild that season's IDPA competition list from the official MDLSZ calendar.
2. Run the download script to resolve every `Eredmények` link and fetch available PDFs.
3. Run extraction and normalization to rebuild normalized competitor rows and parsing diagnostics.
4. Run statistics calculation to regenerate leaderboard and insight data.
5. Run `python3 scripts/validate-season.py --data-dir data --discipline idpa --year <year>` and review `data/idpa/<year>/data-quality.json` and `data/idpa/<year>/results.json` for parse errors, missing teams, and ambiguous identities before publishing.

## Notes Parsing

The normalization pipeline parses `Megjegyzések` values such as:

- `HU1018104 / 71,33`
- `HU1018104/71,33`
- `HU1018104 / 71.33`
- `HU1018104`
- `71,33`

The original raw value is preserved. Failed parsing is surfaced via `parseError` and the data quality report.

## Dashboard Features

- Championship-editorial season dashboard
- Fixed two-row filters and section navigation with mobile disclosure
- Full-width season hero and latest season totals
- MDLSZ and IDPA organization links, plus official MDLSZ discipline logo directory
- Separate season URLs, year navigation, and a latest-season homepage
- Competition, division, and club filters
- Top competitor leaderboard
- Club power and club strength ranking
- Competitor detail trends
- Competition timeline with source links
- Division, performance, and speed/consistency charts with season-scope labels
- Methodology page
- Data quality dashboard

## Validation

Verified in this repository with:

```bash
python3 -m unittest discover -s tests -p 'test_*.py'
node --test tests/year-data.test.mjs
node --test tests/site-navigation.test.mjs
npm run lint
npm run build
```
