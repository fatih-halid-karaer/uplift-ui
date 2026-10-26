# Design tokens

Tokens are the single place where an app's look lives. Get them right and most components restyle themselves; get them wrong and every page fights you. This file describes a token architecture that has held up across two real admin-style apps, plus how to adapt it.

## Contents
1. Layers
2. Neutral ramp
3. Brand ramp
4. Semantic roles
5. Status quartets
6. Light and dark in one declaration
7. Typography
8. Radius, shadow, spacing
9. Motion
10. Migrating an existing app

## 1. Layers

Keep three layers and never skip one:

| Layer | Example | Who uses it |
|---|---|---|
| Raw ramps | `--color-surface-200`, `--color-primary-700` | only the role layer |
| Roles | `--color-panel`, `--color-line`, `--color-ink-muted`, `--color-primary` | components |
| Component hooks | `--page-pad`, `--row` | a single component or layout |

Components reference roles, never raw ramps or hex. That rule is what lets you change the brand colour in one line, and it is what makes dark mode free.

## 2. Neutral ramp

Use a neutral tinted slightly toward the brand hue (a cool blue-grey for a blue brand, a warm stone for an orange brand). Pure grey looks dead next to a saturated primary.

Eleven steps, 0/50/100…900/950. A blue-tinted example:

```
0 #ffffff   50 #f5f7fb  100 #edf1f7  200 #dde4ee  300 #c3cedd  400 #8f9db3
500 #66748b 600 #4d5a70  700 #3a4558  800 #273041  900 #181f2c  950 #0d121c
```

## 3. Brand ramp

Same eleven steps. Pick the 700 step as the light-mode primary (strong enough for white text, AA on white) and the 400 step as the dark-mode primary (bright enough on a near-black canvas). Example blue:

```
50 #eef5ff 100 #d9e8ff 200 #b5d2ff 300 #84b4fb 400 #5292f2 500 #2f73e0
600 #1f5bc2 700 #1b4a9e 800 #193e80 900 #172f5f 950 #0c1a38
```

To generate a ramp for another hue, keep the lightness curve of this one and rotate the hue; check 700-on-white and 400-on-950 contrast (≥ 4.5:1 for text, ≥ 3:1 for large text and UI borders).

## 4. Semantic roles

| Role | Light | Dark | Use |
|---|---|---|---|
| `canvas` | surface-50 | surface-950 | app background behind panels |
| `panel` | white | surface-900 | cards, dialogs, main content |
| `subtle` | surface-50 | between 900 and 950 | sidebars, tooltip headers |
| `sunken` | surface-100 | surface-800 | hover fill, wells, code blocks |
| `line` | surface-200 | surface-700 | borders, dividers |
| `line-soft` | surface-100 | surface-800 | row separators |
| `ink` | surface-700 | white | body text |
| `ink-emphasis` | surface-800 | white | headings |
| `ink-muted` | surface-500 | surface-400 | secondary text, icons |
| `primary` | primary-700 | primary-400 | actions, selection, focus |
| `primary-contrast` | white | primary-950 | text on primary |
| `highlight` | primary-50 | primary-400 at 16% | selected row, active nav |
| `highlight-ink` | primary-800 | primary-100 | text on highlight |
| `field` | white | surface-950 | inputs |
| `field-line` | surface-300 | surface-600 | input borders |

Body text in the light theme is surface-700, not black: it reads calmer and still passes contrast.

## 5. Status quartets

Every status colour (success, warn, danger, info) gets four tokens, so a component never invents a tint:

| Token | Purpose | Example (danger, light / dark) |
|---|---|---|
| `danger` | icons, solid fills, rails | `#dc2626` / `#f87171` |
| `danger-soft` | background of a callout or hover | `#fef3f2` / `#f87171` mixed 12% |
| `danger-line` | border of a callout | `#fbc5c0` / `#f87171` mixed 30% |
| `danger-ink` | text on the soft background, or coloured status text | `#991b1b` / `#fecaca` |

Dark-mode soft and line values are `color-mix(in srgb, <dark solid>, transparent 88% / 70%)` so they sit on any dark surface.

