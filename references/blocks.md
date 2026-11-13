# Blocks: containers, table layouts and sign-in pieces

`assets/blocks.css` holds ready-made page blocks as `b-` classes: panels and other containers, a table system with its cell types, and the pieces of a modern sign-in flow. They read the tokens and the flavour hooks (`--border-w`, `--row-py`, `--label-case`…), so palette, flavour and dark mode carry through. Open `assets/blocks-gallery.html` (served, for example `python -m http.server` inside `assets`) to try every block with palette, flavour and theme switching. React wrappers live in `assets/react/{tsx,jsx}/`: `Panel` + `KeyValue`, `AuthLayout` (+ `AuthBrand`, `AuthHead`, `AuthLogo`, `SsoButtons`, `AuthDivider`, `AuthAlert`, `AuthSent`), `OtpInput`, `PasswordStrength`.

Use these when a project has no component system of its own, or when its existing one has no answer for a block. When the project already has a panel or table component, restyle that one with these values instead of adding a parallel copy.

## Contents
1. Containers
2. Tables
3. Sign-in
4. Accessibility
5. Common mistakes → fix

## 1. Containers

| Class | What it is | Use for |
|---|---|---|
| `.b-container` (`.is-narrow` 720, default 1200, `.is-wide` 1520, `.is-full`) | centred page column with a safe-area gutter | the page itself; narrow for forms and settings, wide for dashboards |
| `.b-stack`, `.b-cluster`, `.b-grid` | vertical stack, wrapping row, auto-fit grid (`--b-gap`, `--b-min`) | spacing groups without per-element margins |
| `.b-panel` + `.b-panel-head` / `-title` / `-actions` / `-body` / `-foot` | card with header, body and footer | one job per panel: a chart, a table, a form section |
| `.b-panel.is-flush` / `.is-tinted` / `.is-accent` | no shadow / secondary surface / the one panel that needs attention | flush inside a split; tinted for help and summaries; accent once per view |
| `.b-panel-body.is-flush` | body without padding | a table or list that runs edge to edge inside the panel |
| `.b-split` (`.is-aside-left`, `--b-aside`) | main column + sticky aside; stacks below 1024px | record pages with key facts beside the content; filters beside a list |
| `.b-collapse` on `<details>` | collapsible section with rotating chevron | optional or long sections; FAQs; advanced settings |
| `.b-callout` (`.is-success` / `.is-warn` / `.is-danger`) | inline message with a tone, icon slot and optional action | page-level notices that must stay visible; short-lived feedback still goes to the popup channel (feedback.md) |
| `.b-kv` (`.is-stacked`) | label/value pairs, two columns or stacked tiles | detail asides, summaries above a table |
| `.b-actionbar` (+ `.b-actionbar-note`) | sticky bottom bar with blur and safe-area padding | long forms and editors: Save on the right, status on the left |
| `.b-btn` (`.is-primary`, `.is-ghost`, `.is-sm`, `.is-block`) | minimal button that matches the blocks | only when the project has no button of its own |

Panel heads put the title on the left and at most two actions on the right; overflow goes into a menu. A panel footer holds a count or a link, never the primary action of the page.

## 2. Tables

Wrap every table: `<div class="b-table-wrap"><table class="b-table">…</table></div>`. The wrap scrolls in both directions, keeps the header sticky, and shows a soft shadow at the left or right edge only while there is more to scroll.

| Modifier | Effect | When |
|---|---|---|
| `.is-dense` / `.is-roomy` | tighter or looser rows | dense for operators scanning many rows; roomy for few, rich rows |
| `.is-zebra` | alternate row tint | wide tables without strong row content; skip when rows already have avatars or meters |
| `.is-ruled` | vertical rules between cells | numeric grids people read across, like finance |
| `.is-sticky-first` | first column stays while scrolling sideways | wide tables where the first column names the row |
| `.b-table-wrap.is-tall` (`--b-table-h`) | caps the height so the body scrolls under the header | tables inside panels or dialogs |
| `.b-table-wrap.is-bare` | no border | tables inside a panel body |
| `.b-table.is-stack` + `data-label` on cells | below 640px each row becomes a label/value card | lists that must stay usable on phones without a card component |

Cells and rows:

| Piece | Markup |
|---|---|
| Numbers | `th.num` / `td.num`: right-aligned, tabular figures |
| Tight column | `.shrink` for checkboxes and actions |
| Group header | `<tr class="b-group"><th colspan="N">Name<small>3 items</small></th></tr>` |
| Expandable row | `.b-expander` button with `aria-expanded` and `aria-controls`, followed by `<tr class="b-detail" hidden><td colspan="N"><div class="b-detail-body">…` |
| Person or object | `.b-cell-user` with `.b-avatar` and `<b>` + `<small>` |
| Status | `.b-state.is-ok` / `.is-warn` / `.is-danger` / `.is-info` (`.is-live` pulses); a coloured word with a dot, never colour alone |
| Load or quota | `.b-meter` with `--b-value: 64%` and an `<output>`; `.is-mid` / `.is-high` change the tone |
| Trend | `<svg class="b-spark" viewBox="0 0 88 24">` with a line path and an area path |
| Row actions | `.b-row-actions` with `.b-iconbtn` (`.is-danger`); dim until hover or focus, always visible on touch |
| Selection | `.b-check` in the first column, `tr.is-selected`, and `.b-bulkbar` above the table showing the count and bulk actions |

