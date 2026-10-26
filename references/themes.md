# Themes: palettes, flavours and font pairings

Ready-made palette presets and flavours that sit on top of `tokens.plain.css` or `tokens.tailwind.css`. They change raw ramps and a few shape variables only, so every component built on role tokens restyles itself. Open `assets/theme-gallery.html` to compare them live.

## Contents
1. Choosing a palette
2. How presets are built and switched
3. Contrast table
4. Status collisions and adjustments
5. Flavours
6. Hook variables
7. Font pairings
8. Generating a custom ramp
9. Common mistakes → fix

## 1. Choosing a palette

Match the product's job first, then its audience. Offer two or three, recommend one, show them in the gallery.

| Preset | Character | Fits |
|---|---|---|
| `ocean` | clear azure, cool blue-grey neutrals | infrastructure, networking, logistics, maritime, cloud consoles |
| `indigo` | calm, serious, slightly creative | developer platforms, analytics, project tools |
| `violet` | imaginative, premium | design tools, AI products, creator platforms |
| `teal` | fresh, clinical, trustworthy | health, lab, water/energy, monitoring |
| `forest` | grounded deep emerald | sustainability, agriculture, finance (growth), field operations |
| `sunset` | warm burnt orange, energetic | marketplaces, booking, media, food and hospitality |
| `rose` | warm, personable, mauve-pink | community, HR, wellness, education |
| `crimson` | bold wine red, decisive | security, sports, editorial brands; avoid where errors are frequent |
| `graphite` | near-monochrome, ink as accent | dev tools, terminals, finance desks, products whose content carries colour |
| `sand` | warm stone and bronze, quiet luxury | documents, legal, archives, real estate, craft |
| `neon` | electric fuchsia on near-black, dark-first | gaming, streaming, nightlife, events, security operations centres |
| `frost` | desaturated steel blue on icy neutrals | internal tools, admin back offices, data catalogues, long working sessions |

Rules of thumb:

- Busy, colour-heavy content (maps, charts, media) → low-chroma preset (`graphite`, `frost`, `sand`) so data stays the loudest thing.
- Many destructive or error states → avoid `crimson`; many warnings → avoid `sunset`; many success states → avoid `forest`.
- Products used at night or in dark rooms → `neon` with dark as the default theme (set `data-theme='dark'` when no preference is stored).
- Sibling apps in the same organisation → pick presets at least 40° of hue apart (identity.md §5).

## 2. How presets are built and switched

Each file in `assets/themes/<name>.css` contains:

| Block | Selector | Contents |
|---|---|---|
| ramps | `:root[data-palette='<name>']` | `--n-0…950` and `--p-50…950` (plain), `--color-surface-0…950` and `--color-primary-50…950` (Tailwind), 11 brand steps + 12 neutral steps (0 is white) |
| extras (some presets) | same | `--font-sans`, `--font-mono` (`graphite`, `sand`, `frost`, `neon`); `--r-*` and `--radius-*` (`rose`, `neon`) |
| shadow tint | `:root[data-palette='<name>']:not([data-theme='dark'])` | `--shadow-card`, `--shadow-float` tinted with the preset's neutral 950 |
| dark extras (`neon` only) | `:root[data-palette='neon'][data-theme='dark']` | glow on `--shadow-float` |

Presets never declare role tokens (`--canvas`, `--primary`, `--color-ink` …). Roles keep pointing at ramp steps, so light/dark keeps working.

Use one preset in production: copy its ramp values into the project's token file and drop the attribute. Switch at runtime (theme picker, multi-tenant branding): load every preset file after the token file and set the attribute on `<html>`:

```html
<link rel="stylesheet" href="tokens.plain.css" />
<link rel="stylesheet" href="themes/hooks.css" />
<link rel="stylesheet" href="themes/ocean.css" />
<link rel="stylesheet" href="themes/flavour-soft.css" />
```

```js
document.documentElement.dataset.palette = 'ocean';
```

Persist the choice like the theme (localStorage + pre-paint script) to avoid a flash. With Tailwind, `@import` the preset files after `tokens.tailwind.css`; they are plain CSS and override the `@theme static` variables because `:root[data-palette]` is more specific than `:root`.

Load order matters: tokens → `hooks.css` → palettes → flavours. When a palette and a flavour both set radius, fonts or shadows, the flavour wins.

Radius mapping between the two token files:

| Plain | Tailwind | Default | Used for |
|---|---|---|---|
| `--r-sm` | `--radius-md` | 6px | small controls, pager buttons |
| `--r-md` | `--radius-lg` | 8px | buttons, inputs |
| `--r-lg` | `--radius-xl` | 12px | cards, dialogs |

