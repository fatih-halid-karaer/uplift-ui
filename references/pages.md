# Page archetypes

Most screens in an app are one of about a dozen shapes. Recognising the shape first tells you where the title, the primary action, the data and the help belong, and how the page folds down on a phone. Restyle a page by matching it to its archetype, then apply the component patterns from the other files.

Sketches show desktop (≥ 1024px) on the left and phone (360px) on the right. The app shell around them is in layout-responsive.md §1; the page heading component is layout-responsive.md §3.

## Contents
1. Rules shared by every archetype
2. Dashboard / home
3. List (table) page
4. List + detail (master/detail)
5. Detail / record page
6. Settings
7. Create / edit wizard
8. Profile / account
9. Search results
10. Onboarding / first run
11. Error, 404, maintenance, permission denied
12. Sign in, sign up, forgot password
13. Common mistakes

## 1. Rules shared by every archetype

- One `<h1>` per page: the page heading title. Sections use `<h2>`, cards inside them `<h3>`.
- One primary action per view, rightmost in the heading on desktop, wrapping under the title on phones (or in a sticky bottom bar when the page is a form, see forms.md §12).
- Every page has four states designed up front: loading, empty, error, populated (data.md §9). A page sketch without them is unfinished.
- The URL describes what is on screen: tab, filters, page number, selected record (navigation.md §4).
- On route change move focus to `<main tabindex="-1">` or the `<h1>`, and set `document.title` to "Page – App".
- Content max-width ~1680px for data pages; ~720px for reading and forms; ~960px for settings.

## 2. Dashboard / home

Answers "is anything wrong, and where do I go next?". It is a launch pad, not a report.

```
┌─────────────────────────────────────────────┐   ┌──────────────────────┐
│ Overview ⓘ                    [Last 7 d ▾]  │   │ Overview ⓘ  [7 d ▾]  │
│ 3 items need attention                      │   │ 3 items need attention│
├──────────┬──────────┬──────────┬────────────┤   ├──────────┬───────────┤
│ ▣ 128    │ ▣ 12     │ ▣ 3      │ ▣ 99.2%    │   │ ▣ 128    │ ▣ 12      │
│ Services │ Pending  │ Failed   │ Uptime     │   │ Services │ Pending   │
├──────────┴──────────┴──────────┴────────────┤   ├──────────┼───────────┤
│ Runs per day (chart)          │ Needs you   │   │ ▣ 3      │ ▣ 99.2%   │
│                               │ • item  →   │   ├──────────┴───────────┤
│                               │ • item  →   │   │ Needs you            │
├───────────────────────────────┴─────────────┤   │ • item →             │
│ Recent activity                             │   ├──────────────────────┤
└─────────────────────────────────────────────┘   │ Runs per day (chart) │
                                                  └──────────────────────┘
```

- Order by urgency: attention items, then KPI tiles, then trends, then history. On phones the "needs you" list moves above charts.
- Tiles link to their pages (data.md §12). 4 per row at 1440, 3 at 1024, 2 at 768 and 360 (`repeat(auto-fill, minmax(10rem, 1fr))` on phones).
- One global time range control, top right, applied to every widget. Per-widget ranges confuse comparison.
- Charts: charts.md. Keep to 2–4 charts; a dashboard of twelve charts is a report nobody reads.
- New user with no data: replace the whole grid with an onboarding checklist (§10), not twelve zeros.

## 3. List (table) page

The workhorse. Everything in data.md applies.

```
┌─────────────────────────────────────────────┐   ┌──────────────────────┐
│ Rules ⓘ                         [+ New rule]│   │ Rules ⓘ              │
│ 37 rules                                    │   │ 37 rules  [+ New]    │
│ [All] Active  Archived                      │   │ All  Active  Archived│
│ [⌕  Search…     ] [Filters ²]  Showing 4/37 │   │ [⌕  Search…        ] │
├─────────────────────────────────────────────┤   │ [Filters ²]          │
│ Name        Owner     Status    Updated  ✎ 🗑│   ├──────────────────────┤
│ …10 rows                                    │   │ ┌ card per row ────┐ │
├─────────────────────────────────────────────┤   │ │ Name     Status  │ │
│ 1–10 of 37                    ‹ 1 [2] 3 4 › │   │ │ Owner · 3 h ago ⋯│ │
└─────────────────────────────────────────────┘   │ └──────────────────┘ │
                                                  │ ‹ 1 [2] 3 4 ›        │
                                                  └──────────────────────┘
```

