# uplift-ui

A Claude skill that restyles an existing web frontend into a modern, responsive, user-friendly interface with its own identity, without breaking what it does.

It brings:

- **A workflow**: audit first, agree on a direction, build the token foundation, then uplift page by page with a review after each step.
- **A pattern pool** distilled from restyling production admin apps and from widely accepted modern UI practice: design tokens with light/dark, a popup + confirm system, info tips instead of text walls, searchable, filterable and paginated tables, empty states, a responsive sidebar and drawer, page archetypes, forms, charts, mobile, accessibility, microcopy, dark mode, navigation and perceived performance.
- **Themes**: 12 palette presets and 6 flavours (calm rail, glass spring, soft, editorial, terminal, brutal), 16 font pairings, and a live theme gallery.
- **A motion library**: about 80 animations (popups, sheets, scroll reveals, page transitions, text effects, ripples, tilt, confetti, loaders, skeletons, decorative effects, overlays, two theme transitions) with a live gallery page. All reduced-motion safe.
- **52 React components and hooks** in both TSX and JSX: dialogs that become bottom sheets on phones, drawers, popovers, menus, a command palette, an app shell, a data table with phone cards, a tree, stat tiles, a stepper, a timeline, form fields, combobox, date picker, file drop, slider, tag input, avatars, progress, skeletons and more.
- **An audit checklist** of real defects and their fixes.
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

Then ask Claude things like "make this admin panel look modern and work on phones", "our tables are a mess, clean them up", or "add dark mode and a proper popup system".

## Previews

Open these in a browser (serve the `assets` folder, e.g. `python -m http.server` inside it):

- `assets/theme-gallery.html` — switch palette, flavour and light/dark on a sample admin screen.
- `assets/motion-gallery.html` — every animation, with replay buttons.

## Layout

```
SKILL.md                       workflow, principles, reference map
references/
  audit-checklist.md           defects to look for and how to verify
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
assets/
  tokens.tailwind.css          Tailwind v4 starter
  tokens.plain.css             plain CSS custom properties with a dark block
  themes/                      palette presets, flavours, hooks.css
  theme-gallery.html           live theme switcher on a sample admin screen
  motion.css                   every animation as an m- class
  motion-gallery.html          live preview of all animations and theme transitions
  theme-transitions.css        sweep and circular-reveal view transitions
  react/tsx/                   components and hooks in TypeScript
  react/jsx/                   the same in JavaScript
scripts/
  build_icon_css.py            icon CSS generator for Lucide (or any outline SVG set)
```

## Licence

MIT. Icons referenced by the generator come from [Lucide](https://lucide.dev) (ISC). Fonts mentioned in the references are under the SIL Open Font Licence and are not bundled.
