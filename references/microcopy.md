# Microcopy

The words on buttons, errors, empty states and confirmations do more for "user friendly" than any colour. A restyle is the right moment to fix them, because you touch every component anyway. Changing copy is not a behaviour change, but changing copy the server or tests match on is: grep tests and e2e selectors before renaming a label.

## Contents
1. Voice and tone
2. Buttons and links
3. Error messages
4. Empty states
5. Confirmations
6. Success and outcome messages
7. Numbers, dates, relative time
8. Capitalisation and punctuation
9. Raw values, enums, jargon
10. Writing for translation
11. Before and after
12. Common mistakes

## 1. Voice and tone

- **Plain, short, specific.** Write like a competent colleague: no marketing, no jokes in errors, no robot voice.
- **Second person, active voice.** "You don't have access" not "Access is not permitted for this user". "We couldn't save" for system failures, never "You failed to…".
- **Front-load the point.** The first three words carry the meaning; people scan.
- **One term per concept.** If it's a "rule" in the nav, it's a "rule" in the button, the popup and the empty state, never "policy" in one place. Keep a short glossary in the project's DESIGN.md.
- **Tone shifts with stakes**: neutral for routine, calm and direct for errors, explicit for destructive actions. Never cute when something went wrong.
- **Cut filler**: "Please", "Successfully", "simply", "just", "Welcome back", "Click here", "Note that". Keep "please" only when asking a real favour.

## 2. Buttons and links

- Verb, or verb + object: "Save", "Create rule", "Delete branch", "Export CSV". Not "OK", "Yes", "Submit", "Proceed".
- The button says what happens, matching the title that asked: title "Delete core-edge?" → button "Delete".
- Dialog pairs: [Cancel] [Verb]. Never [No] [Yes]: they force re-reading the question.
- New vs Add vs Create: pick one per app. A common split: "New rule" opens a blank form (page heading); "Add member" attaches an existing thing to this one; "Create" is the final submit.
- Progress labels during a request: "Saving…", "Deleting…", "Testing connection…" (controls-motion.md §1), using the same verb.
- Links describe the destination: "View all runs", "Read the setup guide". Never "here" or "more"; screen-reader users list links out of context.
- Toggle buttons keep the same label and use `aria-pressed`; buttons that switch label ("Follow" → "Unfollow") are fine if the new label is the next action.
- Keep labels to 1–3 words; 25 characters max. Expect ~30% growth in other languages (§10).

## 3. Error messages

Formula: **what happened + why (if known) + what to do**. One or two sentences.

| Raw | Better |
|---|---|
| "Error 409" | "A rule named *core-edge* already exists. Choose another name." |
| "Invalid input" | "Enter a port between 1 and 65535." |
| "Request failed with status code 500" | "We couldn't save the rule. Try again in a moment." |
| "Network Error" | "You seem to be offline. Your changes are kept; try again when you're connected." |
| "Unauthorized" | "Your session has ended. Sign in again to continue." |
| "Forbidden" | "You need the *Rules: edit* permission to do this. Ask an admin." |
| "Field is required" | "Enter a name." / "Choose an owner." |
| "Validation failed: cron" | "This schedule isn't valid. Example: `0 2 * * *` (every day at 02:00)." |
| "NullPointerException at …" | "Something went wrong on our side. Error ID `7f3a-2c` — share it with support." |

- Field errors start with the fix ("Enter…", "Choose…", "Use…"); they sit next to the field, so the field name is redundant.
- Don't blame: "That password is too short" not "You entered an invalid password".
- Don't apologise in every message; one "Sorry" for real failures on our side is enough.
- Map status codes and server error codes to sentences in one `describeError` helper (feedback.md §6). Collapse duplicates; never show stack traces.
- Popup error: title is what failed ("Couldn't delete core-edge"), description is why + next step.

## 4. Empty states

Different situations need different words (data.md §9):

| State | Title | Body | Action |
|---|---|---|---|
| Nothing yet | "No rules yet" | one line on what a rule does or why you'd add one | "New rule" |
| Filters hide everything | "No rules match" | "Try fewer filters or a different search." | "Clear filters" |
| Search no results | "No results for *edge*" | "Check the spelling or search all types." | "Search everything" |
| Nothing to do (good) | "All caught up" | "New approvals will show up here." | none |
| No permission to see any | "You can't see any rules" | "Ask an admin for access to rules." | none |
| Error | "Couldn't load rules" | cause if known | "Retry" |

