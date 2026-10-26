---
name: uplift-ui
description: Restyle an existing web frontend into a modern, responsive, user-friendly interface with its own identity, without breaking its behaviour. Brings a pool of proven patterns (design tokens with light/dark, popup and confirm system, info tips instead of text walls, searchable/filterable/paginated tables, empty states, switches, tabs, responsive sidebar and drawer, theme transitions, motion with reduced-motion fallbacks) plus an audit checklist. Use this skill whenever the user wants to beautify, modernise, polish, clean up, "make user friendly", make responsive, redesign or give a new look to an existing app, admin panel, dashboard or internal tool, or asks why their UI looks cheap, cluttered or inconsistent, even if they do not say "restyle". Also use it when unifying the look of several pages, replacing a component library's default theme, or adding dark mode to an existing app.
---

# uplift-ui

Take a working frontend and make it look and feel like a carefully designed product: consistent, calm, responsive, and kind to its users. The code keeps doing what it did; what changes is how it presents itself and how it talks to people.

The pool behind this skill was distilled from two production admin apps that were restyled by hand, page by page, with their users reviewing every step. The patterns are the ones that survived that review. They are described framework-agnostically, with reference implementations in React + Tailwind v4 under `assets/`.

## How to work

Restyling goes wrong in two ways: changing everything at once (the app breaks and nobody can review it) and changing pixels without a system (it looks better on one page and worse on the next). The workflow below avoids both.

### 1. Read before touching

- Find the stack: framework, styling approach (Tailwind, CSS modules, plain CSS, a component library), icon set, fonts, how themes are applied.
- Walk every page (run the app if you can; otherwise read the routes). Note what each page is for.
- Run `references/audit-checklist.md` against it and list the defects you find, grouped by severity.
- If the organisation has sibling frontends, look at them too, so the new identity is different on purpose (`references/identity.md` §5).

### 2. Agree on direction with the user

Present a short plan: the defects, the proposed identity (motif, palette, type pair, flavour from `references/variants.md`), and the order of work. Show choices as concrete samples (colour swatches with hex values, a few lines of text in each font pair, ASCII sketches of a layout) rather than adjectives. Recommend one option for each choice; let the user decide. Users are often specific and change their minds after seeing a result, so plan for small reviewable steps.

### 3. Build the foundation first

1. Tokens: neutral and brand ramps, semantic roles, status quartets, light/dark via `light-dark()` or two variable blocks, typography, radius, shadows, motion. Start from `assets/tokens.tailwind.css` or `assets/tokens.plain.css`, and pick a palette preset and flavour from `assets/themes/` (show the user `theme-gallery.html` to choose). Details: `references/tokens.md`, `references/themes.md`.
2. Self-host fonts; switch icons to one family (`scripts/build_icon_css.py` builds mask-based icon CSS for only the icons in use).
3. Theme switching (light / dark / system, persisted, no flash) and its transition.
4. Shared primitives: button, input, switch, tabs, dialog, popup + confirm, info tip, empty state, pager, table toolbar. Reuse existing components where they exist; restyle them in place so call sites don't change.

The foundation commit should leave every page working and already looking more coherent.

### 4. Uplift page by page

For each page, apply the patterns that fit:

| Problem on the page | Pattern | Reference |
|---|---|---|
| Wall of explanatory text | Info tip next to the title or label; warnings inside it | feedback.md §4–5 |
| Toasts / alerts / no feedback | One popup channel; confirm before destructive steps | feedback.md §1–2 |
| Forms always expanded on the page | Top-right button opening a form dialog | feedback.md §3 |
| Long or unsearchable table | Toolbar with search + Filters, 10-row pagination | data.md §2–3 |
| Noisy chips and dots | Coloured status text, circled-letter flags | data.md §5–6 |
| Empty table with a bare sentence | Empty state with mark, page icon badge and add button | data.md §9 |
| Detail card holding only buttons | Row actions in the list or tree | data.md §7, §10 |
| Different tab styles, boxed tabs | One sliding-underline tab style | layout-responsive.md §6 |
| Breaks on phones | Shell drawer, wrapping toolbars, dialog sizing, card fallback | layout-responsive.md §8 |
| Raw values (cron, enums, timestamps) | Human text first, raw value second | data.md §8 |

