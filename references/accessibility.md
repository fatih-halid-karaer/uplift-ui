# Accessibility

Accessibility in a restyle is mostly about not breaking what native HTML gave you for free, and fixing the custom widgets that never had it. Aim for WCAG 2.2 AA. The audit items are in audit-checklist.md "Accessibility"; this file is the how-to, organised by component so you can check each one as you restyle it.

Rule of thumb: use the native element first (`<button>`, `<a href>`, `<dialog>`, `<select>`, `<input type="checkbox">`, `<details>`). Add ARIA only for widgets HTML doesn't have, and then implement the keyboard behaviour ARIA promises.

## Contents
1. Foundations
2. Colour and contrast numbers
3. Focus: visible, ordered, managed
4. Component checklist
5. Screen-reader announcements
6. Motion and other user preferences
7. Keyboard shortcuts etiquette
8. Testing routine
9. Common mistakes

## 1. Foundations

- `<html lang="…">`; `lang` on any passage in another language.
- One `<h1>` per page, headings in order without skipping levels for styling; size comes from CSS, not from the tag.
- Landmarks: `<header>`, `<nav aria-label="Main">`, `<main id="main" tabindex="-1">`, `<aside>`, `<footer>`. Several navs each get a distinct `aria-label`.
- "Skip to content" link as the first focusable element, visible on focus.
- `document.title` updates per route: "Rules – App".
- Interactive things are `<button>` (does something) or `<a href>` (goes somewhere). A clickable `<div>` is a bug.
- Text resizes: layouts survive 200% browser zoom and 400% reflow at 1280px (equivalent to 320px wide) without horizontal scroll except data tables (WCAG 1.4.10).
- Don't disable zoom (mobile.md §5). Use `rem` for font sizes so the user's base size applies.

## 2. Colour and contrast numbers

