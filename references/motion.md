# Motion library

Every animation from both source apps, collected in `assets/motion.css` (classes prefixed `m-`) with React helpers in `assets/react/{tsx,jsx}/motion`. Open `assets/motion-gallery.html` in a browser to see each one live, in light and dark.

Motion is there to explain cause and effect: where something came from, that an action registered, that the app is working. Use one or two per view; an app where everything moves feels slow.

## Contents
1. Easing and duration tokens
2. Catalogue
3. Choosing per flavour
4. React helpers
5. Rules

## 1. Easing and duration tokens

| Token | Curve | Character |
|---|---|---|
| `--ease-out-quint` | `.22, 1, .36, 1` | calm settle, no overshoot (calm-rail flavour) |
| `--ease-out-expo` | `.16, 1, .3, 1` | fast start, long glide (sheets, drawers, page rise) |
| `--ease-spring` | `.22, 1.15, .36, 1` | slight overshoot (glass-spring flavour, sliding pills) |
| `--ease-overshoot` | `.34, 1.56, .64, 1` | clear bounce, only for small icons popping in |
| `--ease-in-out` | `.65, 0, .35, 1` | symmetric, for sweeps, shines, loaders |

Durations: 120–150 ms for hover and press, 160–220 ms for small things appearing, 260–320 ms for panels, sheets and indicators, 380–520 ms for staggered or drawn content, 560–900 ms only for one-off moments (theme change).

## 2. Catalogue

### Appearing and leaving

| Class | What it does | Use for |
|---|---|---|
| `m-popup-in` / `m-popup-out` | rise 8px + scale .97 → 1, 220 ms; leave 140 ms | dialogs and popups (calm) |
| `m-pop-spring` / `m-leave` | scale .92 → 1 with spring; leave drops 6px | dialogs (spring) |
| `m-scrim-in` / `m-scrim-out` | fade | modal backdrops |
| `m-sheet-in` | slide up from the bottom, 280 ms | dialogs as bottom sheets on phones |
| `m-tip-in` | fade + 4px slide from the left, 160 ms | side tooltips, info panels |
| `m-tip-rise` | fade + 4px rise, 140 ms | tooltips above or below, dropdowns, comboboxes |
| `m-badge-in` | scale .6 → 1 after 60 ms | count badges, filter counts, new-item dots |
| `m-icon-pop` | scale .4 → 1 with overshoot | the big tone icon in a status popup |
| `m-icon-turn` | rotate in from -120° | the active icon of a toggle group (theme switch) |
| `m-halo` | a ring expands and fades once | drawing attention to a just-created item or a pinged control |
| `m-draw` | SVG stroke draws itself (set `--m-length` to the path length) | success check marks, sparklines, chart lines |
| `m-grow-x` | bar grows from the left, staggered by `--i` | ranked bars, progress, meters |

### Lists and pages

| Class | What it does | Use for |
|---|---|---|
| `m-stagger` | children rise 6px with 30 ms stagger, max 10 | table rows, card grids, lists |
| `m-stagger.is-settled` | stops replaying after first load | lists that re-render often |
| `m-page` | page sections rise in with 40 ms stagger | page mount and route change |
| `m-collapse` + `.is-open` | height auto animation via grid rows | expandable rows, accordions, filter rows |

Key the list container by page number (or filter signature) so a page change re-runs the stagger.

### Feedback on interaction

| Class | What it does | Use for |
|---|---|---|
| `m-press` | `scale(.97)` while pressed; `.is-pressed` flash when triggered by keyboard (Enter) | buttons |
| `m-lift` | lift 2px with the float shadow on hover | clickable cards and tiles |
| `m-nudge` + `m-nudge-target` | the trailing icon moves 2px on hover | "Open →", "Next ›" buttons |
| `m-shine` | a diagonal light sweeps across on hover | the one primary call-to-action (spring flavour) |
| `m-spotlight` | a soft radial glow follows the cursor (set `--mx/--my`) | KPI tiles, feature cards; hidden on touch |
| `m-bounce-select` | .92 → 1.06 → 1 | a cell or chip that just got selected |
| `m-shake` | small horizontal shake | a field or dialog after a failed submit (once, not on every keystroke) |

