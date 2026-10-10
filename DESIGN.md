---
name: Hero of IDPA
description: Season analytics presented as a traceable championship editorial record.
colors:
  primary: "#a82e2c"
  primary-deep: "#852321"
  primary-wash: "#f2e5df"
  neutral-bg: "#f3f0e8"
  paper: "#faf9f5"
  paper-raised: "#fffefa"
  paper-deep: "#ebe7dd"
  ink: "#1a1b19"
  ink-muted: "#5d605c"
  rule: "#d4d0c6"
  chart-grid: "#dedacf"
  chart-ink: "#5f605b"
  chart-teal: "#176a63"
  chart-gold: "#976b17"
  chart-purple: "#675381"
  chart-blue: "#285e78"
  chart-gray: "#65655e"
  chart-orange: "#b86e28"
  chart-slate: "#4d7181"
  footer-accent: "#e07868"
  footer-copy: "#d0cec8"
  footer-muted: "#aaa8a2"
typography:
  display:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "clamp(3.6rem, 9.2vw, 7rem)"
    fontWeight: 800
    lineHeight: 0.82
    letterSpacing: "-0.055em"
  headline:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "clamp(2rem, 4.5vw, 3rem)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
  body:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "0.67rem"
    fontWeight: 700
    letterSpacing: "0.14em"
rounded:
  none: "0px"
  sm: "2px"
  md: "10.4px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
    padding: "8px 16px"
  report-card:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.none}"
    padding: "20px"
  filter-control:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  filter-count:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.paper}"
    rounded: "{rounded.sm}"
    padding: "2px 6px"
  navigation-active:
    textColor: "{colors.ink}"
    size: "44px"
  discipline-link:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
    padding: "8px"
---

# Design System: Hero of IDPA

## Overview

**Creative North Star: "The Championship Record"**

Hero of IDPA reads each season as a traceable championship editorial record. A
full-width season masthead, measured totals, open report grids, official links, and
restrained data plots make rankings legible without presenting them as free-floating
claims. The audience is competitors comparing a season of official Hungarian IDPA
results.

Warm opaque paper, championship ink, hairline rules, and a precise red signal form
the page's reusable grammar. Display lettering carries the competition identity;
ordinary interface work remains easy to read and operate. Section links, live
season filters, year-specific routes, quality warnings, and official result sources
are functional parts of the record.

**Key Characteristics:**
- Full-bleed season masthead; centered editorial reading measure below.
- Opaque warm-paper surfaces and ruled, mostly square-corner reports.
- Championship red marks current state, standings, source links, and plot series.
- Reproducible season totals and rankings remain tied to official sources.
- Official organization marks retain their original artwork and attribution.

## Colors

Warm ivory and ink carry most of the interface; red is a scarce championship
signal. Muted categorical chart colors distinguish series without competing with
the interface accent.

### Primary
- **Championship red** (`{colors.primary}`): current navigation underline, podium rank, ranking scoreline, and first plot series.
- **Deep source red** (`{colors.primary-deep}`): readable text-link emphasis on paper and footer copy hierarchy where appropriate.
- **Pale competition wash** (`{colors.primary-wash}`): selected/hovered report rows and pipeline/source warning surfaces.

### Secondary
- **Measured teal** (`{colors.chart-teal}`) and **competition gold** (`{colors.chart-gold}`): chart series only.
- **Plot purple** (`{colors.chart-purple}`), **plot blue** (`{colors.chart-blue}`), **plot gray** (`{colors.chart-gray}`), **plot orange** (`{colors.chart-orange}`), and **plot slate** (`{colors.chart-slate}`): additional categorical series, not interface accents.

### Neutral
- **Warm canvas** (`{colors.neutral-bg}`): full-page ground.
- **Soft paper** (`{colors.paper}`): header, inputs, and report surfaces.
- **Raised paper** (`{colors.paper-raised}`): report rows and light plates behind official marks.
- **Deep paper** (`{colors.paper-deep}`): filter rail and season masthead.
- **Championship ink** (`{colors.ink}`) and **muted ink** (`{colors.ink-muted}`): primary and secondary content.
- **Rule gray** (`{colors.rule}`): report dividers and input borders.
- **Plot grid** (`{colors.chart-grid}`) and **plot ink** (`{colors.chart-ink}`): chart grid and supplemental annotation.
- **Footer coral** (`{colors.footer-accent}`), **footer copy** (`{colors.footer-copy}`), and **footer subdued copy** (`{colors.footer-muted}`): ink-footer wordmark and secondary details.

**The Scoreline Rule.** Red identifies an active navigation state, a source link, a
ranking or a chart series. Keep it functional rather than using it to fill report
surfaces decoratively.

## Typography

**Display Font:** Barlow Condensed (with a sans-serif fallback; locally served Latin
and Latin Extended subsets)  
**Body Font:** DM Sans (with a sans-serif fallback; locally served Latin and Latin
Extended variable subsets)  
**Label/Mono Font:** DM Sans; global tabular numerals supply the numeric alignment.

