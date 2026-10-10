---
name: MDLSZ Pro Telemetry
colors:
  surface: '#111418'
  surface-dim: '#111418'
  surface-bright: '#36393e'
  surface-container-lowest: '#0b0e12'
  surface-container-low: '#191c20'
  surface-container: '#1d2024'
  surface-container-high: '#272a2e'
  surface-container-highest: '#323539'
  on-surface: '#e1e2e8'
  on-surface-variant: '#e1bfb5'
  inverse-surface: '#e1e2e8'
  inverse-on-surface: '#2e3135'
  outline: '#a98a80'
  outline-variant: '#594139'
  surface-tint: '#ffb59d'
  primary: '#ffb59d'
  on-primary: '#5d1900'
  primary-container: '#ff6b35'
  on-primary-container: '#5f1900'
  inverse-primary: '#ab3500'
  secondary: '#ffb3b1'
  on-secondary: '#680011'
  secondary-container: '#ad0224'
  on-secondary-container: '#ffb8b5'
  tertiary: '#67dca2'
  on-tertiary: '#003822'
  tertiary-container: '#31ad77'
  on-tertiary-container: '#003923'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdbd0'
  primary-fixed-dim: '#ffb59d'
  on-primary-fixed: '#390c00'
  on-primary-fixed-variant: '#832600'
  secondary-fixed: '#ffdad8'
  secondary-fixed-dim: '#ffb3b1'
  on-secondary-fixed: '#410007'
  on-secondary-fixed-variant: '#92001c'
  tertiary-fixed: '#84f9bd'
  tertiary-fixed-dim: '#67dca2'
  on-tertiary-fixed: '#002112'
  on-tertiary-fixed-variant: '#005234'
  background: '#111418'
  on-background: '#e1e2e8'
  surface-variant: '#323539'
typography:
  display-score:
    fontFamily: IBM Plex Sans
    fontSize: 3.5rem
    fontWeight: '700'
    lineHeight: 3.75rem
    letterSpacing: -0.03em
  display-score-mobile:
    fontFamily: IBM Plex Sans
    fontSize: 2.5rem
    fontWeight: '700'
    lineHeight: 2.75rem
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: IBM Plex Sans
    fontSize: 2rem
    fontWeight: '700'
    lineHeight: 2.5rem
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: IBM Plex Sans
    fontSize: 1.5rem
    fontWeight: '700'
    lineHeight: 2rem
    letterSpacing: -0.01em
  headline-md:
    fontFamily: IBM Plex Sans
    fontSize: 1.25rem
    fontWeight: '600'
    lineHeight: 1.75rem
    letterSpacing: -0.01em
  body-lg:
    fontFamily: IBM Plex Sans
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: 1.5rem
  body-md:
    fontFamily: IBM Plex Sans
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.25rem
  body-tabular:
    fontFamily: IBM Plex Sans
    fontSize: 0.875rem
    fontWeight: '500'
    lineHeight: 1.25rem
    letterSpacing: 0.01em
  label-caps-bold:
    fontFamily: IBM Plex Sans
    fontSize: 0.6875rem
    fontWeight: '700'
    lineHeight: 1rem
    letterSpacing: 0.1em
  label-caps-muted:
    fontFamily: IBM Plex Sans
    fontSize: 0.625rem
    fontWeight: '600'
    lineHeight: 0.875rem
    letterSpacing: 0.12em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-lg: 1.5rem
  margin: 1rem
  margin-md: 1.5rem
  margin-lg: 2.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 2rem
---

## Brand & Style

This design system is tailored for elite competitive sports telemetry, dynamic shooting analytics, and range-side match timing. Its personality is calibrated, relentless, technical, and hyper-legible under harsh outdoor lighting and glare conditions. 

The aesthetic synthesizes modern tactical instrument design with high-performance digital displays:
- **Style Archetype:** Precision Sports Instrumentation (a synthesis of Technical Minimalism and High-Contrast Cockpit UI).
- **Emotional Response:** Confidence, instant clarity under pressure, split-second recognition, and engineering-grade reliability.
- **Structural Motifs:** Micro-crosshairs, hairline concentric ring segments, optical measurement calibration ticks, and strict modular grid docking. Pure utility dominates; decorative noise is eliminated.

## Colors

The palette is engineered exclusively around dark-mode telemetry efficiency, reducing eye strain in changing light conditions while directing sharp visual focus to active split times, hit factors, and scoring deltas.

### Surface Hierarchy
- **Canvas Base:** `#111418` (Deep Charcoal) - The dominant backdrop.
- **Surface Level 1 (Panels / Cards):** `#1B2027` (Graphite) - Primary card and table row grouping.
- **Surface Level 2 (Inputs / Hover Rows):** `#222933` (Elevated Graphite).
- **Hairlines & Dividers:** `#262D37` (Subtle boundary lines; provides structure without glare).

### Accent & Telemetry Indicators
- **Primary Action & Focus:** `#FF6B35` (Competition Orange) - Critical CTAs, active stage timers, focus rings, selected segments.
- **Secondary Alert / DQ / Penalty:** `#EF4444` and `#E63946` (Crimson / Soft Red) - No-shoot hits, procedural errors, penalties, faults.
- **Positive Movement / Clean Run:** `#40B982` (Muted Ballistic Green) - Personal bests, stage leads, clean strings, sub-second transitions.

### Typography & Content Tokens
- **Primary Text:** `#F4F6F8` (Off-white) - Uncompromising 14:1 contrast ratio against base.
- **Secondary / Muted Text:** `#9BA6B2` (Cool Gray) - Metadata, units (ms, sec, pts), stage notes.
- **Disabled / Structural Marks:** `#4A5568` - Reticle crosshairs, inactive target indicators.

## Typography

