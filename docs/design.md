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
---

# Design System: Hero of IDPA

## Overview

**Creative North Star: "The Championship Record"**

Hero of IDPA presents each available season as a championship editorial record: a full-width season masthead, actual season totals, filterable standings, restrained score plots, and a source-backed competition record. Warm paper, ink typography, thin rules, and a disciplined championship-red accent carry the identity. Results stay tied to their season and official MDLSZ calendar and result sources; the visual system does not imply an organizational sponsorship or endorsement.

The fixed filter-first header and section navigation remain part of the working dashboard, while the report itself is an open, ruled layout rather than a stack of shadowed glass cards. Section headings and data-term labels carry meaning directly; ranking rows, club detail, competition entries, quality counts, and empty states keep their factual content visible.

**Key Characteristics:**
- Championship-red state and scoreline accents on warm opaque paper.
- Condensed display typography paired with readable sans-serif data and copy.
- Open report grids, hairline rules, and restrained chart ink.
- Season facts and quality status remain attributable and visible.

## Colors

The palette is built from warm ivory papers and near-black ink, with one championship-red identity accent and a fixed, muted categorical chart palette; the dark footer reverses the paper-and-ink relationship while retaining official marks in their source colors.

### Primary
- **Championship red** (`{colors.primary}`): active section indicator, podium rank, score track, scoreline, and first chart series.
- **Deep source red** (`{colors.primary-deep}`): readable source-link emphasis.
- **Pale red wash** (`{colors.primary-wash}`): hovered editorial rows and pipeline/source warning surfaces.

### Secondary
- **Measured teal** (`{colors.chart-teal}`): second chart series.
- **Competition gold** (`{colors.chart-gold}`): third chart series.

### Tertiary
- The remaining chart-only hues are **Plot purple** (`{colors.chart-purple}`), **Plot blue** (`{colors.chart-blue}`), **Plot gray** (`{colors.chart-gray}`), **Plot orange** (`{colors.chart-orange}`), and **Plot slate** (`{colors.chart-slate}`). Use these only as distinct series, not as competing interface accents.

### Neutral
- **Warm stock** (`{colors.neutral-bg}`): page canvas.
- **Soft paper** (`{colors.paper}`): fixed header and principal report surfaces.
- **Raised paper** (`{colors.paper-raised}`): report rows, controls, and white plates behind official marks.
- **Deep paper** (`{colors.paper-deep}`): filter rail and season masthead.
- **Championship ink** (`{colors.ink}`): principal text and structural rules.
- **Muted ink** (`{colors.ink-muted}`): secondary text and chart axes.
- **Rule gray** (`{colors.rule}`): recurring hairline dividers.
- **Plot grid** (`{colors.chart-grid}`) and **Plot ink** (`{colors.chart-ink}`): chart grid and supplemental chart details.
- **Footer coral** (`{colors.footer-accent}`), **footer copy** (`{colors.footer-copy}`), and **footer subdued copy** (`{colors.footer-muted}`): contrast hierarchy within the ink footer.

The Recharts series order is championship red, teal, gold, purple, blue, gray, orange, and slate. Axes use muted ink, grid lines are pale, and every tooltip uses raised paper, a rule border, and ink text. Series names and values remain available in the chart labels and tooltip; color is not the only carrier of meaning.

**The Scoreline Rule.** Red identifies a ranking or current state, a source link, or a chart series; keep its use functional rather than filling report surfaces with accent color.

## Typography

**Display Font:** Barlow Condensed (with `sans-serif` fallback; locally served Latin and Latin Extended subsets)
**Body Font:** DM Sans (with `sans-serif` fallback; locally served Latin and Latin Extended variable subsets)
**Label/Mono Font:** DM Sans; tabular numerals are applied globally for standings and season figures.

**Character:** Barlow Condensed gives the season title, product mark, report headings, and ranks a narrow championship voice. DM Sans carries filters, source context, labels, and explanatory copy with a quieter, highly readable texture. Both families are self-hosted; their Open Font License notices are in `public/licenses/`.

