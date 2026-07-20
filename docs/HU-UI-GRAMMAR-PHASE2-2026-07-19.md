# UI GRAMMAR · PHASE 2 — The Shared Kit
### Build notes, 2026-07-19. One sheet, one chip rail, one locate FAB, one stat tile. Plus the first two retrofits.

## The kit

**CSS: appended to src/assets/css/hu-global.css** (the primitives already lived there). New pieces:
- Detent grammar on the shared sheets: `.shell-sheet` / `.shell-dock--sheet` now speak `dt-peek / dt-half / dt-full / .dragging`, same classes the career tree shipped in Phase 1. Peek 120px, half 52dvh, full 92dvh.
- `.hu-chiprail` + `.hu-chip`: ONE horizontal filter rail. Chips apply state, never navigate. 44px floor on touch.
- `.hu-fab`: the locate-me crosshair button with `is-locating / is-on / is-denied` states.
- `.hu-stats` + `.hu-stat`: the glanceable stat tile (one value, one label; hi/lo accent variants).

**JS: new file src/assets/js/hu-kit.js**, loaded per-tool, no dependencies. `window.HUKit`:
- `HUKit.sheet(el, opts)` — the detent controller. Injects a grabber if the sheet lacks one, drag snaps between detents, tap toggles half/full, drag below the peek line dismisses. Same mechanics as the career tree's Phase 1 sheet, now shared.
- `HUKit.locate(btn, opts)` — budget rule 8 in code: permission requested ON TAP only, high accuracy off, 10s timeout, permissions.query used only to style the button, nothing leaves the browser. BUILT, NOT YET WIRED to any map. Phases 3 and 4 consume it.
- `HUKit.phone()` / `HUKit.dcap(ms)` — the shared phone flag (699px, the sheet breakpoint) and the 250ms motion cap.

## Retrofit 1: operators map (the worst phone offender)

- Motion: its `dur()` now rides `HUKit.dcap`, so the 650ms camera glide caps at 250ms on phones. Reduced-motion still zeroes it.
- Gesture declutter (rule 2): while a finger owns the camera, the identity HUD and the legend fade out, then return.
- Sheets displace HUDs (rule 1): when a selector opens as a bottom sheet on phone, the HUD, legend, and tap card yield to it.
- The 123 state-number toggle leaves phones entirely. It was already defaulted off there; the numbers are illegible at that size.
- The 6.2MB pharmacy switch finally has a loading signal (rule 7): the status banner wakes up with "Loading pharmacies…" and reports failure if the fetch dies. Before this, a slow connection got zero feedback.

Not touched: the search pill (correct map grammar already), the fixed bottom deck (that IS the phone toolbar), the tap card (already the pin-to-card pattern at the canvas bottom). Full MapLibre conversion is Phase 3, not this.

## Retrofit 2: Pop Health Multi-Lens Map (the best phone citizen, two real fixes)

- The JS phone gate said 680px while the CSS said 699px. Nineteen pixels of "CSS says phone, JS says desktop": the layout went sheet-mode but state taps did not auto-open the sheet and the metric explainer anchored wrong. MQ_PHONE is now 699, same as everything else.
- One transient rule: a state tap used to open the floating stat card AND auto-raise the data sheet, two surfaces with the same headline number. On phone the float card now stays down; the sheet is the answer.

Deliberately NOT done: converting its in-flow data sheet to the fixed detent sheet (it is an accordion in a scrolling page, not an overlay — forcing detents would change behavior, and this phase is pure consolidation), and re-skinning the Mode/Trend/Year controls as kit chips (working controls, correct sizes, zero user gain). The phone bottom bar already sheds legend and sources; it is within budget as-is.

## Verification record

- Eleventy build clean. hu-kit.js parses and its API answers correctly under a phone-width matchMedia stub (dcap(650)→250, dcap(180)→180).
- All inline scripts parse on all three touched pages (operators 6/6, Pop Health Multi-Lens 6/6, career tree 6/6).
- 15/15 static wiring checks across kit CSS, operators retrofit, and Pop Health Multi-Lens retrofit.
- Not headless-verifiable: gesture fade feel, sheet-yield timing, the pharmacy banner on a genuinely slow connection.

## Phone test additions (on top of the Phase 1 plan)

1. Operators map: pinch/drag the map — title block and legend fade while moving, return when you stop.
2. Operators map: open the Dataset selector (bottom deck) — the title block, legend, and any tap card fade under the sheet.
3. Operators map: switch to Pharmacies on cell data — the top banner should say "Loading pharmacies…" until the map repaints.
4. Operators map: no 123 button anywhere on phone; still there on desktop US view.
5. Pop Health Multi-Lens: tap a state — the data sheet rises, and NO floating card appears over the map (desktop still gets the card).
6. Pop Health Multi-Lens at exactly ~690px wide (fold phones, split screen): state tap should auto-open the sheet now.

Rollback: three files (hu-global.css, hu-kit.js, the two tool pages). Each retrofit is independent of the others; the kit file is additive.
