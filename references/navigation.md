# Navigation and wayfinding

People should always know where they are, how they got there, and how to get to the next thing without hunting. In admin apps navigation tends to grow by accretion: every feature adds a top-level item until the sidebar is a list of 25 nouns. A restyle is the chance to regroup it, as long as routes stay the same (behaviour is sacred; redirects if a URL must change). The sidebar's look and mechanics are in layout-responsive.md §1–2; this file covers structure and wayfinding.

## Contents
1. Information architecture for admin apps
2. Grouping and ordering
3. Labels
4. URL state and deep links
5. Breadcrumbs and back links
6. Back behaviour
7. Global search
8. Command palette
9. Keyboard shortcuts
10. Notifications centre
11. Responsive navigation
12. Common mistakes

## 1. Information architecture for admin apps

Start from what people do, not from the database tables.

1. List every page and what it's for (SKILL.md step 1).
2. Note who uses it and how often: daily work, weekly review, rare setup, admin-only.
3. Group by task or object the user thinks in ("Deployments", "People", "Settings"), not by technical layer ("Entities", "Configurations", "Management").
4. Put daily work at the top, setup and administration at the bottom.
5. Aim for 5–9 top-level items, in 2–4 groups. Over ~12, people stop reading and start scanning, and scanning fails.

Typical shape:

```
[mark] Product
Overview                        ← home / dashboard
WORK ─────────────
  Runs
  Approvals        3            ← count badge for actionable items only
  Schedules
CATALOGUE ────────
  Services
  Rules
ADMIN ────────────
  People
  Roles
  Audit log
──────────────────
  Settings
[AK] A. Kaya · Admin     ⏻
```

