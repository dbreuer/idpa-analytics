---
name: Lövésznapló Statisztika
description: Source-traceable shooting-season analytics in a shared charcoal telemetry interface.
colors:
  signal: "#ff6b35"
  signal-hover: "#ff8a61"
  signal-wash: "rgb(255 107 53 / 12%)"
  valid-state: "#40b982"
  chart-gold: "#e8c365"
  canvas: "#111418"
  footer-canvas: "#0c1014"
  panel: "#1b2027"
  panel-raised: "#222832"
  panel-inset: "#181d24"
  filter-rail: "#15191f"
  foreground: "#f4f6f8"
  muted-foreground: "#9ba6b2"
  rule: "#262d37"
  control-border: "#343c48"
  logo-plate: "#fffefa"
  chart-blue: "#66a8e6"
  chart-purple: "#c58ce5"
  chart-slate: "#70889b"
typography:
  display:
    fontFamily: "Barlow Condensed, sans-serif"
    fontSize: "clamp(3.3rem, 9.2vw, 7rem)"
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
    fontWeight: 600
    lineHeight: 1.05
  body:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "0.67rem"
    fontWeight: 700
    letterSpacing: "0.13em"
  telemetry:
    fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace"
    fontSize: "0.65rem"
    fontWeight: 600
    lineHeight: 1.3
rounded:
  none: "0px"
  minimal: "2px"
  chip: "4px"
  panel: "4.8px"
  control: "10.4px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.foreground}"
    textColor: "{colors.panel}"
    rounded: "{rounded.none}"
    padding: "8px 16px"
  report-card:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.none}"
    padding: "20px"
  filter-control:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
  navigation-active:
    textColor: "{colors.foreground}"
    size: "44px"
  status-chip:
    backgroundColor: "{colors.panel-inset}"
    textColor: "{colors.signal}"
    rounded: "{rounded.chip}"
    padding: "5.6px 8.8px"
  division-card:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.panel}"
    padding: "16px"
  official-logo-plate:
    backgroundColor: "{colors.logo-plate}"
    rounded: "{rounded.none}"
    padding: "8px"
---

# Design System: Lövésznapló Statisztika

## Overview

**Creative North Star: "The Match Telemetry Console"**

The site treats home, discipline, season, descriptive, methodology, and
unavailable-data routes as a legible, source-traceable competition console. A
charcoal ground, graphite report fields, fine steel rules, a receding reticle-dot
texture, and condensed Barlow headings create a technical atmosphere without
displacing the results themselves. DM Sans carries explanations, navigation, and
controls; monospaced type is reserved for measured values and telemetry such as
dates, counts, positions, and percentiles.

The orange signal identifies active navigation, ranking emphasis, source actions,
and selected states. Green marks only verified positive or available state. Flat
surfaces and structural rules keep cards, charts, and tables quiet enough for
dense comparison. The shared chart sequence is orange, blue, gold, purple, light
orange, muted slate, and slate; green is not present in the chart palette.
Official organization and discipline artwork keeps its original colors on white
plates and remains linked in its actual organizational context. IDPA's Hero of
IDPA identity can remain in its wordmark; it does not create a separate color or
surface theme.

**Key Characteristics:**
- One charcoal-and-graphite visual world across home, discipline, season, methodology, descriptive, and unavailable-data routes.
- Barlow Condensed display and headline hierarchy; DM Sans body and interface; monospaced type only for measured values and telemetry.
- Functional orange signal, green only for verified positive or available state, and a seven-color chart sequence that excludes green.
- Flat, ruled reports over a subtle 24px reticle-dot ground.
- Official marks retain their artwork and sit on unrounded white plates.
- Page arrangements and analytics remain discipline-specific; visual consistency never implies shared scoring methods.

## Colors

The shared palette is dark and cool-neutral: orange carries interaction and ranking emphasis, while green marks only verified positive or available state.

### Primary
*Match orange** (`{colors.signal}`): active section underline, selected ranking, source links, podium emphasis, and score tracks.
- **Orange highlight** (`{colors.signal-hover}`): hover emphasis for orange links and controls.
- **Orange state wash** (`{colors.signal-wash}`): restrained selected or hover background where a soft state field is used.

### Secondary
- **Verified green** (`{colors.valid-state}`): verified positive or available
  state only; it does not appear in the chart palette.