The typography is built around **IBM Plex Sans**, selected for its industrial balance, clarity in condensed technical layouts, and distinct numerical glyph forms.

### Rules of Engagement
- **Numerical Tabular Setting:** All telemetry values, scores, timers, hit factors, and split differentials must enforce `font-feature-settings: "tnum" 1, "zero" 1` to guarantee vertical column alignment and prevent jitter during live updates.
- **Technical Uppercase Labels:** Field keys, unit badges, table headers, and status flags use `label-caps-bold` or `label-caps-muted` with strict uppercase casing and letter-spacing between `0.1em` and `0.12em`.
- **Rank & Metric Hierarchy:** Large numeric callouts (`display-score`) use bold tabular figures to allow instant visibility from arm's-length tablet stands or range officer podiums.

## Layout & Spacing

The layout is built on a tight, mathematically consistent fluid grid designed for dynamic dashboards, live leaderboards, and stage telemetry split-screens.

### Grid Anatomy
- **Mobile (under 768px):** 4-column fluid grid, `1rem` margins, `1rem` gutters. Single-column stacked telemetry cards.
- **Tablet / Field Rigs (768px – 1024px):** 8-column grid, `1.5rem` margins, `1rem` gutters. Optimized for horizontal landscape viewing on range tablets.
- **Desktop / Command Terminal (1024px+):** 12-column grid, `2.5rem` outer margins, `1.5rem` gutters. Maximizes density while anchoring key leaderboards to persistent split panels.

### Internal Spacing Rhythm
- Density is prioritized: micro elements (badges, split stamps) use `space-xs` (4px) and `space-sm` (8px).
- Data grid cells rely on `space-md` (12px) horizontal and vertical padding for high data density with zero visual collision.

## Elevation & Depth

This design system avoids decorative blurred drop shadows. Depth and visual hierarchy are established strictly through **tonal stacking** and **crisp technical borders**.

### Layering Blueprint
- **Ground 0 (Canvas):** `#111418`
- **Tier 1 (Panels & Grouping Containers):** `#1B2027` with a 1px continuous hairline outline of `#262D37`.
- **Tier 2 (Modals, Floating Toolbars, Active HUD Overlays):** `#222933` bounded by `#353E4D` border, with an ambient technical shadow: `0 4px 20px -2px rgba(0, 0, 0, 0.75)`.

### Optical Highlights & Accent Hairlines
- Active containers and cards feature a top 2px accent rule in `#FF6B35` (Competition Orange) or a left 3px indicator strip for runner states.
- Reticle lines and concentric scoring targets use 1px stroke geometry rendered with SVG vectors in `rgba(155, 166, 178, 0.12)`.

## Shapes

The geometric architecture is crisp, compact, and semi-brutal (`roundedness: 1`):
- Standard components (buttons, input fields, badges, telemetry cells) have `0.25rem` (4px) corner radii.
- Outer structural viewports and full-stage cards scale to `0.5rem` (8px).
- Circular elements are strictly reserved for:
  1. Target ring visualizations.
  2. Shot hit-point coordinates.
  3. Shooter avatar thumbnails and circular timer dials.
- Pill shapes are strictly forbidden to maintain a disciplined, instrument-grade appearance.

## Components

### Buttons
- **Primary:** High-saturation background in `#FF6B35` with `#111418` high-contrast bold typography. Corner radius 4px. On hover: shifts to `#FF8254`. Focus state displays a 2px offset ring in `#FF6B35`.
- **Secondary / Action:** `#1B2027` background, 1px `#262D37` border, `#F4F6F8` text. On hover: border brightens to `#9BA6B2`.
- **Danger / Fault Trigger:** Dark crimson `#301317` fill with `#EF4444` border and `#EF4444` text.
- **Sizes:** Compact (32px height for dense score tables) and Touch-Target (44px height for field operations).

### Cards & Telemetry Blocks
- Graphite surface (`#1B2027`) encapsulated in 1px hairline `#262D37`.
- Header zones contain technical uppercase breadcrumbs (`STAGE 03 / SECTOR 4`) aligned left, with real-time status indicators (live dot pulse in `#40B982`) aligned right.
- Numerical summaries feature large tabular figures (`headline-lg` or `display-score`) paired with uppercase unit badges underneath.

### Data Tables & Leaderboards
- **Headers:** `#111418` fill, 1px bottom border in `#262D37`. Text in `label-caps-muted`, left-aligned for identity, right-aligned for times, points, and hit factor.
- **Rows:** Alternating subtle hover states (`#222933`). Rank numbers (1st, 2nd, 3rd) utilize monospaced bold styling; the top rank is flagged with a `#FF6B35` left border tag.
- **Cell Content:** Tabular numbers for split timing (`0.18s`, `1.42s`) with subtle color-coding for deltas (+0.12s in `#EF4444`, -0.08s in `#40B982`).

### Chips & Status Badges
- 4px radius, padded at `2px 8px`.
- **Hit Factor Chip:** `#1B2027` surface with a 1px `#FF6B35` accent border and off-white text.
- **Penalty Chip:** `#EF4444` at 15% opacity background, `#EF4444` text, 1px `#EF4444` border.

### Inputs & Measurement Ticks
- Text inputs use `#111418` base background embedded into `#1B2027` card bodies, enclosed with `#262D37` borders. Focused state draws a 1px `#FF6B35` perimeter.
- Number inputs for manual score entry use prominent increment steppers with monospaced center values.

### Specialized Telemetry Displays
- **Concentric Target Widget:** Subtle multi-ring vector target displaying hit points as 6px circles with orange drop indicators and shot sequence labels (1, 2, 3...) in micro tabular font.
- **Split Breakdown Bar:** Horizontal segmented bar graph detailing draw time, transition intervals, and shot splits with alternating monochrome gray ticks and accent highlights.