### Waiting

| Class | What it does | Use for |
|---|---|---|
| `m-seek` | a needle overshoots and settles, 2.4 s loop | brand loader (compass, gauge, dial) |
| `m-spin` | linear spin | generic spinner |
| `m-indeterminate` | a 2px bar sweeping along the top of a panel | refreshing content that stays visible |
| `m-skeleton` | shimmering placeholder blocks | first load when the layout is known |
| `m-bob` | gentle 4px float, 3.6 s | the icon of an empty state (spring flavour) |

### Moving indicators

| Class | What it does | Use for |
|---|---|---|
| `m-slider` | absolutely positioned element that glides to a measured box | active nav pill, tab underline, segmented control knob |
| `m-drawer` | transform transition for off-canvas panels | mobile navigation drawer |

Theme transitions (sweep and circular reveal) live in `assets/theme-transitions.css`; see controls-motion.md §7.

### Scroll

Scroll-driven classes use CSS scroll timelines (`animation-timeline: view()` / `scroll()`) where the browser has them and fall back to a small JS hook elsewhere, so content is never hidden without JS.

| Class | What it does | Timing | Use for |
|---|---|---|---|
| `m-reveal` | fades and rises 24px as it enters the viewport; fallback adds `is-pending` then `is-inview` via `useReveal` | view range `entry 5%` → `cover 30%`; fallback 520 ms quint, 60 ms stagger by `--i` | long marketing-style pages, settings sections below the fold; not table rows |
| `m-scroll-progress` | a 3px accent bar scaling with scroll position; `.is-inline` makes it sticky inside a scroll container | tied to scroll, fallback via `--m-progress` from `useScrollProgress` | long articles, docs, release notes, long forms |
| `m-parallax` | drifts the element by ±`--m-depth` (default 40px) while it crosses the viewport | tied to scroll, no fallback (stays static) | one decorative layer in a hero or empty area; never on text people read |
| `m-sticky-header` + `m-shrink` | sticky header gains shadow, translucent panel and blur when `.is-scrolled`; `m-shrink` child scales to .86 | 220–240 ms quint | app top bars, page headings with actions, table headers on long pages (`useScrolled`) |

### Page transitions

Pick by relationship: unrelated destinations fade through, siblings in a sequence slide on a shared axis, the same object at two sizes morphs.

| Class | What it does | Timing | Use for |
|---|---|---|---|
| `m-fade-through-out` → `m-fade-through-in` | old view fades and shrinks to .98, new one fades in from .94 | 90 ms ease-in, then 210 ms quint | switching top-level sections, tabs with unrelated content |
| `m-axis-x-out` → `m-axis-x-in` | leave left, enter from the right by `--m-shift` (32px); add `m-back` to reverse | 180 ms out, 300 ms expo in | wizard steps, pagers between detail records, carousels |
| `m-axis-y-out` → `m-axis-y-in` | the same on the vertical axis (24px) | 180 / 300 ms | one-question-at-a-time forms, vertical steppers, onboarding |
| `m-back` | sets `--m-dir: -1` so axis transitions run backwards | — | "Back" and "Previous" navigation |
| `m-swap-in` | fade in from a 6px blur | 260 ms quint | swapping content in place: date range, unit toggle, chart data |
| `m-morph` | gives an element `view-transition-class: m-morph` and tunes its group to 380 ms expo; the name comes from `morphTransition` | 380 ms group, 240 ms cross-fade | thumbnail → detail, list card → full page, avatar → profile header |

### Text

