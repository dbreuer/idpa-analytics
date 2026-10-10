# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Hungarian sport shooters comparing their season performance.

## Product Purpose

Lövésznapló Statisztika presents traceable, season-by-season analytics for MDLSZ
shooting disciplines. All seven listed disciplines support source discovery, PDF
extraction, and normalized ingestion. IDPA is the only discipline with validated
scoring and public season rankings.

## Positioning

The dashboard builds comparisons from official MDLSZ calendar and competition
result sources, while exposing source links, data-quality counts, and parsing
issues instead of presenting untraceable rankings.

## Operating Context

The Python pipeline discovers competitions from the MDLSZ calendar, downloads
official result PDFs, extracts and normalizes result rows, and computes season
statistics. The static Next.js site publishes discipline-scoped pages such as `/idpa/2026`
from isolated `data/<discipline>/<year>/` records.

## Capabilities and Constraints

- Competitor standings filtered by competition, division, and club.
- Season leaderboards, trends, charts, competition results, derived insights,
  methodology, and data-quality reporting.
- Season inputs and computed dashboard data are JSON generated locally by the
  repository's data pipeline; the dashboard does not depend on a database or API.
- Keep discipline and season data isolated, preserve the existing IDPA scoring and
  analytics semantics, and never apply them to another sport without its validated
  scoring rules. Until then, retain normalized source results without computed
  rankings or public season reports.
  and link derived results to available official sources.
- Do not fabricate unavailable years, results, organization relationships, or
  performance claims.

## Brand Commitments

- The platform is **Lövésznapló Statisztika** at the planned canonical host
  `statisztika.lovesznaplo.hu`. IDPA season dashboards retain the **Hero of IDPA**
  identity. Legacy IDPA URLs redirect to discipline-scoped URLs.
- MDLSZ and IDPA are linked as governing organizations, not represented as product
  sponsors or endorsers.
- Use the official MDLSZ marks and discipline artwork only in their actual linked
  organizational context; preserve their appearance and link to official sources.

## Evidence on Hand

- Official MDLSZ race-calendar data and linked result PDFs, processed by the
  pipeline and retained with source links.
- Discipline/year JSON files under `data/`, including normalized results, statistics,
  discovery errors, and data-quality counts.
- Official MDLSZ organization and discipline pages and supplied image URLs are
  recorded in the approved Hero of IDPA redesign plan in the session workspace.

## Product Principles

- Make season-level performance comparisons useful to competitors.
- Prefer official, attributable source data over unsupported claims.
- Surface missing, ambiguous, or failed source processing rather than hiding it.
- Keep years separate; only publish complete seasons.