- Depth: two levels at most in the sidebar (group label → item). Third-level structure lives in tabs on the page (layout-responsive.md §6), not in nested accordions.
- Hide items the user has no permission for, rather than showing them disabled; an admin-only group simply isn't there for others.
- Per-object sub-navigation (a project's own pages) belongs in tabs or a secondary sidebar when the object is the main working context.
- Card-sort or tree-test with a few users when regrouping a large app; at minimum, show the new tree to the user before building it.

## 2. Grouping and ordering

- Group labels: 11–12px, ink-muted, with a hairline (layout-responsive.md §1). They are headings (`<h2>` or `aria-labelledby` on a `<ul>`), not links.
- Order within groups by frequency, then by workflow sequence; not alphabetically unless the list is long and homogeneous.
- Settings and the user block always at the bottom; help ("Docs", "What's new", "Shortcuts") in a "?" menu next to the user block.
- Keep the order stable. Personalised or "recent" sorting of the main nav destroys muscle memory; put recents in search or the command palette instead.
- Badges: only for things that need action (pending approvals, failed runs since last visit). Not totals. Cap at "99+". The count is part of the link's accessible name.

## 3. Labels

- Nouns for places ("Runs", "Rules"), plural for collections; the page title matches the nav label exactly.
- One or two words; no "Manage", "View", "My" prefixes unless they disambiguate ("My tasks" vs "All tasks").
- The user's vocabulary (microcopy.md §9): "People", not "Principals".
- Icon + label always; icon-only only in the collapsed rail, with tooltips (layout-responsive.md §2).
- Icon choice: one family, outline, same stroke (controls-motion.md §6). Choose by meaning, and reuse the same icon for that feature in nav, tabs, empty states and search results:

| Concept | Good icon idea | Avoid |
|---|---|---|
| Dashboard / overview | gauge, layout-grid | home (fine for public sites, vague in admin) |
| Runs, jobs | play-circle, activity | rocket |
| Schedules | clock, calendar-clock | generic calendar for everything |
| Approvals | check-check, stamp | thumbs-up |
| Services, components | boxes, server | box (also used for archive) |
| Rules, policies | shield, list-checks | gavel |
| People | users | user (single) |
| Roles, permissions | key-round, shield-check | lock (reads as "locked") |
| Audit log | scroll-text, history | eye |
| Integrations | plug, puzzle | link |
| Settings | settings / sliders | wrench |

## 4. URL state and deep links

If it changes what's on screen and someone might want to share, bookmark or reload it, it belongs in the URL.

| State | Where | Example |
|---|---|---|
| Section / page | path | `/rules` |
| Selected record | path | `/rules/core-edge` |
| Tab | path segment | `/rules/core-edge/runs` |
| Search query | query | `?q=edge` |
| Filters | query, one key per filter, repeated or comma-joined | `?status=active,paused&owner=me` |
| Sort | query | `?sort=-updated` |
| Page | query (1-based) | `?page=3` |
| Page size (if not default) | query | `?size=25` |
| Date range | query, relative when relative | `?range=7d` or `?from=2026-10-01&to=2026-10-24` |
| Wizard step | query or history state | `?step=2` |
| Open dialog for a record | optional query | `?edit=core-edge` (only if linking to it is useful) |
| Transient UI (hover, popover open, scroll) | not in URL | |
| Per-user preferences (density, column widths, sidebar collapsed) | localStorage / server | |

- Use `replaceState` for filter typing and sorting (don't flood history); `pushState` for page changes, tab changes and record selection, which people expect Back to undo.
- Omit defaults from the URL (`page=1`, default sort) to keep links short.
- Validate and clamp URL state on load: unknown filter values are ignored, `page=99` on a 4-page list goes to the last page.
- Changing filters resets `page` (data.md §2).
- "Copy link" on records and filtered views is a cheap, appreciated feature.
- Deep links into a paginated list open the page containing the target row (data.md §3).
- After sign-in, return to the originally requested URL (validated to be same-origin).

## 5. Breadcrumbs and back links

| Hierarchy | Wayfinding |
|---|---|
| Flat (list → detail) | a back link above the title: "← Rules" |
| Deep (workspace → project → service → run) | breadcrumb trail (variants.md "Page header with breadcrumb") |
| Master/detail on desktop | none needed; the list is visible |

Breadcrumb rules:
- `<nav aria-label="Breadcrumb"><ol>`, last item is the current page with `aria-current="page"` and not a link.
- Each crumb is the parent's real name (from data), not "Details".
- Collapse the middle on narrow screens: `Workspace / … / Service / Run`, with "…" opening a menu of the hidden levels; on phones show only the back link to the immediate parent.
- Breadcrumbs reflect hierarchy, not history; Back covers history.

## 6. Back behaviour

- Browser Back must do what people expect: return to the previous view, with its filters, page and scroll position.
  - Keep list state in the URL (§4) and restore scroll on return (most routers support scroll restoration; key it by URL).
  - Cache the list data so returning doesn't flash a loader (performance-perceived.md §4).
- In-app "← Rules" back links navigate to the parent URL including the filters the user came with (pass them along or read them from history state), not to a bare `/rules`.
- Overlays (drawer, sheet, full-screen dialog on phones) push a history entry so Back closes them first (mobile.md §3). Centred desktop dialogs usually don't.
- After a create, go to the new record; Back from there returns to the list, not the empty form (use `replace` when navigating from the form).
- After a delete from a detail page, go to the parent list and show the outcome popup; the deleted URL is replaced, so Back doesn't land on a 404.
- Never break Back with redirects that bounce (`/` → `/home` → `/` loops): use `replace` for redirects.

## 7. Global search

- A search field in the top bar (or the sidebar header) with a visible shortcut hint (`/` or ⌘K). On phones, a search icon in the top bar that opens a full-screen search.
- Searches across object types the user can see; results grouped by type with icons (pages.md §9). Show the top 3–5 per type inline, "See all 23 results" opens the results page.
- As-you-type with 200–300 ms debounce and request cancellation (performance-perceived.md §7); minimum 2 characters.
- Recent searches and recently viewed records shown on focus when the field is empty.
- Keyboard: ↑/↓ through results, Enter opens, Esc clears then closes. Combobox semantics (accessibility.md §4).
- Search the page-local list with the table toolbar's search (data.md §2); don't make the global search do both jobs.

## 8. Command palette

A keyboard-first launcher for power users; it complements, never replaces, visible navigation.

```
┌────────────────────────────────────────────┐
│ ⌕  Type a command or search…           esc │
├────────────────────────────────────────────┤
│ RECENT                                     │
│ ▸ core-edge                    Rule        │
│ PAGES                                      │
│ ▸ Go to Runs                         g r   │
│ ACTIONS                                    │
│ ▸ New rule                           n     │
│ ▸ Switch to dark theme                     │
│ ▸ Copy link to this page                   │
└────────────────────────────────────────────┘
```

- Opens with ⌘K / Ctrl+K from anywhere (including inside inputs, since it has a modifier). Centred dialog, 36rem wide, top-third of the screen; full-screen on phones.
- Sections: Recent, Pages (all nav destinations), Actions (create X, toggle theme, sign out), Records (search results), Context actions for the current page first.
- Fuzzy matching on labels and synonyms ("delete" finds "Remove"); highlight matched characters.
- Every action shows its shortcut if it has one; this is how people learn shortcuts.
- Respect permissions: only actions the user can perform.
- Destructive actions from the palette still confirm (feedback.md §2).
- Implement as a dialog with a combobox and a listbox (accessibility.md §4).

## 9. Keyboard shortcuts

Etiquette and accessibility constraints: accessibility.md §7. A small, conventional set:

| Keys | Action |
|---|---|
| ⌘K / Ctrl+K | command palette |
| / | focus search (page toolbar search if present, else global) |
| ? | shortcut sheet |
| Esc | close the top-most layer; clear a search field |
| g then o / r / s … | go to Overview / Runs / Settings … (sequence within 1 s) |
| n or c | new item on the current list page |
| j / k | next / previous item in lists and master/detail |
| Enter | open the focused item |
| e | edit the current record |
| ⌘Enter / Ctrl+Enter | submit the current form or dialog (including from a textarea) |
| ⌘S / Ctrl+S | save, only on pages with a save model; prevent the browser's save dialog |

- Single-key shortcuts are off while focus is in an editable field; users can disable them in Preferences.
- Shortcut sheet: a dialog listing shortcuts grouped by scope (Global, Lists, Forms), each with `<kbd>` keys rendered for the platform.
- Show the shortcut in the tooltip of the button it accelerates ("New rule · N").

## 10. Notifications centre

The notifications centre is a *history* of things that happened elsewhere (a run you started finished, someone assigned you an approval). It is separate from outcome messages for actions on the current screen, which use the popup (feedback.md §1).

- A bell icon button in the top bar or sidebar footer with an unread count badge; `aria-label="Notifications, 3 unread"`.
- Opens a panel (popover on desktop, full-screen sheet on phones): newest first, grouped "Today / Earlier", each item with an icon by type, one sentence ("Run #1204 of *core-edge* failed"), relative time, unread dot, and a link to the object.
- Clicking an item opens the object and marks it read; "Mark all as read" in the panel header; a link to notification preferences.
- Paginate or "Load older"; keep 30 days.
- Arrival of a new notification: increment the badge, announce politely ("New notification: run 1204 failed") via the live region (accessibility.md §5). Don't open a popup for background events; if a project wants a transient hint here, a small non-blocking toast for non-critical background info is acceptable, and the item must still be in the centre.
- Preferences page: per event type, per channel (in-app, email), with sensible defaults; never notify people of their own actions.

## 11. Responsive navigation

| Width | Navigation |
|---|---|
| ≥ 1280 | full sidebar (user-resizable), breadcrumb/back link, tabs |
| 1024–1279 | sidebar auto-collapses to the 64px rail unless the user chose otherwise |
| 768–1023 | rail or drawer (choose one per app), tabs scroll horizontally |
| < 768 | 56px top bar with ☰ drawer, optional bottom bar for 3–5 daily destinations (mobile.md §3), back link instead of breadcrumbs, search behind an icon |

- The same groups, labels and icons at every width.
- Current location visible at every width: active nav item, page title, and on phones the top bar shows the section name.

## 12. Common mistakes

| Mistake | Fix |
|---|---|
| 20+ ungrouped top-level items | 2–4 groups, 5–9 items, deeper levels as page tabs |
| Groups named after technical layers | Group by user task/object |
| Disabled nav items for missing permissions | Hide them |
| Icons reused for different things (box for services and archive) | One icon per concept, consistent across nav, tabs, empty states |
| Filters, tab, page lost on reload | Put them in the URL |
| Back returns to page 1 of an unfiltered list | URL state + scroll restoration + cached data |
| Breadcrumb crumbs say "Details" | Real names from data |
| Back after delete lands on a 404 | Navigate with `replace` to the parent list |
| Command palette as the only way to reach something | Every destination also visible in nav |
| Shortcuts fire while typing | Ignore single keys in editable fields; allow disabling |
| Notifications shown as popups for background events | Badge + centre + polite announcement |
| Recently used items reorder the sidebar | Stable nav; recents in search/palette |