- Title names the object; body is one sentence; keep explanations in an info tip.
- "No data" and "Nothing here" are never enough on their own.

## 5. Confirmations

Template (feedback.md §2):

```
Title:        <Verb> <object name>?            Delete core-edge?
Description:  <consequence>. <reversibility>.  Its 12 permissions are removed. This can't be undone.
Buttons:      [Cancel]  [<Verb>]               [Cancel] [Delete]
```

- Name the object, in the user's terms (its display name, not its ID).
- State the consequence that matters: what else is affected, who notices, whether it's reversible.
- For bulk actions, give the count: "Delete 8 rules?"
- For reversible actions (archive), say how to undo: "You can restore it from Archived."
- Don't confirm non-destructive actions. Confirmation fatigue makes people click through the ones that matter.

## 6. Success and outcome messages

- Outcome popups (feedback.md §1) are past tense with the object: "Rule *core-edge* created.", "3 users invited." The tone heading already says SUCCESS; don't repeat "Success!" in the message.
- Add a description only when there's a next step or a side effect: "They'll get an email with a sign-in link."
- Inline saved indicators for autosave: "Saved" (2 s), then disappear. Failure: "Couldn't save · Retry".
- Background work the user started: "Export started. It'll be in Downloads in about a minute." then, when done, the outcome popup if they're still on the page.
- Never "Operation completed successfully".

## 7. Numbers, dates, relative time

Use `Intl` with the user's locale; never concatenate formats by hand. Formatter examples are in charts.md §4.

**Numbers**
- Thousands separators always; compact (12.5K) only in tight spaces, with the exact value in `title` or tooltip.
- Units with a thin or regular space: "120 ms", "4.2 GB", "99.2%". Use `Intl.NumberFormat` `style: 'unit'` where available.
- Durations as humans read them: "2 h 14 min", "45 s", not "8040 seconds" or "02:14:00".

**Dates and times**
- Relative for the last ~7 days ("3 min ago", "Yesterday at 14:20"), absolute after ("12 Oct 2026"), the full absolute timestamp with time zone in `title` (data.md §8).

  ```js
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }); // "yesterday", "in 2 days"
  rtf.format(-3, 'minute');                                             // "3 minutes ago"
  ```
- Avoid ambiguous numeric dates (03/04/2026) in UIs used across regions; use a month name (`month: 'short'`).
- Future relative times for schedules: "Next run in 2 h (02:00 UTC+3)".
- Show the time zone whenever it isn't the viewer's local one, and let users choose display time zone in their profile (pages.md §8).
- Update relative times on a timer (every 60 s), not on every render.

## 8. Capitalisation and punctuation

- **Sentence case everywhere**: titles, buttons, tabs, menu items, labels. "Create new rule", not "Create New Rule". Exception: proper nouns and product names.
- Small uppercase only for the tiny tone heading in popups (feedback.md §1) and group labels in navigation if the design uses them; apply with CSS `text-transform`, keep source text in sentence case (screen readers may spell out ALL CAPS).
- No full stop on buttons, labels, titles, tab names, or single-sentence tooltips. Full stops in descriptions and multi-sentence text.
- Ellipsis "…" (one character) on menu items and buttons that open a dialog asking for more input ("Rename…"), and on progress labels ("Saving…").
- No exclamation marks except perhaps a genuine first-success moment. Never in errors.
- Curly quotes and apostrophes in UI text (’ “ ”); straight quotes in code.
- Use the en dash for ranges ("1–10 of 37"), × for dimensions, → for direction in links.

## 9. Raw values, enums, jargon

- Map every enum to a label in one place (`labels.ts`): `MANUAL` → "Manual", `LDAP_SYNC` → "Directory sync", `IN_PROGRESS` → "Running". Unknown values fall back to a humanised version ("Some new value"), never crash.
- Booleans: "Yes / No" in tables only if nothing better; prefer the meaning ("Enabled", "Archived", "—" for not applicable).
- Null and empty: "—" (em dash) in ink-muted, with `aria-label="Not set"` where it matters. Never "null", "undefined", "N/A", "[]".
- Technical values stay visible but secondary: human text first, raw value in mono after (data.md §8): "Every day at 02:00 · `0 2 * * *`".
- Internal jargon ("tenant", "entity", "principal", "payload", "CRUD") → the user's words ("workspace", "item", "user or group", "data", "manage").
- Abbreviations: spell out on first use or in a tooltip (`<abbr title>`), except universal ones (ID, URL, CSV).
- IDs: show short (first 8 characters) with a copy button; the full value in `title`.