## 3. Contrast table

Measured with the WCAG 2 formula. Requirement: ≥ 4.5:1 for 700 on white (light primary, white text on primary buttons) and 400 on neutral-950 (dark primary on canvas). The third column is the dark-mode button text (`primary-contrast` = 950 on 400).

| Preset | primary-700 | 700 on white | primary-400 | 400 on n-950 | 950 on 400 |
|---|---|---|---|---|---|
| base (tokens) | `#1b4a9e` | 8.33 | `#5292f2` | 6.03 | 5.53 |
| `ocean` | `#00567c` | 8.01 | `#009fdd` | 6.25 | 5.70 |
| `indigo` | `#4040a1` | 8.52 | `#7a86f6` | 5.85 | 5.40 |
| `violet` | `#5f3591` | 8.73 | `#a27ae5` | 5.79 | 5.34 |
| `teal` | `#005c58` | 7.86 | `#00a99f` | 6.40 | 5.79 |
| `forest` | `#005239` | 9.27 | `#35ab7c` | 6.46 | 5.86 |
| `sunset` | `#7d2500` | 9.83 | `#e06d38` | 5.73 | 5.32 |
| `rose` | `#852556` | 8.76 | `#d6689e` | 5.67 | 5.25 |
| `crimson` | `#7d0726` | 10.88 | `#e3646f` | 5.63 | 5.48 |
| `graphite` | `#393d45` | 10.90 | `#8e939d` | 6.08 | 5.93 |
| `sand` | `#633910` | 9.89 | `#b98759` | 5.96 | 5.48 |
| `neon` | `#7d1189` | 9.08 | `#d468e7` | 6.65 | 5.80 |
| `frost` | `#255064` | 8.71 | `#6a9bb2` | 6.19 | 5.63 |

Neutral checks across all presets: neutral-500 (`ink-muted`) on white 4.67–4.82, neutral-400 (dark `ink-muted`) on neutral-900 5.96–6.67, and primary-800 on primary-50 (`highlight-ink` on `highlight`) ≥ 8.9. The gallery recomputes the three ratios live for the active preset.

## 4. Status collisions and adjustments

Status colours stay conventional in every preset (green success, amber warn, red danger, sky info); presets cannot touch them. Where the brand hue sits near a status hue, the brand was moved instead:

| Preset | Collides with | Adjustment |
|---|---|---|
| `forest` | success (hue ≈ 149° OKLCH) | brand moved to emerald-teal 163°, chroma lowered to 80%, 700–900 darkened, so success stays the brighter yellow-green |
| `sunset` | warn (≈ 58°) | brand moved to burnt orange 42° (hue drifts redder toward the dark end), 600–800 darkened; warn stays amber |
| `sand` | warn (≈ 58°) | brand kept at 62° but chroma cut to 55% (bronze, not amber) and 700–800 darkened |
| `crimson` | danger (≈ 27°) | brand moved to wine 17°, 600–950 darkened; danger keeps its bright `#dc2626`. Dark-mode 400 (`#e3646f`) is still close to dark danger (`#f87171`): keep danger states as words with icons, and use `crimson` only where errors are rare |
| `rose` | danger | brand moved to mauve-pink 352°, well clear of danger red |
| `ocean`, `frost` | info (≈ 242°) | brand hues 236° / 230°; info stays a lighter, brighter sky. Info statuses are text, never colour alone, so proximity is acceptable |

Whatever the preset, a status is always a word (data.md §5); colour only speeds up scanning.

## 5. Flavours

A flavour is the shape language: radius, shadows, border width, density, heading font and a few looks on `.ui-table` and `.ui-status`. Palettes and flavours combine freely; pick one of each per app. The two original flavours (variants.md) remain: **calm rail** is what you get with no `data-flavour`; **glass spring** is a set of component behaviours, not a file here.

| Flavour | `data-flavour` | Use when | What it changes |
|---|---|---|---|
| Soft rounded | `soft` | consumer-facing apps, onboarding-heavy tools, wellness, education, non-technical users | radii 10/14/20px, 40px controls, roomier rows, pastel canvas, sunken and lines tinted with primary-50/100 (light), canvas tinted with primary-950 (dark), diffuse primary-tinted shadows, status as soft pills, tinted row hover |
| Editorial | `editorial` | documentation, reports, knowledge bases, content management, finance and legal reading | serif headings via `--font-display`, tighter tracking, radii 2/4/6px, no card shadow, hairline rules, header row with an ink-coloured rule and uppercase tracked labels, status in small caps, square row hover |
| Dense terminal / pro | `terminal` | ops consoles, trading, log viewers, admin tools used all day by experts | 32px controls and rows, 13px base text, radii 2–4px, zero shadows (1px outline on floating layers), mono uppercase table headers and statuses, zebra rows, no row entrance animation |
| Bold brutal | `brutal` | campaign tools, creative and youth products, internal hack tools that want personality | 2px borders, square corners, ink-coloured lines and field borders (light) or neutral-400 (dark), hard offset shadows (neutral-950 in light, primary-400 in dark), 800-weight headings, uppercase labels, statuses with a marker underline, flat highlight block on row hover |

