# Mobile and touch

Admin apps get used on phones more than their builders expect: approving something from a corridor, checking a failed run at night. The goal is not a native-app clone; it is that every task that makes sense on a phone can be finished there without pinching, zooming or guessing. The breakpoint checklist is in layout-responsive.md §8; this file explains the reasons and the patterns behind it.

Test widths: 360 (small Android), 390 (common iPhone), 768 (tablet portrait), 1024 (tablet landscape / small laptop).

## Contents
1. Touch targets
2. Thumb zones
3. Navigation: drawer vs bottom bar
4. Bottom sheets vs dialogs
5. Sticky actions and safe areas
6. Viewport height: `dvh`
7. Inputs and the on-screen keyboard
8. Horizontal scroll rules
9. Gestures always have a visible alternative
10. Responsive tables: scroll or cards
11. Hover, pointer and input-mode queries
12. Performance on low-end phones
13. Testing on real devices
14. Common mistakes

## 1. Touch targets

| Context | Minimum hit area | Spacing |
|---|---|---|
| Fine pointer (mouse) | 32px (layout-responsive.md §8) | 4–8px |
| Coarse pointer (touch) | 44px, 48px for primary and frequent actions | 8px between separate targets |
| Inline text links in paragraphs | exempt, but give line-height ≥ 1.5 | |

- The visual can stay small; grow the hit area with padding or a pseudo-element:

  ```css
  @media (pointer: coarse) {
    .icon-btn { position: relative; }
    .icon-btn::after { content: ''; position: absolute; inset: 50% auto auto 50%;
                       width: 44px; height: 44px; translate: -50% -50%; }
  }
  ```
- Table row actions on phones move into a "⋯" menu or a card footer instead of three 32px icons crammed together.
- Checkboxes and radios: the whole row (label included) is the target, 44px tall.
- Avoid targets at the very screen edge on Android (system back gesture) and the bottom 20px on iOS (home indicator).

## 2. Thumb zones

On a phone held in one hand, the bottom-centre is easy, the top corners are hard.

```
┌──────────────────────┐
│  hard     hard  hard │  ← search, title, rarely used menu
│                      │
│  ok        ok     ok │  ← content, scrolling
│                      │
│  easy     easy  easy │  ← primary action, tabs, Save
└──────────────────────┘
```

- Primary actions of forms and sheets go in a bottom sticky bar on phones (forms.md §12).
- The page heading's primary button may stay in the heading (it wraps under the title, layout-responsive.md §3) for list pages, because people scroll up to start a new task anyway. For task pages (edit, approve, review) move the action to the bottom bar.
- Don't put destructive actions where the thumb rests; bottom-right is for the confirming action, delete lives in a menu.

## 3. Navigation: drawer vs bottom bar

| Pattern | Use when | Rules |
|---|---|---|
| Drawer (default for admin apps) | > 5 destinations, grouped navigation | ☰ in a 56px sticky top bar, slides from the left, scrim, `inert` background, Esc and route change close it, focus returns to ☰ (layout-responsive.md §2) |
| Bottom tab bar | 3–5 top-level destinations used daily, the app is mostly used on phones | 56px + safe-area inset, icon + label always (never icon-only), active item primary, hides nothing important behind "More" except settings |
| Both | rarely | bottom bar for the 4 frequent destinations, "More" opens the drawer with the rest |

- Don't hide the top bar on scroll in admin apps; people need the title to know where they are. If you must, show it again on any upward scroll.
- The drawer lists the same groups and icons as the desktop sidebar; don't reorganise navigation per device.
- Back: the browser back button and the Android back gesture must close an open drawer, sheet or dialog before leaving the page (push a history entry when opening, or listen for `popstate`). Losing the page because back closed it instead of the sheet is a common complaint.

## 4. Bottom sheets vs dialogs

| Content | Phone container |
|---|---|
| Outcome popup, confirmation | centred popup (feedback.md §1–2), `min(26rem, 100vw - 2rem)` |
| Form dialog, ≤ 4 short fields | centred dialog, body scrolls |
| Form dialog with many fields | full-screen sheet: header with ✕ and title, scrolling body, sticky action bar |
| Menu of actions ("⋯") | bottom sheet listing actions as 48px rows, Cancel at the bottom; or a popover menu if short |
| Filters panel | bottom sheet up to `92dvh`, "Clear all" and "Show 12 results" in its sticky footer |
| Pickers (date, select with search) | bottom sheet or the native control |