After each page: type-check, run the tests, look at it in light and dark and at phone width, and show the user. Keep each step small enough to review in a minute.

### 5. Verify and hand over

Run the "Verification at the end" section of the checklist. Summarise what changed per page, what was intentionally left alone, and anything the user should decide next.

## Principles

These came out of real review rounds. Each has a reason; keep the reason in mind when a situation doesn't fit the rule.

- **Behaviour is sacred.** Restyling must not change what the app does, what it sends to the server, or its routes. If a fix needs a behaviour change (disabling only the saving switch instead of all), say so.
- **One way to do each thing.** One message channel, one tab style, one tag style, one empty-state pattern. Inconsistency is what makes an app look cheap, more than any single ugly component.
- **Calm by default.** Explanations go behind info tips, statuses are coloured words rather than boxes, warnings live inside tips rather than as icons next to headings. The page shows the data; help is one hover away.
- **Ask before destroying.** Every destructive action is confirmed with the object named and the consequence stated.
- **Every list can be searched, filtered and paged.** Ten rows per page, numbered pager, distinct empty and no-match states, and the add button in the empty state.
- **Responsive is part of done.** 360px to 1440px with no page-level horizontal scroll.
- **Motion explains, then gets out of the way.** 150–300 ms, transform and opacity only, ease-out entrances, faster exits, and a reduced-motion fallback.
- **Own identity.** Derive a motif from the product; don't copy a sibling app's popups, empty states, theme transition or fonts.
- **Accessible by construction.** Labels on icon buttons, focus-visible rings, keyboard paths for trees, tabs, sliders and dialogs, status never by colour alone.
- **Match the codebase.** Follow its naming, file layout, formatting and comment density. Don't run a formatter with settings the project doesn't use.

## Reference map

Read only what the current step needs.

| File | Read when |
|---|---|
| `references/audit-checklist.md` | starting (to plan) and finishing (to verify) |
| `references/tokens.md` | building or migrating colours, type, radius, shadow, motion |
| `references/identity.md` | choosing motif, palette, fonts, login look |
| `references/variants.md` | choosing between the calm-rail and glass-spring flavours; sort, column resize, combobox, KPI tiles, charts, map/graph frames |
| `references/feedback.md` | popups, confirmations, form dialogs, info tips, errors, focus rules |
| `references/data.md` | tables, toolbars, pagination, statuses, row actions, trees, empty states, dashboard tiles |
| `references/layout-responsive.md` | shell, sidebar, drawer, page heading, tabs, breakpoints |
| `references/controls-motion.md` | buttons, inputs, switch, icons, theme sweep |
| `references/motion.md` | choosing animations: the full `m-` class catalogue (about 80), easing tokens, per-flavour picks, React helpers |
| `references/themes.md` | picking a palette preset or flavour (soft, editorial, terminal, brutal), contrast table, font pairings, custom ramps |
| `references/pages.md` | laying out a whole page: dashboard, list, master/detail, record, settings, wizard, search, onboarding, errors, sign-in |
| `references/forms.md` | form placement, layout, validation timing, input types and autofill, unsaved-changes guard, sticky actions |
| `references/charts.md` | choosing and styling charts, accessible charts, dashboards, responsive charts |
| `references/mobile.md` | phones: touch targets, thumb zones, sheets, safe areas, `dvh`, tables on small screens |
| `references/accessibility.md` | per-component accessibility checklist, focus recipes, announcements, testing |
| `references/microcopy.md` | labels, errors, empty states, confirmations, numbers and dates, translation-ready copy |
| `references/dark-mode.md` | dark surfaces and elevation, brand and status colours in dark, charts/maps/widgets, no flash |
| `references/navigation.md` | information architecture, URL state, breadcrumbs, back behaviour, search, command palette |
| `references/performance-perceived.md` | loading thresholds, skeletons, optimistic UI, prefetching, layout shift |

