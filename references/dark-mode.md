# Dark mode in depth

tokens.md §4–6 gives the role table and the `light-dark()` mechanics; controls-motion.md §7 and `assets/theme-transitions.css` cover the switch animation. This file is about making dark mode *good* rather than merely inverted: surfaces, colour, depth, media, embedded widgets, and how to test it.

Dark mode is not "light mode with the colours flipped". In light mode, depth comes from shadows on a bright canvas; in the dark, shadows vanish, so depth comes from surface lightness. Saturated colours that look crisp on white vibrate on near-black. Most dark-mode bugs come from ignoring those two facts.

## Contents
1. Principles
2. Surfaces and elevation
3. Text
4. Brand colour in the dark
5. Status colours
6. Shadows, borders and focus
7. Charts and maps
8. Images, logos, illustrations
9. Third-party widgets and embedded content
10. Avoiding the flash
11. Switching
12. Testing
13. Common mistakes

## 1. Principles

- Not pure black. Canvas around surface-950 (`#0d121c` in the example ramp): pure `#000` with white text causes halation (text smearing) and makes elevation impossible.
- Not pure white text for long reading: white is fine for headings (`ink-emphasis`); body `ink` can be white or surface-100 depending on the ramp; muted is surface-400.
- Tinted neutrals: keep the dark ramp tinted toward the brand hue, like the light one (tokens.md §2). A neutral grey dark mode next to a blue primary looks unfinished.
- Same hierarchy, same layout. Nothing moves or appears only in one theme.
- Every colour is a role token with a dark value. If a component needs a colour that has no role, add the role in both themes; don't hard-code a dark override in the component.

## 2. Surfaces and elevation

In the dark, higher means lighter.

| Level | Role | Light | Dark (example ramp) |
|---|---|---|---|
| 0 canvas | `canvas` | surface-50 | surface-950 `#0d121c` |
| 1 sidebar, subtle areas | `subtle` | surface-50 | between 950 and 900 |
| 1 main panel, cards | `panel` | white | surface-900 `#181f2c` |
| 2 popovers, menus, tooltips | `raised` (add if needed) | white | ~surface-850 (mix 900 and 800) |
| 3 dialogs, popups | `raised` or `panel` + border | white | surface-800 `#273041` at most |
| wells, hover, code | `sunken` | surface-100 | surface-800 |

```
light                               dark
canvas  ░░░░░░░░░░░░░░░             canvas  ████████████████  darkest
panel     ▒▒▒▒▒▒▒▒▒▒▒  + shadow     panel     ▓▓▓▓▓▓▓▓▓▓▓    lighter
dialog       ▒▒▒▒▒  + float shadow  dialog       ▒▒▒▒▒       lighter still + 1px line
```

- Two to three dark surface steps are enough; more and they look like mistakes.
- Note `sunken` in dark is *lighter* than panel (surface-800), because "hover" and "well" both need to be distinguishable from the panel, and darker than surface-900 is nearly invisible. Check that hover on a `panel` row is visible in both themes.
- Alternative: an elevation overlay, `color-mix(in srgb, white 4–8%, var(--color-panel))` per level. Simpler to retrofit, slightly greyer.
- The scrim behind dialogs is darker in dark mode (`rgb(0 0 0 / .6)`) because the light-mode scrim barely changes a dark page.
- Translucent glass surfaces (glass-spring flavour) use panel at 72–85% opacity over the canvas; check text contrast over the busiest content that can sit behind them.

## 3. Text

| Role | Light | Dark | Notes |
|---|---|---|---|
| `ink-emphasis` | surface-800 | white | headings |
| `ink` | surface-700 | white or surface-100 | body |
| `ink-muted` | surface-500 | surface-400 | check ≥ 4.5:1 on panel *and* sunken |
| disabled | 50% opacity of the element | same | exempt from contrast, but must still look disabled |

- Light text on dark looks bolder than dark on light. If 600 headings feel heavy in dark mode, keep the weight (consistency) but you may drop ink-emphasis to surface-50.
- Thin fonts (300) and 12px text suffer most in the dark; the UI shouldn't use them anyway (tokens.md §7).
- Selection colour (`::selection`): primary at 30–35% in dark so selected text stays readable.

## 4. Brand colour in the dark

