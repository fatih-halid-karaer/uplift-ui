# Surfaces: modern backgrounds, cards, layout pieces, patterns and marks

`assets/surfaces.css` holds the pieces that make a page feel current without a framework: textured backgrounds, layered cards, a bento grid, section heads, small status bits, device frames. `assets/patterns/` has tileable SVG patterns and `assets/marks/` has motif marks. Everything reads the tokens, so palette, flavour and dark mode carry through. Open `assets/surfaces-gallery.html` (served, for example `python -m http.server` inside `assets`) to see them in every palette.

## Contents
1. When these belong, and when they don't
2. Backgrounds
3. Patterns
4. Cards
5. Bento grid
6. Section heads and text accents
7. Bits: pills, avatar stack, metric, ring, divider, dock
8. Device frames
9. Motif marks
10. Accessibility and fallbacks
11. Common mistakes → fix

## 1. When these belong, and when they don't

Modern effects are seasoning. They earn their place on surfaces people look at rather than work in: landing and marketing pages, sign-in, onboarding, empty first-use states, dashboards' overview row, feature announcements. Dense working screens (tables, forms, editors, settings) stay on plain `--panel` cards; texture behind a data table makes it harder to read.

Rules of thumb:
- One textured background per view, and only behind a region with little text.
- One featured card (`.s-gradient-border`) per group; if every card is featured, none is.
- Glass only over something busy enough to blur (a mesh, a photo, a map). Over a flat colour it is just a grey card that costs GPU time.
- Keep motion from `motion.css` (aurora, border beam, spotlight) for the same featured spots; don't stack a beam on a gradient border on glass.

## 2. Backgrounds

| Class | Look | Use for |
|---|---|---|
| `.s-bg-dots` | dot grid | hero, empty state, sign-in side |
| `.s-bg-grid` | square grid | planning, blueprint, developer tools |
| `.s-bg-lines` | diagonal hatch | placeholder areas, disabled zones |
| `.s-bg-mesh` | soft multi-colour glow from the brand ramp | hero, onboarding, sign-in |
| `.s-bg-spot` | one glow from the top | page heads, featured card |
| `.s-noise` | film grain over whatever is below | adds depth to mesh and flat brand fills |

`--s-gap` sets the pattern spacing. Fade patterns out with `.s-fade-radial`, `.s-fade-edges` (top and bottom) or `.s-fade-x` (left and right) so they don't end in a hard edge. `--s-noise-strength` (default 0.06) tunes the grain; above 0.12 it looks dirty.

## 3. Patterns

`assets/patterns/` has eight tileable SVGs: `dots`, `grid`, `cross`, `diagonal`, `waves`, `hexagons`, `rings`, `circuit`. They are drawn in black and used as a CSS mask, so the colour comes from a variable:

```html
<div class="s-pattern is-faded" style="--s-pattern-url: url(patterns/hexagons.svg); --s-pattern-size: 28px"></div>
```

`--s-pattern-ink` sets the colour (defaults to muted ink at 22%, 30% in dark); `.is-faded` adds the radial fade. Put the pattern element absolutely behind the content (`position: absolute; inset: 0; z-index: -1` inside an `isolation: isolate` parent). Pick the pattern from the product's domain the same way as the motif: `circuit` for infrastructure, `hexagons` for networks and logistics, `waves` for maritime or audio, `rings` for location and radio.

## 4. Cards

| Class | Look | Use for |
|---|---|---|
| `.s-card` | panel, line, soft shadow | default container |
| `.s-card-raised` | 1px top highlight and three-layer shadow | featured content, popovers on a page, bento tiles |
| `.s-card-inset` | sunken well with an inner shadow | secondary content inside a card, code, previews |
| `.s-glass` | translucent with blur | over mesh, photos and maps only |
| `.s-gradient-border` | brand gradient on the border | the one recommended plan, the new feature |
| `.s-lift` | lifts 2px and tints the border on hover | clickable cards |
| `.s-deck` | two cards peeking below | a collection, "and 12 more" |

Card classes set `background-color`, not the `background` shorthand, so a background class (`.s-bg-spot`, `.s-bg-dots`) on the same element still shows. `--s-angle` turns the gradient border. Clickable cards are links or buttons, not `div`s with `onClick`, and keep a visible focus ring.