- **Chart sequence:** match orange, plot blue (`{colors.chart-blue}`), chart gold
  (`{colors.chart-gold}`), plot purple (`{colors.chart-purple}`), light orange
  (`{colors.signal-hover}`), muted slate (`{colors.muted-foreground}`), and slate
  (`{colors.chart-slate}`). These seven categorical colors are not competing
  interface accents.

### Neutral
- **Charcoal canvas** (`{colors.canvas}`): global page ground and reticle-dot field.
- **Footer charcoal** (`{colors.footer-canvas}`): deeper footer ground.
- **Graphite panel** (`{colors.panel}`), **raised graphite** (`{colors.panel-raised}`), **inset graphite** (`{colors.panel-inset}`), and **filter rail** (`{colors.filter-rail}`): report surfaces, row interaction, compact chips, and the fixed filter band.
- **Cool white** (`{colors.foreground}`) and **steel mist** (`{colors.muted-foreground}`): primary and secondary text.
- **Steel rule** (`{colors.rule}`) and **control border** (`{colors.control-border}`): structural dividers and stronger control outlines.
- **Logo white** (`{colors.logo-plate}`): unrounded backing for unmodified official artwork.

**The Signal-Not-Fill Rule.** Orange marks actions, current state, rankings, and
source access; keep large report surfaces graphite rather than filling them with
the accent.

**The Green-For-Validity Rule.** Use green only for verified positive or available
state; never use it as a general brand accent.

## Typography

**Display Font:** Barlow Condensed (with sans-serif fallback; locally served Latin
and Latin Extended weights)  
**Body Font:** DM Sans (with sans-serif fallback; locally served Latin and Latin
Extended variable subsets)  
**Label/Mono Font:** UI monospace stack for measured values and compact telemetry.

**Character:** Barlow Condensed gives headings a compact, assertive competition
voice. DM Sans keeps the interface and longer source explanations calm and easy to
scan. Monospaced telemetry separates measured data from prose without changing the
meaning of the figures.

### Hierarchy
- **Display** (800, `clamp(3.3rem, 9.2vw, 7rem)`, 0.82 line-height): season and landing-page mastheads; handset mastheads reduce to a tighter responsive clamp.
- **Headline** (700, `clamp(2rem, 4.5vw, 3rem)`, 1 line-height): semantic report-section headings.
- **Title** (600–700, from 1.2rem to 1.875rem, tight line-height): division, ranking, report-card, and methodology headings.
- **Body** (400, 1rem, approximately 1.5–1.65 line-height): explanatory and descriptive copy; long introductions stay around 62–68ch.
- **Label** (700, 0.67rem, 0.14em tracking, commonly uppercase): filter names and concise factual labels.
- **Telemetry** (600–700, about 0.65rem and up): monospaced measured values,
  dates, counts, positions, percentiles, and compact telemetry labels.

**The Heading-First Rule.** Let semantic headings carry hierarchy. Use DM Sans
for interface copy and factual labels; reserve monospaced type for measured
values and telemetry.

## Layout

The dashboard shell and footer use a responsive 96rem maximum width and clamped
horizontal gutters. Dashboard content uses centered measures between 88rem and
96rem so dense data grids have room; methodology reading stays near 68rem, while
home and availability surfaces use a narrower centered measure. These widths
follow the work: broad data grids get room, while explanatory pages retain a
comfortable reading line.

The dashboard header keeps filters above section navigation. A `ResizeObserver`
measures the fixed shell and supplies the anchor offset; filters collapse into a
disclosure below 1024px and section navigation into a menu below 1280px. Those
disclosures close each other, while the season selector remains available.
Multi-column report and division grids collapse at tablet/phone breakpoints;
official result tables use horizontal overflow containers rather than making the
page itself wider than the viewport. Paired factual ledgers collapse to one ruled
column on phones. Footer associations and discipline links follow the same
mobile-first collapse.

Use the 24px reticle dot field as a low-contrast ground texture; content panels
remain opaque and legible over it. Spacing recurs around 8, 16, 24, and 32px, with
larger section gaps and responsive page gutters.

## Elevation & Depth

The system is flat at rest. Opaque graphite layers, subtle surface changes, and
one-pixel steel rules establish structure; the dot field remains behind content.
Chart tooltips use a soft dark shadow to separate their floating information from
the plot. No card relies on a decorative shadow stack for hierarchy.