Bottom sheet spec:
- Slides up 280 ms with `--ease-out-expo` (`m-sheet-in`), exits in ~180 ms; scrim fades.
- Top corners 16px radius; a 36 × 4px grab handle centred 8px from the top (decorative; also add a visible close button).
- `max-height: 92dvh`, body `overflow-y: auto; overscroll-behavior: contain` so scrolling the sheet doesn't scroll the page.
- Swipe down on the handle area dismisses (same guard as Esc for dirty forms, forms.md §10).
- Native `<dialog>` with `showModal()` still: focus trap, Esc, top layer.

Pick per flavour once (variants.md): calm-rail keeps centred dialogs; glass-spring uses sheets on phones. Don't mix within one app.

## 5. Sticky actions and safe areas

Phones with notches and home indicators eat into the viewport. Opt in and pad:

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

```css
.top-bar     { padding-top: env(safe-area-inset-top); }
.action-bar  { position: sticky; bottom: 0;
               padding: 12px max(16px, env(safe-area-inset-right))
                        calc(12px + env(safe-area-inset-bottom))
                        max(16px, env(safe-area-inset-left)); }
.floating-pill { bottom: calc(16px + env(safe-area-inset-bottom)); }
```

- Every fixed or sticky element touching an edge gets the matching inset: top bar, bottom bar, sheet footer, floating theme pill, drawer.
- Landscape phones have left/right insets; content padding uses `max(var(--page-pad), env(safe-area-inset-left))`.
- Reserve space under scrolling content equal to the sticky bar's height so the last field isn't hidden (layout-responsive.md §4).
- Never `user-scalable=no` or `maximum-scale=1`; it blocks zoom for people who need it (and fails WCAG 1.4.4).

## 6. Viewport height: `dvh`

`100vh` on mobile browsers is the height with the URL bar hidden, so a `100vh` layout is taller than the visible screen and its bottom bar sits under the browser chrome.

| Unit | Means | Use for |
|---|---|---|
| `100dvh` | current visible height, changes as bars show/hide | full-height shells, sheets' `max-height` |
| `100svh` | smallest (bars visible) | hero sections that must never be cut |
| `100lvh` | largest (bars hidden) | rarely |

```css
.shell { min-height: 100vh; min-height: 100dvh; }  /* fallback first */
```

- The on-screen keyboard does not shrink `dvh` on iOS. For an action bar that must stay above the keyboard, use the `visualViewport` API (`visualViewport.height` + `resize` event) or the `interactive-widget=resizes-content` viewport key on Chromium.
- Avoid `height: 100dvh` with `overflow: hidden` on the body; let the document scroll so the browser can collapse its bars and pull-to-refresh works.

## 7. Inputs and the on-screen keyboard

- Input font-size 16px on phones, or iOS Safari zooms in on focus and doesn't zoom back. Desktop can keep 14px:

  ```css
  @media (pointer: coarse) { input, select, textarea { font-size: 16px; } }
  ```
- Correct `type`, `inputmode`, `autocomplete` and `enterkeyhint` for every field (forms.md §7).
- When a field gets focus near the bottom, make sure it scrolls into view above the keyboard: `scroll-margin-bottom` equal to the sticky bar height plus 16px.
- Don't auto-focus inputs on page load on phones; the keyboard covers half the page before the user has seen it. Dialogs with one field may.
- Native `<select>` and date inputs are fine on phones; they open the OS picker, which is accessible and thumb-friendly. A custom combobox is worth it only for search over many options.

## 8. Horizontal scroll rules

- The page never scrolls horizontally at 360px. Find offenders with `document.querySelectorAll('*')` and compare `scrollWidth` to the viewport, or outline everything (`* { outline: 1px solid red }`) for a quick look.
- Usual causes: fixed widths (`width: 600px`), long unbroken strings (IDs, URLs, emails: `overflow-wrap: anywhere`), `100vw` inside a page with a scrollbar, negative margins, tables without a wrapper, flex children without `min-width: 0`.
- Allowed horizontal scrollers, each inside its own container: table wrappers, tab lists, chip filter rows, code blocks. Give them `overscroll-behavior-x: contain`, and a fade mask on the edge that has more content, so people know they scroll.
- Scroll-snap card carousels are rarely right in admin apps; a vertical list is easier.

## 9. Gestures always have a visible alternative

Gestures are invisible, conflict with system gestures, and fail for switch and voice users. Treat them as shortcuts.

| Gesture | Visible alternative |
|---|---|
| Swipe row to delete/archive | "⋯" menu on the row with the same actions; delete still confirms (or offers Undo for archive) |
| Swipe down to close a sheet | ✕ button in the sheet header |
| Pull to refresh | Refresh button or auto-refresh; the browser's own pull-to-refresh works if you don't block it |
| Long press for context menu | "⋯" button |
| Pinch to zoom a chart or map | +/− buttons and "Reset view" |
| Drag to reorder | "Move up / Move down" in the row menu, or arrow keys on a focused handle |
| Swipe between tabs | tapping the tabs |

