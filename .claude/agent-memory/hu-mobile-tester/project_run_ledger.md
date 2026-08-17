---
name: project-run-ledger
description: Mobile-test run ledger, breakpoint failure map, and per-component pass streaks (updated every run)
metadata:
  type: project
---

# Run ledger

## Run 2 · 2026-08-16 · regression re-test of run 1 fixes (360 primary, atlas spot-checked 390/430, sql at 670)

**Why:** verify the post-run-1 fix batch actually landed.
**How to apply:** run 3 opens with the four FAILs below; streak-3 components get a one-line smoke.

Verdicts: bbar FIXED · hospital sheet FIXED but new close-recursion BLOCKER · atlas controls on-screen but BURIED under search bar · vendor FIXED · sql 670 FIXED, badge clip NOT fixed · iceberg back NOT fixed · career-tree tabs FIXED.

## Breakpoint failure map (verified in browser, run 2 state)

- atlas `#find-bar`: phone override `#atlas-find{top:110px}` (src/atlas/index.njk:289) clears nav+row1 only; wrapped controls row sits y120-164 at 360/390/430, find bar y128-166 covers it. All four `#atlas-controls` buttons fail elementFromPoint. Needs top ≈152px+ or in-flow placement.
- sql-mystery `.hdr-stat` badge: clipped at 360 (right 383 vs clientW 354) AND causes page h-scroll. Root: `.tool-bar-actions{min-width:auto}` blocks the ellipsis chain (badge itself has min-width:0/ellipsis). Fix: min-width:0 on .tool-bar-actions.
- hospital-map phone sheet CANNOT CLOSE (X, Escape, every path): infinite recursion closePanel→kitSheet.close→hu-kit dismiss→onDismiss→closePanel. hu-kit.js dismiss() only removes 'open' when NO onDismiss given; hospital-map onDismiss guard checks `classList.contains('open')` which never clears (index.html:2531/2540/2740, hu-kit.js:58). RangeError: Maximum call stack size exceeded. Desktop unaffected (mobileSheet early-returns).
- iceberg popstate desync STILL LIVE: the rp-open removal fix landed in the view-TABS handler (index.njk:1519) but NOT in the popstate handler (index.njk:1600-1607). Back clears ?n= then go() re-renders default node H with sheet still open.

## Component track record (pass streak; 3 = skim next time)

| Component | Streak | Notes |
|---|---|---|
| hu-bbar home: fixed bottom, 56px items, safe-area (css:1041/1058), nav brand + bbar replaces hamburger | 1 | fixed this run |
| hu-bbar absent on operators-map + career-tree (hub-pages-only) | 1 | |
| hospital-map sheet: position fixed bottom, z300, hu-sheet-grab | 1 | but see close blocker above |
| hospital-map interactive .hm-dp-chip buttons 44px min-height (info spans 28px are non-interactive) | 1 | ED chip width 43.8px, hair under square |
| hospital marquee/ground-zone/SYS as <button>: appearance none, site fonts, theme-correct both themes; ground-zone tap opens panel | 1 | |
| atlas controls 44x44 + fully on-screen portrait | 1 | but buried, see failure map |
| atlas desktop hint gone (only lives in a <style> string) | 1 | |
| atlas prefetch gate (no search-graph.json, 5s idle) | 2 | |
| vendor .vd-tools wraps, no page h-scroll 360 | 1 | |
| vendor URL state ?q ?vendor + back-to-close | 1 | not retested run 2 |
| sql 641-699 gap: stacked single-col layout at 670, no overflow | 1 | |
| sql quick-query buttons 44px | 1 | not retested run 2 |
| career-tree tablist: overflow-x auto, 4 tabs 44px, all reachable at 360 | 1 | |
| home catalog cards / iceberg overflow / about page / hm em-dash scrub | 1 | not retested run 2 |

## FAILED components (recheck first next run)

- hospital-map sheet close recursion (UNUSABLE, new this run, introduced by the sheet retrofit)
- atlas find-bar covers #atlas-controls at all phone widths (UNUSABLE for zoom/reset/help)
- sql .hdr-stat clip + page h-scroll at 360 (fix: .tool-bar-actions min-width:0)
- iceberg popstate: add the line from index.njk:1519 into the popstate handler at :1600
- carried from run 1, not retested run 2: career-tree g.hct-cact deck +/x 24x24; board framing drift; em dashes in vendor intro + sql case copy
