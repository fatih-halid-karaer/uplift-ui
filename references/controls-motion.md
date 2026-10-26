# Controls, icons and motion

## Contents
1. Buttons
2. Inputs and selects
3. Switch with check mark
4. Checkboxes
5. Date inputs
6. Icons
7. Theme switch with a sweep transition
8. Small motions that pay off
9. Reduced motion

## 1. Buttons

| Variant | Look | Use |
|---|---|---|
| primary | solid primary, primary-contrast text, 600 weight | the one main action per view |
| outlined | panel background, line border, ink text | secondary actions next to a primary |
| text | no background until hover (`sunken`) | Cancel, tertiary actions, toolbar buttons |
| danger | solid danger (in confirmations) or text in danger-ink (in rows) | destructive actions |

- Sizes: small 32px (toolbars, cards, rows), default 36px (page heading, dialogs).
- Icon + label with a 6–8px gap; icon-only buttons are square and always have `aria-label` and `title`.
- Pressed state: `scale(.98)`; disabled: 50% opacity and `pointer-events: none`.
- While a request runs, swap the label to a progress verb ("Saving…", "Testing…") and disable; don't add spinners to every button.

## 2. Inputs and selects

- 36px tall, `field` background, `field-line` border, 8px radius; hover darkens the border, focus shows a 2px primary outline with offset (or a 3px primary ring at 20% opacity).
- Labels above, 13px weight 500; required fields marked with a subtle asterisk.
- Prefix icons (search) inside the field at the left, muted.
- Selects with more than ~8 options get a searchable listbox popover; fewer can be a plain select styled like the input.
- Mono font for technical values (IPs, patterns, commands).

## 3. Switch with check mark

A switch reads better with an icon in its knob:

- Track 44×24px, fully rounded, 2px padding, 1px border; off: `line` background; on: primary. A faint inset shadow (`inset 0 1px 2px rgb(0 0 0 / .08)`) gives depth.
- Knob 18px, `panel` background, `0 1px 3px rgb(0 0 0 / .18)` shadow, travels 20px with a 300 ms ease-out-quint.
- Inside the knob: a primary ✓ when on, a muted × when off; they cross-fade with a scale from .5 to 1 over 200 ms.
- Hover: the off track darkens to the field-line-hover colour; the on track goes to primary at 90%.
- Built on a real `<input type="checkbox" role="switch">` stretched invisibly over the track, so keyboard, forms and screen readers work.
- When a list of switches saves on toggle, disable only the switch being saved. Disabling all of them while one request runs makes the whole column flicker at half opacity.

## 4. Checkboxes

16px box, 4px radius, primary fill with a white check when on, the label clickable. Use them in forms and filter panels; use switches for settings that take effect immediately.

## 5. Date inputs

A date field opens its calendar on click or ArrowDown, not on focus: tabbing through a form should not pop a calendar open, and dialogs that focus their first field must not open one by themselves.

## 6. Icons

- One outline icon family with one stroke width everywhere. Lucide (ISC licence) works well; draw at a 1.75 stroke for a calmer look than the default 2.
- Rendering icons as CSS masks keeps markup tiny and lets them inherit `currentColor`:

  ```css
  .icon { display: inline-block; width: 1em; height: 1em; flex-shrink: 0; vertical-align: -0.125em;
          background-color: currentColor;
          mask: var(--icon, url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E")) center / contain no-repeat; }
  .icon-trash { --icon: url("data:image/svg+xml,…"); }
  ```

  The empty-SVG fallback means an unknown icon name draws nothing instead of a solid square. `scripts/build_icon_css.py` generates the rules for only the icons the codebase uses.
- Choose icons that mean the action: an archive box with a lid for archive, a clock for schedules, a route or workflow glyph for flows. A generic box or inbox for everything reads as filler.
- Navigation, tabs, page empty states and dashboard tiles of the same feature use the same icon.

## 7. Theme switch with a sweep transition

A theme change can be an event instead of a flash. With the View Transitions API, reveal the new theme with a rotating conic mask, like a radar or compass hand sweeping across the screen:

```css
@property --sweep { syntax: '<angle>'; inherits: false; initial-value: 0deg; }
:root[data-theme-sweep]::view-transition-group(root),
:root[data-theme-sweep]::view-transition-old(root) { animation: none; }
:root[data-theme-sweep]::view-transition-new(root) {
  animation: theme-sweep 900ms cubic-bezier(.65, 0, .35, 1) both;
  mask-image: conic-gradient(from 0deg at 50% 50%, #000 0deg,
              #000 max(0deg, calc(var(--sweep) - 28deg)), transparent var(--sweep));
}
@keyframes theme-sweep { from { --sweep: 0deg } to { --sweep: 392deg } }
```

```js
function sweepTo(scheme) {
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (calm || !document.startViewTransition) return applyScheme(scheme);
  document.documentElement.dataset.themeSweep = '';
  document.startViewTransition(() => applyScheme(scheme))
    .finished.finally(() => delete document.documentElement.dataset.themeSweep);
}
```

The 28° soft edge keeps the leading edge from looking like a hard cut. The active theme button's icon turns in (rotate from -120°, scale .5, opacity .3, 520 ms). Pick a transition motif that fits the product's identity (a sweep for navigation/monitoring tools, a ripple from the clicked button for playful apps); do not copy a sibling app's motif.

## 8. Small motions that pay off

| Motion | Spec |
|---|---|
| popup in / out | see feedback.md |
| tooltip in | 160 ms, from opacity 0 and `translate: -4px 0` |
| tab underline | transform + width, 300 ms ease-out-quint |
| row entrance | fade up 6px, 30 ms stagger, max 10 rows |
| badge pop | scale .6 → 1, 420 ms ease-out-quint, 60 ms delay |
| hover colours | 150 ms |
| loading mark | a brand-mark needle that seeks: rotates past its target and settles back (`45° → 420° → 395° → 405°`) on a 2.4 s loop |

Animate only `transform` and `opacity` (and colours). Never animate width/height of layout boxes, except measured indicators like the tab underline.

## 9. Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important;
                           transition-duration: .01ms !important; scroll-behavior: auto !important; }
}
```

Plus skip the theme sweep and the row stagger entirely.