- Segmented or underline tabs for saved views (All / Active / Archived) above the toolbar; their choice lives in the URL.
- Row click opens the detail page (§5) or a side panel (§4). Make the name cell a real link so middle-click and "open in new tab" work.
- Bulk selection adds a contextual bar replacing the toolbar: "3 selected · [Archive] [Delete] · Clear".
- Phones: cards or in-wrapper scroll, see mobile.md §10.

## 4. List + detail (master/detail)

For triage work where people move through many records quickly: inboxes, queues, trees with properties.

```
≥ 1024px                                          < 1024px
┌──────────────────┬──────────────────────────┐   ┌──────────────────────┐
│ [⌕  Search     ] │ ‹ › Item 4 of 37     ⋯ ✕ │   │ [⌕  Search         ] │
│ ▸ Item 1         │ Title          Status    │   │ Item 1             › │
│ ▸ Item 2         │ key facts                │   │ Item 2             › │
│ ▌Item 4 (active) │ [tabs]                   │   │ Item 4             › │
│ ▸ Item 5         │ content                  │   └──────────────────────┘
│                  │                          │      tap → full-screen
│ ‹ 1 2 3 ›        │                          │   ┌──────────────────────┐
└──────────────────┴──────────────────────────┘   │ ← Items   Item 4   ⋯ │
                                                  │ content              │
                                                  └──────────────────────┘
```

- Grid `minmax(18rem, 22rem) 1fr` from `lg`; the list pane scrolls independently; the separator can be resizable (same rules as the sidebar handle, layout-responsive.md §2).
- Selection lives in the URL (`/items/4`), so reload and back keep the selected record. On phones the same URL shows the detail full-screen with a back link labelled with the list's name.
- Nothing selected: muted prompt in the detail pane ("Choose an item to see its details"), never an empty white box.
- Keyboard: ↑/↓ or J/K move through the list while focus is in it; Enter opens; Esc returns focus to the list.
- Keep the list's scroll position and selection when the detail updates; a re-render that scrolls the list to the top breaks triage.

## 5. Detail / record page

One object: a user, a run, an order. Answers "what is it, what state is it in, what can I do to it?".

```
┌─────────────────────────────────────────────┐   ┌──────────────────────┐
│ Rules / core-edge                           │   │ ← Rules              │
│ core-edge  Active ⓘ        [Edit] [⋯]       │   │ core-edge  Active    │
│ Owner A. Kaya · Updated 3 h ago             │   │ A. Kaya · 3 h ago    │
├──────────┬──────────┬──────────┬────────────┤   │ [Edit] [⋯]           │
│ Priority │ Scope    │ Runs     │ Last run   │   ├──────────────────────┤
│ High     │ 4 nodes  │ 1,204    │ Passed     │   │ Priority   High      │
├──────────┴──────────┴──────────┴────────────┤   │ Scope      4 nodes   │
│ Overview  Runs 12  Permissions  Activity    │   │ Runs       1,204     │
│ ─────────                                   │   ├──────────────────────┤
│ tab content                                 │   │ Overview Runs Perm… →│
└─────────────────────────────────────────────┘   │ tab content          │
                                                  └──────────────────────┘
```

- Header: breadcrumb or back link, name, status as coloured text, primary action, overflow menu for the rest (Duplicate, Archive, Delete). Destructive items sit last in the menu, separated by a divider, in danger-ink.
- Key facts: 3–6 label/value pairs in a row (`repeat(auto-fit, minmax(10rem, 1fr))`), stacked as a two-column definition list on phones. Use `<dl>`.
- Tabs for the rest, URL-bound (`/rules/core-edge/runs`). Default tab is Overview.
- Activity / history: newest first, grouped by day, each entry "Who did what · when" with relative time and absolute time in `title`. Paginate or "Show 20 more", never infinite.
- Edit opens a form dialog (feedback.md §3) for a few fields, or switches the page into edit mode with a save bar (§6) for many.

## 6. Settings