## 5. Bento grid

`.s-bento` is a dense grid of unequal tiles for overview and feature sections:

```html
<div class="s-bento" style="--s-cols: 4; --s-row: 140px">
  <article class="s-card-raised s-span-2 s-row-2">…</article>
  <article class="s-card">…</article>
  <article class="s-card">…</article>
  <article class="s-card s-span-2">…</article>
</div>
```

`.s-span-2`, `.s-span-3`, `.s-span-full` and `.s-row-2` size tiles; the grid drops to two columns below 900px and one below 560px, where spans reset. Give the largest tile the main message and keep the reading order in the DOM the same as the visual order, so screen readers and keyboard users meet tiles in a sensible sequence.

## 6. Section heads and text accents

`.s-section-head` stacks `.s-eyebrow` (a pill with an optional `<b>` badge such as "New"), `.s-display` (fluid display title with balanced wrapping) and `.s-lead` (fluid lead paragraph). `.is-center` centres it. `.s-marker` puts a highlighter stroke behind a few words of the title; use it once per page. `.s-hairline` is an `<hr>` that fades at both ends, and `.s-divider-label` is a rule with a word in the middle ("or continue with").

## 7. Bits

- `.s-pill` with an optional `.s-dot` (set `--s-dot` to a status colour) for live states: Online, Syncing, Offline. The word carries the meaning; the dot only decorates.
- `.s-avatar-stack` overlaps initials or images; end with `.is-more` ("+9") instead of showing every person. Set `--s-avatar` for the size and give the group an accessible label ("Ayşe, Zeynep, Mert and 9 others").
- `.s-metric` is a big tabular number over a label; pair it with `StatTile` from the React set when it needs a delta or sparkline.
- `.s-ring` is a CSS-only progress ring; set `--s-value` from 0 to 1, `--s-ring-size` and `--s-ring-w`. Add `role="img"` and an `aria-label` with the percentage.
- `.s-dock` is a floating glass bar at the bottom centre (safe-area aware) for a few top-level actions on phones or a canvas editor. `.is-static` keeps it in the flow. Don't use it on pages that already have a bottom navigation.

## 8. Device frames

`.s-browser` (with `.s-browser-bar` holding three `<i>` dots and a `<span>` address field) and `.s-phone` (with one child as the screen) frame product screenshots on landing and onboarding pages. `--s-phone-w` sets the phone width; `--s-bezel` its colour. Put a real screenshot inside rather than a mock layout, and give the image a meaningful `alt`.

## 9. Motif marks

`assets/marks/` has twelve 24px single-colour marks drawn with `currentColor`: `compass`, `beam`, `blueprint`, `pulse`, `route`, `orbit`, `layers`, `spark`, `shield`, `nodes`, `wave`, `leaf`. They are starting points for the motif chosen in `identity.md` §1: inline the SVG, colour it with `color: var(--primary)`, and use the same mark for the sidebar logo, the loader and the empty-state ring. Adjust the drawing to the product rather than shipping the stock mark as the logo.

## 10. Accessibility and fallbacks

- `prefers-reduced-transparency: reduce` turns glass and the dock into solid panels.
- `prefers-reduced-motion: reduce` removes the hover lift.
- `forced-colors: active` replaces glass, gradient borders and raised cards with system colours and drops noise and deck layers.
- Text on glass or mesh must still meet 4.5:1; check it in both themes and in the brightest palette.
- Decorative backgrounds, patterns, frames and marks are `aria-hidden` or CSS-only; marks used as a logo get an accessible name from the product name, not "compass".

## 11. Common mistakes → fix

| Mistake | Fix |
|---|---|
| Glass card on a flat background | Use `.s-card-raised`; glass only over mesh, photos or maps |
| Pattern behind a table or form | Move it to the hero or empty state; working surfaces stay plain |
| Every card has a gradient border | Keep one featured card per group |
| Pattern ends in a hard edge | Add `.is-faded` or one of the `.s-fade-*` masks |
| Background class on a card does nothing | The card's own CSS uses the `background` shorthand; switch it to `background-color` |
| Noise looks like dirt | Lower `--s-noise-strength` to 0.04–0.08 |
| Bento order differs from reading order | Reorder the DOM; use spans, not `order`, for layout |