- Never override horizontal swipes near the screen edges (browser back/forward on iOS and Android).
- Drag uses Pointer Events with `touch-action: none` only on the handle, not the whole row, so the list still scrolls.

## 10. Responsive tables: scroll or cards

data.md §11 gives the two options. How to choose:

| Use in-wrapper horizontal scroll when | Use stacked cards when |
|---|---|
| Users compare values across rows (numbers, statuses) | Users look up one row at a time |
| ≤ 6 columns, short values | Many columns, long text |
| Power users on internal tools | Occasional users, public-facing |

Scroll table rules:
- Pin the first column (`position: sticky; left: 0`, panel background, a soft shadow on its right edge when scrolled).
- Drop low-value columns under 768px (show them in the detail view) before resorting to scroll.

Card rules:

```
┌──────────────────────────────┐
│ core-edge            Active  │  ← primary field + status
│ Owner   A. Kaya              │  ← 2–3 label/value pairs
│ Updated 3 h ago              │
│                    [Edit] ⋯  │  ← actions bottom-right, 44px
└──────────────────────────────┘
```

- Same data source, same filters, same pagination; only the rendering changes (container query on the table's wrapper, not a separate page).
- The whole card is tappable when it opens a detail; nested buttons stop propagation.
- Keep sort available through a "Sort by" select in the toolbar, since there are no column headers.

## 11. Hover, pointer and input-mode queries

```css
@media (hover: hover) and (pointer: fine) { /* hover reveals, spotlight effects, dense rows */ }
@media (pointer: coarse) { /* 44px targets, 16px inputs, always-visible row actions */ }
```

- Hover-revealed actions (data.md §7) must be visible on touch devices: show them on the selected row, or always under `(hover: none)`.
- Tooltips on touch: open on tap, close on tap outside; info tips already pin on click (feedback.md §4).
- Don't infer "phone" from width alone; a 1024px tablet is touch, a 700px desktop window is a mouse. Combine width (layout) with pointer (interaction).

## 12. Performance on low-end phones

A mid-range Android phone is 3–5× slower at JavaScript than a developer laptop. Test with CPU throttling at 4× and network "Fast 4G".

- Budget: interactive within 3 s on 4G; ≤ 170 KB of compressed JavaScript on the critical path for a light page, route-split the rest.
- Avoid `backdrop-filter: blur` on large or scrolling surfaces (glass-spring flavour): use it on small floating elements only, and fall back to a solid panel under `(pointer: coarse) and (max-width: 768px)` if scrolling stutters.
- Large `box-shadow` and `filter` on many list items are expensive to paint; use them on hover only.
- Virtualise lists over ~200 rows (performance-perceived.md §9), but prefer pagination (data.md §3) in admin apps.
- Pause polling and animations when the tab is hidden (`document.visibilityState`).
- Images: correct `sizes`, `loading="lazy"` below the fold (performance-perceived.md §10).
- Passive listeners for scroll and touch (`{ passive: true }`); never `preventDefault` on `touchmove` for the whole page.

## 13. Testing on real devices

- Device emulation catches layout; it misses the keyboard, safe areas, `dvh`, tap delays and real CPU speed. Check at least one real iPhone (Safari) and one real Android (Chrome) before calling a page done.
- Remote debug: Safari Web Inspector for iOS, `chrome://inspect` for Android.
- Pass: open each page at 360px, rotate to landscape, open every dialog and sheet, fill a form with the on-screen keyboard, use back gestures with a sheet open, turn on the OS large-text setting.

## 14. Common mistakes

| Mistake | Fix |
|---|---|
| Three 28px icon buttons per row on phones | One "⋯" menu or card footer actions at 44px |
| Page zooms when an input gets focus | 16px input font on coarse pointers |
| `height: 100vh` shell with the bottom bar under the browser UI | `100dvh` with a `100vh` fallback |
| Sticky Save bar hidden behind the home indicator | `env(safe-area-inset-bottom)` padding, `viewport-fit=cover` |
| `user-scalable=no` | Remove; fix the layout instead |
| Back gesture leaves the page instead of closing the sheet | History entry per open overlay |
| Swipe-only delete | "⋯" menu with the same actions |
| Hover-revealed row actions invisible on touch | Show on selected row or under `(hover: none)` |
| Horizontal page scroll from a long ID | `overflow-wrap: anywhere`, `min-width: 0` on flex children |
| Glass blur everywhere stutters on mid-range phones | Blur only small floating elements; solid fallback |
| Separate "mobile pages" with different data | Same component and data, container queries switch the rendering |
| Filters panel as a tiny popover on phones | Bottom sheet with a "Show N results" footer |