## 10. Writing for translation

Even a single-language app benefits: these rules also prevent awkward English.

- **No concatenation.** `"Delete " + name + "?"` can't be reordered for languages that put the verb last. Use whole-message templates with named placeholders: `t('rule.delete.title', { name })` → "Delete {name}?".
- **Plurals by rule, not `count === 1`.** Many languages have more than two forms. Use ICU MessageFormat or `Intl.PluralRules`:

  ```js
  const pr = new Intl.PluralRules(locale);
  const msgs = { one: '{n} rule', other: '{n} rules' };   // translators add few, many, two, zero…
  const text = msgs[pr.select(n)].replace('{n}', nf.format(n));
  ```
  ICU form: `{count, plural, =0 {No rules} one {# rule} other {# rules}}`.
- **Lists**: `new Intl.ListFormat(locale, { type: 'conjunction' }).format(['A', 'B', 'C'])` → "A, B, and C".
- **No text in images or icons-as-words**; no meaning from word position in the layout.
- **Allow growth**: buttons and tabs must take +30–40% text without breaking; never fixed-width labels. Test with a pseudo-locale (wrap strings in `[!! … !!]` and lengthen them).
- **RTL-ready**: logical CSS properties (`margin-inline-start`, `padding-inline`, `inset-inline-end`, `text-align: start`); mirror directional icons (chevrons, arrows) with `:dir(rtl)`, not clocks or checkmarks.
- **Gender and grammar**: avoid sentences where the placeholder's grammatical gender changes other words; rephrase ("Owner: {name}").
- **Context for translators**: a description per key ("Button on the rule detail page that opens the delete confirmation").
- Dates, numbers and currency only through `Intl` (§7).

## 11. Before and after

| Before | After |
|---|---|
| Button "Submit" on an invite form | "Send invite" |
| "Are you sure?" [No] [Yes] | "Remove A. Kaya from Ops?" / "They lose access to 4 services at once." [Cancel] [Remove] |
| "Operation completed successfully!" | "Rule *core-edge* saved." |
| "No data" | "No runs yet" / "Runs appear here after the first schedule fires." [Run now] |
| "Error: ECONNREFUSED 10.0.0.4:5432" | "Couldn't reach the database. Check that it's running, then retry." |
| "Status: IN_PROGRESS" | "Running" (info-ink) |
| "Last login: 2026-10-24T08:13:44.512Z" | "Last sign-in 2 h ago" (title: "24 Oct 2026, 11:13 UTC+3") |
| "1 rules found" | "1 rule" via plural rules |
| "Click here to learn more about schedules" | "How schedules work" (info tip) |
| "Please Enter A Valid Email Address!" | "Enter an email like name@example.com" |
| Page intro paragraph of 80 words | Title + info tip; meta line "7 rules · 2 paused" |
| Tab "MANAGE USER PERMISSIONS" | "Permissions" |

## 12. Common mistakes

| Mistake | Fix |
|---|---|
| "OK" / "Yes" / "Submit" buttons | Verb that names the outcome |
| "Are you sure?" | Question naming action and object, plus consequence |
| Raw status codes, exception text | `describeError` → cause + fix |
| Title Case Everywhere | Sentence case |
| "Success!" title plus "Saved successfully" message | One past-tense message with the object |
| Same thing called rule, policy and filter | One term; glossary |
| `count + " item(s)"` | `Intl.PluralRules` / ICU plural |
| String concatenation around names | Templates with named placeholders |
| "null", "undefined", "N/A" in cells | "—" with an accessible "Not set" |
| `MM/DD/YYYY` hard-coded | `Intl.DateTimeFormat` with month names |
| "Click here" links | Link text that names the destination |
| Fixed-width buttons cut translated text | Intrinsic widths; pseudo-locale test |
