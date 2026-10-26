# Two flavours of the same patterns

The pool was distilled from two apps that solve the same problems with deliberately different looks. Offer both when a choice matters, and let the product's identity decide. Mixing the two flavours inside one app produces exactly the inconsistency this skill is meant to remove, so pick one per app.

| | Flavour A: **Calm rail** | Flavour B: **Glass spring** |
|---|---|---|
| Mood | flat, quiet, precise; navigation and orchestration tools | layered, lively, tactile; dashboards and monitoring |
| Surfaces | opaque panels on a tinted canvas, 1px lines, almost no shadow | translucent panels (white at 72–90%) over a soft radial-glow canvas, `blur` backdrops, resting and floating shadows |
| Easing | `ease-out-quint (.22,1,.36,1)`, no overshoot | `ease-out (.16,1,.3,1)` plus a spring `(.22,1.15,.36,1)` with a slight overshoot |
| Status popup | neutral card, 4px tone rail on the left, small uppercase tone heading, message, right-aligned buttons | centred card with a 56px tone-coloured icon in an 8px soft ring that pops in (`scale .4→1` with overshoot); the success check is drawn with an SVG stroke-dash animation; 18px title |
| Popup dismissal | user dismisses | auto-dismiss after 4 s for success/info, timer pauses on hover and resumes with the time left; errors wait for the user |
| Dialog footer | none; actions right-aligned in the body | tinted footer bar (negative margins); Enter triggers the `[data-default]` button with a 130 ms pressed flash |
| Dialog on phones | centred, width `min(…, 100vw - 2rem)` | bottom sheet: slides up 280 ms, `max-height: 92dvh`, top corners rounded |
| Theme transition | conic "sweep" mask rotating around the centre | circular clip-path reveal growing from the clicked button; radius `hypot(max(x, W-x), max(y, H-y))`, 560 ms |
| Active nav and tabs | 3px bar for nav, sliding 2px underline for tabs | a measured pill that slides behind the active item with the spring easing (re-measured with ResizeObserver) |
| Tags | coloured text with hover tint | small caps with a 5px dot, or coloured text in the brand layer |
| Buttons | flat solid primary | gradient primary with a diagonal shine sweep on hover (650 ms), 1px hover lift, `scale(.97)` on press, trailing icon nudges 2px |
| Tables | toolbar search + Filters panel, 10 rows, numbered pager | filter row under the header with per-column match mode, three-state sort, resizable and pinned columns, rows-per-page select |
| Empty state | brand mark in a dashed ring with a page-icon badge | floating icon (gentle 3.6 s bob) with a short message |
| Page entrance | table rows stagger in | `.page > *` children rise in with a 40 ms stagger; route changes fade/slide via a view transition |

Shared by both, keep regardless of flavour: semantic token roles with status quartets, light/dark/system with a persisted choice, confirmation before destructive actions, info tips over text walls, distinct empty vs no-match states, reduced-motion fallbacks.

## Details worth stealing from flavour B

### Status families with five slots
`base / -2 (hover, border) / -soft (tint background) / -line (border) / -ink (text)`, and two families beyond the usual four: **neutral** (slate) for "unknown/idle" and **alt** (violet) for a fifth category such as "scheduled" or "reserved". In dark mode `-soft` becomes the hue at 16% alpha and `-ink` the bright end of the hue.

### Dark mode by inverting the neutral ramp
`:root[data-theme='dark']` remaps `--n-0 … --n-950` in reverse, so every rule that uses the ramp flips without being rewritten. Fast for retrofitting an app that already uses a ramp everywhere; the role-based `light-dark()` approach in tokens.md is cleaner for new work.

### Sliding active pill
An absolutely positioned span sits behind the nav or tab list; on route or tab change, read the active element's `offsetLeft/Top/Width/Height` and move the span with `transform` over 300 ms spring. Re-measure on resize. Works for segmented controls too: the three-option theme toggle slides a `::before` knob by `translateX(32px * index)`.

### Route transitions and focus
On navigation: fade the main area out (120 ms) and in with a small rise (260 ms) using a view transition, move focus to `<main tabindex="-1">`, reset scroll, and provide a "Skip to content" link. Wrap each route in its own error boundary and suspense loader; preload lazy routes in `requestIdleCallback`.

### Page header with breadcrumb
Breadcrumb in 10px small caps above the title (current item emphasised), title with an inline status tag, a note capped at 68ch, actions wrapping to full width on phones. Good for deep hierarchies; flat apps don't need the breadcrumb.

### Data grid extras
- Three-state sort (asc → desc → none) with `aria-sort`; the arrow appears on header hover and rotates 180° for descending; compare numerically when both values are numbers, else `localeCompare(…, { numeric: true })`.
- Column resize with a 7px grip that shows a 1px accent line on hover; keyboard arrows ±16px; minimum 56px. Use pointer events (not mouse events) so it works on touch.
- Sticky header and a pinned first column.
- Filter row: each cell has an input, a clear button and a match-mode button cycling contains / equals / starts-with (≈ / = / A…); a filled cell is tinted.
- Row selection with an indeterminate header checkbox; selection clears when page, sort or filters change.
- Expandable detail rows that animate open.
- Row entrance stagger that runs once: mark the table `is-settled` after ~450 ms so later re-renders don't replay it; key `tbody` by page so a page change re-runs it.
- Rows-per-page select (10 / 25 / 50 / 100) for power users, default 10.

### Combobox
ARIA combobox + listbox with `aria-activedescendant`, arrow / Enter / Esc, portaled panel that flips upward when there is less than ~220px below, highlights the matched substring, 140 ms entrance.

### Forms
- 11px small-caps labels stacked 6px above the field (flavour A uses 13px sentence case).
- A panel that contains the focused input gets a soft 3px accent ring (`.panel:has(input:focus)`), which helps orientation in long forms.
- Required marker `*` plus a visually hidden "required".
- Password fields get a reveal toggle with `aria-pressed`.
- On submit failure, move focus to the first invalid field and link the message with `aria-describedby`.

### Global tooltip layer
One portaled tooltip for the whole app instead of per-component tooltips: 250 ms hover delay, immediate on `:focus-visible`, hides on scroll/keydown/mousedown, clamps 8px inside the viewport, flips below when there is no room above, arrow offset by a CSS variable. Multi-line content parsed into a header plus `Key: value` rows. Link it with `aria-describedby`, and let Esc close it.

### KPI tile
Count-up of the number (620 ms ease-out), a sparkline drawn with a stroke-dash animation, hover lift of 2px with the icon tilting −4° and scaling 1.08, and a radial "spotlight" that follows the cursor (skip it on `hover: none` devices).

### Charts
SVG area chart with three gridlines and thinned x labels; the line draws in and the area fades in; each point has a focusable hit rectangle; the tooltip flips its anchor near the edges (< 20% or > 80% of the width); an sr-only table mirrors the data. Ranked bars: label and value above a 7px track that grows with `scaleX` and a 60 ms stagger.

### Map and graph frames
A toolbar (view tabs, date range, export, basemap segmented switch), a meta sub-bar, and overlay cards inside the stage: filters top-right, legend bottom-left on glass (`blur(6px)`), a loading veil (`blur(2px)`) and a centred "Nothing to plot" state. Graph canvases get zoom −/+ disabled at the limits and a "Reset view" button that turns into "Retry" on failure. Re-theme third-party map controls and tooltips for dark mode.

### Busy panels
Keep content in place and dim it while refreshing, with a sticky centred loader and a 2px indeterminate bar along the panel top. Don't unmount content just to show a spinner.