| Class | What it does | Timing | Use for |
|---|---|---|---|
| `m-typewriter` | reveals a single line with `clip-path` steps; set `--m-chars` to the character count; best in a mono font | 45 ms per character | a terminal line, a status like "Deploy finished", empty-state hint |
| `m-caret` | a blinking caret after the text (`::after`) | 1 s steps | pair with `useTypewriter` for any font, or with a live input preview |
| `m-split` | children (from `splitText`) rise 0.6em from a 4px blur, one after another by `--i` × `--m-step` (28 ms) | 520 ms quint each | a hero heading, a welcome line; one per page |
| `m-shimmer-text` | a light band sweeps through muted text | 2.2 s linear loop | "Generating…", "Thinking…", background job labels |
| `m-gradient-text` | brand-to-info-to-success gradient slowly pans inside the letters | 8 s loop | one display word on a login or landing hero |
| `m-odometer` (+ `m-odometer-digit`, `m-odometer-reel`) | digits roll on vertical reels to a new value; built by `odometer()` | 700 ms expo, 40 ms per digit from the right | KPI tiles that update live, counters, prices |
| `m-scramble` | tabular figures for text that `scramble()` decrypts left to right | 640 ms | revealing a generated key or code, a status that resolves |

### Feedback (extended)

| Class | What it does | Timing | Use for |
|---|---|---|---|
| `m-ripple` + `m-ripple-wave` | a circle expands from the click point and fades (`ripple()` adds the wave) | 560 ms quint | material-flavoured buttons, list rows, icon buttons |
| `m-magnetic` | the element leans up to 30% toward the pointer (`magnetic()` / `magneticReset()`) | 280 ms spring | one hero call-to-action; mouse only |
| `m-tilt` | 3D tilt up to 8° toward the pointer with a soft glare (`tilt()` / `tiltReset()`) | 90 ms follow, 420 ms settle | feature or pricing cards on a public page, not dense app UI |
| `m-confetti-bit` | small coloured bits fly out and fall from a point (`burst()` spawns 18) | 900 ms quint | finishing onboarding, first successful setup; rare moments only |
| `m-like` + `m-like-icon` | on `aria-pressed="true"` the icon squashes and pops to 1.25 with a ring | 460 ms spring, ring 520 ms | like, favourite, star, pin toggles |
| `m-swap-icon` + `.is-done` | first icon rotates out, second rotates in with overshoot | 280 ms overshoot | copy → check, save → saved, play → pause (`useTimedFlag`) |
| `m-burger` | three bars morph to a close × when the button has `aria-expanded="true"` (or `.is-open`) | 300 ms quint | mobile navigation toggle |
| `m-ping` | a copy of the dot grows and fades behind it | 1.6 s loop | unread indicator, live status, "new" dot; one per screen |
| `m-wiggle` | a short decaying rotation | 620 ms once | point at a control the user needs ("You have unsaved changes" save button) |
| `m-wiggle-loop` | the same wiggle every 4 s, still the rest of the time | 4 s loop | a bell with unread notifications; stop it once seen |
| `m-underline` | underline grows from the left on hover and focus | 260 ms quint | inline links, footer and nav links |
| `m-card-flip` + `.is-flipped` | two stacked faces rotate 180° in 3D | 560 ms quint | front/back detail cards, flashcards, "show answer" |

### Lists (extended)

| Class / helper | What it does | Timing | Use for |
|---|---|---|---|
| `flip()` / `useFlip()` | FLIP: items with `data-flip-key` glide from their old position to their new one | 320 ms quint | sorting, filtering, drag-and-drop reorder, a moved row |
| `m-row-enter` | the row opens from zero height (`grid-template-rows` 0fr → 1fr) and fades in | 280 ms quint | a row or card that was just added |
| `m-row-exit` | the row slides 24px right, fades and collapses its height | 200 ms ease-in | a row that was removed or archived (unmount with `useLeave`) |
| `m-flash` | the background starts as `--highlight` and fades out | 1.4 s | marking the added or just-updated row |
| `m-drag` + `.is-lifted` | the grabbed item scales 1.03, tilts 1° and gets the float shadow | 200 ms spring | drag handles in sortable lists, kanban cards |
| `m-accordion` + `m-chevron` | `<details>` opens to auto height (`::details-content` + `interpolate-size`), chevron turns 180°; plain open/close where unsupported | 280 ms / 260 ms quint | FAQs, settings groups, filter groups |
| `m-stagger-grid` | grid children zoom in from .9 in a diagonal wave by `--row` + `--col` (`gridStagger()` measures them) | 420 ms, 45 ms per diagonal | card grids, gallery thumbnails, dashboard tiles |
| `m-img-in` | fades in from a 12px blur and 1.04 scale | 600 ms quint | lazy images once `load` fires, avatars, thumbnails |