| Element | Minimum ratio (AA) |
|---|---|
| Body text < 18.66px bold / 24px regular | 4.5 : 1 |
| Large text | 3 : 1 |
| UI component boundaries the user must see to operate (input borders, switch tracks, focus rings) | 3 : 1 against adjacent colours |
| Meaningful graphics (chart lines, status icons) | 3 : 1 |
| Disabled controls, decorative lines | exempt |
| Placeholder text | 4.5 : 1 if it carries information (it shouldn't, forms.md §3) |

- Check every role pair in both themes: ink on panel, ink-muted on panel and on sunken, primary-contrast on primary, each `*-ink` on its `*-soft`, primary on panel (links). tokens.md §3 picks primary 700 / 400 for this reason.
- `ink-muted` is the usual failure: surface-500 on white is ~4.7:1, fine; on `sunken` it can drop under 4.5. Test it on every background it sits on.
- `field-line` borders must reach 3:1 against `field` or the input has no visible edge; if the design wants a softer border, add a sunken fill so the field area is still distinguishable.
- Never colour alone: status words (data.md §5), error icons plus text, underlined links in running text, dash patterns in charts.
- Test with a colour-vision simulator (browser DevTools "Emulate vision deficiencies").

## 3. Focus: visible, ordered, managed

**Visible**

```css
:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; border-radius: inherit; }
```
- Never `outline: none` without a replacement. Focus ring ≥ 3:1 against the background, not hidden by sticky headers (`scroll-margin-top` equal to the sticky header height, WCAG 2.4.11).
- In Windows High Contrast / forced-colors mode, box-shadow rings vanish; outlines survive. Prefer outline, or add `@media (forced-colors: active) { :focus-visible { outline: 2px solid CanvasText; } }`.

**Ordered**
- DOM order = visual order. Don't reorder with CSS `order` or grid placement in ways that make Tab jump around.
- No positive `tabindex`. Use `0` to add, `-1` for programmatic-only targets.

**Managed — recipes**

| Event | Focus goes to |
|---|---|
| Route change | `<main tabindex="-1">` or the `<h1>`; announce the new title |
| Dialog opens | first meaningful control, deferred one frame, skipping info tips (feedback.md §7); for danger confirms, Cancel |
| Dialog closes | the opener, only if focus is still inside the dialog (feedback.md §7) |
| Drawer opens / closes | first nav link / the ☰ button |
| Item deleted from a list | the next row's equivalent control, or the previous one, or the list heading if empty |
| Inline edit saved | the edit button of that row |
| Form submit fails | error summary or first invalid field (forms.md §6) |
| New content loaded by "Show more" | the first new item |
| Tab panel switched | stays on the tab; Tab moves into the panel |
| Popover/menu closes with Esc | its trigger |

Losing focus to `<body>` (because the focused element was removed) is the bug behind most "keyboard users get stuck" reports. Every removal needs a destination.

## 4. Component checklist

**Dialog / popup / confirm** (feedback.md §1–3)
- Native `<dialog>` + `showModal()`: focus trap, Esc, inert background, top layer.
- `aria-labelledby` the title, `aria-describedby` the description. `role="alertdialog"` for confirmations.
- Background content `inert` (native modal does it). Body scroll locked.
- Danger confirmations: Enter does not trigger the destructive button (focus starts on Cancel).

**Menu ("⋯", action menus)**
- Trigger `<button aria-haspopup="menu" aria-expanded>`; list `role="menu"`, items `role="menuitem"`.
- ↑/↓ move, Home/End, typing a letter jumps, Enter/Space activate, Esc closes and returns focus, Tab closes.
- Roving focus inside the menu; the menu itself isn't in the tab order once closed.
- If it's really navigation links, use a disclosure (`<button aria-expanded>` + list of links), not `role="menu"`.

**Tabs** (layout-responsive.md §6)
- `role="tablist"` / `tab` / `tabpanel`, `aria-selected`, `aria-controls`, `aria-labelledby` on the panel.
- ←/→ move and activate (automatic activation) when panels are cheap; manual activation (Enter) when switching loads data.
- Roving tabindex: only the selected tab is `tabindex="0"`.
- URL-bound tabs that are really page navigation can be links with `aria-current="page"` instead.

**Tree** (data.md §10)
- `role="tree"`, `treeitem` with `aria-expanded`, `aria-level`, `aria-setsize`, `aria-posinset`, `aria-selected`; `role="group"` for children.
- Keys as data.md §10; plus `*` expands siblings, typing jumps by name.
- Hover-revealed row actions must be reachable: on the focused row show them and allow Tab into them, or provide them through a context key (Shift+F10 / ⋯).

**Combobox / autocomplete** (variants.md "Combobox")
- Input `role="combobox" aria-expanded aria-controls aria-autocomplete="list"`; options `role="option"` with `aria-selected`; active option via `aria-activedescendant` (focus stays in the input).
- ↓ opens and moves, Enter selects, Esc closes (second Esc clears), Tab accepts nothing and moves on.
- Announce result counts politely ("8 results").

**Table** (data.md §1)
- Real `<table>` with `<th scope="col">` (and `scope="row"` for row headers). `<caption>` or `aria-labelledby` the section title.
- Sortable headers: a `<button>` inside `<th>`; `aria-sort` on the `<th>` only for the sorted column.
- Row selection checkboxes labelled with the row's name ("Select core-edge").
- Icon actions labelled with the object ("Delete core-edge").
- Don't make whole rows clickable without a real link inside; screen readers won't find it.
- Pagination: `<nav aria-label="Pagination">`, current page `aria-current="page"`, prev/next labelled.
- Card layout on phones keeps the same order and labels.

**Outcome popup / optional toast**
- The popup is a modal dialog, so it is announced when it opens and focus moves to its button.
- If a project keeps toasts for non-critical background info (feedback.md §1 keeps one popup channel for outcomes), put them in a persistent `aria-live="polite"` region, don't auto-dismiss under 6 s, pause on hover and focus, and never put actions only there.

**Tooltip and info tip** (feedback.md §4)
- Tooltip text linked with `aria-describedby`; shown on hover and on keyboard focus; Esc closes without moving focus (WCAG 1.4.13); pointer can move into it.
- Never put essential information or interactive content in a hover-only tooltip; the info tip is a button with a toggled panel for exactly that reason.
- Icon-only buttons need `aria-label` even if they have a tooltip.

**Forms** (forms.md)
- Labels for every control, `fieldset`/`legend` for groups, `aria-describedby` for hints and errors, `aria-invalid` on errors, `required`, `autocomplete` tokens (WCAG 1.3.5).
- Error summary focused on submit; errors in text, not just red borders.
- Switch: `<input type="checkbox" role="switch">` with a visible label; state changes announced natively.

**Drawer / sidebar** (layout-responsive.md §2)
- Drawer as a modal (`<dialog>` or `inert` on the rest), Esc closes, focus returns to the toggle. Toggle has `aria-expanded` and `aria-controls`.
- Resizer: `role="separator" aria-orientation="vertical" aria-valuenow/min/max`, arrow keys.
- Current page link `aria-current="page"`.

**Status and badges**
- Status text is text. A count badge on a nav item is in the link's accessible name ("Approvals, 3 pending").
- Circled-letter flags (data.md §6) are info tip buttons whose `aria-label` is the full word ("Protected").

## 5. Screen-reader announcements

Use a live region for changes that happen without focus moving.

```html
<div id="announcer" class="sr-only" aria-live="polite" aria-atomic="true"></div>
```
```js
export function announce(text) {
  const el = document.getElementById('announcer');
  el.textContent = '';
  requestAnimationFrame(() => { el.textContent = text; });
}
```

- The region exists in the DOM from page load; regions inserted together with their content are often not read.
- `polite` for almost everything: "4 of 37 rules shown", "Saved", "Loading results", "Item moved to position 3". `assertive` only for errors that block the user right now.
- Announce: filter/search result counts (debounced, after results arrive), autosave results, list reorder, background job completion the user started, route title on navigation.
- Don't announce every keystroke, every poll update or decorative changes.
- Loading regions: `aria-busy="true"` on the container while it refreshes.
- `.sr-only`: `position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip-path:inset(50%); white-space:nowrap; border:0;`.

## 6. Motion and other user preferences

| Preference | Response |
|---|---|
| `prefers-reduced-motion: reduce` | global block (controls-motion.md §9): no stagger, no sweep, no parallax, no auto-playing loops; keep opacity fades ≤ 150 ms if they aid understanding |
| `prefers-color-scheme` | "system" theme option follows it live (tokens.md §6) |
| `prefers-contrast: more` | strengthen `line` and `field-line` one or two ramp steps, ink-muted → ink |
| `forced-colors: active` | don't rely on backgrounds for state; use borders/outlines; system colours (`Canvas`, `CanvasText`, `Highlight`); `forced-color-adjust: none` only on things like colour swatches |
| OS text size / browser zoom | `rem` units, no fixed-height text containers, wrap instead of truncate where possible |

Anything that moves for more than 5 s (carousels, tickers, loaders that keep going) needs a pause or stops by itself (WCAG 2.2.2). Nothing flashes more than 3 times a second.

## 7. Keyboard shortcuts etiquette

- Every shortcut has a visible alternative (button, menu item). Shortcuts are accelerators, not the only path.
- Single-character shortcuts (J, K, /, ?) only when focus is not in a text field, and users can turn them off or remap them (WCAG 2.1.4).
- Don't override browser or screen-reader keys: Ctrl/⌘+L, T, W, R, F, Tab, F6, arrows inside text, and the screen reader's own browse-mode keys.
- Conventions: `/` or Ctrl/⌘+K focuses search or opens the command palette, `?` opens the shortcut list, Esc closes the top-most layer, `g` then a letter for go-to navigation.
- Show shortcuts in tooltips and menus as `<kbd>` hints, platform-aware (⌘ on macOS, Ctrl elsewhere).
- Details and the shortcut sheet: navigation.md §9.

## 8. Testing routine

Run per page during the restyle, not once at the end.

1. **Automated**: axe DevTools or `@axe-core/playwright` / `jest-axe` in CI on every route in both themes. Catches ~30–40% of issues: contrast, missing labels, ARIA misuse. Zero violations is the floor, not the goal.
2. **Keyboard-only pass**: unplug the mouse. Tab through the page: is focus always visible? Does order make sense? Can you open and close every dialog, menu, drawer, info tip, date picker? Operate tabs, trees and sliders with arrows? Does focus land somewhere sensible after deleting a row?
3. **Zoom**: 200% browser zoom and a 320px-wide window: nothing cut off or overlapping, no page-level horizontal scroll, sticky headers don't eat the screen.
4. **Screen reader smoke test** (10 minutes): NVDA + Firefox or Chrome on Windows, VoiceOver + Safari on macOS/iOS, TalkBack on Android. Navigate by headings (H), landmarks (D / rotor), form fields (F). Submit a form with an error. Trigger a popup. Use a filter and hear the count.
5. **Preferences**: reduced motion on, forced colors on (Windows contrast theme), OS text size large.
6. **Contrast spot-check** in dark mode, where muted text and soft status backgrounds most often fail.

Record what was tested in the hand-over summary (SKILL.md step 5).

## 9. Common mistakes

| Mistake | Fix |
|---|---|
| `<div onClick>` as a button | `<button type="button">` |
| `outline: none` with no replacement | `:focus-visible` outline in primary, 2px, offset 2px |
| Icon button with only a tooltip | `aria-label` naming action and object |
| `aria-label` on a `<div>` with no role | Use a real element or give it a role; otherwise the label is ignored |
| Focus lost to `<body>` after deleting a row | Move focus to the next row, previous row, or the heading |
| `role="menu"` on a nav list of links | Disclosure button + list of links |
| Tabs with roles but no arrow keys | Roving tabindex + ←/→/Home/End |
| Live region added at the same moment as its text | Region present from load; set text after a frame |
| Everything `aria-live="assertive"` | `polite` by default |
| Hover-only tooltip with essential info | Info tip button with a toggle panel |
| Placeholder as label | Visible label |
| Muted text fails contrast on sunken backgrounds in dark mode | Check every role pair in both themes |
| Single-key shortcuts fire while typing in a field | Ignore when focus is in editable elements; allow disabling |
| "We ran axe, it's accessible" | Add the keyboard, zoom and screen-reader passes |