### Hierarchy
- **Display** (800, `clamp(3.6rem, 9.2vw, 7rem)`, 0.82 line-height): the full-bleed season title. Below 768px it uses the mobile override `clamp(3.3rem, 17vw, 5.1rem)`.
- **Headline** (700, `clamp(2rem, 4.5vw, 3rem)`, 1 line-height): semantic section headings.
- **Title** (700, 1.875rem): ranking, club, and report-card titles.
- **Body** (400, 1rem, 1.65 line-height): season explanation and general copy; paragraph measures stay near 62–68ch where constrained.
- **Label** (700, 0.67rem, 0.14em tracking, uppercase): filter labels and compact data terms. Other fact labels use the same compact uppercase approach at their local observed sizes.

Section headings are real `h2` elements; report-card titles use `h3`. The season masthead owns the page's `h1`, identifying the IDPA season. Do not introduce decorative eyebrow text to create an extra heading tier: use the semantic title, its optional explanatory sentence, and concise `dt`/`dd` labels.

## Layout

The season hero field runs edge-to-edge. Its inner content, report sections, and footer align to the same centered maximum width of 88rem, with horizontal gutters scaling from 1rem to 2.25rem. Main sections use generous responsive vertical spacing; report grids are dense but open, with no decorative card stack.

The fixed shell has two rows: filters above section navigation. At widths below 1024px, the three filters collapse behind a compact disclosure with a selected-filter summary and independently scrollable open panel. The full filter row appears from 1024px. Section links use a compact menu below 1280px and a horizontal desktop navigation at and above that width. The year selector remains in the header. The menu and filter disclosure are separate controls and close each other when opened.

The hero changes from a single-column stack to title/report columns at 768px. Metric, quality, and insight grids are two columns by default and collapse to one column on phones; competition entries also stack their date and details. Footer marks begin in compact grids, then expand to two discipline columns from 768px and four from 1024px. The page supports a 320px minimum viewport and wraps content rather than relying on horizontal overflow.

The header measures its actual height with `ResizeObserver`, writes `--site-header-height`, and uses that measurement for content offset, section scroll margins, and active-section observation. Section links are real hash anchors, sourced from `lib/site-navigation.ts`; the seven IDs are `overview`, `rankings`, `analytics`, `details`, `competitions`, `insights`, and `data-quality`. Clicking a link moves to the section; the active indicator follows the visible section.

## Elevation & Depth

This is a flat report system. Opaque paper tones, ink rules, and a small number of raised paper rows distinguish layers; cards do not use ornamental shadows or blur. The chart tooltip is the one observed lifted surface, with a restrained shadow so it separates from the plot. Respect `prefers-reduced-motion`; state transitions are brief and nonessential.

### Shadow Vocabulary
- **Chart tooltip** (`0 8px 24px rgb(26 27 25 / 12%)`): the only recurring lift, used to keep the light tooltip legible above chart marks.

**The Ruled-Not-Lifted Rule.** Use surface tone and border hierarchy for report depth; reserve shadow for the chart tooltip rather than adding elevation to cards.

## Shapes

Report cards and ranked records are square-edged or minimally framed: a strong top rule establishes a panel, and hairline separators organize rows. Ranking bars and rules stay straight. Native filter controls use a modest rounded rectangle (10.4px) while buttons and report cards remain square; official organization marks sit in simple light rectangular plates so their original color and proportions remain intact. There is no pill-shaped card or chip vocabulary.

## Components

Components use the editorial surface and rule system; interaction is conveyed by readable labels, a red or ink state change, and visible keyboard focus.

### Buttons
- **Shape:** Square, structural control.
- **Primary:** Ink fill with paper text and 16px horizontal / 8px vertical padding; hover changes to deep championship red.
- **Hover / Focus:** Color transition; the global `:focus-visible` treatment is a 2px red outline with 3px offset.
- **Disabled:** Noninteractive cursor and reduced opacity.

