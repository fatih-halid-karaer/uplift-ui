# Feedback, dialogs and hints

How an app talks to its user: results of actions, questions before destructive steps, forms that create or edit, and explanations of what a page or field means. Most "this UI feels cheap" complaints trace back to this layer: toasts that vanish before they are read, text walls at the top of every page, deletes without a question.

## Contents
1. One message channel: the popup
2. Confirmations
3. Form dialogs
4. Info tips instead of text walls
5. Warnings
6. Inline errors
7. Focus rules that prevent subtle bugs

## 1. One message channel: the popup

Use a single, centred, modal popup for every outcome message (success, info, warning, error). Do not mix toasts, banners and alerts.

Why: toasts disappear while the user is still reading, stack unpredictably, and are missed by screen readers and by people looking at the table rather than the corner. One channel is easy to learn.

Anatomy (no footer band, no close X):

```
┃ ✓ SUCCESS                      ← small uppercase tone heading with icon, tone-coloured
┃ Branch "core/edge" deleted.    ← the message, 16px semibold
┃ Services under it were moved.  ← optional description, 14px muted
┃                    [ Done ]    ← right-aligned compact button(s)
```

- A 4px rounded rail on the left edge in the tone colour (inset from top and bottom by 16px) carries the tone; the panel itself stays neutral. This is quieter than a full coloured header and keeps four tones visually related.
- Do not repeat the tone word: the heading already says SUCCESS, so a message that is only "Success" is dropped and the description is shown alone.
- Width `min(26rem, 100vw - 2rem)`, radius 12px, `float` shadow, scrim `rgb(10 14 24 / .4)`.
- Enter: 220 ms, from `translateY(8px) scale(.97)` and opacity 0, ease-out-quint. Exit: 140 ms to `translateY(4px) scale(.98)`. Resolve the promise after the exit finishes.
- Render as a native `<dialog>` with `showModal()`: you get focus trapping, Esc and the top layer for free. Use `role="alertdialog"` when it asks a question.
- Queue messages: show one at a time, the next after the previous resolves.
- API shape that keeps call sites short: `popup.success(title, { description })`, `popup.error(...)`, `await popup.confirm({ title, description, tone, confirmLabel }) → boolean`.

Button labels per tone: success "Done", info and warning "Got it", error "Close". Never "OK".

## 2. Confirmations

Every destructive or hard-to-undo action asks first: delete, unassign, revoke, archive, close an account.

- Title is the action as a question with the object named: "Delete core/edge?", not "Are you sure?".
- Description states the consequence: "This cannot be undone." / "Its sessions end at once."
- Danger tone: red rail, triangle icon, confirm button in danger style labelled with the verb ("Delete", "Remove"), Cancel as a quiet text button on its left.
- Initial focus goes to **Cancel** for danger, to the confirm button otherwise. Enter on a danger popup must not destroy anything.
- Never confirm by an inline two-step button ("click again to delete"); it is easy to double-click through.

## 3. Form dialogs

Add and edit forms open from a primary button at the top-right of the page or section ("New rule", "Add permission") as a dialog, not as a form permanently expanded on the page.

- Same family as the popup: the left rail in the primary colour, title at the top, fields, then right-aligned actions (Cancel as text button, primary submit). No grey footer band, no "+ NEW" eyebrow label above the title.
- Stacked labels above fields. Placeholders show an example value, never the label.
- Hints belong in an info tip next to the label, not as permanent grey text under every field.
- Disable the submit button and show a progress label ("Saving…") while pending; keep the dialog open and show the server error inside it on failure; close and fire a success popup on success.
- Width grows with content: 28rem for 1–4 fields, 36rem for two-column forms, always `min(…, 100vw - 2rem)`. On phones the body scrolls and the actions stay visible.

## 4. Info tips instead of text walls

Pages and fields often arrive with paragraphs of explanation. Move them behind a small ⓘ button next to the page title or field label.

- Trigger: 28px round icon button, muted until hover, primary on hover/open. `aria-label` names what it explains ("About Service Tree").
- Opens on hover after 120 ms, closes 160 ms after the pointer leaves (the pointer may travel into the panel), toggles pinned on click, opens on keyboard focus only when the focus is `:focus-visible` (otherwise a dialog that focuses its first control will pop the tip open by itself).
- Panel: 22rem max, a slim header (`subtle` background) with a tinted square icon and a short title ("About this page"), then paragraphs at 13px in muted ink, scrolling at 60vh.
- Esc closes it, clicking outside closes it, and it repositions to stay on screen.
- Letter variant: for a status flag that needs a word of explanation (Protected, Reusable, Archived) show a 16px circled letter (P, R, A) inside the trigger instead of a chip; the tooltip says what it means.
- Accent variant (info blue) for neutral facts, warn variant (amber) only when the tip contains a warning.

## 5. Warnings

Important caveats ("Deleting a branch removes its permissions") go **inside** the same info tip, as a yellow callout under the paragraphs: `warn-soft` background, `warn-line` border, `warn-ink` text, triangle icon. Do not put separate warning icons next to headings: they make every page look alarming and users learn to ignore them.

## 6. Inline errors

- Field validation: message directly under the field in `danger-ink`, field border in `danger`, shown after blur or submit, never on every keystroke.
- Load failures: replace the content area with an error state (icon, one sentence, Retry button), not a red banner above an empty table.
- Mutation failures: an error popup with the server's explanation. Rewrite raw messages ("409 Conflict") into human sentences in a single `describeError` helper.

## 7. Focus rules that prevent subtle bugs

- When a dialog opens, defer initial focus by one animation frame and skip info-tip buttons; otherwise StrictMode double effects and focus-triggered tooltips misbehave.
- On close, return focus to the opener only if focus is still inside the dialog. Returning focus blindly marks the opener's form fields as touched and shows validation errors nobody caused.
- Call `focus({ focusVisible: false })` when focusing programmatically, so a mouse user does not get a focus ring on a popup button.
- Buttons get `user-select: none` and a transparent caret, so clicks do not show a blinking text cursor.
