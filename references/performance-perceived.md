# Perceived performance

Users judge speed by what they see, not by what the network panel says. A 600 ms request that keeps the old table in place and dims it feels faster than a 300 ms one that blanks the page and spins. Most of the techniques here are presentation choices, which is why they belong in a restyle; a few (prefetching, virtualisation) touch data flow, so agree them with the user (behaviour is sacred, SKILL.md).

The waiting animations themselves (`m-skeleton`, `m-indeterminate`, `m-seek`) are in motion.md §2; busy panels in variants.md "Busy panels".

## Contents
1. Budgets
2. Loading thresholds
3. Skeletons vs spinners vs progress
4. Keep content during refetch
5. Optimistic UI with rollback
6. Prefetch
7. Debounce, throttle, cancel
8. Code splitting and lazy loading
9. Long lists: paginate, virtualise
10. Images
11. Fonts
12. Layout shift
13. Measuring
14. Common mistakes

## 1. Budgets

| Interaction | Feels instant | Acceptable | Needs feedback |
|---|---|---|---|
| Press, hover, toggle visual response | ≤ 100 ms | | always immediate |
| Opening a menu, dialog, tab (local) | ≤ 100 ms | 200 ms | |
| Navigation to a cached page | ≤ 300 ms | | |
| Data fetch | ≤ 300 ms | 1 s | > 1 s: skeleton or progress |
| Long operation (export, deploy) | | | > 10 s: progress + "continue in background" |

Targets on a mid-range phone (mobile.md §12): LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 (Core Web Vitals "good" thresholds).

## 2. Loading thresholds

Showing a loader for a fast response creates a flash that makes the app feel slower. Delay it.

| Elapsed | Show |
|---|---|
| 0–300 ms | nothing new; keep the current view (pressed state on the button is enough) |
| 300 ms–1 s | subtle: button label "Saving…", 2px indeterminate bar on the panel, dimmed old content |
| > 1 s | skeleton for first loads, or progress for operations |
| > 4 s | add text: "Still working…"; for known steps, step text ("Building image 2/4") |
| > 10 s | determinate progress if possible, offer to continue in the background and notify when done (navigation.md §10) |

Once a loader is shown, keep it at least ~400 ms so it doesn't flicker on and off.

```js
function useDelayedFlag(active, delay = 300, minShow = 400) {
  const [shown, setShown] = useState(false);
  const since = useRef(0);
  useEffect(() => {
    if (active) {
      const t = setTimeout(() => { since.current = Date.now(); setShown(true); }, delay);
      return () => clearTimeout(t);
    }
    if (!shown) return;
    const t = setTimeout(() => setShown(false), Math.max(0, minShow - (Date.now() - since.current)));
    return () => clearTimeout(t);
  }, [active]);
  return shown;
}
```