## Assets

| File | What it is |
|---|---|
| `assets/tokens.tailwind.css` | Tailwind v4 `@theme` starter: ramps, roles, status quartets, motion, table and reduced-motion base |
| `assets/tokens.plain.css` | the same tokens as plain CSS custom properties with a dark block, for apps without Tailwind |
| `assets/motion.css` | the motion library: easing tokens and about 80 animations as `m-` classes (scroll reveals, page transitions, text effects, ripples, tilt, confetti, loaders, skeletons, decorative effects, overlays), all reduced-motion safe |
| `assets/motion-gallery.html` | open in a browser to see every animation and both theme transitions live |
| `assets/theme-transitions.css` | sweep and circular-reveal view transitions for theme changes |
| `assets/themes/` | 12 palette presets (`data-palette`: ocean, indigo, violet, teal, forest, sunset, rose, crimson, graphite, sand, neon, frost), 4 flavours (`data-flavour`: soft, editorial, terminal, brutal) and `hooks.css` that wires shape and density variables |
| `assets/theme-gallery.html` | a sample admin screen where palette, flavour and light/dark can be switched live |
| `assets/react/tsx/` and `assets/react/jsx/` | the same React components in TypeScript and plain JavaScript; use the one matching the project |
| ↳ feedback | `popup` + `PopupHost` (promise-based popups and confirms), `InfoTip`, `Tooltip`, `EmptyState`, `ErrorState` / `ErrorPage` (403, 500, maintenance, offline), `NotFound`, `Badge`, `StatusText`, `Progress` (bar and ring), `Skeleton` |
| ↳ overlays | `Dialog` (bottom sheet on phones), `FormDialog`, `Drawer`, `Popover`, `DropdownMenu`, `CommandPalette` (⌘K) |
| ↳ layout | `AppShell` (resizable, collapsible sidebar; drawer on phones), `SplitPane` (master/detail, stacks below 1024px), `PageHeading`, `Breadcrumbs`, `Tabs`, `SegmentedControl`, `Accordion`, `Stepper`, `ThemeSwitcher`, `Button` |
| ↳ forms | `Field` (+ `TextInput`, `Textarea`, `PasswordInput`), `Select`, `Combobox` (single and multi), `Checkbox`, `RadioGroup`, `Slider`, `TagInput`, `Rating`, `DatePicker`, `FileDrop`, `ToggleSwitch`, `Kbd`, `Avatar` |
| ↳ data | `DataTable` (sort, selection, expandable rows, paging, cards on phones), `TableToolbar` + `FilterPanel`, `useTableFilters`, `pager` (`usePaged`, `Pager`), `Tree` (keyboard, row actions, paged roots), `StatTile` + `StatGrid` (count-up, delta, sparkline), `Timeline` |
| ↳ hooks | `theme` (light/dark/system, pre-paint script), `motion` (reveal, count-up, typewriter, scramble, odometer, ripple, magnetic, tilt, FLIP, sliding indicator, view transitions…), `layout` (media query, resize handle), `overlay` (modal focus handling, anchored positioning), `floating` (small popovers, dismiss) |
| `scripts/build_icon_css.py` | scans the source for used icon names and writes mask-based CSS from a Lucide SVG folder |

The components use Tailwind v4 classes on top of `tokens.tailwind.css`; for a project without Tailwind, keep their structure and behaviour and move the classes into the project's own CSS using `tokens.plain.css`. Icons are written as `<i class="icon icon-NAME">` (see `build_icon_css.py`); swap in the project's icon component if it has one.

The React files are starting points. Adapt them to the project's own primitives (its button component, its class-joining helper, its floating-panel utility) rather than adding parallel copies.
