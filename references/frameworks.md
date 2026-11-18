# Frameworks and component libraries

The patterns in this skill are framework-agnostic; the reference components are React + Tailwind. Most apps that need an uplift are built on something else, or on React with a component library that has its own theme. This file says how to bring the tokens, the popup channel and the rest of the pool into those stacks without fighting them.

## 1. Rules that hold for every stack

1. **One source of truth.** The token file (`assets/tokens.plain.css`, or the Tailwind one) stays the only place colours, radii and type are decided. A library's theme is *fed from* the tokens, never edited by hand next to them.
2. **Theme through the library's API, not its selectors.** Every mature library has a theme object, CSS variables or Sass maps. Overriding its internal class names (`.mat-mdc-button .mdc-button__label`, `.ant-btn-primary`) breaks on the next upgrade and needs `!important`. `scripts/audit_scan.py` reports `!important` counts; a high number usually means someone fought the library.
3. **Know whether the library needs literal colours.** Libraries that compute hover, pressed and alpha shades in JavaScript (MUI, Ant Design, Vuetify, Chart.js) cannot take `var(--primary)`; they need hex values. Generate their config from the same palette (a small build step or a constant file next to the tokens) and regenerate when the palette changes. Libraries that style with CSS variables (Angular Material 18+, Bootstrap 5.3, PrimeNG/PrimeVue 4, ag-Grid) can point straight at the tokens.
4. **Dark mode is one switch.** The library's own dark mechanism (`.dark` class, `data-bs-theme`, a scheme name) is set by the same pre-paint script that sets `data-theme` (dark-mode.md §10). Two switches drift apart and produce half-dark pages.
5. **One message channel even when the library ships one.** Wrap the library's snackbar, message or toast service behind the popup API from feedback.md §1, and route every call through the wrapper. `audit_scan.py` flags apps that import two channels.
6. **Port behaviour, not markup.** When a React reference component has no equivalent, port its *behaviour* (focus trap, Esc, bottom sheet on phones, 10-row pager, two empty states) into the framework's idiom: Angular CDK overlay, Vue `<Teleport>`, Svelte actions.

## 2. Angular

**Angular Material.** Recent versions (18 and later) expose the theme as CSS system variables (`--mat-sys-primary`, `--mat-sys-surface`, `--mat-sys-on-surface`, `--mat-sys-outline`, …) once a theme is included with system variables enabled, and newer versions add per-component override mixins (`mat.button-overrides(...)`, `mat.table-overrides(...)`). Check the installed version's theming guide before writing Sass; the API changed between 15, 17 and 19.

- Map system variables to role tokens once, in the global stylesheet, for light and dark:
  ```scss
  :root {
    --mat-sys-primary: var(--primary);
    --mat-sys-on-primary: var(--primary-contrast);
    --mat-sys-surface: var(--panel);
    --mat-sys-on-surface: var(--ink);
    --mat-sys-on-surface-variant: var(--ink-muted);
    --mat-sys-outline: var(--field-line);
    --mat-sys-outline-variant: var(--line);
    --mat-sys-error: var(--danger);
  }
  ```