```
≥ 1024px                                          < 768px
┌───────────────┬─────────────────────────────┐   ┌──────────────────────┐
│ General     ▌ │ General                     │   │ Settings             │
│ Notifications │ ─────────────────────────── │   │ [General          ▾] │
│ Security      │ Workspace name  [_______]   │   ├──────────────────────┤
│ Integrations  │ Time zone       [UTC+3   ▾] │   │ Workspace name       │
│ Danger zone   │ Weekly digest   [●━]        │   │ [__________________] │
│               │                             │   │ Weekly digest  [●━]  │
│               │ ┌ Unsaved changes  [Discard] [Save] ┐ │ …                │
└───────────────┴─────────────────────────────┘   │ ┌[Discard]  [Save]─┐ │
                                                  └─┴──────────────────┴─┘
```

- Section nav on the left (`<nav aria-label="Settings sections">`, 12–14rem), each section its own URL. Below `md` replace it with a native `<select>` or a horizontally scrolling tab list at the top; a native select is the most robust on phones.
- Rows: label and a one-line description on the left, the control on the right at ≥ 768px; stacked below.
- Choose one save model per section and say which it is:

| Model | Use when | Behaviour |
|---|---|---|
| Autosave | independent toggles and selects that take effect at once | save on change, disable only that control while saving, inline "Saved" text for 2 s next to it (not a popup per toggle), error popup on failure and revert the control |
| Save bar | text fields, related fields that must be valid together, anything costly | sticky bar appears when dirty: "Unsaved changes · [Discard] [Save]"; guard navigation (forms.md §10) |

- Danger zone last: its own section with a danger-line border, each action a row with an explanation and an outlined danger button that goes through a confirmation (feedback.md §2). Typing the object's name to confirm is reserved for irreversible, large-blast-radius actions (deleting a workspace).

## 7. Create / edit wizard

Only when the task is long (≥ 8 fields), has dependent steps, or needs review before commit. Otherwise use a form dialog.

```
┌─────────────────────────────────────────────┐   ┌──────────────────────┐
│ New pipeline                            ✕   │   │ ✕  New pipeline      │
│ ① Source ── ② Steps ── ③ Schedule ── ④ Review│   │ Step 2 of 4 · Steps  │
│                                             │   │ ▬▬▬▬▬▬▬▬▬░░░░░░░░░   │
│ step fields (max-width 40rem)               │   │ fields               │
│                                             │   │                      │
│ [Back]                  [Save draft] [Next] │   │ [Back]        [Next] │
└─────────────────────────────────────────────┘   └──────────────────────┘
```

- 3–5 steps. Stepper with numbers and names on desktop; on phones "Step 2 of 4 · Steps" plus a thin progress bar.
- Completed steps are clickable to go back; future steps are not until reached.
- Validate per step on Next; keep entered data when going Back.
- Last step is a read-only review with "Edit" links per section, then the commit button labelled with the outcome ("Create pipeline").
- Step in the URL (`?step=2`) or in history state, so browser Back goes to the previous step rather than leaving the wizard. Details: forms.md §9.

## 8. Profile / account

- Single column, 40rem max: avatar and name header, then sections: Personal info, Sign-in and security (password, 2FA, sessions), Preferences (theme, language, time zone, density), Notifications.
- Sessions list: device, approximate location, last active (relative), "This device" marker, "Sign out" per row and "Sign out other sessions" with confirmation.
- Avatar: initials fallback on a hue derived from the name; upload with crop preview; the file input has a visible label.
- Theme preference here mirrors the floating theme control; both write the same stored value.

## 9. Search results

```
┌─────────────────────────────────────────────┐   ┌──────────────────────┐
│ [⌕  "edge"                         ✕]       │   │ [⌕  "edge"        ✕] │
│ 23 results                                  │   │ 23 results [Filter ²]│
│ All 23 · Services 12 · Rules 8 · Users 3    │   │ All Services Rules → │
├──────────────┬──────────────────────────────┤   ├──────────────────────┤
│ Filters      │ ▣ core-**edge**  Service     │   │ ▣ core-edge  Service │
│ ☐ Active     │   path · updated 2 d ago     │   │   path · 2 d ago     │
│ ☐ Mine       │ ▣ **edge**-sync  Rule        │   │ …                    │
└──────────────┴──────────────────────────────┘   └──────────────────────┘
```