## 6. Light and dark in one declaration

Declare each role once with `light-dark()` and switch with `color-scheme`:

```css
:root { color-scheme: light; }
:root[data-theme='dark'] { color-scheme: dark; }

--color-panel: light-dark(#ffffff, var(--color-surface-900));
```

Declare **both** `color-scheme` rules in CSS, even if JavaScript also sets `style.colorScheme`. Production builds that run LightningCSS (Tailwind v4, Vite with `css.transformer: 'lightningcss'`) polyfill `light-dark()` as `var(--lightningcss-light, a) var(--lightningcss-dark, b)` and only define those helper variables on selectors where CSS declares `color-scheme`. With only the dark rule declared, every role token is invalid in light mode in the production build (transparent backgrounds, black text) while the dev server looks fine.

This keeps both themes side by side in the source, so nobody forgets one. Store the user's choice (light / dark / system) in localStorage, resolve "system" with `matchMedia('(prefers-color-scheme: dark)')`, and set `data-theme` on `<html>` before first paint (inline script in `index.html`) to avoid a flash.

For browsers without `light-dark()` (pre-2024), fall back to two blocks of custom properties under `:root` and `:root[data-theme='dark']`. The `assets/tokens.plain.css` file does exactly that.

## 7. Typography

- One sans for UI, one mono for code, IDs, cron expressions, IPs. Pair them from the same family when possible (DM Sans + DM Mono, IBM Plex Sans + Plex Mono, Geist + Geist Mono) so x-heights match.
- Self-host the fonts (woff2, `font-display: swap`, latin + latin-ext subsets with `unicode-range`). A UI that silently falls back to a system font on some machines looks inconsistent; users notice "the font keeps changing".
- Base size 14px (0.875rem) with line-height 1.5 for dense admin UIs, 16px for public sites. Add a 13px step (`text-13`) for table meta, hints and tooltip bodies, and an 11px step only for badges.
- Weights: 400 body, 500 labels and table headers, 600 headings and buttons. Avoid 700+ in UI chrome.
- Use `font-variant-numeric: tabular-nums` in tables, counters and pagers so numbers don't jitter.
- Disable ligatures in mono (`font-variant-ligatures: none`) so `->` and `!=` stay literal.

## 8. Radius, shadow, spacing

- Radius scale: 6px controls, 8px buttons and inputs, 12px cards and dialogs, full for pills and switches. Nested radii shrink by the padding between them.
- Two shadows are enough: `card` (barely there: `0 1px 2px rgb(0 0 0 / .05), 0 1px 3px rgb(0 0 0 / .04)`) and `float` for popovers and dialogs (`0 8px 24px -6px rgb(0 0 0 / .16), 0 2px 6px rgb(0 0 0 / .06)`). Tint the shadow colour with the darkest neutral, not pure black.
- Spacing on a 4px grid. Page padding as a variable (`--page-pad: 1rem` on phones, `1.5rem` from md) so full-bleed pages can cancel it with `margin: calc(var(--page-pad) * -1)`.

## 9. Motion

| Token | Value | Use |
|---|---|---|
| `ease-out-quint` | `cubic-bezier(.22, 1, .36, 1)` | anything entering, sliding, settling |
| fast | 150 ms | hover and colour changes |
| base | 200–220 ms | popups in, tabs, switches |
| exit | 140 ms | popups out (exit faster than enter) |
| slow | 300–420 ms | sliding indicators, staggered rows |

Always ship a `prefers-reduced-motion: reduce` block that shortens durations to ~0 and removes staggered entrances.

## 10. Migrating an existing app

1. Inventory every hard-coded colour (`grep -E '#[0-9a-fA-F]{3,8}|rgb\('`) and every component-library theme variable.
2. Map each to a role from section 4; when two greys are within a step of each other, merge them.
3. Introduce the tokens file, then replace usages file by file. Keep the app running between steps.
4. If a component library is in use (PrimeReact, MUI, Ant), point its theme variables at your roles rather than fighting its CSS selector by selector.
5. Only after the swap compiles and looks right in both themes, start changing the palette itself.
