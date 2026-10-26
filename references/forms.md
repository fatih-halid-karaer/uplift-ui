# Forms

Forms are where users do work and where most frustration happens: lost input, errors that appear too early or too late, phones that open the wrong keyboard. This file covers form structure and behaviour. The look of individual controls is in controls-motion.md §1–5; form dialogs, inline error styling and focus rules are in feedback.md §3, §6, §7.

Restyling rule: change layout, labels, timing and attributes freely; never change field names, payload shape or validation rules the server relies on without telling the user.

## Contents
1. Where a form lives
2. Layout: one column, when two
3. Labels, required, placeholders
4. Help text vs info tips
5. Validation timing
6. Inline errors, error summary, async validation
7. Input types, mobile keyboards, autofill
8. Choosing the control
9. Multi-step forms
10. Unsaved-changes guard
11. Destructive confirmations inside forms
12. Long forms and sticky actions
13. Disabled vs read-only
14. Submitting
15. Common mistakes

## 1. Where a form lives

| Size | Container |
|---|---|
| 1 field (rename, quick add) | inline edit or a small form dialog |
| 2–8 fields | form dialog opened from the page's primary button (feedback.md §3) |
| 8–25 fields, one topic | full page, single column, sticky actions |
| > 25 fields or several topics | full page with section nav (§12), or a wizard if steps depend on each other (§9) |
| settings | settings archetype, autosave or save bar (pages.md §6) |

## 2. Layout: one column, when two

One column is the default. The eye travels straight down, tab order matches visual order, and it folds to phones unchanged.

```
Good                         Avoid
Name                         Name          Email
[____________________]       [_________]   [_________]
Email                        Role   Timezone   Team
[____________________]       [___]  [_____]    [____]
Role                         ← zig-zag reading, tab order unclear
[__________ ▾]
```

Use two columns (from ≥ 768px, inside a 36rem+ container) only for fields that belong together and are short:

- First name / Last name; City / Postcode; Start / End date; Min / Max.
- Never put unrelated fields side by side just to fill width.
- Below 640px everything is one column.

Field width hints the expected length: postcode 8rem, phone 14rem, name and email full width (max 32rem). A 600px-wide field for a 4-digit code reads as "type a lot here".

Spacing: 6px label to field, 16–20px between fields, 32px plus a section heading between groups. Group with `<fieldset>` + `<legend>` for radio sets and related controls.

## 3. Labels, required, placeholders

- Labels above fields, 13px weight 500 (controls-motion.md §2). Left-aligned side labels only in dense settings rows at ≥ 768px.
- Every input has a programmatic label: `<label for>` or wrapping `<label>`. Icon-only fields (search) use `aria-label`.
- Mark the minority: if most fields are required, mark the optional ones "(optional)"; if most are optional, mark required ones with `*` and a visually hidden "required". Add `required` or `aria-required="true"` either way.
- Placeholders show an example (`e.g. core-edge`), never the label or instructions. They disappear on typing and have low contrast.
- Labels are nouns ("Email"), not questions or instructions ("Please enter your email").

## 4. Help text vs info tips

| Kind of help | Where |
|---|---|
| Format the user must follow to succeed ("8+ characters", "YYYY-MM-DD") | short visible hint under the field, 13px ink-muted, linked by `aria-describedby` |
| Background, why, consequences, examples | info tip next to the label (feedback.md §4) |
| A warning about consequences | inside the info tip as a warn callout (feedback.md §5) |
| Long policy text | a link that opens a dialog or a new tab |

Visible hints are only for things people get wrong without them. If every field has grey text under it, nobody reads any of it.

## 5. Validation timing

| Moment | Show |
|---|---|
| While typing in an untouched field | nothing |
| On blur of a field the user changed | that field's error |
| While typing in a field that already shows an error | re-validate on input, clear the error as soon as it is fixed (reward early, punish late) |
| On submit | all errors, focus the first invalid field (or the summary, §6) |
| Live per-keystroke | only for constraints that guide typing: password rule checklist, character counter near a limit, username availability |

- Don't validate on blur when the user only tabbed through an empty required field; wait for submit.
- Don't disable the submit button to signal invalid input: people can't tell why it's disabled. Keep it enabled and show the errors on click. (Disable it only while submitting.)

## 6. Inline errors, error summary, async validation

**Inline error** (feedback.md §6 for style):

- Directly under the field, before the hint, in danger-ink with a small danger icon so colour is not the only signal.
- `aria-invalid="true"` on the field, error element id added to `aria-describedby`.
- Message says what's wrong and how to fix it: "Enter a port between 1 and 65535", not "Invalid value". See microcopy.md §3.