### Chips
- **Style:** The shared `Badge` primitive is text-led, with a 2px championship-red bottom rule, muted uppercase lettering, and no pill fill.
- **State:** Use only when a concise tag is semantically useful; do not substitute it for headings or data labels.

### Cards / Containers
- **Corner Style:** Square report geometry.
- **Background:** Soft paper for primary panels; raised paper for ranking rows and control surfaces.
- **Shadow Strategy:** Flat, except the chart tooltip (see Elevation & Depth).
- **Border:** One-pixel top rule for ordinary cards; 2px ink top rule for season ledgers, competitor panel, rankings, metrics, and competition lists; one-pixel row separators.
- **Internal Padding:** 20px base card padding, 24px at medium widths; smaller compact padding is used for source-oriented rows.

### Inputs / Fields
- **Style:** Native labeled selects and a native range input on a soft-paper field, lightly rounded, with rule-gray border and ink text.
- **Focus:** Red border plus a 2px red focus ring with 20% red tint; preserve the global visible focus outline.
- **Responsive:** Desktop filters are a four-column row; compact layouts expose the same controlled values in a disclosed, viewport-constrained panel.

### Navigation
- **Style:** Fixed, paper-colored filter rail over a second brand and section-navigation row. The seven section links use small DM Sans labels; the active location has an ink label and short red underline.
- **Behavior:** Section links use real anchors and `aria-current="location"`; active state follows scroll position. At narrower widths the nav becomes a menu, while the filter controls use their own disclosure. The year selector stays visible.

### Scoreline ranking rows
Competitor and club standings are ordered lists of full-width interactive rows. Condensed tabular rank numerals align with names and performance totals; podium ranks use the championship accent, and a thin proportional score track makes relative scale legible. Each row has a descriptive accessible name, visible focus, and supporting wins, podiums, match counts, or other available facts. Empty filters return a readable status message rather than a blank panel.

### Season report and chart frame
`SectionHeading` renders a semantic `h2` with optional description and right-side source/action link. `SectionChart` composes a `Card`, an `h3` title, description, and responsive plot region; plot heights are 280px on narrow layouts and 320px from the medium breakpoint. Keep charts labeled with meaningful units and series, use the fixed palette and light tooltip, and preserve the fact that season-wide charts are not silently filtered with rankings.

### Source footer
`SiteFooter` pairs the product wordmark and source statement with linked MDLSZ and IDPA organization marks and seven MDLSZ discipline marks. Marks preserve their source artwork, use contain sizing on light plates, and link to their corresponding official pages; names and links stay readable independently of the images. The asset source and license record is maintained in [`docs/asset-sources.md`](asset-sources.md).

Accessibility is part of each component: native controls have associated labels, disclosure controls expose `aria-expanded` and `aria-controls`, section landmarks reference headings, interactive rows have useful names, external links identify their destination, keyboard focus is visible, and reduced-motion preferences are honored.

## Do's and Don'ts

### Do:
- **Do** keep the season title edge-to-edge while aligning its contents, report sections, and footer to the shared 88rem measure.
- **Do** keep filter order and meaning stable across the desktop row and mobile disclosure; keep year selection available at all widths.
- **Do** use the real section heading and anchor structure; the page title is `h1`, section titles are `h2`, and card titles are `h3`.
- **Do** use tabular numerals for standings and figures, and retain readable series labels and source context.
- **Do** keep official source marks in their original colors and link each only to its actual organizational or discipline context.
- **Do** preserve actual-data empty, warning, and processing-quality states.

### Don't:
- **Don't** invent season values, result claims, club affiliations, or MDLSZ/IDPA endorsement language.
- **Don't** add glass, blur, glow, ornamental gradients, or elevated card shadows; the tooltip remains the limited shadow exception.
- **Don't** let chart hues replace labels, values, or source context.
- **Don't** add decorative eyebrow paragraphs above the existing semantic headings or reframe data-term labels as headlines.
- **Don't** canonize the residual competition-list ordinal styled as `.editorial-kicker` or Lucide glyph cues beside source links as house patterns; these are build carryovers, not recommended design rules.
