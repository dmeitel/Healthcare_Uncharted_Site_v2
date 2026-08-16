---
name: project-run-ledger
description: Mobile-test run ledger, breakpoint failure map, and per-component pass streaks (updated every run)
metadata:
  type: project
---

# Run ledger

## Run 1 · 2026-08-16 · first real-browser pass after career-tree overhaul + mobile/a11y optimization arc (uncommitted)

Viewports: 360x800, 390x844, 430x932 portrait; 670x800 (sql gap probe); 800x360 atlas landscape.

**Why:** first honest viewport evidence for two large uncommitted change arcs.
**How to apply:** re-test every FAIL below next run; components at streak 3 get a quick smoke only.

## Breakpoint failure map (site-specific numbers, verified in browser)

- `.hu-bbar` bottom bar: broken at ALL widths <=699 (bare `nav` selector collision, hu-global.css ~line 924 nav rule vs 1027 bbar rule). Renders top:0 behind z-200 nav; hamburger+search also hidden by `body:has(#huBottomBar)`. NO nav on phone for pages carrying the bar (home, career-tree).
- vendor-directory `.vd-tools`: fixed ~396px flex nowrap -> overflows below ~412px (58px @360, 28px @390, 0 @430).
- sql-mystery: breakpoint is 640 not 699; 641-699 gap engages desktop 3-col that does not fit (Run button clipped, title wraps 1 word/line). Verified at 670.
- atlas `#atlas-controls`: static x=334..477 regardless of portrait width -> zoom-out/reset/help offscreen at 360/390/430; fine at 800 landscape.
- career-tree Views tablist: overflow-x hidden, clips Skills tab at 360 only (fits at 390+).

## Component track record (pass streak; 3 = skim next time)

| Component | Streak | Notes |
|---|---|---|
| home catalog cards + cluster tabs | 1 | clamp works; mid-word ellipsis on hc-desc |
| home overflow (all 3 widths) | 1 | clean |
| iceberg sheet close 44px | 1 | #rpMobClose 44x44 exactly |
| iceberg overflow | 1 | clean |
| vendor URL state ?q ?vendor + back-to-close | 1 | works incl. panel motion + vh/dvh pair |
| atlas prefetch gate (search-graph.json) | 1 | NOT fetched at phone width, 4s idle |
| atlas hash history / back stays on-site | 1 | #provider/cdss -> back -> clean /atlas/ |
| career-tree deck->role->sheet->back walk | 1 | works; sheet close 44x44 |
| sql quick-query buttons 44px | 1 | 44px tall |
| about page (all 3 widths) | 1 | clean, no em dashes, 18px body |
| hospital-map em-dash scrub | 1 | clean |

## FAILED components (recheck first next run)

- hu-bbar (unusable, sitewide)
- atlas #atlas-controls portrait (unusable-tier for reset/help)
- hospital-map #detailPanel opens below fold, no auto-scroll (looks like a dead tap)
- hospital-map .hm-dp-chip 24px tall (the "44px dep chips" fix did NOT land)
- iceberg popstate desync: back drops ?n= but sheet stays open showing default node
- vendor .vd-tools overflow, career-tree tablist clip, sql 641-699 gap
- career-tree g.hct-cact deck +/x buttons 24x24; board framing drifts off-center after fold
- em dashes still live in vendor intro + sql case copy