`m-row-enter` / `m-row-exit` animate grid rows, which is a layout property: this is a measured exception like `m-collapse`. They need a block element (a `<li>`, a `div` row, or a wrapper inside a `<td>`); a `<tr>` cannot become a grid.

### Loading (extended)

Every loader needs an accessible name (`role="status"` + `aria-label`, or visible text). Under reduced motion they stop as a static shape, so keep the text.

| Class | What it does | Timing | Use for |
|---|---|---|---|
| `m-dots` | three dots pulse in turn (inherits `currentColor`) | 1 s loop | inline "loading" in a button or a sentence |
| `m-equalizer` | five bars bounce at offset phases | 1 s loop | live streams, audio, "receiving data" |
| `m-ring` (+ `m-ring-track`, `m-ring-value`) | determinate SVG ring; set `--m-value` 0–100, the value circle has `pathLength="100"` | 640 ms expo per change | upload progress, quota, completion score |
| `m-orbit` | two dots orbit and breathe | 1.2 s loop | a compact spinner with more character than `m-spin` |
| `m-circular` | indeterminate SVG spinner: arc grows and shrinks while rotating | 1.4 s loop | default indeterminate spinner for panels and buttons |
| `m-typing` | chat bubble with three rising dots | 1.2 s loop | assistant or colleague is typing |
| `m-stripes` | determinate bar with moving diagonal stripes; `--m-value` drives a `clip-path` | 800 ms stripe loop, 420 ms value change | long jobs with known progress (import, export, migration) |
| `m-skeleton-pulse` | placeholder fades between 1 and .5 opacity | 1.6 s loop | calmer alternative to `m-skeleton` (calm-rail flavour) |
| `m-skeleton-wave` | a soft sheen (`--m-sheen`) sweeps across the placeholder | 1.6 s loop | skeletons on light and dark panels alike |
| `m-sk-avatar`, `m-sk-line`, `m-sk-media` | shapes for skeletons: 40px circle, 0.75em text line (last line 60%), 16:9 media block | — | combine with any skeleton class to sketch the real layout |

### Decorative

Decoration is for public and entry surfaces (login, empty dashboards, landing heroes). One per view; none in dense tables or forms.

| Class | What it does | Timing | Use for |
|---|---|---|---|
| `m-border-beam` | a bright arc travels around the border (conic gradient on a registered `--m-angle`, masked to a 1.5px ring; `--m-beam-width`) | 4 s loop | a "new" feature card, the selected plan |
| `m-glow` | a blurred accent copy behind the element breathes | 2.4 s loop | the single primary CTA on a landing or upgrade page |
| `m-aurora` | two blurred colour fields drift slowly behind the content | 18 s and 24 s alternate | login background, onboarding hero, empty dashboard header |
| `m-marquee` + `m-marquee-track` | the track (content duplicated once, copy `aria-hidden`) scrolls endlessly; edges fade; pauses on hover and focus; `--m-duration`, `--m-gap` | 30 s default | logo strips, integrations list, testimonials |
| `m-particles` + `m-particle` | up to 8 small motes float upwards behind the content | 6–10 s each | a quiet hero or splash screen |
| `m-spotlight-grid` | a faint grid pattern revealed in a circle around the pointer (set `--mx/--my` with `spotlight`) | 240 ms fade | feature sections, empty canvases, hero cards |

### Overlays

