# uplift-ui

A Claude skill that restyles an existing web frontend into a modern, responsive, user-friendly interface with its own identity, without breaking what it does.

It brings:

- **A workflow**: audit first, agree on a direction, build the token foundation, then uplift page by page with a review after each step.
- **A pattern pool** distilled from restyling production admin apps and from widely accepted modern UI practice: design tokens with light/dark, a popup + confirm system, info tips instead of text walls, searchable, filterable and paginated tables, empty states, a responsive sidebar and drawer, page archetypes, forms, charts, mobile, accessibility, microcopy, dark mode, navigation and perceived performance.
- **Themes**: 12 palette presets and 6 flavours (calm rail, glass spring, soft, editorial, terminal, brutal), 16 font pairings, and a live theme gallery.
- **A motion library**: about 80 animations (popups, sheets, scroll reveals, page transitions, text effects, ripples, tilt, confetti, loaders, skeletons, decorative effects, overlays, two theme transitions) with a live gallery page. All reduced-motion safe.
- **Blocks**: modern panels, a split layout with a sticky inspector, collapsible sections, callouts, key-value lists and a sticky action bar; a table system with dense, zebra, ruled, sticky-column, grouped, expandable, selectable, row-card, comparison and phone-stacking styles; and sign-in pages in four layouts (split, center, glass, minimal) with SSO, two-step code, password strength and link-sent steps.
- **57 React components and hooks** in both TSX and JSX: dialogs that become bottom sheets on phones, drawers, popovers, menus, a command palette, an app shell, a data table with phone cards, a tree, stat tiles, a stepper, a timeline, form fields, combobox, date picker, file drop, slider, tag input, avatars, progress, skeletons and more.
- **An audit checklist** of real defects and their fixes, and **`audit_scan.py`**, a static scanner that finds the ones a script can see (hard-coded colours, stacked token layers, ad-hoc breakpoints, native dialogs, mixed toast libraries, unlabelled icon buttons, removed focus rings, missing reduced-motion, theme flash) with file:line examples, JSON output and a CI exit code.
- **`contrast_check.py`**: resolves the tokens for every palette and flavour in light, dark and dim (including `color-mix()` in sRGB and OKLab) and checks WCAG contrast of every text, button, highlight, status and focus pair. All presets pass AA.
- **Framework and library guide**: how to feed the tokens, dark mode and the popup channel into Angular Material, Fuse-style templates, MUI, Ant Design, Chakra, Mantine, shadcn/ui, Vue, Vuetify, PrimeNG/PrimeVue, Nuxt, Svelte, Bootstrap, server-rendered apps, ag-Grid and charts, without overriding library internals.
- **Modern surfaces**: mesh, dot, grid and noise backgrounds, glass and gradient-border cards, a responsive bento grid, section heads, pills, avatar stacks, progress rings, a floating dock and device frames, plus 8 tileable patterns and 12 motif marks, all driven by the tokens.
- **Illustrations**: 12 page-level empty, error and success illustrations (no results, no data, upload, 403, 404, 500, offline, maintenance and more) that colour themselves from the tokens, so they follow every palette and dark mode.
- **Starter assets**: Tailwind v4 and plain-CSS token files, and a script that builds mask-based icon CSS for only the icons a codebase uses.

## Install

Claude Code (personal):

```bash
git clone https://github.com/<you>/uplift-ui ~/.claude/skills/uplift-ui
```

Or with the skills CLI:

```bash
npx skills add <you>/uplift-ui
```

Run the scanner and the contrast check directly too:

```bash
python ~/.claude/skills/uplift-ui/scripts/audit_scan.py --src ./src --exclude vendor
python ~/.claude/skills/uplift-ui/scripts/contrast_check.py --extra ./src/styles/brand.css --palette brand
```

Then ask Claude things like "make this admin panel look modern and work on phones", "our tables are a mess, clean them up", or "add dark mode and a proper popup system".

## Previews

Open these in a browser (serve the `assets` folder, e.g. `python -m http.server` inside it):

- `assets/theme-gallery.html` — switch palette, flavour and light/dark on a sample admin screen.
- `assets/motion-gallery.html` — every animation, with replay buttons.
- `assets/illustrations-gallery.html` — every illustration in the chosen palette, light or dark (`?palette=sunset` also works).
- `assets/surfaces-gallery.html` — backgrounds, cards, bento, bits, frames, patterns and marks in the chosen palette, light or dark.
- `assets/blocks-gallery.html` — panels, table styles and sign-in layouts with live table modifiers and sign-in steps, in any palette, flavour and theme.

## Layout

```
SKILL.md                       workflow, principles, reference map
references/
  audit-checklist.md           defects to look for and how to verify
  frameworks.md                Angular, Vue, Svelte, server-rendered apps and component libraries
  tokens.md                    colour, type, radius, shadow, motion architecture
  themes.md                    palette presets, flavours, contrast, font pairings
  identity.md                  motif, palette, fonts, staying distinct from sibling apps
  variants.md                  calm-rail vs glass-spring, plus grid, chart, map patterns
  pages.md                     page archetypes with desktop and phone wireframes
  feedback.md                  popups, confirmations, form dialogs, info tips
  forms.md                     form layout, validation, input types, unsaved changes
  data.md                      tables, filters, pagination, statuses, trees, empty states
  charts.md                    chart choice, styling, accessibility, dashboards
  layout-responsive.md         shell, sidebar, drawer, tabs, breakpoints
  mobile.md                    touch, sheets, safe areas, small-screen tables
  navigation.md                information architecture, URL state, search, shortcuts
  controls-motion.md           buttons, inputs, switch, icons, theme sweep
  motion.md                    the animation catalogue and when to use each
  dark-mode.md                 dark surfaces, colours, widgets, no flash
  accessibility.md             per-component checklist, focus, testing
  microcopy.md                 labels, errors, empty states, dates and numbers
  performance-perceived.md     loading thresholds, skeletons, optimistic UI
  surfaces.md                  modern backgrounds, cards, bento, patterns, marks and when not to use them
  blocks.md                    panels and containers, table styles, sign-in layouts and pieces
assets/
  tokens.tailwind.css          Tailwind v4 starter
  tokens.plain.css             plain CSS custom properties with a dark block
  themes/                      palette presets, flavours, hooks.css
  theme-gallery.html           live theme switcher on a sample admin screen
  motion.css                   every animation as an m- class
  motion-gallery.html          live preview of all animations and theme transitions
  theme-transitions.css        sweep and circular-reveal view transitions
  illustrations/               page-level empty, error and success SVGs that follow the tokens
  illustrations-gallery.html   live preview of the illustrations in every palette
  surfaces.css                 modern backgrounds, cards, bento grid, section heads, bits and frames (s- classes)
  patterns/                    tileable SVG patterns used as CSS masks
  marks/                       single-colour motif marks for logo, loader and empty states
  surfaces-gallery.html        live preview of surfaces, patterns and marks
  blocks.css                   panels, containers, table styles and sign-in pieces (b- classes)
  blocks-gallery.html          live preview of every block, table style and sign-in step
  react/tsx/                   components and hooks in TypeScript
  react/jsx/                   the same in JavaScript
scripts/
  build_icon_css.py            icon CSS generator for Lucide (or any outline SVG set)
  audit_scan.py                static scan for checklist defects, with severity and file:line examples
  contrast_check.py            WCAG contrast of the token pairs in every palette, flavour and theme
```

## Licence

MIT. Icons referenced by the generator come from [Lucide](https://lucide.dev) (ISC). Fonts mentioned in the references are under the SIL Open Font Licence and are not bundled.