- Use a lighter, slightly less saturated step: primary-400 instead of 700 (tokens.md §3). Saturated mid-tones on near-black vibrate and fail contrast.
- If the 400 step still looks neon, reduce chroma by 10–20% (in OKLCH, lower C, keep L): `oklch(from var(--color-primary-400) l calc(c * .85) h)`.
- Text on a primary button flips: `primary-contrast` is primary-950 (dark text on a light-blue button) in dark mode. White text on primary-400 usually fails 4.5:1.
- `highlight` (selected row, active nav) becomes primary-400 at ~16% over the surface, with `highlight-ink` primary-100.
- Large brand-coloured areas (login brand half, onboarding hero) get the 800–900 step in dark mode, not the light-mode 700, so they don't glow.
- Links in body text: primary in both themes, underlined; check them on `sunken` too.

## 5. Status colours

Same quartets (tokens.md §5), dark values:

| Token | Dark value |
|---|---|
| `danger` (icons, fills) | the 400 step (`#f87171`) |
| `danger-soft` (callout background) | `color-mix(in srgb, var(--danger) 12%, transparent)` |
| `danger-line` | `color-mix(in srgb, var(--danger) 30%, transparent)` |
| `danger-ink` (text) | the 200 step (`#fecaca`) |

- Using `transparent` in the mix (not a fixed dark hex) lets soft backgrounds sit on panel, sunken or raised without a visible box edge.
- Status text in tables (data.md §5) uses `*-ink` dark values; check success-ink and warn-ink on panel ≥ 4.5:1.
- Amber/yellow is the hardest: warn-ink in dark is a pale amber, warn solid is amber-400; never yellow text on white-ish backgrounds in light mode either.
- Solid status fills with text (rare: a "Failed" badge in a popup heading) need dark text on the bright dark-mode fill.

## 6. Shadows, borders and focus

- Shadows barely show on dark surfaces. Keep the `card` shadow (harmless) but rely on **elevation + a 1px `line` border** for cards, dialogs, menus and popovers in dark mode.
- Floating elements: `float` shadow made deeper (`0 8px 24px -6px rgb(0 0 0 / .5)`) plus a 1px border at `line` or white at 6–8%. The border does the work.
- An inner top highlight (`inset 0 1px 0 rgb(255 255 255 / .04)`) on raised surfaces reads as a lit edge; use sparingly, consistently.
- Dividers and table row separators: `line-soft` (surface-800). A light-mode `#e5e7eb` hard-coded border becomes a glaring white line in dark mode: grep for it.
- Focus rings: primary-400 outline, still 2px. Check ≥ 3:1 against both panel and the element's own fill.
- Input fields: `field` is the darkest surface (surface-950) so fields read as recessed; `field-line` surface-600 for a visible edge.

## 7. Charts and maps

charts.md §10 has the chart rules. Additionally:

- Chart series colours step up one or two ramp steps in dark (400 instead of 600) and area fills drop to 10–14% opacity.
- Heatmaps: invert sequential scales so high = bright.
- Canvas and WebGL renderers don't follow CSS variables after drawing. Subscribe to theme changes (a `MutationObserver` on `<html data-theme>`, or the app's theme store) and re-render with values read via `getComputedStyle`.
- Maps: switch to the provider's dark basemap style (most raster and vector providers ship one), not a CSS `filter: invert()` hack (it inverts photos, flags and brand pins). Re-theme zoom controls, attribution and popups with role tokens; markers keep status colours at dark values with a 1–2px panel-coloured halo so they separate from the basemap.
- Graph/diagram canvases (node editors, topology views): node fill `panel`, border `line`, edges ink-muted, selected primary; the background grid dots `line-soft`.

## 8. Images, logos, illustrations

| Asset | Dark-mode treatment |
|---|---|
| Logo / brand mark (single colour) | SVG with `fill="currentColor"` or a token; flips with the theme |
| Logo (multi-colour, third party) | provide a dark variant via `<picture><source media="(prefers-color-scheme: dark)">`, or for app-controlled themes swap by `data-theme` |
| Icons | CSS mask icons inherit `currentColor` (controls-motion.md §6); nothing to do |
| Illustrations, empty-state art | draw with `currentColor` and tokens (the motif in a dashed ring already does); avoid baked white backgrounds |
| Screenshots and photos | leave as is; optionally `filter: brightness(.9)` to reduce glare; never invert |
| Diagrams with white backgrounds (user content) | place on a white "paper" card with 8px padding instead of fighting them |
| Avatars | keep; add a 1px `line` ring so dark avatars don't merge with the panel |
| Favicons | an SVG favicon can contain `@media (prefers-color-scheme: dark)` in its `<style>` |

Transparent PNGs with dark strokes vanish on dark backgrounds; check every PNG asset once in dark mode.

## 9. Third-party widgets and embedded content

The most common dark-mode leaks live here (audit-checklist.md "Theme").