**Error summary** for long forms (> 8 fields) or full-page forms:

```
┃ △ Fix 2 fields to continue
┃   • Port — enter a number between 1 and 65535
┃   • Owner — choose an owner
```

- At the top of the form, danger-soft background, danger-line border; each item is a link that focuses its field.
- On submit, focus the summary (`tabindex="-1"`) so screen readers read it.
- Short dialogs skip the summary and focus the first invalid field.

**Server errors**: map field-level errors from the response onto fields; show form-level errors inside the form (dialog stays open, feedback.md §3). Never clear the user's input after a failed submit.

**Async validation** (name taken, address reachable):

- Run on blur or 400 ms after typing stops; cancel the previous request (AbortController); ignore stale responses.
- Show a small "Checking…" with a spinner inside the field's trailing slot; show "Available" in success-ink only if it helps (usernames), otherwise silence means OK.
- Re-check on submit; the server is the authority.
- If the check itself fails (network), don't block submit; let the server decide.

## 7. Input types, mobile keyboards, autofill

The right attributes give phones the right keyboard and let password managers and browsers fill fields. They are free and invisible on desktop.

| Field | Attributes |
|---|---|
| Email | `type="email" autocomplete="email" spellcheck="false" autocapitalize="off"` |
| Phone | `type="tel" autocomplete="tel"` |
| Integer (quantity, port) | `type="text" inputmode="numeric" pattern="[0-9]*"` (avoid `type="number"`: scroll-wheel changes, spinners, accepts `e`) |
| Decimal, money | `inputmode="decimal"`; parse with the locale's decimal separator |
| URL | `type="url" autocomplete="url" autocapitalize="off"` |
| Search | `type="search" enterkeyhint="search"` |
| One-time code | `inputmode="numeric" autocomplete="one-time-code"` |
| Username | `autocomplete="username" autocapitalize="off" spellcheck="false"` |
| Current password | `type="password" autocomplete="current-password"` |
| New password | `autocomplete="new-password"` + reveal toggle |
| Name | `autocomplete="name"` (or `given-name` / `family-name`) |
| Address | `street-address`, `address-level2` (city), `postal-code`, `country` |
| Technical (IPs, IDs, cron, paths) | `spellcheck="false" autocapitalize="off" autocorrect="off"`, mono font |

- `enterkeyhint="next"` on fields in a sequence, `"done"` or `"send"` on the last.
- Inputs are 16px font-size on phones, or iOS zooms on focus (mobile.md §7).
- Never block paste, and never disable autofill on sign-in fields.
- Admin fields that should not be autofilled with the user's own data (creating *another* user's email) use `autocomplete="off"`; managers may still offer, which is acceptable.

## 8. Choosing the control

| Choice | Control |
|---|---|
| On/off that takes effect immediately | switch (controls-motion.md §3) |
| On/off submitted with the form, or agreement | checkbox |
| 2–5 exclusive options, all worth seeing | radio group (vertical) or segmented control (≤ 3 short labels) |
| 6–15 options | select |
| > 15 options, or remote data | searchable combobox (variants.md "Combobox") |
| Several from many | multi-select combobox with chips, or checkbox list in a scroll area with search |
| Date | date input that opens on click or ArrowDown (controls-motion.md §5); allow typing |
| Date range | two dates or a range picker with presets (Today, Last 7 days, Last 30 days) |
| Number in a small range | stepper or slider with a visible value and a text input |

Radios and checkboxes have the label clickable with a 40px row height on touch.

## 9. Multi-step forms

Page-level wizard layout is in pages.md §7. Behaviour:

- Each step validates on Next; errors as §6. Steps never lose data when going back.
- Persist a draft (server draft or sessionStorage) for wizards longer than 2 minutes; restore it with a one-line notice "Restored your draft from 10:42 · Discard".
- Step in URL or history state so browser Back steps back. Leaving the wizard entirely triggers the unsaved-changes guard.
- Conditional steps: show the step count that is true now ("Step 2 of 3"), update when a choice adds a step.
- Final button names the outcome ("Create pipeline"), never "Finish" or "Submit".

## 10. Unsaved-changes guard

Losing typed input is the most resented form bug. Guard every form that took more than a few seconds to fill.

