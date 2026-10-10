# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

IDPA competitors comparing their season performance.

## Product Purpose

Hero of IDPA presents season-by-season analytics for Hungarian IDPA competition
results so competitors can compare their performance across the season.

## Positioning

The dashboard builds comparisons from official MDLSZ calendar and competition
result sources, while exposing source links, data-quality counts, and parsing
issues instead of presenting untraceable rankings.

## Operating Context

The Python pipeline discovers competitions from the MDLSZ calendar, downloads
official result PDFs, extracts and normalizes result rows, and computes season
statistics. The static Next.js site publishes a separate page for each generated
season, such as `/2026`.

## Capabilities and Constraints

- Competitor standings filtered by competition, division, and club.
- Season leaderboards, trends, charts, competition results, derived insights,
  methodology, and data-quality reporting.
- Season inputs and computed dashboard data are JSON generated locally by the
  repository's data pipeline; the dashboard does not depend on a database or API.
- Keep season data isolated, preserve the current scoring and analytics semantics,
  and link derived results to available official sources.
- Do not fabricate unavailable years, results, organization relationships, or
  performance claims.

## Brand Commitments

- The web product name is **Hero of IDPA** and it is hosted for `hero-of-idpa.hu`.
- MDLSZ and IDPA are linked as governing organizations, not represented as product
  sponsors or endorsers.
- Use the official MDLSZ marks and discipline artwork only in their actual linked
  organizational context; preserve their appearance and link to official sources.

## Evidence on Hand

- Official MDLSZ race-calendar data and linked result PDFs, processed by the
  pipeline and retained with source links.
- Season JSON files under `data/`, including normalized results, statistics,
  discovery errors, and data-quality counts.
- Official MDLSZ organization and discipline pages and supplied image URLs are
  recorded in the approved Hero of IDPA redesign plan in the session workspace.

## Product Principles

- Make season-level performance comparisons useful to competitors.
- Prefer official, attributable source data over unsupported claims.
- Surface missing, ambiguous, or failed source processing rather than hiding it.
- Keep years separate; only publish complete seasons.
