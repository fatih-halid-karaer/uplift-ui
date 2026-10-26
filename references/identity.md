# Giving an app its own identity

A restyle that only swaps colours produces "another admin template". An identity comes from a small set of choices applied everywhere. Decide them once, write them in the project's README or DESIGN.md, and apply them consistently.

## Contents
1. Pick a motif
2. Palette
3. Type pair
4. Where the motif appears
5. Staying distinct from sibling apps
6. Login screen

## 1. Pick a motif

Derive one visual motif from the product's name or domain: a compass for a navigation/orchestration tool, a lens or beam for an observability tool, a grid or blueprint for a planning tool, a pulse for monitoring. Keep it geometric and simple enough to draw as a single-colour SVG at 16px and at 400px.

Ask the user (or read the README) for the product name and what it does before choosing. Offer two or three motif ideas with a one-line rationale each, recommend one.

## 2. Palette

- One brand hue, built as an eleven-step ramp (see tokens.md), with a neutral ramp tinted toward it.
- Status colours stay conventional (green success, amber warning, red danger, sky info) regardless of brand; changing their meaning confuses people.
- If the brand hue is close to a status hue (a green brand vs success green), shift one of them: make success more teal or the brand more emerald, and lean on text labels.
- Login or marketing surfaces may use a lighter, airier variant of the brand (a sky blue next to a navy primary); the app UI uses the working primary.

## 3. Type pair

Offer the user three pairings rendered as a short sample (heading, body sentence, a table row with numbers, a code line) and let them pick. Good open-licence starting points:

| Pair | Character |
|---|---|
| DM Sans + DM Mono | geometric, friendly, compact |
| IBM Plex Sans + IBM Plex Mono | technical, sturdy |
| Inter + JetBrains Mono | neutral, very legible at small sizes |
| Geist + Geist Mono | crisp, modern |
| Manrope + Fira Code | rounded, warm |

Vendor the chosen fonts with their OFL licence files.

## 4. Where the motif appears

- Logo mark in the sidebar header (simple, single colour, in a round frame).
- Loading spinner: the mark animated (a needle seeking, a beam scanning).
- Empty states: the mark large and faint (primary at 25%) inside a dashed ring, with the page's own icon in a small badge at the ring's lower right.
- Theme transition: a motion that echoes the motif (a compass sweep).
- Login: the mark large on one half of the screen, the sign-in card on the other.

Do not put it everywhere: headers, buttons and tables stay plain. The motif is the seasoning.

## 5. Staying distinct from sibling apps

Organisations often own several frontends. When restyling one, read the others first and list what they already use (palette, fonts, popup shape, empty-state art, theme transition). Then choose differently on purpose for each item, so the apps don't look like skins of each other. Share behaviour rules (confirm destructive actions, pagination size, info tips), not looks.

## 6. Login screen

Split layout on wide screens: the brand side (motif drawing, product name, a one-line tagline; background colour follows the theme) and a centred card with the form. On phones, the brand side collapses to a small header above the card. Keep the card text minimal: the heading "Sign in", fields, the button. Remove filler sentences ("Welcome back", "Sign in with your directory account") unless they carry real information.