- Track dirty state by comparing current values with the initial values, not by "any input event happened" (typing and deleting returns to clean).
- In-app navigation (link, back, closing a dialog with Esc or scrim click): confirmation popup "Discard unsaved changes?" / "Your edits to *core-edge* will be lost." / [Keep editing] [Discard]. Focus "Keep editing".
- Tab close and reload: `beforeunload` with `preventDefault()` only while dirty; the browser shows its own text.
- Form dialogs: Esc and scrim click on a dirty dialog ask the same question; on a clean dialog they just close.
- Remove the guard right before a successful submit navigates away.
- Session expiry: re-authenticate in a dialog over the form, then retry the submit; never redirect away from a dirty form.

## 11. Destructive confirmations inside forms

- Removing a row from a repeatable group (an env var, a rule line): remove instantly with an inline "Removed · Undo" for 6 s in the group, because nothing is saved yet. The real commit is the form's Save.
- Actions that commit immediately (Delete this item from an edit page): confirmation popup (feedback.md §2), danger button, kept away from Save (bottom-left or in the danger zone, never next to Save).
- Changes with a big blast radius on Save ("Changing the region restarts 14 services"): show the consequence in the confirmation that Save triggers, listing what will happen.

## 12. Long forms and sticky actions

```
≥ 1024px                                       phone
┌──────────────┬──────────────────────────┐    ┌──────────────────────┐
│ On this page │ General                  │    │ fields …             │
│ ▌General     │ fields …                 │    │                      │
│  Network     │ Network                  │    │                      │
│  Access   △1 │ fields …                 │    ├──────────────────────┤
│              ├──────────────────────────┤    │ [Cancel]     [Save]  │ ← sticky, safe-area padded
│              │ Unsaved · [Cancel][Save] │    └──────────────────────┘
└──────────────┴──────────────────────────┘
```

- Section nav ("On this page") from ≥ 1024px: anchor links, scroll-spy highlights the visible section, error count badges per section after a failed submit. Hidden below 1024px; a long form on phones is just a scroll.
- Sticky action bar at the bottom of the viewport (or the form container): `position: sticky; bottom: 0`, panel background, top border `line`, 12–16px padding plus `env(safe-area-inset-bottom)` (mobile.md §5). On desktop the bar can show "Unsaved changes" on its left.
- Primary action on the right on all widths; on phones Cancel and Save share the row, each ≥ 44px tall.
- Don't add a second Save at the top; one place for the action.
- Collapsible sections only for rarely used advanced groups ("Advanced · 6 settings"), closed by default, auto-opened if they contain an error.

## 13. Disabled vs read-only

| State | Meaning | Look and behaviour |
|---|---|---|
| `disabled` | not available right now (depends on another choice, no permission) | 50% opacity, not focusable, not submitted; explain why with an info tip or a hint ("Enable sync to choose a schedule") |
| `readonly` | value matters but can't be changed here | normal text contrast on `sunken` background, focusable and selectable (people copy IDs), submitted |
| plain text | value is display-only on a view page | not an input at all; `<dl>` label/value |

- Never use disabled inputs to display data: the text fails contrast and can't be copied.
- Hide controls the user can never use (no permission at all); disable with an explanation only when they could reasonably expect it.

## 14. Submitting

- Submit on Enter in single-line inputs (native `<form>` behaviour), never in textareas.
- Pending: disable the submit button only, label "Saving…" (controls-motion.md §1); keep fields editable-looking but ignore double submits with an in-flight flag.
- Success: dialog closes and a success popup confirms (feedback.md §1); full-page forms navigate to the record and the popup names it ("Rule *core-edge* created.").
- Failure: stay, keep input, show errors as §6, focus the summary or first invalid field.
- Slow saves (> 1 s): see performance-perceived.md §2 for progress thresholds.

## 15. Common mistakes

| Mistake | Fix |
|---|---|
| Two or three columns of unrelated fields | One column; pair only related short fields |
| Placeholder as the only label | Visible label above; placeholder shows an example |
| Errors on the first keystroke | Validate on blur and submit; clear errors live once shown |
| Submit disabled until valid, no reason given | Keep it enabled; show errors on click |
| "Invalid input" | Say what's wrong and how to fix it |
| Input cleared after a server error | Keep everything; map server errors to fields |
| `type="number"` for IDs, ports, codes | `inputmode="numeric"` with a text input |
| Phone zooms in when a field is focused | 16px input font on phones |
| Typed form lost by Esc, back or a misclick on the scrim | Dirty check + discard confirmation + `beforeunload` |
| Disabled inputs used to show read-only data | Plain text or `readonly` |
| Grey help text under every field | Hints only for formats; the rest in info tips |
| Save button at the bottom of a long form off-screen on phones | Sticky action bar with safe-area padding |