- **Component libraries**: point their theme variables at your roles (tokens.md §10) in both themes; check their portaled overlays (date pickers, selects, tooltips) which may sit outside your themed container.
- **Code editors** (Monaco, CodeMirror): ship a light and dark editor theme built from your tokens; switch with the app theme.
- **Rich-text editors, markdown previews**: style their content area with your roles; strip inline `color`/`background` styles from pasted content, or render them on a "paper" surface.
- **Iframes and embeds** you don't control: give the frame a `panel` border and accept they may be light; set `color-scheme` on the iframe element so the browser at least styles its scrollbars.
- **Native controls**: `color-scheme: dark` on `:root` makes scrollbars, date pickers, checkboxes and autofill backgrounds dark. Set it with the theme, not just in CSS for `prefers-color-scheme`.
- **Autofill**: browsers paint autofilled inputs light yellow/blue; override with `input:-webkit-autofill { -webkit-text-fill-color: var(--color-ink); box-shadow: 0 0 0 1000px var(--color-field) inset; }`.
- **Emails and exported PDFs** stay light; don't let the theme leak into generated documents.

Grep for leaks: `#fff`, `white`, `#000`, `black`, `rgb(255`, `bg-white`, `text-black`, `background: #` in components and third-party overrides.

## 10. Avoiding the flash

The flash of the wrong theme (FOUC) happens when the theme is applied after first paint (in a React effect). Apply it before:

```html
<head>
  <meta name="color-scheme" content="light dark">
  <script>
    (function () {
      try {
        var s = localStorage.getItem('theme') || 'system';
        var dark = s === 'dark' || (s === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
        var r = document.documentElement;
        r.dataset.theme = dark ? 'dark' : 'light';
        r.style.colorScheme = dark ? 'dark' : 'light';
      } catch (e) {}
    })();
  </script>
  <!-- stylesheets after -->
```

- Inline, synchronous, before stylesheets, wrapped in try/catch (localStorage can throw). `assets/react/*/theme` contains this script.
- `<meta name="color-scheme">` tells the browser both are supported, so the default canvas before CSS loads matches the system.
- Server-rendered apps can set `data-theme` on the server from a cookie, avoiding the script; still keep it for "system".
- Content Security Policy: allow the inline script with a hash or nonce rather than dropping it.
- Disable transitions during the initial application and during non-animated theme switches (add a `.no-transitions` class for one frame), or every element animates its colour on load.

## 11. Switching

- Three options: Light, Dark, System. Persisted. "System" follows `prefers-color-scheme` live via a `change` listener on the media query.
- The switch lives in the floating pill (layout-responsive.md §7) and in the profile page (pages.md §8); both write the same value.
- Transition: the identity's motif (sweep or circular reveal) or an instant switch; skip animation under reduced motion (controls-motion.md §7).
- Persist per user on the server if the app has accounts and people use several devices; localStorage remains the pre-paint source.

## 12. Testing

- View every page in both themes as part of each step (SKILL.md step 4), not at the end.
- Contrast check of every role pair in dark (accessibility.md §2), especially ink-muted on sunken, `*-ink` on `*-soft`, primary-contrast on primary.
- Open every overlay (menus, date pickers, comboboxes, info tips, popups) in dark: portaled elements are where leaks hide.
- Reload in dark with cache disabled and network throttled: no white flash.
- Switch theme with a dialog open and a chart visible: both re-theme.
- Toggle the OS theme while the app is on "System": it follows without reload.
- Check images and logos once on dark.
- Screenshot both themes side by side for the user's review.

## 13. Common mistakes

| Mistake | Fix |
|---|---|
| Pure `#000` canvas with pure white text | Tinted surface-950 canvas; white only for headings |
| Same saturated primary in both themes | Primary-400 in dark, desaturate if neon; dark text on primary buttons |
| Dark cards separated only by shadows | Lighter surface for higher levels + 1px border |
| Hover/sunken darker than panel in dark, invisible | Sunken one step lighter than panel in dark |
| Hard-coded `#e5e7eb` borders glare in dark | `line` / `line-soft` roles |
| White flash on load | Inline pre-paint script + `color-scheme` meta |
| Date picker or select menu stays light | Theme portaled overlays; `color-scheme` on root |
| Map made dark with `filter: invert()` | Provider's dark basemap; re-theme controls |
| Canvas chart keeps light colours after switching | Re-render on theme change with computed token values |
| Logo disappears on dark | `currentColor` SVG or a dark variant |
| Light-yellow autofill boxes | Autofill override with field and ink roles |
| Dark mode tested only on the dashboard | Every page, every overlay, both themes, each step |
