# Layout and responsive behaviour

## Contents
1. App shell
2. Sidebar: resizable, collapsible, drawer
3. Page heading
4. Content width and padding
5. Sections and cards
6. Tabs and segmented controls
7. Floating controls
8. Breakpoint checklist

## 1. App shell

```
md and up                                   below md
┌────────┬──────────────────────────┐       ┌──────────────────────────┐
│ brand  │ Page title ⓘ     [+ New] │       │ ☰  brand                 │ ← sticky 56px top bar
│ group  │ meta line                │       ├──────────────────────────┤
│  item  │ [tabs]                   │       │ Page title ⓘ             │
│  item  │ toolbar                  │       │ [+ New]                  │
│ group  │ table / content          │       │ content                  │
│  item  │                          │       │                          │
│ user ⏻ │                          │       └──────────────────────────┘
└────────┴──────────────────────────┘
```

- Sidebar uses the `subtle` background with a right border; the main area uses `panel`. The canvas colour only shows behind cards and the login screen.
- Navigation is grouped under small muted group labels with a hairline after them ("Admin ———").
- The active item has a 3px primary bar on its left edge plus a `highlight`-free, bold label; hover is `sunken`. Every item has an icon and a label.
- The user block at the bottom: avatar initials, name, a one-line role summary truncated with ellipsis, sign-out icon button.

## 2. Sidebar: resizable, collapsible, drawer

- Width is user-resizable by dragging a 6px handle on its right edge (`role="separator"`, `aria-valuenow`, arrow keys resize). Clamp between ~13rem and ~22rem; dragging below the minimum collapses it.
- Collapsed state is a 64px icon rail with tooltips on hover. The choice is remembered in localStorage; with no stored choice, collapse automatically on narrow desktops (< 1024px).
- Below `md` the sidebar becomes an off-canvas drawer: a scrim fades in, the panel slides in from the left (`translate-x`), the rest of the page gets `inert`, Esc and navigation close it, and focus returns to the menu button.

## 3. Page heading

One component for every page:

- Title (20–22px, semibold, tight tracking) with an info tip button right after it holding the page description and warnings.
- An optional meta line under the title in 13px muted text: counts ("7 roles"), a status, a summary. It replaces the separate stat-card rows that pages tend to grow.
- Actions aligned right on wide screens: the primary action last (rightmost), secondary as outlined or text buttons before it. On phones the actions wrap under the title.

## 4. Content width and padding

- Content max-width around 1680px, centred, so tables don't stretch into unreadable lines on ultra-wide monitors.
- `--page-pad`: 1rem below md, 1.5rem from md. Full-bleed pages (canvas editors, maps) opt out with a utility that applies the negative margin.
- Reserve space at the bottom of scrolling pages when there is a floating control in the corner (an `::after` spacer of the control's height), so the last row is never hidden under it.

## 5. Sections and cards

- Prefer flat sections over nested boxes. A section is a heading row (title, info tip, actions) and content; use a card (panel, 1px line border, 12px radius, card shadow) only to group a tree, a side panel, or a set of fields.
- Never put a card inside a card.
- Two-pane pages (tree + details): `grid-template-columns: 20rem 1fr` from `lg`, stacked below. Show a short muted prompt in the details pane until something is selected ("Choose a branch to see what it holds").
- If a detail card would only hold a title and buttons, remove it and move the buttons to where the item is listed.

## 6. Tabs and segmented controls

- Section tabs: text tabs with an icon, 28px gap, no boxes; the active tab is bold with a primary icon, and a 2px primary underline slides between tabs (measure the active tab's `offsetLeft`/`offsetWidth`, animate `transform` and `width` over 300 ms ease-out-quint, re-measure on resize). Optional count after the label in 13px.
- Tabs reflect the URL (`/runs`, `/runs/scheduled`) so they can be linked and survive reload.
- Nested choices inside a tab (pool A / pool B) use the same underline tabs, never a different "folder tab" style; two tab styles stacked on one page look broken.
- Two or three mutually exclusive filters (Mine / All, All / Published / Draft) use a segmented control: a sunken track with the active segment raised on a panel-coloured pill.
- Tab lists scroll horizontally on phones with hidden scrollbars; arrow keys move between tabs.

## 7. Floating controls

A small floating pill at the bottom-right is a good home for global toggles such as the theme switch (light / dark / system as three 32px round buttons; the active one filled primary). Give it a translucent panel background with `backdrop-filter: blur` and the float shadow.

## 8. Breakpoint checklist

Check every page at 360, 768, 1024 and 1440 px wide:

- No horizontal page scroll; only tables scroll inside their wrapper.
- Toolbars wrap: search takes the full width on phones, filters and actions wrap under it.
- Page heading actions wrap under the title.
- Dialogs fit (`min(width, 100vw - 2rem)`), their bodies scroll, actions stay reachable.
- Two-pane layouts stack.
- Touch targets are at least 32px (40px preferred) with 8px between them; hover-only actions are visible on the selected item.
- Floating panels (filters, tooltips, menus) stay within the viewport and shrink with an internal scroll (`min-height: 0` on flex children) instead of running off-screen.
- Text inputs are 16px on iOS phones, or the page zooms on focus.
