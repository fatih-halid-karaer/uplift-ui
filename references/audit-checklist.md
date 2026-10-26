# Audit checklist and common defects

Run this before changing anything (to write the uplift plan) and again at the end (to verify). Each item names the defect and the fix. The defects are real ones found in production frontends.

## Structure and tokens
- [ ] Several `:root` blocks or "skins" layered on top of each other, the same component restyled in many places → one token file, components read only role tokens; delete the dead layers.
- [ ] Hard-coded hex colours in components → map to roles (tokens.md §10).
- [ ] Two greys a step apart used for the same purpose → merge.
- [ ] Duplicate scale steps (two size tokens with the same value) → collapse.
- [ ] Ad-hoc breakpoints (480, 520, 560, 600, 700, 720, 900…) → three or four: 640, 768, 1024, 1280.
- [ ] Platform-only font stacks (e.g. a Windows-only font first) → self-hosted web fonts with a neutral fallback.

## Theme
- [ ] Flash of the wrong theme on load: theme applied in a React effect, `color-scheme` hard-coded in `index.html` → inline pre-paint script that reads the stored choice and sets `data-theme` and `color-scheme`.
- [ ] Dark-mode leaks: `#fff` or a brand hex inside third-party containers (graphs, maps, code editors), scrollbars, loaders → search for literal colours, theme every embedded widget.
- [ ] No "system" option, or the choice is not persisted → light / dark / system, persisted, system follows `prefers-color-scheme` live.

## Feedback
- [ ] Toasts, banners and alerts mixed → one popup channel (feedback.md §1).
- [ ] `window.confirm` / `alert` → promise-based confirm popup.
- [ ] Destructive actions without a question → confirm with the object named.
- [ ] Raw server messages shown ("409", stack traces) → `describeError` maps status and codes to sentences; duplicates collapsed.
- [ ] Popups say the tone twice ("SUCCESS / Success") → drop the generic title.

## Text and hints
- [ ] Paragraphs of explanation at the top of pages and under fields → info tips.
- [ ] Warning icons sprinkled next to headings → warnings inside the info tip.
- [ ] Filler sentences ("Welcome back", "Signed in as …") → remove.
- [ ] Raw enum values (`MANUAL`, `LDAP`) → human labels.
- [ ] Loopback or internal addresses shown as data → hide.

## Data views
- [ ] Tables without search or filters → toolbar (data.md §2).
- [ ] Lists that grow unbounded → paginate at 10.
- [ ] "Newer / Older" pagers, or "Page N" with no way to jump → numbered pager.
- [ ] Boxed chips with dots for every status → coloured text.
- [ ] One empty message for "nothing exists" and "filters hide everything" → two states.
- [ ] Empty states without an action → add the primary action.
- [ ] Generic empty-state icon on every page → the page's own icon.
- [ ] Details card that only holds Rename/Delete → move actions into the list rows.
- [ ] Toggling one switch disables (and dims) every switch in the column → disable only the one saving.
- [ ] Entrance animation replays on every re-render → run once per mount or page.
- [ ] `body { user-select: none }` → users can't copy data; restrict it to buttons.

## Layout and responsive
- [ ] Horizontal page scroll on phones → overflow only inside table wrappers; wrap toolbars and heading actions.
- [ ] No mobile navigation, or a drawer without focus handling → drawer with scrim, `inert` background, Esc, focus return.
- [ ] Floating corner controls covering the last row → bottom spacer.
- [ ] Two different tab styles stacked → one tab style.
- [ ] Floating panels running off-screen or not scrolling → clamp to viewport, `min-height: 0` on flex children.
- [ ] Mouse-only interactions (column resize, drag handles) → pointer events and keyboard paths.
- [ ] Hover-only actions with no touch path → visible on the selected item.

## Accessibility
- [ ] Icon-only buttons without `aria-label` → add, plus `title`.
- [ ] Tooltips not linked to their trigger → `aria-describedby`; Esc closes.
- [ ] Error text not linked to its field → `aria-describedby`, `aria-invalid`.
- [ ] Tabs with `role="tab"` but no arrow keys or roving tabindex → add.
- [ ] Focus rings removed → `:focus-visible` outline in primary.
- [ ] Status shown by colour alone → keep the word.
- [ ] Animations ignore `prefers-reduced-motion` → global reduced-motion block.

## Verification at the end
- Type check and tests pass; nothing in behaviour changed unless the user asked.
- Every touched page viewed in light and dark, at 360 / 768 / 1024 / 1440 px.
- Every popup tone and a confirmation triggered once.
- Keyboard pass: Tab through a page, open and close a dialog, operate tabs and a tree with arrows.