- Buttons: the label switches to the progress verb immediately (it's informative, not a flash), and the button is disabled to prevent double submits.
- Page navigations in SPAs: a 2px top progress bar after 300 ms, not a full-screen spinner.

## 3. Skeletons vs spinners vs progress

| Situation | Use |
|---|---|
| First load, layout known (table, cards, detail facts) | skeleton matching the final layout |
| First load, layout unknown or tiny area | brand loader (`m-seek`) centred, or a small spinner |
| Refresh of visible content | keep content, indeterminate bar (§4) |
| Operation with measurable steps (upload, import) | determinate progress bar with percentage and "x of y" |
| Button-triggered action | progress verb on the button |
| Whole app boot | brand mark on the canvas, then the shell, then content |

Skeleton rules:
- Same geometry as the real content: table skeletons have the real header row (real column names) and 10 body rows of grey bars with varied widths (60–90%); detail pages show the title bar, key-fact blocks and tabs.
- Bars in `sunken`, 8–12px tall, radius 4px; shimmer with `m-skeleton` (a 1.6 s sweep of a lighter band), static under reduced motion.
- Don't skeleton things that don't depend on data: page title, toolbar, tabs and actions render immediately.
- `aria-busy="true"` on the container and an sr-only "Loading rules" text; skeleton bars `aria-hidden`.
- Never more than ~2 s of skeleton without a timeout plan: after 10 s show the error state with Retry.

## 4. Keep content during refetch

Unmounting content to show a spinner on every refetch (filter change, page change, polling) is the most common cause of a "jumpy" admin app.

- Keep the previous data visible while new data loads (TanStack Query `placeholderData: keepPreviousData`, SWR `keepPreviousData`, Apollo `previousData`, or local state that holds the last result).
- Show the refresh as: content at 60% opacity (`transition: opacity 150ms` after the 300 ms threshold), `pointer-events` kept so users can keep reading, 2px indeterminate bar along the panel's top edge (`m-indeterminate`), `aria-busy`.
- Pagination: keep the pager and table height stable; the row stagger runs when the new rows arrive (data.md §4).
- Cache by key (query + filters + page) so Back and revisiting a tab are instant (stale-while-revalidate), then refresh quietly.
- Polling/live data: update in place without dimming; highlight changed cells briefly (a 600 ms highlight fade) if it matters; pause polling when the tab is hidden.
- Don't reset scroll position or close expanded rows on refetch.

## 5. Optimistic UI with rollback

Show the result of an action before the server confirms it, when success is very likely and the action is easy to reverse.

| Good candidates | Not optimistic |
|---|---|
| toggle a switch, star, mark as read | delete (confirm first; then optimistic removal is fine) |
| rename inline | payments, deploys, anything with side effects outside the app |
| reorder a list | creating records whose ID/derived fields come from the server (show them after) |
| add a comment | actions that often fail validation on the server |

Recipe:
1. Snapshot the current state.
2. Apply the change locally; mark the item as pending (subtle: 70% opacity or a small spinner in place of its icon; the switch itself shows its new position, only that switch disabled, controls-motion.md §3).
3. Send the request.
4. Success: replace local state with the server's response (it may differ: normalised name, timestamps).
5. Failure: restore the snapshot, then show an error popup naming what was undone ("Couldn't rename *core-edge*. The name was changed back.") (feedback.md §1). Restore focus to the control.
6. Concurrency: if several mutations target the same item, cancel outgoing refetches and apply them in order; ignore stale responses.

Undo instead of confirm: for reversible bulk-ish actions (archive, mark all read) acting immediately with an inline "Archived · Undo" in the list, visible for 6 s, can be friendlier than a confirmation. Deletes that can't be undone always confirm.

## 6. Prefetch

Start loading before the click when intent is clear.

| Signal | Prefetch |
|---|---|
| Hover over a link or row for ≥ 100 ms (desktop) | the destination route's code and its primary query |
| `pointerdown` / `touchstart` (gains ~100 ms on mobile) | same |
| Link enters the viewport, on idle | route code only (not data) for likely next pages |
| Idle after first load (`requestIdleCallback`) | lazy chunks of the main nav routes (variants.md "Route transitions") |
| Pager visible on page n | page n+1 data |
| Wizard step n | step n+1 options |

- Respect `navigator.connection?.saveData` and slow connections: skip data prefetch.
- Prefetch with the same cache key the page will use, so it's actually reused.
- Don't prefetch mutations or anything with side effects; only GETs.
- Don't prefetch on hover for 50 rows at once while the mouse sweeps a table; require the 100 ms dwell.

## 7. Debounce, throttle, cancel

| Input | Technique |
|---|---|
| Server search as-you-type | debounce 250–300 ms, min 2 chars, abort the previous request |
| Client-side table filter (≤ a few thousand rows) | no debounce needed; filter in a `useDeferredValue` / transition so typing stays smooth |
| Async field validation | on blur or 400 ms after typing stops (forms.md §6) |
| Window resize, chart re-layout | throttle to one per animation frame (`ResizeObserver` + rAF) |
| Scroll handlers | passive listeners, rAF-throttled; prefer `IntersectionObserver` |
| Autosave of text | debounce 800–1000 ms plus save on blur |

- Always cancel or ignore stale responses (`AbortController`, or compare a request counter). Out-of-order results are a real bug: results for "ed" arriving after "edge".
- Show "Searching…" only after the 300 ms threshold (§2).
- Keep the input responsive: never run heavy filtering synchronously in the keystroke handler.

## 8. Code splitting and lazy loading

- Split by route; the shell (sidebar, top bar, tokens, fonts) loads first, the page's chunk next. Show the shell immediately with a skeleton in `<main>`.
- Lazy-load heavy, rarely used pieces: chart libraries (charts.md §11), code editors, map SDKs, rich-text editors, date-picker locales, PDF/CSV exporters. Load them when their container is about to be visible.
- Preload lazy routes on idle (§6) so later navigation is instant.
- Each lazy boundary has a suspense fallback sized like the content (no layout jump) and an error boundary with Retry (chunk loading fails after deploys; reload the page once on a chunk 404).
- Watch the bundle: a single icon import of a whole icon library, moment-style date libraries with all locales, and duplicate component libraries are common bloat. Mask-based icon CSS (controls-motion.md §6) avoids shipping icon JS at all.

## 9. Long lists: paginate, virtualise

- Admin lists paginate at 10 rows (data.md §3); that alone removes most rendering problems and is better for scanning.
- Virtualise when a view genuinely needs hundreds of rows on screen at once (log viewers, large trees, a "select from 5,000 items" list, infinite activity feeds): render only visible rows plus an overscan of ~5–10.
  - Fixed row heights are simplest; for variable heights measure rows (TanStack Virtual, react-window's variable lists).
  - Keep keyboard navigation and `aria-rowcount` / `aria-rowindex` (or `aria-setsize` / `aria-posinset`) so screen readers know the true size.
  - Browser find (Ctrl+F) won't see unrendered rows; provide the list's own search.
- Alternatives before virtualising: `content-visibility: auto` with `contain-intrinsic-size` on long sections (cheap, keeps everything in the DOM), or "Show 50 more" batches.
- Expensive cells (sparklines, avatars, relative times): memoise rows; update relative times with one shared timer.

## 10. Images

- Always set `width` and `height` attributes (or `aspect-ratio`) so space is reserved (§12).
- `loading="lazy"` and `decoding="async"` for images below the fold; `fetchpriority="high"` on the one LCP image (login illustration, hero).
- Responsive sources: `srcset` with 1×/2× for fixed-size images (avatars, logos), width descriptors + `sizes` for fluid ones.
- Modern formats (AVIF/WebP) with a fallback; SVG for logos, marks and illustrations (and they theme, dark-mode.md §8).
- Avatars: request the size you display (32–40px → 80px source), initials fallback while loading or on error, so the row doesn't jump.
- Blur-up or dominant-colour placeholders for large photos; plain `sunken` for small ones.

## 11. Fonts

- Self-host woff2 (tokens.md §7), subset to the scripts you need, `font-display: swap`.
- Preload only the one or two weights used above the fold (`<link rel="preload" as="font" type="font/woff2" crossorigin>`), typically 400 and 600 of the UI sans.
- Reduce the swap jump with a metric-adjusted fallback:

  ```css
  @font-face { font-family: 'UI Fallback'; src: local('Arial');
               size-adjust: 104%; ascent-override: 92%; descent-override: 24%; line-gap-override: 0%; }
  body { font-family: 'DM Sans', 'UI Fallback', system-ui, sans-serif; }
  ```
  (Compute the overrides for your font with a fallback-metrics tool.)
- Variable fonts: one file for all weights is often smaller than three static files.
- Mono font can load lazily (`font-display: optional`) if it only appears deeper in the app.

## 12. Layout shift

Content jumping as things load makes people misclick and makes the app feel unstable.

- Reserve space for everything async: images (§10), charts (fixed aspect ratio, charts.md §9), ads-like banners (don't add them), table bodies (skeleton with 10 rows), counts in headings (fixed min-width with tabular numbers).
- Insert new content below the viewport or in reserved slots, never above what the user is reading. New items in a live list at the top: show "3 new items · Show" instead of pushing rows down.
- Loading → loaded must keep the same box: skeleton height = content height; error and empty states sized similarly.
- Fonts: §11. Icons: CSS mask icons have intrinsic 1em size, no pop-in.
- Scrollbar appearance shifts centred layouts: `scrollbar-gutter: stable` on the scrolling container.
- Animate with `transform`, not by changing layout properties (motion.md §5).
- Collapsing/expanding content is user-initiated, which CLS excludes for 500 ms; keep such animations under that.

## 13. Measuring

- Lighthouse / PageSpeed for lab numbers, with mobile emulation and 4× CPU throttling.
- Real-user metrics with the `web-vitals` library (LCP, INP, CLS) reported per route; INP is the one admin apps usually fail (heavy table renders on filter input).
- DevTools Performance panel: record a filter change or tab switch, look for long tasks > 50 ms.
- React Profiler / why-did-you-render for wasted re-renders of whole tables on each keystroke.
- Measure before and after the restyle; a restyle that adds blur, shadows and animation should not make INP worse. Report it in the hand-over.

## 14. Common mistakes

| Mistake | Fix |
|---|---|
| Spinner flashes for 80 ms on every request | Show loaders only after 300 ms, keep them ≥ 400 ms |
| Table unmounts to a spinner on every filter change | Keep previous data, dim, indeterminate bar |
| Full-page spinner on navigation | Shell renders at once, skeleton in `<main>`, top progress bar |
| Skeleton that doesn't match the final layout | Same geometry; real headers and actions render immediately |
| Optimistic toggle with no rollback | Snapshot, restore on failure, error popup naming the undo |
| Search requests race and show stale results | Debounce + AbortController / ignore stale responses |
| Rendering 2,000 rows | Paginate at 10; virtualise only true bulk views |
| Images without dimensions push content down | `width`/`height` or `aspect-ratio` |
| Font swap reflows every page | Preload 1–2 weights, metric-adjusted fallback |
| New items inserted above the reading position | "N new items · Show" bar |
| Chart library in the main bundle | Lazy-load on visibility |
| Heavy blur and shadows on every row | Effects on hover or small floating elements only |