Two alternatives to a plain table:
- `.b-rowcards` (`--b-cols`): each row is a card that lifts on hover. Use it for short lists of objects people open (projects, sites, integrations), not for data people compare across rows.
- `.b-compare` with `.is-featured` on one column, and `.b-yes` / `.b-no` marks: plan or option comparisons.

Search, filters, sorting and paging stay with `TableToolbar`, `useTableFilters` and `pager` (data.md); these classes only cover the table body's look.

## 3. Sign-in

`.b-auth` is a full-height page with four layouts sharing one card:

| Layout | Look | Pick it when |
|---|---|---|
| `.is-split` | brand panel (`.b-auth-brand`) beside the form; brand collapses to a strip below 900px | the product wants a pitch, feature points or a customer quote on its door |
| `.is-center` | card on a soft accent spotlight | internal tools; the safe default |
| `.is-glass` | frosted card over a slowly drifting mesh | products with a strong visual identity; never for dense admin apps that want calm |
| `.is-minimal` | no card, the form on a plain panel | embedded flows, kiosks, very small screens |

Pieces inside `.b-auth-card`:

| Piece | Class / component | Notes |
|---|---|---|
| Logo, title, subtitle | `.b-auth-head`, `.b-auth-logo` / `AuthHead`, `AuthLogo` | one `h1` per page |
| Corner controls | `.b-auth-corner` | theme switcher and language, top right, safe-area aware |
| Single sign-on | `.b-sso` / `SsoButtons` | providers first when most users have them; label is the provider name |
| Divider | `.b-divider` / `AuthDivider` | "or with email" |
| Fields | `.b-field`, `.b-input` (`.has-icon`, `.has-end`), `.b-field-hint` (`.is-error`) | 16px text on phones to stop iOS zoom; "Forgot?" link sits in the label row |
| Error | `.b-auth-alert` / `AuthAlert` with `role="alert"` | says what failed and what to do; mark the field with `aria-invalid` |
| Remember me and links | `.b-row`, `.b-link` | |
| Two-step code | `.b-otp` (`.has-gap` for 3 + 3) / `OtpInput` | numeric keypad, paste fills every box, backspace moves back, `autocomplete="one-time-code"` on the first box; `.is-error` shakes once |
| New password | `.b-strength` (`data-level` 0–4) + `.b-rules` / `PasswordStrength`, `scorePassword` | rules turn green as they are met; the meter is a hint, the server decides |
| Link sent | `.b-sent` / `AuthSent` | name the address, the expiry and how to resend |
| Footer | `.b-auth-foot`, `.b-auth-legal` | invite or sign-up link, terms |

Copy: say "Sign in", not "Login" or "Submit". Errors never reveal whether the email exists ("Email or password is wrong"). Say how many tries are left before a lockout and how long it lasts. Keep autofill working: real `<form>`, `type="email"` with `autocomplete="username"`, `autocomplete="current-password"` or `"new-password"`.

The login page follows the app theme. Put a theme switcher in the corner instead of forcing dark; the gallery shows each layout in both themes.

## 4. Accessibility

- Expanders are buttons with `aria-expanded` and `aria-controls`; the detail row is `hidden` when closed.
- The select-all checkbox shows `indeterminate` when only some rows are selected; the bulk bar announces the count.
- Row actions are always reachable by keyboard: they become fully visible on `:focus-within`.
- Each OTP box has `aria-label="Digit n of 6"` inside a labelled group; the strength text sits in an `aria-live="polite"` region.
- `.b-state` always pairs the dot with a word.
- Reduced motion turns off the mesh drift, ring, pulse, shake and entrance animations; reduced transparency swaps the glass for a solid panel; forced colours draw plain borders.

## 5. Common mistakes → fix

| Mistake | Fix |
|---|---|
| A panel around a panel around a table | One panel; the table goes in `.b-panel-body.is-flush` with `.b-table-wrap.is-bare` |
| Every panel is `.is-accent` | Accent marks the one thing that needs attention on the view |
| Zebra stripes plus avatars plus meters | Pick one rhythm; drop the zebra |
| Row actions hidden until hover on a phone | They already show on touch devices; don't override `opacity` |
| Row cards for a 200-row data set | Use `.b-table` with paging; row cards are for a handful of objects |
| Glass sign-in in a calm admin tool | Use `.is-center`; glass belongs to products with a bold identity |
| Error text under the button only | `AuthAlert` above the form and `aria-invalid` on the field |
| OTP that ignores paste | Keep the paste handler from `OtpInput`; people copy codes from SMS and mail |
