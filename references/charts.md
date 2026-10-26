# Charts

A chart in an admin app has one job: let someone answer a question faster than a table would. Most chart problems come from the wrong chart type, too many colours, and labels that collide at phone width. This file covers choosing, styling, accessibility and responsive behaviour. The animated SVG area chart and ranked bars are specified in variants.md "Charts"; KPI tiles in data.md §12 and variants.md "KPI tile".

## Contents
1. Choosing a chart type
2. Colour
3. Axes, gridlines, legends, tooltips
4. Number and date formatting
5. Accessible charts
6. Empty, loading, error states
7. Sparklines and small multiples
8. Dashboard layout
9. Responsive charts
10. Dark mode
11. Library notes
12. Common mistakes

## 1. Choosing a chart type

Start from the question, not the data shape.

| Question | Chart | Notes |
|---|---|---|
| How is it changing over time? | line (continuous), column (discrete periods ≤ 30) | line for many points, columns for daily/weekly counts |
| How does the total split over time? | stacked area or stacked column, ≤ 5 series | put the most important series at the bottom (flat baseline) |
| Which is biggest? ranking | horizontal bar, sorted | horizontal bars keep long labels readable |
| Part of a whole, one moment | single stacked bar or a ranked bar list; donut only for 2–4 parts | people compare lengths far better than angles |
| Is it within a target? | bullet bar, meter, single number with delta | |
| How are values distributed? | histogram, box plot | |
| How do two measures relate? | scatter | label outliers, not every point |
| Where in time is it busy? | heatmap (day × hour) | sequential single-hue scale |
| One number that matters | KPI tile, not a chart | data.md §12 |
| Exact values needed | a table | a chart is the wrong tool |

Avoid: pie charts with more than four slices, 3D anything, dual y-axes (two charts sharing the x-axis instead), gauges for non-bounded values, radar charts for non-experts.

## 2. Colour

Chart colour comes from tokens, never from the library's default palette.

- **One series**: `primary`. Most admin charts have one series; give it the brand colour and nothing else.
- **Status meaning** (passed / failed / skipped): the status solids `success`, `danger`, `warn`, plus `ink-muted` for neutral. Never use status colours for categories without that meaning: a red "Team B" reads as "Team B is failing".
- **Categories (2–6)**: a categorical scale built from the brand ramp plus 3–5 distinct hues of similar lightness, defined as `--chart-1 … --chart-6` role tokens with light and dark values. Check adjacent pairs are distinguishable for common colour-vision deficiencies (vary lightness as well as hue).
- **More than 6 categories**: show the top 5 and group the rest as "Other" in `ink-muted`, or switch to small multiples (§7).
- **Sequential** (heatmaps, density): one hue from light to dark, e.g. primary-100 → primary-800; in dark mode reverse so higher values are brighter.
- **Diverging** (above/below target): two hues meeting at a neutral mid-point that matches the panel.
- **Highlight one thing**: colour it primary and everything else `line` or ink-muted at 40%. This is often better than a full palette.
- Areas under lines: the series colour at 12–18% opacity, or a vertical gradient from 20% to 0%.

## 3. Axes, gridlines, legends, tooltips

**Axes**
- Tick labels 11–12px, ink-muted, tabular numbers. Axis lines off; one baseline at zero in `line`.
- Bar and column charts start at zero. Line charts may zoom the y-axis, but say so with a visible non-zero first tick.
- 3–5 horizontal gridlines in `line-soft`, no vertical gridlines.
- Round ticks to nice values (0, 250, 500, 750); abbreviate with compact notation (§4).
- Axis titles only when units aren't obvious; put units in the chart title instead ("Requests per minute").

**Legends**
- Prefer direct labels at the end of each line or inside large segments. A legend forces eye travel.
- When a legend is needed: above the chart, left-aligned, in series order, each item a 10px swatch plus label. Items are buttons that toggle series (`aria-pressed`); a hidden series shows a hollow swatch.
- Single-series charts need no legend.

**Tooltips**
- Trigger on hover and on focus of a data point (§5); on touch, tap shows, tap elsewhere hides.
- Content: the x value as heading (formatted date), then one row per series: swatch, name, value right-aligned. Sort rows by value when there are > 3 series.
- Crosshair: a 1px `line` vertical rule at the hovered x for time series; snap to the nearest point.
- Position away from the pointer, flip near edges (variants.md "Charts"), stay inside the chart container, never cover the hovered point.
- Panel style matches info tips: panel background, `float` shadow, 12px radius, 13px text. Appear in ≤ 100 ms with no entrance animation; a lagging tooltip feels broken.