Flavour files only touch role tokens where the look demands it (`soft` tints surfaces, `brutal` darkens lines), and always derive them from ramp steps so palette switching keeps working.

Selectors follow one pattern so specificity stays predictable:

| Declares | Selector |
|---|---|
| shape, density, fonts | `:root[data-flavour='x']` |
| light-only roles and shadows | `:root[data-flavour='x']:not([data-theme='dark'])` |
| dark-only roles and shadows | `:root[data-flavour='x'][data-theme='dark']` |
| component looks | `:root[data-flavour='x'] .ui-table :where(…)`, `:root[data-flavour='x'] .ui-status` |

## 6. Hook variables

`assets/themes/hooks.css` defines defaults (calm rail values) and wires them into `.ui-table`, `.ui-status` and headings. Flavours only change the variables. Consume them in your own primitives so flavours reach them too:

| Variable | Default | Consume in |
|---|---|---|
| `--border-w` | 1px | card, input, button, divider borders (Tailwind: `border-(length:--border-w)`) |
| `--control-h` | 2.25rem | button and input height (Tailwind: `h-(--control-h)`) |
| `--control-px` | 0.875rem | button horizontal padding |
| `--control-fs` | 0.875rem | button and input font size |
| `--row-py`, `--row-px` | 0.8125rem, 1rem | table cell padding |
| `--head-pt`, `--head-pb` | 0.5rem, 0.625rem | table header padding |
| `--row-hover-r` | 0.625rem | rounded ends of the hovered row |
| `--status-r` | 0.375rem | status hover box |
| `--font-display` | `var(--font-sans)` | page titles, card titles, empty-state titles |
| `--heading-weight`, `--heading-tracking` | 600, -0.01em | headings |
| `--label-case`, `--label-tracking` | none, 0 | form labels, table headers |

`terminal` also lowers `--fs-sm`, `--fs-13` and Tailwind's `--text-sm`, which shrinks body text by one step.

## 7. Font pairings

All open licence (OFL unless noted). Self-host woff2 with `font-display: swap`; never hot-link. The stacks below fall back to system fonts if a face is missing.

| Pair | Character | Best for | Weights to load | Fallback stack |
|---|---|---|---|---|
| Inter + JetBrains Mono | neutral, very legible small | dashboards, admin, data-dense SaaS | 400 500 600 / 400 500 | `ui-sans-serif, system-ui, 'Segoe UI', Roboto, sans-serif` / `ui-monospace, 'Cascadia Code', Consolas, monospace` |
| Geist + Geist Mono | crisp, engineered | developer tools, `graphite` | 400 500 600 / 400 | `ui-sans-serif, system-ui, sans-serif` / `ui-monospace, Menlo, Consolas, monospace` |
| IBM Plex Sans + IBM Plex Mono | sturdy, technical | infrastructure, enterprise, telecom | 400 500 600 / 400 500 | `'Helvetica Neue', Arial, sans-serif` / `Menlo, Consolas, monospace` |
| DM Sans + DM Mono | geometric, friendly, compact | default tokens, general admin | 400 500 600 / 400 | `ui-sans-serif, system-ui, sans-serif` / `ui-monospace, Consolas, monospace` |
| Manrope + Fira Code | rounded, warm | consumer SaaS, `sand`, `soft` | 400 500 600 700 / 400 | `ui-rounded, system-ui, sans-serif` / `ui-monospace, Consolas, monospace` |
| Plus Jakarta Sans + JetBrains Mono | modern, open | product apps close to marketing, `soft` | 400 500 600 700 / 400 | `system-ui, 'Segoe UI', sans-serif` / `ui-monospace, Consolas, monospace` |
| Space Grotesk + JetBrains Mono | quirky, techno | `neon`, creative tech, events | 400 500 600 / 400 500 | `system-ui, sans-serif` / `ui-monospace, Consolas, monospace` |
| Source Sans 3 + Source Code Pro | humanist, long reading | docs, CMS, help centres | 400 600 / 400 | `'Segoe UI', 'Helvetica Neue', Arial, sans-serif` / `Consolas, Menlo, monospace` |
| Public Sans + Roboto Mono (Apache 2.0) | plain, institutional | public services, forms-heavy apps | 400 500 600 / 400 | `system-ui, Arial, sans-serif` / `ui-monospace, Consolas, monospace` |
| Figtree + Fira Code | friendly, clean | HR, education, community, `rose` | 400 500 600 / 400 | `system-ui, 'Segoe UI', sans-serif` / `ui-monospace, Consolas, monospace` |
| Atkinson Hyperlegible Next + Atkinson Hyperlegible Mono | built for low vision | health, accessibility-first products | 400 500 700 / 400 | `Verdana, system-ui, sans-serif` / `ui-monospace, Consolas, monospace` |
| Rubik + Fira Code | soft corners, bold | `brutal`, playful tools | 400 500 700 800 / 400 500 | `system-ui, sans-serif` / `ui-monospace, Consolas, monospace` |
| Fraunces (display) + Inter | warm editorial serif | `editorial`, reports, knowledge bases | Fraunces 500 600 (opsz axis); Inter 400 500 600 | `Georgia, 'Times New Roman', serif` / Inter stack above |
| Newsreader (display) + Source Sans 3 | journalistic, sober | newsrooms, research, long-form dashboards | 500 600 / 400 600 | `Georgia, serif` / Source Sans stack above |
| Instrument Serif (display) + Geist | fashionable, high contrast | login and empty-state headlines only, never body | 400 (and italic) / 400 500 600 | `'Times New Roman', serif` / Geist stack above |
| Source Serif 4 (display) + IBM Plex Sans | formal, precise | finance, legal, compliance reporting | 600 / 400 500 600 | `Georgia, serif` / Plex stack above |