- Older (M2, pre-18) themes take Sass palettes; build the palette map from the hex values of the chosen preset and keep that file next to the tokens.
- `mat-icon-button` with `matTooltip` still has **no accessible name**: the tooltip is not a label. Add `aria-label` (the scan's most common Angular finding).
- `MatSnackBar` plus SweetAlert2 or ngx-toastr in the same app is two channels. Build one `PopupService` (CDK overlay or `MatDialog` with the popup styles from `feedback.md`) and replace both.
- Dialogs: give `MatDialog` the bottom-sheet behaviour on phones with a `panelClass` that the stylesheet turns into a sheet below 640px, or open `MatBottomSheet` instead on small screens.

**Fuse and similar admin templates.** These ship their own Tailwind config, theme classes (`.light` / `.dark` on `body`, scheme stored by the template) and a large layer of SCSS. Keep the template's layout shell if it works; feed its Tailwind colours from the token ramps (`--color-primary-50 … 950` and `--color-surface-*` already have the right shape), and set its scheme class in the pre-paint script. Exclude the vendored template folder from audits (`audit_scan.py --exclude @fuse`) so findings are about the app's own code.

**ag-Grid in Angular or React.** See §6.

## 3. React with a component library

**MUI (Material UI).** MUI derives hover, focus and alpha colours from the palette in JavaScript, so the palette needs literal colours. Since v6, `createTheme({ cssVariables: true, colorSchemes: { light: {...}, dark: {...} } })` emits CSS variables and switches schemes without re-rendering; feed both schemes from the preset's hex values, set `colorSchemeSelector: '[data-theme="%s"]'` (or the data attribute MUI documents for the installed version) so the same pre-paint attribute drives it, and keep `shape.borderRadius` and `typography.fontFamily` equal to the tokens.

**Ant Design 5.** Configure through `ConfigProvider theme={{ token: { colorPrimary, colorBgContainer, colorBgLayout, colorText, colorTextSecondary, colorBorder, borderRadius, fontFamily }, algorithm }}`. Use `theme.darkAlgorithm` for dark and pass the dark preset's colours; with `cssVar` enabled (5.12+) the derived values become CSS variables. Replace `message` and `notification` calls with the popup wrapper; keep `Modal.confirm` only if it is restyled to match the popup.

**Chakra, Mantine, shadcn/ui, Radix.** Chakra and Mantine take a theme object (literal colours, generated from the preset). shadcn/ui and Radix Themes already read CSS variables (`--background`, `--foreground`, `--primary`, `--muted-foreground`, `--border`, `--ring`, `--radius`); alias them to the role tokens in one block per theme and the components follow.

## 4. Vue and Nuxt

- Use `tokens.plain.css` (or the Tailwind file if the project has Tailwind) globally; components read role variables in `<style scoped>`.
- Port popups with `<Teleport to="body">`, focus handling with a small composable modelled on `react/*/overlay.*`, and the pager as a composable (`usePaged`).
- **Vuetify 3:** `createVuetify({ theme: { defaultTheme, themes: { light: { colors: { primary, surface, background, error, … } }, dark: { … } } } })` needs literal colours; set `theme.global.name` from the stored choice before mount.
- **PrimeVue 4 / PrimeNG 17+:** presets use the same ramp names as the tokens (`primary.50 … 950`, `surface.0 … 950`). `definePreset(Aura, { semantic: { primary: { 50: '{…}' … } } })` can take the preset's values, and the dark selector option (`darkModeSelector: '[data-theme="dark"]'`) lets the pre-paint attribute drive Prime too. Prime's `MessageService` / `ToastService` is the channel to wrap.
- **Nuxt:** the pre-paint script goes into `app.head.script` with `tagPosition: 'head'` (or the color-mode module, configured to set `data-theme`), not into a plugin that runs after hydration.

## 5. Svelte, server-rendered and plain HTML

- **Svelte / SvelteKit:** tokens globally, components port cleanly (actions for click-outside and focus trap, stores for theme). Put the pre-paint script in `app.html`.
- **Server-rendered (Thymeleaf, JSP, Razor, Django, Rails, Laravel Blade):** tokens and the `b-` / `s-` / `m-` class libraries work without a build step. The pre-paint script goes into the base layout's `<head>`. Popups and confirms can be a small vanilla module (one host element, `dialog` element or a div with `role="dialog"`, promise-returning `confirm()` replacement). Tables keep server paging; add the toolbar and the two empty states in the template.
- **jQuery-era apps:** do not rewrite. Swap the stylesheet for tokens plus blocks, replace `alert`/`confirm` with the vanilla popup module, and fix focus and labels in place.
- **Bootstrap 5.3:** components read `--bs-*` variables and switch on `data-bs-theme`. Alias them to the tokens in one block per theme (`--bs-body-bg: var(--canvas)`, `--bs-body-color: var(--ink)`, `--bs-secondary-color: var(--ink-muted)`, `--bs-border-color: var(--line)`, `--bs-border-radius: var(--r-md)`), set `data-bs-theme` from the pre-paint script, and set the colours that Bootstrap only takes as Sass or as `-rgb` triplets (`$primary`, `--bs-primary-rgb`) from the preset's hex values. Replace `.alert` banners and Bootstrap toasts with the popup channel.

## 6. Grids, charts and embedded widgets

**ag-Grid.** From v33 the Theming API (`themeQuartz.withParams({...})`) is the main path; the CSS-variable path (`.ag-theme-quartz` with `--ag-*` variables) still works in v31–v32 and in legacy mode. Either way, map once:

| ag-Grid parameter / variable | Token |
|---|---|
| `backgroundColor` / `--ag-background-color` | `--panel` |
| `foregroundColor` / `--ag-foreground-color` | `--ink` |
| `headerBackgroundColor` / `--ag-header-background-color` | `--subtle` |
| `headerTextColor` / `--ag-header-foreground-color` | `--ink-muted` |
| `borderColor` / `--ag-border-color` | `--line` |
| `rowHoverColor` / `--ag-row-hover-color` | `--highlight` |
| `selectedRowBackgroundColor` / `--ag-selected-row-background-color` | `--highlight` |
| `accentColor` / `--ag-active-color` | `--primary` |
| `fontFamily` / `--ag-font-family` | `--font-sans` |

Theme params given as strings can be `var(--panel)`, so the grid follows the theme switch without a reload. Keep the grid's own pagination at 10 rows unless the user asks for more, and give it the two empty states through `noRowsOverlayComponent`.

**Charts (ECharts, Chart.js, Highcharts, Recharts).** Charts render colours into canvas or SVG once; they do not see CSS changes. Read the tokens with `getComputedStyle(document.documentElement).getPropertyValue('--ink')` when building options, and rebuild the chart when the theme attribute changes (a `MutationObserver` on `data-theme`). charts.md covers palette order and accessibility.

**Server-side chart images (mail, PDF).** Images rendered on a server cannot follow the viewer's theme: render them light, with the preset's categorical colours and `--ink-muted` axis text, and keep them legible on white mail clients.

**Maps, code editors, rich-text editors.** Leaflet tiles, Monaco and CodeMirror themes, TinyMCE and Quill skins all need an explicit dark variant; dark-mode.md §9 lists the usual leaks.

## 7. Checking the result

- `python scripts/audit_scan.py --src <app source> --exclude <vendored template>` before and after; the high-severity count should drop to zero for the pages touched.
- `python scripts/contrast_check.py --extra <project palette css>` whenever a palette is customised.
- Toggle light, dark and dim with the library's own components on screen (a dialog, a menu, a grid, a date picker): those are where library defaults leak through.
