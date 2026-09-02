# Dashboard Design System

Design reference for the Next.js dashboard (`app/`, `components/`). Read this before adding
new UI components or charts so new work matches the existing "premium dark analytics"
aesthetic instead of introducing a one-off style.

## Visual Language

Dark, glassy analytics look: near-black background, translucent white "glass" surfaces,
cyan as the primary accent, soft heavy shadows, generous rounding.

## Tokens

Defined in `app/globals.css` via `@theme inline` (Tailwind 4 CSS-first theming):

| Token          | Value                                                    | Usage                |
| -------------- | -------------------------------------------------------- | -------------------- |
| `--background` | `#020617` (slate-950)                                    | Page background      |
| `--foreground` | `#f8fafc` (slate-50)                                     | Default text color   |
| `--font-sans`  | `Inter, "Segoe UI", Arial, sans-serif`                   | Body/UI font         |
| `--font-mono`  | `SFMono-Regular, Consolas, "Liberation Mono", monospace` | Numeric/code display |

There is no separate light theme — the dashboard is dark-only by design.

## Color Usage

- **Accent**: cyan (`cyan-300`/`cyan-400`/`cyan-100`) for interactive states, badges, and highlights (e.g. `hover:border-cyan-300/40`, `border-cyan-400/30`).
- **Surfaces**: white at low opacity over the dark background — `bg-white/5` (cards), `bg-white/10` (buttons/controls), `border-white/10` — never opaque white/gray panels.
- **Text**: `text-white` for headings/emphasis, `text-slate-300` for secondary/body copy.
- **Chart series**: a fixed 5-color palette for rankings/medals (`medalColors` in `dashboard-app.tsx`): `#facc15` gold, `#cbd5e1` silver, `#fb923c` bronze, `#a855f7` purple, `#22d3ee` cyan. Reuse this palette (or extend it) for any new ranked/top-N chart rather than inventing new hues.
- Icons come from `lucide-react` (`Activity`, `Award`, `Gauge`, `Shield`, `Timer`, `Trophy`, etc.) — pick semantically matching icons rather than decorative ones.

## Layout & Surface Primitives (`components/ui/`)

All built with `class-variance-authority`-style `cn()` merging (`lib/utils.ts`) so callers can
override via `className`. Don't recreate these ad hoc in feature components — compose them.

- **`Card`**: `rounded-3xl border border-white/10 bg-white/5 p-6` + soft double shadow + `backdrop-blur`. The base container for every panel.
- **`CardTitle`** / **`CardDescription`**: `text-lg font-semibold text-white` / `text-sm text-slate-300`, always used together at the top of a `Card`.
- **`Button`**: pill-shaped (`rounded-full`), `border-white/10 bg-white/10`, hover state switches to cyan (`hover:border-cyan-300/40 hover:bg-cyan-400/10`).
- **`Badge`**: pill, `border-cyan-400/30 bg-cyan-400/10 text-cyan-100`, `uppercase tracking-[0.2em] text-xs` — used for eyebrow labels/tags, not for arbitrary colored status chips.

## Composition Pattern

- `components/charts/section-chart.tsx` is the standard wrapper for any chart: a `Card` with `CardTitle`/`CardDescription` header and a fixed `h-[320px]` chart area below. New charts should use `SectionChart`, not a bare `Card`.
- Charts use `recharts` (`BarChart`, `LineChart`, `ScatterChart`, `ResponsiveContainer`, etc.).
- Feature areas map to folders: `components/charts/` (division/performance/speed charts), `components/leaderboard/` (competitor rankings), `components/competition/` (competition timeline), `components/dashboard/` (top-level `DashboardApp` orchestrator with all filter state).
- `DashboardApp` owns all filter state (competition/division/club/minimum-participation) via `useState` + `useMemo`-derived slices — child components stay presentational and receive filtered data as props rather than reading global state themselves.
- Subtle motion via `framer-motion` (`motion.*`) for entrance/emphasis, not for persistent looping animation.

## Conventions

- Use `cn()` from `lib/utils.ts` to merge Tailwind classes — don't concatenate class strings manually.
- Format numbers/dates through `lib/utils.ts` helpers (`formatDate`, `formatNumber`, `formatNullableNumber`) instead of inline `toFixed`/`Intl` calls in components.
- Prefer Tailwind utility opacity modifiers (`/5`, `/10`, `/30`, `/40`) over custom `rgba()` values to stay consistent with the existing glass-panel look.
