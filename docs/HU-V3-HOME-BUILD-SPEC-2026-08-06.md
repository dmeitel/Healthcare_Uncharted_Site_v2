# HU V3 · HOME BUILD SPEC (LOCKED 2026-08-06)
### Source of truth: the round-3 comp at /secret-menu/design-v3-home/ (R1 T2 M2 + David's swaps)
### Review basis: docs/HU-V3-HOME-REVIEW-2026-08-06.md

## The locked page, top to bottom (desktop)
1. **Nav**: current top nav grammar; wordmark carries the EXISTING brand hex logo SVGs (hu-logo-inline). Search entry added to nav.
2. **Hero, at rest**: CLEAN ground. The CURRENT canvas compass rose (today's main-page rose, same art), centered above the headline. NO hint text (David's call). H1 "Map the system. Understand the why." + one-line mission subline + floating search box with example queries + three cluster quick-chips. No canvas work on load.
3. **The rose reveal**: first tap draws the EXISTING hex panel background + walking routes (the shipped canvas world, same art) into the hero zone. Further taps reroll routes as today. The 8-tap secret-menu function is UNTOUCHED. prefers-reduced-motion: reveal without animation.
4. **Catalog**: T2 tabs (Careers & Pay · Maps & Systems · Learn & Play) fed from a new cluster field in tools.js. Active tab shows full cards (thumbnail, title, desc, mono meta); other tabs one click. "All 8 tools →" to /tools/.
5. **New on the site**: three dated rows fed from real dates (featuredPages + tool ship dates), live counts (tools/modules/talks + updated stamp) right-aligned in the header. Replaces the carousel.
6. **Three ways in**: the role doors (clinician / analyst / leader) as one compact row, current copy and links.
7. **Mission block (M2)**: titled block, "Map the connections, not just the components," 3 to 4 sentences, link to /about/, credential line inside. The author appears exactly once on the page.
8. **Footer**: current.

## Phone (locked as approved)
- Screen 1: brand + rose (small, beside wordmark), H1, pinned search, cluster chip rail, first two cards of active cluster.
- Screen 2 (one swipe): dated list, three doors, compact mission block.
- Bottom bar persistent: Home · Tools · SEARCH (center, filled) · Learn · More. Replaces the hamburger on home first; extends site-wide if it QAs well.
- Hex texture on phone is CSS only; no canvas on phone first paint.

## Dies from the current page
88vh hero · one-card featured carousel · four-fact trivia stats bar · citations strip · duplicate about section + credentials strip (consolidated into the mission block). The dead SEARCH_DATA array dies when real search ships.

## Survives
Rose + full canvas world (earned by tap) · 8-tap secret · live counts · role doors · light theme by token · voice kernel everywhere.

## Build phases (each lands for David's QA before the next)
1. **Generated global search**: index built at build time from tools.js + learn/rounds/talk collections (+ atlas top entry; atlas node-level in a later pass); one component; nav entry + `/` shortcut; phone sheet presentation. Ships FIRST so the hero box is real on day one.
2. **The new home page** per this spec, including the tools.js `cluster` field (careers-pay / maps-systems / learn-play).
3. **Phone bottom bar** on home.
4. **Thumbnails**: authored screenshots per tool, same-filename overwrite pattern (like the OG cards).
5. **Measurement**: GoatCounter events, search use + tool entry from home, live BEFORE test users arrive.

## Doctrine
Before phase 2 code: DESIGN.md gains the Hub Surface addendum (The Hub Lift Rule: hub catalog cards and the search box carry resting elevation as product affordance; Border-First continues to govern reading surfaces; the rose reveal is the Earned Color Rule applied to scenery). Voice kernel: no em dashes anywhere, middots join, CAPS emphasize.