**The Rule-Over-Shadow Rule.** Use tonal panels and visible structural rules to
separate reports; reserve shadow for floating chart tooltips.

## Shapes

Report cards, lists, buttons, footer links, and organization plates are mostly
square-edged and defined by thin rules. Filters use a restrained 10.4px radius;
status chips and small counters use a subtler 2–4px radius; compact telemetry
cards may soften to about 4.8px. The recurring silhouette is a flat, ruled
rectangle, not a pill or floating tile.

## Components

### Buttons
- **Shape:** square-edged, compact action surface.
- **Primary:** foreground fill with graphite text and 8px by 16px padding.
- **Hover / focus:** orange-hover fill; keyboard focus remains a clearly visible 2px orange outline with 3px offset.
- **Disabled:** visibly dimmed and non-interactive.

### Chips
- **Style:** compact inset graphite with a fine steel border and restrained rounding.
- **State:** orange identifies archive/method or selected context; a green marker is reserved for verified availability.
- **Filter count:** a small numeric counter accompanies the mobile filter disclosure.

### Cards / Containers
- **Corner style:** primarily square; compact telemetry cards use only a small radius.
- **Background:** graphite panel, with raised graphite for interactive rows and inset graphite for compact status/table headings.
- **Shadow strategy:** flat at rest; see Elevation & Depth for chart tooltips.
- **Internal padding:** 20px on the shared card primitive, increasing to 24px at medium widths; telemetry cards use 16px.
- **Boundary:** use a top rule or a fine full border according to the report pattern.

### Inputs / Fields
- **Style:** labeled dark select controls with steel border, restrained radius, and compact padding.
- **Focus:** orange border and visible focus ring.
- **States:** controls retain labels and selected values in both desktop filters and the compact mobile disclosure.

### Navigation
- **Style:** fixed two-row dashboard shell with filters first, product/discipline wordmark, available-season selector, and section links.
- **Active:** foreground text and a 2px orange underline.
- **Mobile:** measured filter and section disclosures, with only one open at a time; section anchors account for the live header height.
- **Methodology:** compact top navigation returns to the relevant season and keeps available-year choices visible.

### Ranking and telemetry rows
- Use real names and sourced figures, tabular/monospaced values, a ruled row, and a thin orange score track when the underlying metric supports one.
- Selected or hovered rows shift subtly to raised graphite; keyboard selection remains visible and semantic.
- Steel Challenge division cards show a concise leading group and use native disclosure for remaining ranked entrants. Keep those cards and percentile semantics distinct from other disciplines' own ranking methods.

### Charts and tables
- Charts use the shared orange/blue/gold/purple/light-orange/muted-slate/slate sequence, cool grid and axis labels, and dark raised tooltips. Green is excluded from the chart palette. Do not use color as the only series distinction.
- Dense official results keep compact ruled rows, visible source links, and horizontal overflow on narrow screens.

### Footer associations and discipline links
- The footer uses a deeper charcoal field, restrained orange links/wordmark accent, and fine outlined link rows.
- Organization and discipline marks retain their original colors and proportions on unrounded white plates. Link labels identify the actual organization or discipline; association must not imply sponsorship.

## Do's and Don'ts

### Do:
- **Do** apply the charcoal-and-graphite telemetry palette across the home page, all discipline dashboards and routes, methodology, descriptive reports, unavailable states, shared navigation, and footer.
- **Do** preserve each discipline's facts, data methods, and page-specific composition; shared styling does not make one discipline's scoring portable to another.
- **Do** reserve orange for active/ranking/source signals and green for verified positive or available state.
- **Do** keep source attribution, data-quality states, and missing-data explanations visible.
- **Do** preserve official organization artwork unchanged on white plates and use it only in its real linked context.
- **Do** keep visible keyboard focus, reduced-motion support, responsive filters/navigation, and contained horizontal overflow for wide tables.
- **Do** keep the dot texture subtle and behind opaque content panels.

### Don't:
- **Don't** use green outside verified positive or available state or introduce it into the chart palette; don't use orange as a large decorative panel fill.
- **Don't** imply endorsement through federation or discipline marks.
- **Don't** rely on color alone to communicate rank, chart series, availability, or selection.
- **Don't** invent unavailable seasons, analytics, records, measurements, or performance claims.