| Class | What it does | Timing | Use for |
|---|---|---|---|
| `m-popover-in` / `m-popover-out` | scale .95 → 1 from `--m-origin`; `data-side="top|left|right"` presets the origin, `originFrom()` points it at the trigger | 180 / 120 ms | popovers, info tips, share menus anchored to a button |
| `m-popover` | the same for native `[popover]` and `<dialog>`, CSS only, using `@starting-style` and `allow-discrete` | 160–180 ms | any top-layer popover or dialog without JS animation code |
| `m-dropdown-in` | `clip-path` unrolls the panel from the top while it fades and settles 4px | 220 ms expo | select menus, sort menus, combobox lists |
| `m-menu-in` | fast scale .9 → 1 from the corner nearest the pointer (`placeAtPointer()` sets it) | 140 ms quint | context menus, right-click and long-press menus |
| `m-edge-in` / `m-edge-out` + `data-edge` | panel slides in from `left` (default), `right`, `top` or `bottom` | 300 ms expo / 200 ms ease-in | filter drawers, detail side panels, mobile nav, bottom sheets on wide screens |
| `m-notice-in` / `m-notice-out` + `m-notice-timer` | a corner notice springs in from the right; the timer bar shrinks over `--m-duration` (5 s) and pauses on hover and focus | 380 ms spring / 180 ms | optional, non-critical background info only ("Export ready", "Synced") |

The corner notice is an option, not the default: the skill's single message channel stays the modal popup (feedback.md §1). Use a notice only for information the user does not need to act on, never for errors, confirmations or anything destructive, and give it `role="status"`.

## 3. Choosing per flavour

| Moment | Calm rail | Glass spring |
|---|---|---|
| dialog in | `m-popup-in` | `m-pop-spring`, `m-sheet-in` on phones |
| popup tone icon | static icon in heading | `m-icon-pop` + `m-draw` check + `m-halo` ring |
| active indicator | tab underline, quint | sliding pill, spring |
| list entrance | `m-stagger` | `m-stagger` with `is-settled` |
| page entrance | none | `m-page` + route view transition |
| primary button | `m-press` | `m-press` + `m-shine` + `m-nudge` |
| tiles | `m-lift` | `m-lift` + `m-spotlight` + count-up + `m-draw` sparkline |
| empty state | static mark | `m-bob` |
| theme change | sweep | circular reveal from the click point |
| route change | `m-fade-through-in/out` | `m-axis-x-in/out` for sequences, `m-morph` for list → detail |
| long page | `m-scroll-progress`, `m-sticky-header` | + `m-reveal` on sections |
| headline | static | `m-split` once per page |
| live number | `useCountUp` | `odometer` |
| button feedback | `m-press`, `m-swap-icon` | + `m-ripple` or `m-like` where it fits |
| reorder / add / remove | `useFlip`, `m-row-enter/exit` | the same + `m-flash` and `m-drag` lift |
| loader | `m-circular`, `m-skeleton-pulse` | `m-orbit`, `m-skeleton-wave`, `m-typing` |
| menus and popovers | `m-dropdown-in`, `m-popover-in` (quint, no overshoot) | `m-popover-in` from `originFrom`, `m-menu-in` |
| side panel | `m-edge-in` | `m-edge-in` |
| login / empty hero | static | `m-aurora` or `m-particles`, `m-glow` CTA |
| celebration | `m-icon-pop` + `m-draw` | + `burst` once |

## 4. React helpers

`motion.ts` / `motion.js` export:

| Helper | Purpose |
|---|---|
| `useLeave(open, exitMs)` | keeps an element mounted during its exit animation; returns `{ mounted, leaving }` |
| `useCountUp(target, ms)` | animates a number to its target (ease-out cubic), instant under reduced motion |
| `useSlidingIndicator(ref, '[aria-current="page"]', deps)` | measures the active child and returns the style for an `m-slider` element |
| `useSettled(ref, key)` | adds `is-settled` 450 ms after mount or after `key` changes |
| `spotlight(event)` | `onPointerMove` handler that sets `--mx/--my` |
| `pressFlash(node)` | replays the press flash, e.g. when Enter triggers a dialog's default button |
| `routeTransition(update)` | wraps a navigation in a view transition when available |
| `useReveal(ref, '.m-reveal', deps)` | IntersectionObserver fallback for `m-reveal`; does nothing when `view()` timelines exist or motion is reduced |
| `useScrollProgress(barRef, scrollerRef?)` | sets `--m-progress` on an `m-scroll-progress` bar where `scroll()` timelines are missing |
| `useScrolled(threshold, scrollerRef?)` | returns `true` once the window (or scroller) passes `threshold` px; toggle `is-scrolled` with it |
| `morphTransition(from, name, update, to?)` | shared-element view transition: names `from`, runs `update` through `flushSync`, names `to()` in the new state, clears both afterwards |
| `splitText(text, 'letters' \| 'words')` | returns `{ key, text, style }` parts with `--i` set; render them as `<span aria-hidden>` inside an `m-split` element that carries `aria-label` |
| `useTypewriter(text, msPerChar, delayMs)` | returns `{ shown, done }`; full text immediately under reduced motion |
| `scramble(node, text, ms)` / `useScramble(text, ms)` / `scrambleFrames(text, onFrame, ms)` | left-to-right decrypt effect; the DOM version sets `aria-label`, all return or use a cancel function |
| `odometer(node, value, format?)` | builds and updates `m-odometer` reels inside an empty span (call it from an effect with a ref) |
| `ripple(event)` | `onPointerDown`/`onClick` handler that appends an `m-ripple-wave` at the click point (centre for keyboard clicks) |
| `magnetic(event, strength)` / `magneticReset(event)` | `onPointerMove` / `onPointerLeave` handlers for `m-magnetic` |
| `tilt(event, maxDeg)` / `tiltReset(event)` | `onPointerMove` / `onPointerLeave` handlers for `m-tilt` |
| `burst(elementOrPoint, count)` | spawns `m-confetti-bit` pieces on `document.body`; they remove themselves |
| `useTimedFlag(ms)` | `[flag, trigger]`, flag stays true for `ms`; drives `is-done` on `m-swap-icon` |
| `flip(root, mutate, ms)` | vanilla FLIP around a DOM mutation |
| `useFlip(ref, deps, ms)` | FLIP after each render where `deps` change; children need a stable `data-flip-key` |
| `gridStagger(root)` | measures grid children and sets `--row`/`--col` for `m-stagger-grid` |
| `originFrom(trigger, panel)` | sets the panel's `--m-origin` to the point nearest the trigger's centre; call before adding `m-popover-in` |
| `placeAtPointer(event, panel, gap)` | positions a `position: fixed` context menu at the pointer, flips it at viewport edges and sets `--m-origin` |

All helpers check `prefers-reduced-motion` and fall back to the end state. The DOM-writing helpers (`ripple`, `odometer`, `burst`) touch nodes React does not render children into, or append short-lived children that remove themselves. `useReveal`, `useFlip` and `useSlidingIndicator` take a deps array the same way as `useLayoutEffect`.

The plain-JS version in `assets/react/jsx/motion.js` is generated from the TypeScript file and exports the same helpers.

## 5. Rules

- Animate `transform`, `opacity`, colours, `clip-path`, masks. Not `width`, `height`, `top`, `left` of layout boxes (measured indicators are the exception).
- Exits are shorter than entrances (≈ 60–70%).
- Nothing blocks input: the user can click through a staggered list while it is still rising.
- Loops (`m-seek`, `m-spin`, `m-bob`, `m-skeleton`) only while something is actually waiting or empty.
- Every class is neutralised under `prefers-reduced-motion: reduce`; the React helpers check it too.
- Don't stack effects on one element: a button with shine, lift, nudge and halo at once feels like a toy.
- Scroll-driven classes are progressive enhancement: without timeline support the hooks fall back or the element simply stays still. Never hide content behind a scroll effect that has no fallback.
- Decorative loops (`m-aurora`, `m-particles`, `m-marquee`, `m-border-beam`, `m-glow`, `m-gradient-text`) belong on entry and marketing surfaces, one per view. They are switched off under reduced motion; the marquee becomes a horizontally scrollable row.
- Pointer-follow effects (`m-magnetic`, `m-tilt`, `m-spotlight-grid`) are for mouse users; keep them out of forms and tables.
- Celebration (`burst`, `m-like`, `m-wiggle-loop`) is rare by design: once per achievement, not on every save.
- `m-border-beam` animates a registered custom property and `m-shimmer-text`, `m-stripes`, `m-skeleton` animate background position, which repaint every frame; keep them small and few.