**Titles**
- Every chart has a title (h3, 14–16px semibold) stating what it shows, and an optional one-line takeaway in ink-muted ("Failures doubled since Monday"). Explanations go in an info tip next to the title.

## 4. Number and date formatting

Format with `Intl`, using the user's locale. Don't hand-roll separators.

```js
const n = new Intl.NumberFormat(locale);                                      // 12,480
const compact = new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }); // 12.5K
const pct = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 });       // 99.2%
const money = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' });
const delta = new Intl.NumberFormat(locale, { signDisplay: 'exceptZero', maximumFractionDigits: 1 }); // +4.2
const unit = new Intl.NumberFormat(locale, { style: 'unit', unit: 'millisecond', unitDisplay: 'short' }); // 120 ms
const day = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }); // Oct 24
const hour = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' });
```

- Axis ticks: compact. Tooltips: full precision. Same number never shown with different rounding in tile and tooltip.
- Choose tick date format by range: < 2 days → hours, < 3 months → day, otherwise month. Show the year only when the range crosses one.
- State the time zone when it isn't the user's ("All times UTC").
- Deltas: arrow plus signed number plus colour; whether up is good depends on the metric (more errors is bad). Decide per metric, not globally.
- Create formatters once and reuse; constructing `Intl` objects in a render loop is slow.

## 5. Accessible charts

A chart must work without sight and without a mouse.

- Wrap in `<figure>` with a `<figcaption>` (the title and takeaway). Give the SVG `role="img"` and an `aria-label` summarising it: "Runs per day, last 7 days. Peak 412 on Tuesday, lowest 88 on Sunday."
- Provide the data as a table: a visually hidden `<table>` after the SVG, or a visible "Show as table" toggle (better: sighted users want it too, and it doubles as export).
- Focusable points (variants.md "Charts"): one tab stop for the chart, then ←/→ move between points, Home/End jump, the tooltip follows focus, and an `aria-live="polite"` region announces "Tue Oct 22: 412 runs". Don't put every point in the tab order.
- Never colour only: different dash patterns or markers for series that print or are viewed in greyscale; direct labels; status words in tooltips.
- Contrast: lines and bars ≥ 3:1 against the panel; text ≥ 4.5:1. Light pastel series fail this; darken them.
- Respect `prefers-reduced-motion`: no draw-in, bars appear at full length.
- Legend toggles are real buttons with `aria-pressed`.

## 6. Empty, loading, error states

Charts keep their frame (title, size) in every state so the dashboard doesn't jump.

| State | Show inside the frame |
|---|---|
| Loading, first time | skeleton: axis baseline and 3 gridlines with a soft shimmer, or bars of random heights at 30% opacity (performance-perceived.md §3) |
| Refreshing | keep the old chart, dim to 60%, 2px indeterminate bar at the top (variants.md "Busy panels") |
| No data in range | "No runs in the last 7 days" centred, plus "Show last 30 days" if that has data |
| All zeros | draw the chart with a zero line; zero is data, not empty |
| Partial data (today in progress) | dashed line or hatched last bar, legend note "Today so far" |
| Error | icon, one sentence, Retry, inside the frame; the rest of the dashboard keeps working |

## 7. Sparklines and small multiples

**Sparklines**
- Word-sized trend: 80–120 × 24–32px, no axes, no gridlines, 1.5px stroke in primary (or status colour when the metric has a status), optional dot on the last point.
- Next to a number in a tile or a table cell, never alone; the number is the content, the line is context.
- Give it an `aria-label` with the trend ("Up 12% over 7 days") or mark it `aria-hidden` when the adjacent text already says so.

**Small multiples**
- One small chart per category, same scales, same size, in a grid (`repeat(auto-fill, minmax(14rem, 1fr))`). Better than a spaghetti chart of 8 lines.
- Shared y-axis scale unless the point is shape, not size (then say "scales differ").
- Synchronise crosshairs across the multiples on hover.

## 8. Dashboard layout

Page archetype: pages.md §2.