- Query, total, and type tabs with counts; filters in a left column at ≥ 1024px, in a sheet behind a "Filter" button below.
- Each result: type icon (same as its nav icon), title with the match highlighted (`<mark>`), one line of context, type label.
- No results: say what was searched, suggest removing filters or checking spelling, offer the closest type with hits. Different message for "no results" vs "filters hide results".
- Query and filters in the URL (`/search?q=edge&type=rule`).

## 10. Onboarding / first run

- Replace empty dashboards with a checklist card: 3–5 steps, each with a verb title ("Connect a data source"), one line of why, a button, and a check when done. Progress "2 of 4 done".
- Let people dismiss it; keep a way back ("Setup guide" in the help menu).
- No forced product tours of 8 tooltips. If you highlight something, one spotlight with "Got it", once, remembered.
- Per-page first use is the empty state (data.md §9): explain in one line and offer the add button.
- Sample data, if offered, is labelled "Sample" everywhere it appears and removable in one action.

## 11. Error, 404, maintenance, permission denied

All share one layout: the brand mark (or the page icon) faint, a title, one sentence, and one or two actions. Keep the app shell around them when the user is signed in, so navigation still works.

| Page | Title | Body | Actions |
|---|---|---|---|
| 404 | "Page not found" | "The link may be old, or the item was moved or deleted." | Go to [section], Search |
| Record not found | "Rule not found" | "It may have been deleted. Check the rules list." | Back to rules |
| 403 | "You don't have access to this page" | "Ask an admin for the *Rules: edit* permission." name the permission when known | Request access (if supported), Go home |
| 500 / crash | "Something went wrong" | "We couldn't load this page. Try again in a moment." plus a short error ID in mono, copyable | Retry, Go home |
| Offline | "You're offline" | "Changes will be saved when you reconnect." only if true | Retry |
| Maintenance | "Back soon" | expected end time in the user's time zone | Status page link |

- Never show stack traces; show an error ID that support can look up.
- Use a route-level error boundary so one broken widget doesn't blank the shell.
- Permission-denied *inside* a page (a button the user can't use): hide actions the user can never use; disable with an info tip explaining why when the user might reasonably expect them.

## 12. Sign in, sign up, forgot password

Layout is identity.md §6 (brand half + card; card only on phones). Form rules:

- Sign in: email or username, password with reveal toggle, "Forgot password?" link next to the password label, primary "Sign in". SSO buttons above the form with a divider "or".
- Autofill: `autocomplete="username"` and `current-password`; sign-up uses `new-password` (forms.md §7). Never block paste.
- Error after a failed sign-in: one message above the button ("Email or password is incorrect") without saying which, focus moved to it, fields kept.
- Sign up: as few fields as possible; password rules shown as a live checklist under the field (the one place where per-keystroke feedback helps), passing rules turn success-ink.
- Forgot password: one field; afterwards always the same confirmation ("If an account exists for a@b.com, we sent a link. It expires in 30 min.") whether or not the account exists.
- Session expired: keep the user's place; after re-auth return to the same URL, ideally in a dialog over the page so unsaved form state survives.

## 13. Common mistakes

| Mistake | Fix |
|---|---|
| Dashboard of a dozen charts with no "what needs me" | Lead with attention items and linked tiles; 2–4 charts |
| Master/detail selection not in the URL | `/items/:id`; reload and back keep the selection; phones show the same URL full-screen |
| Detail page as a giant form of read-only inputs | Key facts as a `<dl>`, tabs for the rest, edit in a dialog |
| Settings that autosave some fields and need Save for others with no signal | One model per section; "Saved" inline for autosave, sticky save bar for the other |
| Side section nav squeezed into a 360px screen | Native select or scrolling tabs at the top below `md` |
| Wizard for a 4-field form | Form dialog |
| 404 page without the shell or any way out | Keep the shell; offer section link and search |
| "Access denied" with no reason | Name the missing permission and who can grant it |
| Sign-in error says "user not found" | Generic "email or password is incorrect" |
| Empty dashboard full of zeros for new users | Onboarding checklist |
