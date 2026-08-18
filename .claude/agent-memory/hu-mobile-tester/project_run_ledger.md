---
name: project-run-ledger
description: QA run ledger, breakpoint failure map, and per-component pass streaks (updated every run)
metadata:
  type: project
---

# Run ledger

## Run 4 · 2026-08-18 · pre-production QA of the HUKit.pop / HUKit.urlState extraction (desktop 1280 + 1024/900/768/700, phone 390/360)

**Why:** seven tools swapped hand-rolled popover + URL code for two shared kit implementations; atlas, iceberg-map and vendor-directory loaded `/assets/js/hu-kit.js` for the first time. Never run in a browser before this pass. David ships to prod right after.
**How to apply:** the refactor is CLEAN. Next run, skim the popover contract (open/toggle/switch/keyboard/Esc/outside-click/aria) rather than re-deriving all seven checks per tool, and spend the time on the two open defects below plus whatever is new.

**Verdict: zero console errors and zero page errors on all 14 pages; popover contract 7/7 on all four popover tools; URL/history 4/4 on all seven tools. Two cosmetic defects found, both pre-existing, neither from the refactor.**

- Popover contract verified per tool: opens under trigger and on-screen, same-trigger toggles closed with focus return, a second trigger closes the first (never two open), ArrowDown/Up/Home/End walk options with NO page scroll (checked on vendor-directory where the doc is 17,595px tall), Esc peels exactly one rung (popover, then help/HUD or sheet or detail panel), outside click closes, aria-expanded flips.
- URL/history verified per tool: scope pushes (atlas `#zone/node`, career `?view=`, iceberg `?n=`, vendor `?vendor=`, hospital `?unit=`, both maps `?state=`/`?county=`), tweaks replace (career `metric=`, iceberg `focus=`, vendor 11 keystrokes + sort = zero entries, multi-lens `year=`, operators `types=`), Back walks one step at a time and restores the view, Forward restores, and every deep link leaves cleanly on ONE Back (the `seeded` flag works).
- Career-tree deliberately does NOT serialize a selected role (`?role=` is a one-shot deep link, scrubbed after use). Not a bug — see the comment at src/tools/career-tree/index.njk ~7079.
- Phone (390) popovers still convert to bottom sheets on all four tools: `position:fixed`, left 0, full width, bottom = viewport bottom. The kit's inline `left/top` is correctly overridden by the `!important` phone rules in hu-global.css.
- Career phone flow re-smoked at 390: grid 27 decks → ladder 19 roles → sheet → Back closes sheet only → Back returns to grid. Still good.
- Zero horizontal overflow on all 14 pages at 390 AND 360.
- Homepage h1 ("Healthcare doesn't come with a map. So we made one.") = 2 lines at 1280, 3 lines at 430/390/360 (38/35.1/32.4px). Not cramped. `.hv-chips` is a deliberate `overflow-x:auto` rail; the third chip clipping at the edge is the scroll affordance, not a defect.

## Open defects (recheck first next run)

- **atlas light theme, frontier terrain is painted with hardcoded dark-theme hex.** src/atlas/index.njk:2134 `.attr('fill','#060e07').attr('fill-opacity',0.30)` and :2141 `'#08130a'` @0.50 on the `#frontier-g` ring hexes. In light mode those become dark gray "wings" flanking the whole board and read as a rendering bug. Fix = theme-aware token instead of the literal. Ranked UGLY. Survives a reload, so it is not a repaint problem.
- **atlas light theme, canvas-drawn zone labels** (PAYER, PROVIDER, PATIENT, PUBLIC HEALTH, HEALTH TECH) are low-contrast pale-on-pale. Same screenshot.
- **iceberg light theme, legend swatches** (Current Selection / Available Path / Not in Current Path) render as three near-identical empty pale boxes — the state key stops keying.
- **career-tree, Help and Search popovers touch the exact right edge at 1280** (right = 1280, gutter 0; Views gets its 8px). Cause is in the kit: `HUKit.pop` clamps with `popEl.offsetWidth` measured before the content settles (220 min-width instead of the final 228), so `left` lands 8px too far right. Ranked IMPERFECT.
- carried from run 3, NOT retested: career-tree `#hct-class` Roles/Populations toggle unreachable (inline `display:none`) — still David's call whether that is intentional; `g.hct-cact` deck +/x at 25.8px; em dashes in vendor intro + sql case copy.

## Notes that are NOT defects (do not re-report)

- vendor-directory `#selSector` is `display:none` at ≥1100px by design (the sidebar carries sector there) — test that popover at ≤1099.
- vendor-directory's detail panel overlays the toolbar at 1280 and 1024, so `#selViews` is not mouse-reachable while a vendor is open. It is `role="dialog"`; keyboard still reaches the trigger.
- hospital-map `?unit=icu` is an invalid id (the real one is `nicu`); it falls back to the welcome panel and keeps the stale param. Graceful.
- `.pop-opt` 30px / sheet close 24px measured without touch emulation is a HARNESS artifact — see [[test-harness-quirks]]. Real touch = 44px.

## Component track record (pass streak; 3 = skim next time)

| Component | Streak | Notes |
|---|---|---|
| HUKit.pop contract on atlas / career-tree / iceberg / vendor (7 checks each) | 1 | new this run, 28/28 |
| HUKit.urlState scope-push / tweak-replace / back / forward / deep link, all 7 tools | 1 | new this run |
| phone popover → bottom sheet conversion (4 tools) | 1 | |
| career phone flow: deck grid → ladder → sheet, one level per Back | 2 | |
| career-tree tablist: 4 tabs, URL per tab, back walks tabs | 3 | **skim next run** |
| no horizontal overflow at 390/360, all 14 pages | 2 | |
| zero console errors on all 14 pages | 2 | only noise: goatcounter localhost, MapLibre circle-11, compass perdiem 404 |
| operators-map phone pan + pinch, page does not scroll | 2 | |
| hospital-map sheet open/close/reopen | 2 | via ?unit= + unit clicks |
| iceberg-map hardware back / popstate | 2 | |
| atlas controls 44x44 and on-screen portrait | 2 | find-bar fix from run 3b still holding |
| hospital-map + career-tree light theme | 1 | readable; a few pale hex labels on career |