```
1440                                         768                    360
┌────┬────┬────┬────┐                        ┌─────┬─────┐          ┌─────┬─────┐
│KPI │KPI │KPI │KPI │                        │KPI  │KPI  │          │KPI  │KPI  │
├────┴────┴────┼────┤                        ├─────┴─────┤          ├─────┴─────┤
│ main chart   │list│                        │ main chart│          │ list      │
│ (span 3)     │    │                        ├───────────┤          ├───────────┤
├───────┬──────┴────┤                        │ list      │          │ main chart│
│chart  │ chart     │                        ├───────────┤          ├───────────┤
└───────┴───────────┘                        │ chart     │          │ chart     │
                                             └───────────┘          └───────────┘
```

- 12-column grid at ≥ 1024px; widgets span 3, 4, 6, 8 or 12. Two columns at 768, one at 360 (KPI tiles stay two-up).
- Widgets in one row share height; the chart area inside flexes.
- One time-range control for the page; a widget that ignores it shows its own range in its title.
- Every widget links somewhere ("View all runs →") so the dashboard is a door, not a dead end.
- Load widgets independently; one slow query doesn't hold the page.

## 9. Responsive charts

- Size by container, not viewport: `width: 100%` with an `aspect-ratio` (16 / 9 on desktop, 4 / 3 or 1 / 1 under 480px container width) and a `min-height` of 180px. Re-render on `ResizeObserver`, throttled to one frame.
- Use container queries for chart internals (`@container (max-width: 30rem)`), since a chart in a narrow column on desktop has the same problem as one on a phone.
- Label thinning: compute how many tick labels fit (`width / (labelWidth + 16px)`) and show every nth; always keep first and last. Never rotate labels 45° as the fix.
- Shorten formats when narrow: "Oct 24" → "24", "12,480" → "12.5K", full series names → names in the legend only.
- Long category names on phones: switch vertical columns to horizontal bars, labels above each bar.
- Hide secondary series under 480px behind the legend toggles; keep the primary one.
- Legends move from the right side to above the chart under 768px, and wrap.
- Touch: hit areas for points at least 24px wide (invisible rects per x band); tooltip opens on tap, pinned until tap elsewhere; horizontal drag scrubs the crosshair. Don't hijack vertical scroll.
- Wide time series on phones: never horizontally scroll a chart; aggregate (daily → weekly) instead.

## 10. Dark mode

Detail in dark-mode.md §7. In short:

- All chart colours are tokens with dark values; a hard-coded `#2f73e0` series turns muddy on a near-black panel.
- Gridlines `line-soft`, labels ink-muted; both already flip with the theme.
- Brighten series in dark (use the 400 step), and reduce area-fill opacity to 10–14%.
- Sequential scales: low values dark, high values bright.
- Re-render canvas-based charts on theme change; they don't read CSS variables after drawing. Read computed token values with `getComputedStyle(document.documentElement).getPropertyValue('--color-primary')`.

## 11. Library notes

- Whatever the library (Recharts, Chart.js, ECharts, Nivo, uPlot, D3), wrap it once in an app `Chart` component that injects token colours, fonts, formatters, tooltip style and the accessible table. Pages never configure the library directly.
- Turn off library defaults that fight the system: drop shadows, gradients, animation longer than 400 ms, legend at the bottom, default palette.
- SVG for < ~2,000 points (crisp, stylable, accessible); canvas above that (uPlot, ECharts) with the sr-only table still provided.
- Lazy-load chart libraries; they are often the largest dependency on the page (performance-perceived.md §8).

## 12. Common mistakes

| Mistake | Fix |
|---|---|
| Pie with 9 slices | Sorted horizontal bars, top 5 + Other |
| Library's rainbow palette | Token-based `--chart-1…6`, primary for single series |
| Red used for an ordinary category | Status colours only for status meaning |
| Dual y-axes | Two charts sharing the x-axis |
| Rotated, overlapping x labels on phones | Thin labels to every nth, shorter formats, horizontal bars |
| Chart with no title, or titled "Chart 1" | Title states what it shows; optional takeaway line |
| Legend at the bottom far from the lines | Direct labels or legend above |
| Tooltip only on mouse hover | Focusable chart with arrow keys and a live region; tap on touch |
| No text alternative | `figure` + `figcaption`, `aria-label` summary, data table |
| Chart disappears while refreshing | Keep it, dim it, indeterminate bar |
| "No data" for a range that is genuinely zero | Draw the zero line |
| Hex colours in chart config break dark mode | Read token values; re-render on theme change |
| Raw numbers like 12480.333333 | `Intl.NumberFormat` with compact ticks, precise tooltips |
