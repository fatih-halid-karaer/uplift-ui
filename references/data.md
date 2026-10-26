# Data views: tables, trees, lists

Admin apps are mostly tables. These patterns turn a raw `<table>` dump into something people can scan, filter and act on.

## Contents
1. Table anatomy
2. Toolbar: search + filters
3. Pagination
4. Row entrance animation
5. Status as coloured text, not chips
6. Flags as circled letters
7. Row actions
8. Long values
9. Empty, no-match, loading, error
10. Trees
11. Cards instead of tables on phones
12. Dashboard tiles

## 1. Table anatomy

- No outer box. The table sits on the panel with a single bottom border; the header row has a bottom border; body rows are separated by `line-soft`.
- Header cells: 12px, weight 500, muted ink, no uppercase, sticky (`position: sticky; top: 0`) with the panel background.
- Body cells: 14px, padding `13px 16px`, `vertical-align: middle`, tabular numbers.
- Hover: the whole row gets `primary` at 5% with the first and last cells rounded (10px), and the row border disappears under it, so the hover reads as a soft pill.
- Wrap in `overflow-x: auto` so wide tables scroll inside themselves instead of widening the page.
- A secondary line inside a cell (email under a name, path under a title) is 12px muted, `display: block`.

## 2. Toolbar: search + filters

Every table that can exceed a screen gets a toolbar above it:

```
[🔍 Search by name, IP…      ] [⚲ Filters ²]  [extra toggles]      Showing 4 of 37   [+ New rule]
```

- Search is a 16rem field on the left with a placeholder naming what it searches.
- Filters is a button opening a panel with one section per filterable column: text columns get a contains-input, choice columns get a checkbox list built from the values present. The button shows a count badge when filters are active, and the panel has "Clear all".
- Extra page-specific controls (an "Active only" checkbox, a segmented All/Published/Draft) sit right after Filters.
- On the right: "Showing x of y" only while filtering, then the page's count and primary action.
- Changing filters returns the table to page 1: key the table by a filter signature string so pagination state resets.
- A filter model per column (`{ key, label, kind: 'text' | 'choice', value: row => string | string[] }`) lets one hook (`useTableFilters(rows, columns)`) serve every table.

## 3. Pagination

- Page client-side lists at 10 rows. People scan ten rows; fifty is a wall.
- Pager at the bottom right: `‹ 1 … 4 [5] 6 … 12 ›`. Always show first, last, and neighbours of the current page, with "…" for gaps. Current page is a filled primary square, others are quiet 32px buttons.
- Left side: "41–50 of 117" in 13px muted tabular numbers.
- Hide the pager when there is only one page.
- Server-paged lists that only know "has more": number pages seen so far and show a trailing "…" when more exist. Avoid "Newer / Older" text buttons; they don't say where you are.
- If a deep link targets a row, open the page containing it (`startAt` index).
- Trees page their top-level roots, not their total rows, so an expanded subtree never splits across pages.

## 4. Row entrance animation

Rows fade up 6px with a 30 ms stagger, capped at ten rows:

```css
tbody tr { animation: row-in 380ms var(--ease-out-quint) both;
           animation-delay: calc(min(var(--row, 10), 10) * 30ms); }
tbody tr:nth-child(1) { --row: 0 } … tbody tr:nth-child(10) { --row: 9 }
@keyframes row-in { from { opacity: 0; translate: 0 6px; } }
```

It runs on mount and when the page changes (new rows mount), which makes paging feel alive without slowing anything. Disable it under reduced motion.

## 5. Status as coloured text, not chips

Boxed pills with dots make dense tables noisy. Show status as coloured, medium-weight text with a hover tint:

```css
.status { display: inline-flex; margin-inline: -0.375rem; padding: 2px 6px; border-radius: 6px;
          font-weight: 500; transition: background-color 150ms; }
.status:hover { background: color-mix(in srgb, currentColor 11%, transparent); }
```

The negative margin keeps the text aligned with the column while the hover box extends around it. Colours come from the `*-ink` tokens (success-ink for Running/Published, danger-ink for Failed, muted for Draft). Capitalise values ("Manual", "Directory"), never show raw enums ("MANUAL", "LDAP_SYNC").

Because colour alone must not carry meaning, the word itself is the status; the colour only speeds up scanning.

## 6. Flags as circled letters

A boolean flag that needs explaining (Protected, Reusable, Archived) is a circled letter (P, R, A) rendered as an info tip trigger; hovering explains it. It costs 24px instead of a 90px chip.

## 7. Row actions

- One or two actions: icon buttons at the end of the row (pencil, trash), 32px, muted, tinted on hover, danger tint for delete. Each has `aria-label` and `title` naming the object ("Delete core/edge").
- Archive / unarchive: use an archive-box icon (box with a lid; unarchive adds an up arrow), not a generic box.
- More than two: a "⋯" menu.
- Delete always goes through the confirmation popup.
- In trees and long lists, reveal row actions on hover (`opacity-0 group-hover:opacity-100`) and keep them visible on the selected row, so touch users can select first and then act.

## 8. Long values

- Cron expressions, intervals, IDs: show the human version as the primary text or tooltip ("Every day at 02:00") and the raw value in mono beside or inside it. A small `describeCron` helper covers the common cases and falls back to the expression.
- Timestamps: relative for recent ("3 min ago") with the absolute time in `title`; absolute for older ones.
- Many items in one cell (roles of a user): show the first two and "+4" as a button that opens a floating panel listing all, grouped, with per-item actions.
- Never show loopback or internal values as if meaningful ("::1", "127.0.0.1" as last sign-in address); hide them.

## 9. Empty, no-match, loading, error

Four different states, four different messages:

| State | Content |
|---|---|
| Empty (nothing exists yet) | brand mark in a dashed ring, a small corner badge with the page's own icon, title "No rules yet", one-line hint, and the primary add button |
| No match (filters hide everything) | filter-off icon, "No rules match", "Clear filters" button |
| Loading | a centred brand-mark spinner for full pages; skeleton rows if the layout is known |
| Error | icon, one sentence from `describeError`, Retry |

The corner badge must match the icon the page uses in navigation or tabs; a generic inbox icon on every page looks templated. Lay the empty state out horizontally (mark left, text right) in wide containers and stacked on narrow ones (container query `@md`).

## 10. Trees

- Rows: chevron, folder icon (open/closed), name, optional count badge, then hover-revealed row actions: `+` (add child), pencil (rename), trash (delete). This removes the need for a separate details card that only holds those buttons.
- Keyboard: ↑/↓ move, → expands or enters, ← collapses or goes to parent, Home/End, Enter/Space select; roving tabindex.
- Selected row: `highlight` background and primary folder icon.
- Indent 18px per level.
- Root-level "New …" button lives in the tree card header.

## 11. Cards instead of tables on phones

Below `md`, tables with more than three columns either scroll horizontally inside their wrapper (acceptable for admin tools) or switch to stacked cards (better for public apps): one card per row, the primary field as title, two or three secondary fields as label/value pairs, actions at the card's bottom right.

## 12. Dashboard tiles

A home page with 6–9 stat tiles that link to their pages: icon in a tinted square, the count large (24–28px, semibold, tabular), the label under it, an optional delta or sub-count in status-ink. Grid `repeat(auto-fill, minmax(14rem, 1fr))`. No heavy gradients; a hover lift (`translateY(-1px)` and the float shadow) is enough.