**Character:** Barlow Condensed carries the championship masthead and report
headings. DM Sans keeps filters, source context, and detailed records calm and
readable. Both families are self-hosted with their Open Font License notices in
`public/licenses/`.

### Hierarchy
- **Display** (800, `clamp(3.6rem, 9.2vw, 7rem)`, 0.82 line-height): season masthead; phones use `clamp(3.3rem, 17vw, 5.1rem)`.
- **Headline** (700, `clamp(2rem, 4.5vw, 3rem)`, 1 line-height): semantic section headings.
- **Title** (700, 1.875rem): card, ranking, and report titles.
- **Body** (400, 1rem, 1.65 line-height): explanations and descriptive content; constrained prose stays close to 62–68ch.
- **Label** (700, 0.67rem, 0.14em tracking, uppercase): filter names and concise fact labels.

**The Heading-First Rule.** Let the semantic title lead. Reserve uppercase label
styling for controls and actual data terms, not decorative text above card headings.

## Layout

The season masthead and footer backgrounds span the viewport. Their contents,
section reports, and footer records share an 88rem maximum width with responsive
gutters between 1rem and 2.25rem. The hero changes from a stacked handset
composition to headline-and-ledger columns at 768px.

The fixed header measures its combined filter and navigation height using a
`ResizeObserver` and publishes that measurement through `--site-header-height`.
Section scroll margins and the active-section observer use the measured value.
Filters remain above navigation; below 1024px they use a compact disclosure, and
below 1280px section navigation uses a mobile/tablet menu. Opening either
disclosure closes the other. The year selector stays visible.

Rankings and plotted reports are dense and ruled; competitor and club details,
competition entries, insights, and data quality receive independent section
anchors. At tablet width the footer uses two discipline columns, expanding to four
from 1024px and one at phone widths. Charts and records keep `min-width: 0` behavior
to avoid creating page-level horizontal overflow.

## Elevation & Depth

Surfaces are flat and opaque; tonal fields, typography, spacing, and one-pixel
rules supply the report's depth. Cards do not use decorative shadows. A chart
tooltip alone uses an offset soft shadow (`0 8px 24px rgb(26 27 25 / 12%)`) to
remain legible above the plot.

**The Rule-Over-Shadow Rule.** Prefer a visible editorial rule or tonal paper shift
to adding elevation.

## Shapes

Report cards, rows, buttons, and navigation are square-edged with a one-pixel
structural rule. Filter selects and participation controls use a restrained 0.65rem
radius (10.4px); the active-filter count is minimally softened (2px). Logo plates
are unrounded paper fields that preserve the original official colors.

## Components

Common components use `cn()` for class composition; report-card, heading, button,
and badge primitives live under `components/ui/`.

### Buttons
- **Shape:** square-edged, opaque ink primary with paper text.
- **Hover / focus / disabled:** subtle deep-red hover; strong red keyboard focus;
  disabled controls remain visibly inactive.
- **Secondary:** section/source links remain visibly underlined.

### Chips
- **Filter count:** small championship-red square counter within the mobile filter disclosure.
- **Selected navigation:** text uses ink with a two-pixel red underline; unselected links use muted ink.

### Cards / Containers
- **Corner style:** square.
- **Background:** soft paper, with a structural top rule.
- **Shadow strategy:** flat at rest.
- **Internal padding:** 1.25rem phones, 1.5rem at medium widths.

### Inputs / Fields
- **Style:** paper background, rule border, compact restrained rounding for filter selects and participation range.
- **Focus:** visible two-pixel red outline/border treatment.
- **States:** labeled selects and range input retain their values in both desktop controls and the mobile disclosure.

### Navigation
- **Header:** fixed two-row shell with filters first; product wordmark at left, available season selector at right.
- **Sections:** links share the named `dashboardSections` registry; the visible section receives `aria-current="location"`.
- **Mobile:** independent filter and section disclosures close each other and update the measured header offset.

### Scoreline ranking row
- Competitor and club rankings use tabular place labels, real names and figures, a red score track, and a paper row that responds to hover and focus.
- Ranking records remain actionable buttons with descriptive accessible names; an empty match state explains how to recover.

### Competition record
- Competition entries use a semantic ordered list, date/time element, concise factual fields, and direct calendar/result source links.

## Do's and Don'ts

### Do:
- **Do** keep one URL and data set per published season; the selector lists available seasons only.
- **Do** retain source attribution, visible parsing/quality states, and semantic season-wide versus filtered scope.
- **Do** label and shape chart series with the existing palette, legible axes, and paper tooltips.
- **Do** retain official organization artwork without recoloring or distorting it; its source-to-link mapping lives in `docs/asset-sources.md`.
- **Do** maintain visible keyboard focus, a skip-to-content link, reduced-motion support, and a measured anchor offset.

### Don't:
- **Don't** imply sponsorship or endorsement through organization or discipline marks.
- **Don't** use color as the only way to distinguish a ranking, state, or chart series.
- **Don't** make report cards compete with the actual season figures using glass, gradients, decorative shadow stacks, or ornamental accents.