Set a display serif through `--font-display`, not `--font-sans`: serifs belong to headings, tables and controls stay sans.

## 8. Generating a custom ramp

1. Convert the base ramps to OKLCH (any colour tool). Keep their lightness curve: brand L ≈ .97 .93 .86 .76 .66 .57 .50 .43 .38 .32 .22 for 50…950; neutral L ≈ 1 .98 .96 .92 .85 .69 .56 .47 .39 .31 .24 .18 for 0…950.
2. Rotate the hue to the brand hue. Keep the base chroma curve (peaks at 500–600) and scale it: 1.0 for saturated brands, 0.4–0.6 for muted ones, 0.1 for near-mono.
3. Optionally drift the hue a few degrees along the ramp (warmer/yellower in light steps for oranges, slightly bluer in dark steps for teals); it looks more natural than a fixed hue.
4. Clip out-of-gamut colours by reducing chroma, not lightness.
5. Neutral ramp: same hue (or ±10°), chroma 30–115% of the base neutral (≈ 0.01–0.04). Warm brands want warm neutrals.
6. Check: 700 on white ≥ 4.5, 400 on neutral-950 ≥ 4.5, 950 on 400 ≥ 4.5, neutral-500 on white ≥ 4.5. If 700 fails, lower L of 600–900 by 0.02–0.05; if 400 fails, raise L of 300–400 by 0.02–0.03.
7. Compare against the status hues (success ≈ 149°, warn ≈ 58°, danger ≈ 27°, info ≈ 242°). Within ~15°, move the brand or lower its chroma and document it (§4).
8. Write the values into both variable families (`--p-*` and `--color-primary-*`, `--n-*` and `--color-surface-*`) and view them in the gallery in both themes.

## 9. Common mistakes → fix

| Mistake | Fix |
|---|---|
| Preset declares `--primary` or `--color-panel` | presets set ramps only; roles stay in the token file |
| Only the plain or only the Tailwind names are overridden | write both families; the other is ignored harmlessly |
| Flavour file loaded before palettes, so palette shadows win | load tokens → hooks → palettes → flavours |
| A light-mode shadow override leaks into dark mode | put shadow overrides under `:not([data-theme='dark'])` and `[data-theme='dark']` |
| Brand green used for success badges too | keep statuses on status tokens; adjust the brand (§4) |
| Picking a palette from a swatch on white only | check it in dark and on a full screen in the gallery |
| Serif set on `--font-sans` for the editorial look | use `--font-display`; body and tables stay sans |
| Terminal density on a consumer app | dense flavours are for expert daily users; use calm rail or soft elsewhere |
| Hard brutal shadows on every element | shadows go on cards, secondary buttons and floating layers only |
| Fonts named in a preset but never shipped | self-host them, or accept the system fallback deliberately |
| Mixing two flavours in one app | one flavour per app; the palette may be switchable, the flavour should not be |
