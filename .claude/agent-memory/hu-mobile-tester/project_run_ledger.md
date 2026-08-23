---
name: project-run-ledger
description: QA run ledger, breakpoint failure map, and per-component pass streaks (updated every run)
metadata:
  type: project
---

# Run ledger

## Run 12b · 2026-08-22 · RE-VERIFY of the three fixes the coordinator shipped after run 12 — 3 PASS

**1. multi-lens Population regression — PASS on all four paths.** The `.then` in `paintCounties()` now re-renders the open card. Proved with a MutationObserver on `#lvSheetBody` that logs every render's Population cells, so the intermediate state is visible rather than inferred: tap CO `——`@6545ms → `6.0M/340.1M`@6581ms · tap MT `——`@6177 → `1.1M/340.1M`@6208 · `?state=UT` `——`@351 → `3.5M/340.1M`@396 · `?state=CO` `——`@348 → `6.0M/340.1M`@383. Exactly two renders each, never more. County drill still real (Lincoln MT `22k/1.1M`, no NaN/undefined); second state `797k` at t=150ms with the county request log still at 2 entries (no refetch).
**Residual, throttled 1.6 Mbps/150 ms: the `—` is on screen for 6.9 s** (`——`@6691 → `1.1M`@13599). The fix converts "wrong forever" into "wrong for ~7 s", which is correct but is the same pop-in class operators chose to label. A `loading…` string in those two cells would match what operators and the atlas HUD now do.

**2. atlas HUD loading state — PASS.** Graph throttled to 2.5 MB/s so the ~4.6 s window is observable. Hex WITH data (`#payer/medicare`, 1280): `Live data / loading…` at t=14 ms, then `Medicare enrollment 19.9 % US avg` at t=4842 ms. Hexes with NO data end **hidden, not stuck**: `#payer/drg` (1280) loading@12ms → `display:none`, 0 rows, empty innerHTML @4850ms; `#payer/coding` (390) loading@66ms → `display:none` @4905ms. One graph fetch in every case. (Coordinate drift put the 1280 no-data click on `payer/drg` instead of `payer/rcm`; both carry only `["part-of","concept:zone:payer"]`, verified against search-graph.json, so it is the same case.)

**3. operators shade-counties button — PASS.** Throttled 1.6 Mbps/150 ms, MT: button present in the card's FIRST paint at t=21 ms reading `◩ Loading county data…`, `disabled=true`, 161x31. Swaps at t=7083 ms to `◩ Shade counties by a metric…`, `disabled=false`, 198x31, with `Population 1.1M` and `Beds per 1,000 2.6` arriving in the same render. The real button is functional: tapping it opens the Display tab with all 7 options; Uninsured gives `gv-county-fill` opacity 0.42 and a visible legend.

Idle byte totals unchanged after the fixes (0 gated fetches at both viewports): atlas 693,286 / 692,903 · multi-lens 1,215,824 · operators 3,004,568. No horizontal overflow and no new console output at 390 or 1280 on any of the three.

**New pre-existing finding (not from these fixes, CSS identical at HEAD):** `.gv-tolist` (operators-map/index.html line 244, `padding:7px 12px`, no `min-height`) renders **198x31 with `(hover:none)` and `(pointer:coarse)` both confirmed true** — under the 44px floor. Fix would be `min-height:44px` inside the existing `@media (hover:none)` block.

## Run 12 · 2026-08-22 · VERIFY three perf deferrals (atlas idle-prefetch removal + `ensureCountyData()` on both maps). Read-only. 2 of 3 clean, 1 real regression.

Method: CDP `Network.loadingFinished.encodedDataLength`, cache disabled, raw uncompressed dev bytes. Same harness as run 11.

**Bytes, before → after (raw / gzip-equivalent of the deferred file):**

| Page · viewport | Before | After (no interaction) | After the intent action | Delta |
|---|---|---|---|---|
| /atlas/ 1280x900 | 12,254,582 | **692,742** | 12,257,948 | **−11,561,840 (−94.3%)** |
| /atlas/ 390x844 | ~689,000 | 692,835 | 12,257,950 | flat (phone never prefetched) |
| /tools/multi-lens-map/ 390x844 | 2,000,933 | **1,215,449** | 2,072,733 (state picked) | **−785,484 (−39.3%)** |
| /tools/operators-map/ 390x844 | 3,789,933 | **3,004,327** | 3,866,331 (state picked) | **−785,606 (−20.7%)** |

gzip equivalents (prod-shaped): search-graph 11,564,941 → 1,080,377 · countyData 723,774 → 216,563 · us-counties 62,777 → 18,005.

**(a) Atlas idle prefetch removal — CLEAN.** 0 requests for search-graph.json after a 10s idle load at both 1280 and 390. All three intent triggers fire it and fire it EXACTLY ONCE per page load: search focus, a synthetic `input` event with no focus (keystroke path), and a hex select. Repeat queries, second hexes and a search-result → map select all reuse the same `graphPromise`. Results correct ("nurse" 31, "medicare" 8, "sepsis" 4). HUD refills via `window.__lastHudNode` (Medicare → "Live data · Medicare enrollment 19.9 % US avg"). Hexes reading 0 rows (`payer/rcm`, `payer/coding`) are correct — those concepts only carry a `part-of` rel in the graph, verified against the file. Atlas phone CLS 0.0119, graph parse ≈ 460 ms of long task at 4x CPU throttle.

**(b) multi-lens `ensureCountyData()` — ONE REGRESSION.** `selectState()` calls `openStateCard()` BEFORE `paintCounties()`, and `openStateCard` calls `popOf()` which memoizes `SPOP`/`NPOP` off `CPOP` (us-counties.json). At first selection `CPOP` is null, so the card's **Population row renders `—` / `—` and never repairs**: the `ensureCountyData().then()` inside `paintCounties()` only calls `refreshCountyLabels(); paintCounties();`, never `openStateCard()`. Reproduced 4/4 (tap-select CO and MT, and the `?state=UT` / `?state=CO` deep links). Repairs only when something else re-renders the card (metric change, back-walk, second state). Everything else on this map passed: county labels' "Pop." fallback DOES repair (its refresh is in the same `.then`), tint 0.6 with real per-county colors, county card real (Lincoln MT 14%, #50 of 56, 22k), second state does NOT refetch.
County-grain indicator is fine and was never at risk: the boot `COUNTY_IDX` literal is byte-identical to the live file's keys (19 metrics, verified by script), and both the literal and the re-derivation already existed at HEAD.

**(c) operators `ensureCountyData()` — CLEAN but pops in.** No county fetch on load; `selectState()` calls it directly and `.then(refreshOpenCard, applyCountyTint)` repairs everything. Under CDP throttle (1.6 Mbps / 150 ms) the state card has NO Population row, NO "Beds per 1,000" and NO "◩ Shade counties by a metric…" button from t=0 to t≈5 s, then all three appear at once — a multi-second in-sheet layout shift, not a permanent hole. County card fully populated (Cascade MT: 84,523 / $64k / 9.8% / 10.4% / 20.3%), no NaN, no undefined. Second state no refetch. Uninsured tint 0.42 with a real match expression + legend.

**Incidental, NOT caused by these changes (both pre-existing at HEAD, verified by `git show`):**
- operators `toFeatures()` never copies `co` into feature properties, so `pinEnrichBlocks`' whole `if (p.co){…}` block (County + population, County median income, County uninsured) is DEAD on every facility card. Confirmed with `?fac=270012` and `?state=MT&fac=270012` — county data loaded, still nothing.
- multi-lens `#lvScope` county→state back-walk does not `syncURL()`, so `&county=` survives in the URL; and after `deselectState()` the URL still carried `?state=`.

Regression sweep: no horizontal overflow at 390 or 1280 on any of the three; console noise only (goatcounter localhost, MapLibre `circle-11`, my own `.11ty` abort).

## Run 11 · 2026-08-22 · SITE-WIDE PERFORMANCE AUDIT (9 pages x 390x844 touch + 1280x900, read-only, raw uncompressed bytes off the dev server)

Not a layout run. Byte/CWV baseline for the whole site. Full method + gotchas in [[test-harness-quirks]].

**Total raw first-load bytes (phone 390 / desktop 1280):** home 415K/415K · /tools/ 399K/427K · /learn/ 417K/432K · laws-and-paradoxes 541K/541K · multi-lens-map 2.00M/2.93M · operators-map **3.79M/4.75M** · career-tree 1.34M/1.34M · atlas **689K/12.25M** · vendor-directory 604K/603K.

**The five headline costs (measured, with the gzip equivalent since local dev serves uncompressed):**
1. `/atlas/` DESKTOP ONLY idle-prefetches `search-graph.json` = **11,565,119 B raw / 1,080,377 B gzip at t=228ms with zero user intent**. 94% of the page. Gate is `!phone && 'requestIdleCallback' in window` with `phone = matchMedia('(max-width:699px)')` — WIDTH ONLY, so an Android phone in landscape (844px) still gets it. Blocking it: 12.25M -> 690K, TBT 128 -> 106.
2. `countyData.json` **723,951 B raw / 216,563 B gzip fetched on `map.on('load')` by BOTH maps**, phone included, before any state is selected. `paintCounties()` early-returns while `selState` is null, so it is unused in the first view. operators-map phone 3.79M -> 2.45M when countyData + us-counties + hospital-enrich are blocked.
3. `career-tree/index.html` is **593,761 B**: one **425,559 B inline `<script>`** + one **122,098 B inline `<style>`** + only ~38 KB of markup. Uncacheable, re-downloaded every visit. 166 KB gzip of HTML.
4. `lucide.min.js` **80,853 B from unpkg on EVERY page, synchronous, no defer/async**, at the end of body followed by `lucide.createIcons()`. Blocks DOMContentLoaded.
5. `us-suppliers-pharmacy.json` **6,447,402 B is DEPLOYED but never requested by any page** — build-time only (operators-map lazy-loads `/assets/data/geo/pharmacy/XX.json` per state instead). Pure deploy weight, zero runtime cost.

**CLS failures (clean measurement, fresh page per nav):**
- **vendor-directory 0.4322 desktop / 0.1079 phone** — `div.ehr-market` collapses [582,317] -> [0,0] at t=180ms (0.3618) and `div.vd-board` [466,116] -> [839,60]. Phone: `div.vd-board` [592,251] -> [0,0] at t=146 (0.0912). Same component as run-10's finding, still unreserved. Varies run to run (0.11-0.43); report the range.
- **career-tree 0.1915 PHONE / 0.0019 desktop** — one shift, `div.bp-sheet` [402,441] -> [600,243] at t=168ms, `div.bp-panel.bp-panel-trunk` -> [0,0]. Phone-only, so it is the blueprint sheet reflowing after data lands.
- Everything else is under 0.04. Maps are effectively 0 (0.0005-0.0044).

**TBT / long tasks:** only `/atlas/` is meaningful — 124ms desktop / 103ms phone, dominated by a **153ms task at t~50ms** which is the page's own 180,799 B inline script building **5,053 DOM nodes**. Blocking d3 does NOT improve FCP (248 vs 236), so "defer d3" is a fake fix. Atlas also has the worst FCP on the site (248-260ms vs 76-180 elsewhere). Everything else: TBT 0-9ms.

**Render-blocking head, identical on all 9 pages:** Google Fonts CSS2 `<link>`, `hu-global.css`, `/brand/web/brand.css`, one 307 B inline theme-flash script. Tool pages add a body-position parser block: `/atlas/` puts **d3.min.js at line 134 with `</head>` at 108** (top of body), multi-lens-map puts `maplibre-gl.css` (69,422 B, 4.7% used) at line 150 in the BODY. **laws-and-paradoxes has a SECOND `<link rel=stylesheet>` for DM Serif Display at line 149, inside `<body>`.**

**Fonts:** one Google Fonts request site-wide, `display=swap` on every face, 4 preconnects present. Chrome gets VARIABLE files: DM Sans roman 62,758 (one file covers 300-700), DM Sans italic 28,493, Outfit 32,321 (600-800), IBM Plex Mono is NON-variable so one file per weight (400 = 14,735 · 500 = 14,915 · 600 = 15,647). Typical page = 153,954 B of font. **DM Sans italic is fetched on 8 of 9 pages but `CSS.getPlatformFontsForNode` reports ZERO glyphs from it on `/`, `/tools/` and `/atlas/`.**

**Per-page fixed overhead nobody needs:** 4 logo SVGs requested on content pages (`hu-logo.svg` + `hu-logo-dark.svg` + `hu-logo-inline.svg` + `hu-logo-inline-dark.svg`, 37,352 B) of which **2 are `display:none`** (the light/dark twins); SVGs are unoptimised at ~9.4 KB each. `/brand/icon-192.png` (7,978 B) is pulled on every page by the webmanifest and never rendered.

**CSS:** ONE shared file, `hu-global.css` 54,884 B (13,301 B gzip) + `brand.css` 2,072 B, plus a per-page inline `<style>`. Coverage at 390 on load: hu-global **14.8%-20.3%** matched (8,115-11,145 B). Inline blocks: career-tree 122,098 B -> 15.7% · atlas 36,335 -> 33.7% · mlm 21,440 -> 31.9% · ops 19,386 -> 31.6% · laws 25,153 -> 75.9% · vendor 17,614 -> 62.1%. Interaction-only rules count as unused, so treat as a ceiling.

**Third-party origins, all pages:** fonts.googleapis.com (CSS, render-blocking), fonts.gstatic.com (woff2, swap), unpkg.com (lucide, sync), gc.zgo.at (GoatCounter, async). Map pages add cdn.jsdelivr.net (maplibre-gl.js 248,098 B) and tiles.openfreemap.org (12 reqs / 345 KB phone, 37 reqs / 1.27 MB desktop). d3 pages add cdn.jsdelivr.net (d3.min.js 92,773 B). **No page loads both MapLibre and D3** — maps get MapLibre, atlas/career-tree/data-observatory get D3.

**Datasets fetched on load that the first view does not need:** search-graph.json (atlas desktop) · countyData.json + us-counties.json (both maps) · hospital-enrich.json (ops, already delayed 2.5s, only feeds an open pin card) · career-tree-creds/bls/growth-detail (96,928 B, only feed the role detail sheet).

**Images:** tool-thumb PNGs are all **1280x440** rendered ~358px wide on phone (3.6x), and they are CSS backgrounds so they get no `loading=lazy` — `/tools/` pulls 98,269 B of thumbs at 390 where most cards are below the fold. Bytes are small (2.7-12 KB each) so this is the cheapest item on the list.

**Console:** unchanged from prior runs. Every page = 1 error (my own blocked `/.11ty/reload-client.js`) + 1 warning (goatcounter localhost). Map pages add the MapLibre `circle-11` image warning. No new errors.

**No `100vh` on any full-height element on any of the 9 pages** (scanned computed height/min-height/max-height). That risk is closed.

## Run 10b · 2026-08-22 · re-verify of the four fixes the coordinator shipped after run 10 — 3 PASS, 1 PASS-EXCEPT-360

**ICEBERG regression: FIXED at 390 and 430, still broken at 360.** The wrap shape works: `#tb` scrollWidth === clientWidth at **354/384/424** (was 454 against all three). `#selLayer` 124.2x44, `#selViews` 44x44, `.hi` **44x44** all hit SELF at every width, none past the edge. The plain `.hi` selector took (`min-width/min-height: 44px` on the `div[role=button]`); confirmed `tag: DIV, role: button`.
- **At 360 the bar needs 3 rows but `height:88px` only fits 2.** Natural height with `height:auto` is **118px**. `align-content:center` then spills the content **15px above and 13px below** the bar box: `#selLayer` renders at y49 (bar starts at 64) and `#bc` at y145-165 while the bar ends at 152. The breadcrumb lands on top of `#tblk` ("THE HEALTHCARE ICEBERG"), `elementsFromPoint` returns `[div#tblk, div#ma-inner, div#ma, span.bi]` — **the crumb is 4th, so it is NOT tappable** (`crumbHitIsSelf: false`). At 390/430 the bar is 2 rows, `#bc` sits inside it and hits SELF.
- **`#ct{top:88px}` is DEAD CODE.** On phone both `#tb` and `#ct` are `position:static` (the "Inner topbar: static so page scrolls past it" block), so `top` is never used — `getComputedStyle(#ct).top` reports the base `52px` while the box sits at 152 purely because it FLOWS after an 88px `#tb`. The seam therefore cannot drift, which is good, but the paired-number design is not what is holding it together.
- **Control experiment proves the one-line fix.** Setting `#tb.style.height='auto'` at 360: bar 88 → **118px**, `#ct` follows 152 → **182**, gap still **0**, no overlap, `#bc` moves inside the bar (`belowBar -2`) and the crumb becomes reachable (hit = `span`). So `#tb{height:auto}` (or `min-height:88px`) plus deleting the inert `#ct{top:88px}` fixes 360 without touching 390/430.
- Seam at 390/430 as shipped: `#tb` bottom **152** === `#ct` top **152**, gap 0, no overlap, board not clipped (`#ma` 152-1280, 54 nodes, first node top 242, none above the canvas).
- **Layer filter works end to end, both paths.** Popover opens with 13 options all 44px tall. `data-focus="Experience"` → face "All layers" → **"Patient"**, URL `?focus=patient`, reverses cleanly. `data-layer="1"` → URL `?hide=1`, visible `.lnd` rows 8 → 7, lit nodes 54 → 48. Note iceberg's `#selLayer` face DOES track its value, unlike the atlas Layers button.

**VENDOR sticky gap: PASS at 360/390/430.** `.vd-toolbar{top:122px}` closes it exactly. searchbar 64-122, toolbar 122-320, **gap 0**, no overlap. Probed every pixel row across the seam: y121 `.vd-searchbar`, y122-123 `.vd-toolbar`, **zero card content** (`anyCardLeak: false`; previously `div.vc-desc` was legible in the slot). `#searchInput` and `#selSector` both still hit SELF when stuck.

**HOSPITAL hint overlap: PASS at 360/390/430.** `#hmPzHint` is `display:none` (box 0x0, not painting). Exactly **one** hint paints, `.hm-mobile-hint` 277x34, reading **"Pinch to zoom · tap any department"**. `overlap: false`. Pinch still works: `.hm-campus-col` scale **0.3 → 1.86 (6.2x)**. `#hmPzReset` is `display:none` before the pinch and `flex` after, 123x30, hits SELF.

**Regression: PASS.** iceberg / vendor / hospital x 360/390/430 = 9 combos, **zero console errors, zero warnings, zero page overflow** (`docSW === docCW` everywhere). Iceberg control positions measured directly rather than trusting the doc metric, since `#tb` sits under an `overflow:hidden` ancestor.

## Run 10 · 2026-08-22 · RE-VERIFY of the run-9 discoverability fixes (390 primary, 360/430 spot) — 6 of 8 PASS, 1 FAIL, 1 PARTIAL

**Verdict: hospital-map, vendor-directory, atlas, multi-lens, career-tree, operators all PASS. ICEBERG FAILS and REGRESSED. The atlas Layers "current value" is a static label, not a value.**

**The two structural shapes from run 9 are now both proven fixable, and the fixes worked:**
- `.hm-subbar{flex-wrap:wrap;height:auto}` + `.hm-subbar-legend{flex:1 0 100%;justify-content:flex-start}` → **8 of 8 category chips reachable** (was 2 of 8). Rail max `scrollLeft` **316** (was 2), clientW 352 / scrollW 668. Title bottom 89 vs rail top 101, no overlap, `elementFromPoint` at the title centre returns the title's own span. Real-touch tap on "Critical Care" → `aria-pressed` false→true and 9 of 72 units stay lit, 63 dim. At 360 all 8 also reachable (Support at scrollLeft 20, Admin at 320) — max scrollLeft 346. At 430, 276.
- Atlas `#atlas-bc{flex:1 0 100%;order:3;overflow-x:auto;min-width:0}` → **clientW 358 / scrollW 358** for a 3-level trail (was 30/400). All 5 crumb children hit SELF. Longest trail found ("Overview › Payer & Payment › Value-Based Contracts") is 399 scrollW / 358 clientW and scrolls 41px to recover. Back-walk is exactly one level per tap: `#payer/coding` → `#payer` → ``.

**ICEBERG — the only FAIL, and the fix made it worse. Two separate bugs:**
1. **`button.hi{min-width:44px;min-height:44px}` matches ZERO elements.** The markup is `<div class="hi" role="button" onclick="resetAll()">` (index.njk:592), not a `<button>`. `document.querySelectorAll('button.hi').length === 0`. Control stays **32x32** with `min-width:auto`. Selector must be `.hi`.
2. **`#bc{flex:none;max-width:44vw}` pushed two controls off the right edge.** Control experiment (set `#bc` back to `flex:1` in the live page and re-measure) is decisive: with the fix `#tb` scrollWidth **454** vs clientWidth 384, and `button#selViews.icon-btn` (44x44, x 368-412) plus `div.hics` (the only reset, x 422-454) are both past the edge with `elementFromPoint` off-viewport at **360, 390 AND 430**. With `flex:1` restored, `#tb` scrollWidth is exactly 384, `.hics` right = 368, on screen. So the old `#bc` 3.2px crush was *absorbing* the bar's 70px overflow. `#tb` is `nowrap` + ancestor `overflow:hidden`, so `docSW === docCW` reports clean and there is NO scroll recovery. `#selLayer` "All layers" (124x44) survives and hits SELF. `#bc` itself is now correct: 89.4px, "Healthy Patient" fully readable, at all three widths.
   Fix shape: wrap `#tb` (`flex-wrap:wrap;height:auto`) and move `#ct{top:52px}` to match — the same shape that worked on `.hm-subbar` and the atlas toolbar. Bar natural width is ~454 against 384 available, so ~70px must go somewhere.

**Atlas Layers — PARTIAL.** `.sel-val` is restored and visible (`display:block`, 40x16, max-width 156px, not truncated) so the button is **no longer icon-only**: face reads **"Layers"** at 91x44. But that string is the control's NAME, not its value — toggled `af-expand-all` to `aria-pressed="true"` and the face still read "Layers". Toolbar wraps to 3 clean rows (title+Layers+Craft / 4 icon buttons at 44x44 / breadcrumb) with every control hitting SELF and no right overflow.

**The rest, all PASS:**
- **vendor-directory**: `#searchInput` absY **455** (was 1097), `#selSector` absY **864** (was 1494). First screen at 390 now holds the search box + the 52-cell HQ tile map (was zero tool controls). `#selSector` still misses the 844 fold by **20px** (360: misses by 52; 430: it IS on screen at 823). Stuck at scrollY 6000 both bars pin cleanly — nav 0-64, `.vd-searchbar` 64-122 (z21), `.vd-toolbar` 126-324 (z20), no mutual overlap, both `#searchInput` and `#selSector` hit SELF. Real-touch tap + type at scrollY 6000 → `?q=epic`, 17 cards. Carousel now at absY 44170 (below the grid, which ends 43950) and `#ms-next` works: dot 2→0, rows → Epic 42.3% / Oracle 22.9% / MEDITECH 14.8%.
- **multi-lens**: metric text is now **"Life expectancy at birth"**, the "Patient · " prefix is gone. Still truncates but far less: clientW 114 / scrollW 150, **76% visible** (was 44%), renders "Life expectancy a…". `.lv-ident` visible at 77x38 showing **"Multi-Lens"** (`.lv-ident-long` "Pop Health " is display:none) so the tool is no longer anonymous. Desktop 1280 unchanged: **"Patient · Life expectancy at birth"**, 197/197 not truncated, ident "Pop Health Multi-Lens".
- **career-tree**: `h1.tool-bar-title` now has NON-ZERO size **39.2 x 19.8** at [10,71], font-size 12px, visible text **"Career"** (the `<span>Tree</span>` is display:none). `#hct-mp-goals` **100.1 x 44** and `#hct-mp-more` **70.3 x 44** (were 100x27 / 70x27), both `min-height:44px`, both hit SELF.
- **operators**: `#gvPillClr` is exactly **44x44** with touch emulation on (was 11x18), computed 44px/44px, hits SELF, fits inside its 275x44 parent.
- **Regression sweep, 7 pages x 360/390/430 = 21 combos: zero real console errors, zero page overflow** (`docSW === docCW` everywhere, zero *uncontained* right-edge offenders). Only console output is the `.11ty` abort from my own route block (proved by a fresh tab: 0 errors, 1 goatcounter warning).

**Two NEW defects introduced by these fixes (beyond the iceberg one):**
1. **hospital-map: the two hints overlap on load.** `#hmPzHint` "Pinch to zoom · drag to pan" (bottom:50px, z90, y 786-815) and `.hm-mobile-hint` "Pinch to zoom · tap any department" (fixed bottom:14px, z140, y 796-830) are both opacity 1 simultaneously and **overlap by 19px**, the second painting over the first. Confirmed in a screenshot.
2. **vendor-directory: 4px leak between the two sticky bars.** `.vd-searchbar` bottom is 122 (top:64 + 10 pad + 42 input + 6 pad) but `.vd-toolbar` is `top:126px`. `elementFromPoint` in the gap returns `div.vc-desc` and card body text is visibly readable through the slot at all three widths. Fix: `.vd-toolbar{top:122px}`.
3. **vendor-directory CLS regressed to 0.2155-0.3237** (run 5 measured 0.0022). Attribution: `div.vd-board` shifts 561→593 then collapses to [0,0,0,0] at t=139ms (v=0.0912), `div.hq-map` 471→503. `.vd-board` is NOT new (it is in HEAD); the shifts became *visible* because moving the carousel below the directory pulled the board and HQ map up into the first 844px.

**Hint lifecycle is INTACT and matches the JS exactly** (index.html:3222-3227): shown at load, `setTimeout(2500)` → opacity 0, inner `setTimeout(800)` → `display:none`. Measured opacity 1 until 2.637s, decaying 0.68→0.32→0.13→0.03, `display:none` at 3.40s. Not pinned. **But `.hm-mobile-hint` is NOT persistent** — it carries `animation: hintfade 4s ease forwards 0.8s` and measured opacity 1 → 0.274 at 4.0s → **0 at 4.8s and stays 0**. It is a 4.8s toast, so after 5 seconds the phone user again has nothing on screen saying pinch-zoom exists.

**Gestures re-confirmed on hospital-map at 390**: transform target is `.hm-campus-col` (NOT `.hm-building-scroll.children[0]`, which is the 0x0 reset button). Landing scale **0.3**. Pinch 0.3 → 1.86 (**6.2x**), pan moves tx/ty, `#hmPzReset` appears at 123x30 and hits SELF. Page itself is effectively non-scrolling (docH 865 vs vh 844).

## Run 9 · 2026-08-22 · DISCOVERABILITY AUDIT at 390x844 only (read-only, not a bug hunt)

**Why:** David: "there are still situations where headers or filters are not easy to find" on phones. Question was *can a first-time visitor find the controls*, per tool: first-screen inventory, primary-filter face, hidden-at-390 controls, scroll cost, icon-only count, where-am-I header.

**Ranked worst → best: hospital-map, vendor-directory, atlas, operators-map, iceberg-map, multi-lens-map, career-tree, sql-mystery.**

**Two structural bugs, each hit two tools. Learn the shapes:**
1. **`justify-content:flex-end` on an `overflow-x:auto` flex rail sends the overflow out the START edge, where scrollLeft cannot reach.** hospital-map `.hm-subbar-legend` (index.html:49 base + :945 phone override that never resets justify). Content spans x −225..378 in a 159px box; max scrollLeft is **2px**. 6 of 8 category filter chips unreachable, and that legend is the tool's ONLY filter (the CSS comment at :944 says so out loud). UNUSABLE-grade.
2. **A `flex:1; overflow:hidden` breadcrumb with `flex-shrink:0` children gets crushed to a sliver.** atlas `#atlas-bc` (index.njk:44) = clientWidth **30** vs scrollWidth **400** after selecting a node ("Overview › Payer & Payment › Utilization Management"); iceberg `#bc` = clientWidth **3** vs scrollWidth 89. Both are the tool's where-am-I AND its back-walk. Neither has `min-width` or a phone rule.

**Per-tool one-liners (measurements in the run report):**
- **hospital-map**: also lands at ~30% scale (72 units, all <44px tall, min 26x18); 23 of 72 units off-screen; `#hmPzHint` "Pinch to zoom · drag to pan" is `display:none` at 390 while pinch is the ONLY way to read it; `#hmPzReset` appears only after you zoom, at 123x30.
- **vendor-directory**: ZERO tool controls in the first viewport. Search at absolute y=1097, `#selSector` at y=1494 (694px of scroll = 0.8 screens just to reveal it). `.vd-toolbar` is NOT sticky, so across 43,155px of cards the only on-screen controls are the site nav. The control itself is good once found (text label + live current value "Interop / Interface", 134x44, no truncation, applied chip appears).
- **atlas**: primary filter `#atlas-layers-btn` is ICON-ONLY (aria "Layers"), 44x44, face shows no current state; `#atlas-layers-btn .sel-val` is explicitly `display:none` under 699 (index.njk:300). Panel itself is a good 390x608 sheet, 10 opts at 44px.
- **operators-map**: `#gvLayersPill` ("Layers · Hospitals ▾") and `#gvTypesPill` ("Types · All ▾") are hidden at 390 and replaced by ONE generic `#gvDisplayPill` reading "⚙ Display" — the current layer never appears on the face. NOTE: contrary to the older ledger entry, `#gvDisplayPill` STAYS visible after a state is selected at 390 (verified). Search placeholder truncates to "Search 5,366 …" once the scope chip appears (pill 275→145px).
- **iceberg-map**: best-labelled filter of the eight (`#selLayer` "All layers", 124x44, on first screen). But `#lp` ("Map Controls" incl. the `#lines-toggle` Lines on/off) is `display:none` at 390 with NO replacement; the legend guide IS relocated into the Layer popover via `.pop-guide{display:block}` (:93), an odd home for a legend. 30 of 54 `.nc` nodes start off-screen; rows ARE horizontally scrollable (`.lnd` overflow auto, verified swipe 0→263) with only the clipped-4th-card as affordance.
- **multi-lens-map**: filter is on the first screen, labelled, shows current value, 266x44 — but truncates to "Patient · Life ex…" (label sw205 / cw114, 44% visible) and the lens prefix eats over half the visible characters.
- **career-tree**: lands on the EMPTY "Path 0" sheet, not the board; the 27-deck grid is one tab away. Controls themselves are good (`#hct-sel-metric` "Family" 109x44, decks 175x81+). `#hct-mp-goals` 100x27 and `#hct-mp-more` 70x27 are under 44.
- **sql-mystery**: PASSES. Full where-am-I on the first screen ("—TOOL Clinical SQL Mystery", "CASES SOLVED: 0/4"), both panel triggers text-labelled ("☰ Cases" 86x44, "Schema □" 94x44), Cases drawer 384x734 with 94px rows.

**The tool NAME is hidden at ≤699 on three tools, with nothing replacing it:** multi-lens `.lv-ident` "Pop Health Multi-Lens" (index.njk:44), career-tree `span.hct-logo` wrapping `h1.tool-bar-title` "Career Tree", and both leave only a `.vh` h1. iceberg, hospital, sql, atlas and vendor all keep a visible title.

**Site-wide, NOT a defect:** `#themeToggle` is hidden at 390 on every page but lives in the hamburger drawer at 346x43 with aria-label "Toggle light / dark mode". Same for the 5 `a.nav-link` and the "Atlas →" pill.

**Icon-only control counts on the first screen** (all had aria-labels; none had visible text): atlas 6, multi-lens 6, career-tree 4-6, operators 4, iceberg 3, vendor 5 (carousel), hospital 0, sql 0.

## Run 8 · 2026-08-22 · operators-map module extraction (12/12 CLEAN) + 5 fix verifications (3 PASS, 2 FAIL)

**Why:** (a) operators-map's 87.5KB inline `<script>` became `/assets/js/tools/operators-map.js` (`type="module"`); (b) five reported defects were fixed and needed verification.
**How to apply: the operators extraction is CLEAN, 12/12, zero app console errors. Do not re-derive it.** `diff` of the old inline body vs the module is 8 hunks: header + `'use strict'`, a JSDoc on `$`, 5 `@type` casts in the delegated Display handler / drawer shell / insets tuple, `setTimeout`→`window.setTimeout`, plus the intentional `fitPad` change. `git diff` of index.html is 4 insertions total: the module `<script>` tag and the 3-line `.gv-cleg{bottom:84px}` fix. Zero inline handlers remain.

**PART A, all 12 PASS at desktop 1280 unless noted:**
- Console clean. Module 200s (91,061 bytes, `application/javascript`). 3 maplibre canvases (1280x836 + two 118x90 insets). 5,366 hospitals.
- Layer toggles exercised 4 deep with pixel-hash proof: 5,316 → 12,699 (+dial) → 18,159 (+asc) → 24,478 (+dme) → 19,162 (hosp off), each a distinct hash, data files 200 on demand, and returning to baseline reproduced the **exact** baseline hash `32ef2669`.
- `data-only` solos exactly (cah 1,357, child 91, both matching the chip tallies) and `data-t` chips add/remove with exact arithmetic (psych 628 + child 91 = 719). `__all` restores the baseline hash.
- `data-m` county tint: correct, but **gated on a selected state** (`applyCountyTint` returns early when `!selState`) so at US scope the picker is a legitimate no-op. Test it after selecting a state.
- TX: 468 hospitals / 60,836 beds / 3.38★ / 31.3M pop. County drill `?state=TX&county=48013` → Atascosa, `/assets/data/geo/counties/48.json` 200. Facility → CMS ID 450165, HCA 157 facilities, nearest peer 24.5 mi.
- Insets: badges track layers (hospitals AK 25/HI 24 → dialysis AK 7/HI 41), both hashes change, clicking each jumps and the badge matches the state card exactly. Retyped tuple path intact.
- Drawer resize `.gv-resize` (NOT `[class*=grip]`): 370 → 506px, `--drawer-w` + `localStorage['hu-drawer-w']='506'`, survives reload.
- URL/history semantics: state PUSH, county PUSH, **facility REPLACE** (history.length 4→4). So one Back from a facility card returns to STATE scope, skipping the county level. Coherent, but worth David's eye on phone where Back is hardware.
- Search "Intermountain Medical" → 1 result → `?fac=460010`, 508 beds, Trauma Lv I, #2 of 38 in UT.
- 390 portrait: real-touch tap selects a state, sheet detents walk half → peek → dismissed, pan and pinch both move the camera (3 distinct hashes), page never scrolls (`scrollY` 0, docH === 844 === vh), zero horizontal overflow at 360/390/430. CLS 0.0014. No `100vh` anywhere. `.tool-attribution--fixed` already has `calc(2px + env(safe-area-inset-bottom))`. No hover-dependent content.

**PART B fix verification:**
- **13. MLM phone metric survives the URL — PASS, twice.** `?metric=diabetes-prevalence` and cross-lens `?lens=payer&metric=uninsured-rate`, both reload to the right metric/year/legend. The history shim shows the fix working literally: `repl ?metric=… → POP (wipes it) → repl ?metric=…` from the `setTimeout(syncURL,0)`.
- **14. MLM `#lvCleg` — PASS at 360/390/430.** `bottom:84px`, box [10,733,329,27], **full 27px visible** (was 6/21/41), 4px above the bar, and `elementFromPoint` at the midpoint AND both edges returns `DIV#lvCleg.lv-cleg`, never `lvYearNext`.
- **16. OPS `#gvCleg` — PASS at 360/390/430.** `bottom:84px`, box [10,732,245,28], full 28px, 4px above the bar, `elementFromPoint` returns the `<i>` swatch / `DIV#gvCleg`.
- **15 + 17. Landscape fitPad — BOTH FAIL.** The `innerHeight < 500` branch fires correctly, but the phone bottom pad is calibrated for a 780px portrait shell, not a 326px landscape one. MLM 118+212 = **330 > 326**; OPS 130+212 = **342 > 326**. MapLibre refuses the fit and logs `Map cannot fit within canvas with the given bounds, padding, and/or offset.` — the camera does **not move at all**. Verified by control: the warning is absent at 844x430 (MLM, shell 366) and 844x420 (OPS, shell 356), and present only at 844x390. Even where it does fit, the usable box is 36px (MLM@430) / 14px (OPS@420) so the state is still a speck behind the control cluster. Fix belongs in `fitPad()`: clamp to the shell, or give landscape its own pad (top+bottom under ~200 for a 326px shell).

**Three NEW defects, all PRE-EXISTING (hu-kit's only diff today is a JSDoc cast in `pop`; `.gv-bottombar` CSS untouched):**
1. **OPS backGuard eats the state scope from the URL.** UGLY. Repro at 390: bare load → tap a state → open Display → pick a metric → drag the sheet away. Result: URL back to `/tools/operators-map/` while the map, crumb ("◀ United States"), county tint, legend and count all still say Colorado. Mechanism, proven with a `history` shim: opening the sheet fires `hu-kit.js:206 arm()` which pushes a **duplicate of the pre-scope URL**, and only THEN does `syncURL` push `?state=CO`. The guard's sentinel is therefore *beneath* the scope entry, so its `disarmEat()` → `history.back()` pops the scope away. The popstate handler early-returns on `consumed()`, so app state is untouched and the two disagree. Deep-linking `?state=CO` first masks it (the guard's duplicate carries the state). Same disease as the MLM metric bug, one level up.
2. **OPS `#gvListBtn` count text wraps to 3 lines and clips at every phone width.** UGLY. "List · 1,096 in view" renders as "List" + "1,096 / in / view" with "view" cut off (`clientHeight` 44 vs `scrollHeight` 50 against `height:46px`). Cause: `.gv-bottombar` is `position:absolute; left:50%` with no `right`, so its shrink-to-fit available width is only viewport − 50% = 180/195/215px, while the bar wants 208-271px. The two `.hu-fab` are `flex:none` so the whole squeeze lands on `.gv-listbtn`, which has no `white-space:nowrap`. MLM's `.lv-bottombar` uses the same positioning but all its children are fixed-width, so it overflows the box symmetrically and looks fine. Fix: `.gv-listbtn{flex:none;white-space:nowrap}` (index.html:157).
3. **OPS county metric never reaches the URL.** IMPERFECT. `urlFor()` writes layers/types/state/county/sys/fac but not `countyMetric`, so "🔗 Copy link to this view" loses the shading the state card is advertising ("◩ Shading: Uninsured · change…").

**Also IMPERFECT on operators at 390 (measured WITH touch emulation, so real):** `button#gvPillClr` (search Clear ✕) is **11x18**; `button.ta-toggle` is 38x38 (twin of MLM's); `button.hu-sheet-grab` is 352x**20**; `a.nav-brand` 192x40. Text: `b#gvCount` is 11px, `#gvPillQ` placeholder 13px. Third-party MapLibre attribution links are 15px tall.
**Legend behind the peek sheet (both maps, portrait and landscape).** The `bottom:84px` fix clears the *control bar*, which is what was asked, but the sheet at peek occupies 724-844 at 390 and the legend sits at 732-760, so it is invisible whenever the sheet is up. On operators that matters more because the legend only exists once a state is selected, and selecting a state auto-opens the sheet. Consider a `.gv-shell:has(#gvSheet.open) .gv-cleg { bottom:170px; }` twin of the existing bar rule.

## Run 8b · 2026-08-22 · re-verify of the rebuilt landscape clamp + the list-pill fix (same day, coordinator's second attempt)

**Attempt 2 on landscape fit: warning GONE, camera still WRONG. Do not accept "no warning" as proof of a fit fix again — measure the zoom.**
- The rebuilt `fitPad()` scales the pad by `k = min(1, max(0, (shellH - 60) / (top + bottom)))`. Computed values are exactly as designed: at a 326px shell, MLM k=0.806 → 95/171, OPS k=0.778 → 101/165, both leaving a 60px fit box. `Map cannot fit within canvas` is gone from both consoles.
- **But the camera now zooms OUT.** Hooked the MapLibre constructor to read `map.getZoom()` directly. Selecting Colorado at 844x390: **boot 3.60 → 3.03 on BOTH maps** (delta −0.57, linear **0.67x**). For contrast, portrait 390x844 goes 3.60 → 5.13 (ops) / 5.18 (MLM), i.e. 2.89x / 2.99x IN. That is what working looks like.
- Root cause is the 60px content reserve, not the clamp idea. `fitBounds` takes the min of the width-fit and height-fit zooms, and in a 13:1 letterbox the HEIGHT always binds. Colorado spans Δψ≈0.1075 of mercator, so a 60px box demands worldSize = 60·2π/0.1075 = 3506px → zoom 2.78 (observed 3.03). At zoom 3.6 Colorado is ALREADY ~89px tall, so any fit box under ~89px is a zoom-out by construction.
- Sanity check that the mechanism is the box height and not a broken fit: small states still zoom in (operators in-view 4,083 → RI 515, DE 1,417) while big ones do not (CO 5,149). NOTE in-view count conflates zoom with center (Texas reads 2,949 because its frame covers the empty Gulf), so it is NOT a clean zoom proxy — use the constructor hook.
- Sizing math for the next attempt: to reach zoom 4.5 on Colorado you need a ~198px fit box; zoom 4.0 needs ~140px. In a 326px shell those mean total pads of ~128 and ~186. **But the real landscape chrome is ~232px** (120px peek sheet + 46px floating bar + offsets + the top pill row), which leaves ~94px → zoom ~3.4, still under the 3.60 boot. **No pad arithmetic can fix landscape while the peek sheet eats 37% of a 326px shell.** The honest options are (a) shrink/suppress the peek sheet and move the floating bar off-center in landscape, or (b) guard the fit: compute `cameraForBounds` and only `fitBounds` when its zoom ≥ current zoom, otherwise just recenter. (b) is the minimum diff and strictly better than today.
- **Portrait and desktop confirmed UNCHANGED, k=1 exactly:** MLM portrait 118/212 (fit box 450), MLM desktop 130/150 (556), OPS portrait 130/212 (438), OPS desktop 130/150 (556). Shell clientHeight is 780 at 390x844 and 836 at 1280x900.

**List-pill clip: FIXED and verified.** `.gv-listbtn{flex:none;white-space:nowrap}` (index.html:164, after the base rule at :157 so order is right). At 360/390/430: computed `flex: 0 0 auto`, `white-space: nowrap`, **clientH 44 === scrollH 44 and clientW 164 === scrollW 164**, zero clipping in either axis. Pill went 100x46 (3 wrapped lines, "view" cut off) → 166x46 on one line. Bar widened 208 → 274 but still fits (x 43-317 inside 360, 43px margin each side), `docSW === docCW` at all three widths, and all three bar controls hit-test to themselves with the two fabs at 46x46.

## Run 7 · 2026-08-22 · multi-lens-map ONLY, regression after the inline-script → JSON-block + ES-module extraction (desktop 1280, phones 360/390/430, landscape 844x390)

**Why:** two inline scripts moved. (a) 61.6KB of build-time data that assigned `window.LENS_CONFIG` / `STATE_DATA` / `DATA_YEARS` became three `<script type="application/json">` blocks (`mlm-lens-config`, `mlm-state-data`, `mlm-data-years`) that the module parses and republishes under the same names. (b) 72.6KB of logic became `/assets/js/tools/multi-lens-map.js` (`type="module"`, so deferred).
**How to apply: the extraction is CLEAN, 12/12 on the parent's list, ZERO app console errors.** Do not re-derive it. `diff` of the old inline body vs the module is 4 hunks only: the header + JSON parse, a JSDoc on `$`, a JSDoc on a `forEach`, and two `@type` casts (`.lv-shell`, the insets tuple array). No CSS or markup outside the script swap changed.

- Data integrity solid: all 3 JSON blocks parse in node AND at runtime, **62 metrics / 7 lenses / 51 states per metric slot**, and `cfgItems === sdSlots === dySlots` for every lens. `LENS_CONFIG` has a `_readme` key (harmless, `LENSES` is a hardcoded map). Status line self-reports "Seven lens groups, 62 metrics".
- Map paints, recolours on every metric switch (proved with a pixel hash of a fixed map region: 3 metrics → 3 distinct hashes). Steppers ‹ ›, catalog across 3 lenses, legend title, metric face (`n/N · year`), inset badges, live region, year control, Rankings (51 rows, sorted, no NaN), state card, county drill (`/assets/data/geo/counties/08.json` 200 @104KB), deep-link restore (`?lens&metric&year&state&county` → Harris County TX 22.2%, #204/254), Back-one-step, and the desktop drawer resize grabber (370→490px, `--drawer-w` + `localStorage['hu-drawer-w']`, survives reload) ALL PASS.
- **AK/HI insets (the retyped code path) are correct.** Two real 118x90 maplibre canvases, both tinted on the live scale, badges track units across metrics (75.5 yrs → 68.8% → 12.6%), and clicking each jumps to that state (`?state=AK` / `?state=HI`). Note `buildInsets()` returns early below 700px and `@media (max-width:699px){.lv-insets{display:none}}` — insets are DESKTOP-ONLY BY DESIGN, so "missing on phone" is not a finding.
- CLS 0.0006 at 390. Only images are the 2 brand logo SVGs. No `100vh` anywhere (all `100dvh`); `#lvSheet` already has `calc(14px + env(safe-area-inset-bottom))`.
- No horizontal overflow at 360, 390, 430, or 844 landscape (only the `-9999px` skip link).
- Hover dependence: NONE. All 9 `:hover` rules are border/shadow/colour only; the only JS hover handlers set the map cursor.
- Phone gestures at 390 all pass with real CDP touch: tap-a-state opens the sheet at peek with real numbers, pan and pinch both move the camera, page never scrolls (`.lv-shell` is `height:calc(100dvh - 64px); overflow:hidden`, doc height === viewport). Grabber walks peek(120) → half(439) → full(776) → half. Catalog becomes a bottom sheet with 62 options at 346x70 and a working search.
- Three defects found (phone metric URL, buried legend, landscape fit). **All three were fixed and re-verified in run 8: the first two PASS, the landscape one still FAILS.**
- **Still IMPERFECT, unchanged:** metric pill text truncates mid-word at phone widths ("Patient · Lif…" at 360, "Patient · Life exp…" at 390) though the accessible name is complete; `#lvYearPrev`/`#lvYearNext` are 42x42 and `button.ta-toggle` is 38x38; MapLibre's own attribution control is third-party; the legend title hard-truncates at 26 chars by design.
- **Boot camera is `center:[-96.5,39.3], zoom:3.6` with no responsive fit**, so the phone landing view crops both coasts. Pre-existing, arguably a design call, but worth David's eye.

## Run 6 · 2026-08-22 · assignment-compass ONLY, regression after the inline-script → ES module extraction (desktop 1280, phones 360/390/430, landscape 844x390)

**Why:** the ~800-line inline `<script>` became `/assets/js/tools/assignment-compass.js` (`type="module"`). Two specific risks: (1) a Nunjucks-generated STATES map had to become a `<script type="application/json" id="ac-states">` block the module parses, with a `__` sentinel it deletes; (2) the module depends on `window.CompassEngine` + `HUKit` loaded as classic scripts first.
**How to apply: the extraction itself is CLEAN, 12/12, zero page errors.** Do not re-derive it. `git diff` of the njk is the fast proof: the ONLY non-script insertions are the JSON block + 3 script tags, and `diff` of the old inline body vs the module shows just the header, `'use strict'`, the JSON parse, JSDoc casts, and `String()` wrappers on `URLSearchParams.set`. Everything else is a byte-identical move.

- STATES JSON: 52 raw keys (51 states + DC, plus the `__` sentinel), dropdown renders exactly 51 → `delete STATES.__` works. NO "undefined" and no literal `__` in visible text at any point in the run, including the canvas share card ("Idaho vs Washington").
- State names read in words everywhere they should: tiles, breakeven sub-copy, same-state note ("You are comparing Utah to itself"), licensure copy (article logic right: "An Arizona", "A California"), negotiation verdict, and the 1080² share card.
- Hourly mode math is exact: 65/hr × 48 hrs = $162,240 matches `CompassEngine.hourlyToAnnual`. Two-offer mode, all 3 presets (exclusive `aria-pressed`), deep-link restore, methodology sheet (focus in → `#acMethodClose`, X and Esc both close, focus returns to trigger, `inert`+`aria-hidden` toggled), share-card `toBlob` download, and "copy the ask" all pass.
- URL is replaceState-only for input tweaks (`history.length` never grows), so ONE Back leaves the page. Correct per HUKit's tweak-replace semantics, not a defect.
- CLS 0.0019 at 390. Only image is the logo SVG (300x63 → rendered 192x40). No `100vh` rules anywhere on the page. `.ac-sticky` correctly uses `padding: ... calc(8px + env(safe-area-inset-bottom))`.
- **Two PRE-EXISTING defects found (no CSS or `_includes` changed today, so neither is a regression):**
  1. **`[hidden]` is overridden by `.ac-field{display:flex}` / `.ac-row2{display:grid}`** (src/tools/assignment-compass/index.njk:39,51). The page boots in HOURLY mode, so the annual field shows with "85,000" in it while the math uses $42/hr. Typing 250,000 into it changes NOTHING and never reaches the URL. All 4 pay inputs (incl. both offer fields, with the offer toggle OFF) render at once. Silent input loss = BLOCKER. The file already solved this exact problem for `.ac-sticky[hidden]{display:none!important}` at :176 with a comment explaining it, so the fix has an in-file precedent.
  2. **`.tool-bar` clips `#acMethodBtn` + `#acResetBtn` off-screen on every phone width.** `.tool-bar` is `display:flex; flex-wrap:nowrap` and kicker/title/crumb are all `white-space:nowrap`, so min-content = 433px; `.hu-shell{overflow-x:clip}` then clips (no scroll). Both buttons sit at left:389 at 360/390/430 alike, `elementFromPoint` = NULL. `#acMethodBtn` is the ONLY trigger for the methodology sheet (module line 779), so that sheet is unreachable in portrait. Fine in landscape 844x390. Crumb is 139px; hiding it under 699px frees enough. Note the `@media (max-width:699px){.icon-btn{width:44px;height:44px}}` floor added in run 3 made this overflow worse (28→44px each).
- `.tool-bar-crumb` is used by 4 pages: assignment-compass, atlas/craft, data-observatory, sql-mystery. data-observatory overflows too (barSW 602) but has NO `.tool-bar-actions`, so only crumb text clips. craft + sql-mystery NOT checked.

**Run 6b · both blockers FIXED by the coordinator and RE-VERIFIED same day. Do not re-test from scratch; smoke them.**
- Fix 1 `.ac-field[hidden], .ac-row2[hidden]{display:none!important}` (index.njk:44). Exactly the right 1-or-2 of 4 pay fields render in all 5 mode/offer combinations. The stray annual input is gone (`#acGross` renders 0x0). Hourly math reaches: 70/hr x 40 = $145,600 in the copy, URL `hr=70&hw=40`, no stray `g=`.
- Fix 2 `@media (max-width:699px){ .tool-bar{flex-wrap:wrap;row-gap:4px;height:auto} .tool-bar-crumb{display:none} }` (hu-global.css:563-566). compass bar stays ONE row at 58px (6+44+6+2 border); `#acMethodBtn`/`#acResetBtn` are 44x44, on-screen, and `elementFromPoint` returns the buttons at 360/390/430. A REAL touch tap opens the methodology sheet on the phone.
- Shared-rule regression on the other 3 crumb pages at 390, ALL PASS: sql-mystery + data-observatory wrap to 2 rows (bar 87px), no overflow, their toggle-chips reachable. **atlas/craft controls test "unreachable" but that is BY DESIGN** — `div.shell-gate` (z 180) is the "Atlas Craft is a desktop tool" gate. The wrap rule strictly IMPROVED craft (bar scrollWidth 526 wrapped vs 971 simulated nowrap).
- No crumb on any of the 4 pages contained links; all were descriptive text, so hiding it loses nothing.

## Run 5 · 2026-08-22 · vendor-directory ONLY, regression after the inline-script → ES module extraction (desktop 1280, phones 390/360/430, 1099/1100 boundary)

**Why:** the page's 361-line inline `<script>` became `/assets/js/tools/vendor-directory.js` loaded `type="module"`. Module scope is not global, so six inline handlers (searchInput oninput, ownSel/shareSel/sortSel onchange, dpClose onclick, card onclick) became addEventListener wiring, and cards went from `<div onclick>` to `<div data-vendor-idx role="button" tabindex="0">` behind one delegated listener. Risk was silent unwiring.
**How to apply: 13/13 PASS, zero regressions, zero console errors.** Do not re-derive this contract next run. Skim it: load the page, confirm card count is 158 and `document.querySelectorAll('[onclick],[oninput],[onchange]').length === 0`, then spend the time elsewhere.

- All six re-wired handlers fire. Search `epic` → 17 cards + `?q=epic`, clears clean. ownSel/shareSel/sortSel all filter, all push their param, all reset. dpClose closes.
- The delegated card listener is correct in a way worth remembering: `data-vendor-idx` carries the SOURCE index, not the display position, so it still opens the right vendor after a re-sort. Verified across all three sort orders.
- Keyboard on cards is NEW and works: Tab reaches them, Enter and Space both open, Space does not scroll the page (preventDefault), focus moves to `#dpClose` on open and returns to the originating card on close. Esc also closes the panel (kit rung walk).
- `.vendor-card` has NO `:focus-visible` rule, so it falls back to Chromium's `outline:auto` ring. It IS visible (light ring on the dark surface, confirmed by focused-vs-unfocused corner crops) but it is not the site's `2px solid var(--teal)` / `var(--teal-dk)` token used by every other control. Only defect found. Ranked IMPERFECT.
- Back/forward, deep link `?vendor=epic-systems&q=epic`, sector sidebar (`aria-pressed` is the string `"true"`, exactly one active), HQ tile map (WA → 4, INTL → 9, click-again toggles off), preset views popover, applied-chip ✕, and the market-share carousel (auto-advance every 6500ms through 3 slides, ‹ › wrap, dots jump, chart height padded so rotation causes no shift) all pass.
- Phones: no horizontal overflow at 390, 360, or 430 (scrollWidth === clientWidth, zero wide elements). Cards stack to one column. Sector sheet opens on a REAL touch tap and filters. Detail panel goes full-screen 390x844 with a 44x44 close X. CLS 0.0022. Only images are the two logo SVGs.
- `.detail-panel` and `.vd-nav` both use the `height:100vh;height:100dvh` progressive pair — correct, no iOS toolbar crop. No fixed top/bottom chrome needing safe-area insets on this page.
- Sidebar ↔ sector-selector swap boundary is exact: at 1099 `.vd-sidebar` is `none` and `#selSector` is `flex`; at 1100 it inverts.

## Open defects (recheck first next run)

**FIXED and VERIFIED in run 10b — do not re-test from scratch, smoke only:** iceberg `#tb` wrap (bar fits at 354/384/424, `#selLayer`/`#selViews`/`.hi` all SELF, `.hi` 44x44) · iceberg layer filter both paths · vendor `.vd-toolbar{top:122px}` seam closed · hospital single hint, no overlap, pinch + reset intact.

**FIXED and VERIFIED in run 10 — smoke only:** hospital-map legend rail (8/8 reachable, scrollLeft 316) · atlas `#atlas-bc` (358/358, one-level back-walk) · iceberg `#bc` (89.4px, readable) · multi-lens metric prefix + `.lv-ident` · career-tree h1 + `#hct-mp-goals`/`#hct-mp-more` 44px · operators `#gvPillClr` 44x44 · vendor search/sector reachable while stuck deep in the list.

- **ICEBERG at 360 ONLY: `#tb{height:88px}` is one row too short.** UGLY. The bar wraps to 3 rows (natural height **118px**), `align-content:center` spills 15px above / 13px below, and `#bc` lands on `#tblk` so the breadcrumb is **not tappable** (`elementsFromPoint` puts `span.bi` 4th behind `div#tblk`). 390 and 430 are clean. Proven fix (live control experiment): `#tb{height:auto}` or `min-height:88px`; `#ct{top:88px}` is inert dead code because both are `position:static` on phone and the seam is held by normal flow. Found run 10b.
- **DEFERRED by the coordinator 2026-08-22.** vendor-directory CLS **0.2155-0.3237** (was 0.0022 in run 5). `div.vd-board` collapse at t=139ms is the dominant shift; it became visible when the carousel moved below the directory. Needs reserved height on `.vd-board`/`.hq-map`, which is a deliberate layout change, not a tack-on. Found run 10.
- **hospital-map `.hm-mobile-hint` fades to opacity 0 at 4.8s** (`animation: hintfade 4s ease forwards 0.8s`) and it is now the ONLY hint, since `#hmPzHint` was set to `display:none` on phone in run 10b. So after ~5s nothing on screen says pinch-zoom exists. IMPERFECT, David's call whether that is intended toast behaviour. Found run 10, re-confirmed 10b.
- **DEFERRED by the coordinator 2026-08-22.** atlas `#atlas-layers-btn` face reads the static string "Layers", not its current value. Needs a JS change to write the value. Iceberg's `#selLayer` does this correctly (face went "All layers" -> "Patient") if a model is wanted. IMPERFECT. Found run 9, partially addressed run 10.
- **DEFERRED by the coordinator 2026-08-22.** vendor-directory `#selSector` still 20px below the 844 fold (52px at 360; on screen at 430). IMPERFECT. Found run 10.
- **hospital-map lands at ~30% scale** (`.hm-campus-col` transform scale 0.3). Pinch works (0.3 → 1.86, 6.2x) and `#hmPzReset` is 123x30. Found run 9, still true run 10.
- **iceberg `#lp` "Map Controls" is `display:none` at 390, taking `#lines-toggle` (connector lines on/off) with it.** No phone replacement. Found run 9, NOT retested run 10.
- **operators `#gvDisplayPill` face reads a generic "⚙ Display"** while desktop shows "Layers · Hospitals ▾" / "Types · All ▾". Current layer never appears on a phone control face. Found run 9, NOT retested run 10.
- **DEFERRED by the coordinator 2026-08-22.** atlas crumb buttons 34px tall (`#bc-ov` 86x34) with the breadcrumb now the primary back-walk; `.atlas-craft-link` 70x32, `#find-input` 296x18, `.ta-toggle` 38x38. IMPERFECT. Found run 10.

- **BOTH MAPS: landscape 844x390 selecting a state zooms OUT (3.60 → 3.03, 0.67x).** UGLY. Found run 7, two fix attempts (run 8 fixed regimes, run 8b proportional clamp) both FAILED. Attempt 2 did remove the `Map cannot fit within canvas` warning, so the console is clean and the defect is now SILENT. The blocker is structural: landscape chrome (120px peek sheet + 46px floating bar + top pill row ≈ 232px) leaves under 94px of a 326px shell, and Colorado already renders ~89px tall at the boot zoom. Needs a chrome change in landscape, or a guard that refuses to fit when the computed zoom is lower than the current one. **Verify any future attempt with the MapLibre constructor hook, not the console.**
- **operators-map: backGuard's `arm()` push lands BENEATH the scope push, so dismissing the sheet pops the state out of the URL** while the view stays on that state. UGLY. Found run 8. **DEFERRED BY THE COORDINATOR 2026-08-22: this is a kit-level change touching all seven tools (same disease as the multi-lens metric bug) and gets its own focused pass, not a migration tack-on.**
- ~~operators-map `#gvListBtn` count clipped~~ FIXED run 8b via `.gv-listbtn{flex:none;white-space:nowrap}`, verified at 360/390/430. Keep the underlying trap in mind: `.gv-bottombar` is `left:50%` with no `right`, so its shrink-to-fit width is only viewport − 50% and any shrinkable child gets squeezed.
- **DEFERRED 2026-08-22 by the coordinator. both maps: the colour legend sits behind the sheet at peek** even after the `bottom:84px` fix (which correctly cleared the control bar). IMPERFECT-to-UGLY on operators, where the legend only exists once a state is selected and selecting a state auto-opens the sheet. Found run 8.
- **DEFERRED 2026-08-22 by the coordinator. operators-map: county metric is absent from `urlFor()`**, so "Copy link to this view" drops the shading. IMPERFECT. Found run 8.
- **DEFERRED 2026-08-22 by the coordinator. operators-map tap targets under 44 at phone widths** (WITH touch emulation, so real): `button#gvPillClr` 11x18, `button.ta-toggle` 38x38, `button.hu-sheet-grab` 352x20, `a.nav-brand` 192x40. IMPERFECT. Found run 8.
- **multi-lens-map tap targets under 44 at phone widths**: `#lvYearPrev`/`#lvYearNext` 42x42, `button.ta-toggle` 38x38. IMPERFECT. Found run 7.
- **DEFERRED by the coordinator 2026-08-22.** multi-lens metric pill still truncates mid-word at 76% visible ("Life expectancy a…", clientW 114 / scrollW 150). Improved from 44% by the run-10 prefix drop. IMPERFECT. Found run 7, re-measured run 10.
- **vendor-directory `.vendor-card` has no `:focus-visible` rule** (src/tools/vendor-directory/index.html:73-75 defines the card, hover only). Falls back to the UA ring instead of the site token. IMPERFECT. Found run 5.
- **atlas light theme, frontier terrain is painted with hardcoded dark-theme hex.** src/atlas/index.njk:2134 `.attr('fill','#060e07').attr('fill-opacity',0.30)` and :2141 `'#08130a'` @0.50 on the `#frontier-g` ring hexes. In light mode those become dark gray "wings" flanking the whole board. UGLY. NOT retested since run 4.
- **atlas light theme, canvas-drawn zone labels** (PAYER, PROVIDER, PATIENT, PUBLIC HEALTH, HEALTH TECH) are low-contrast pale-on-pale. NOT retested since run 4.
- **iceberg light theme, legend swatches** render as three near-identical empty pale boxes. NOT retested since run 4.
- **career-tree Help and Search popovers touch the right edge at 1280** — `HUKit.pop` clamps with `popEl.offsetWidth` measured before content settles. IMPERFECT. NOT retested since run 4.
- carried, NOT retested: career-tree `#hct-class` toggle unreachable (inline `display:none`, David's call); `g.hct-cact` deck +/x at 25.8px; em dashes in vendor intro + sql case copy.
- **vendor-directory pre-existing tap targets under 44px at 390**: `#ownSel` 122x32, `#shareSel` 135x32, `#sortSel` 123x32, `#ms-next`/`#ms-prev` 30x30, `.ms-dot` 8x8 and 22x8, `.hqt` 29.8x29.8, `#searchInput` 358x42. The HQ tiles are a 52-cell map so 44px may not be affordable there; the three selects and the carousel arrows are the fixable ones. IMPERFECT.

## Notes that are NOT defects (do not re-report)

- **operators-map county tint is gated on a selected state** (`applyCountyTint` early-returns when `!selState`), so picking a `data-m` metric at US scope legitimately does nothing. Select a state first.
- **operators-map facility selection is replaceState, not push**, so Back from a facility card goes to STATE scope and skips the county. Matches HUKit's tweak-replace semantics.
- **operators-map `#gvSheetX` is a BACK-WALK, not a close.** From the state card it calls `deselectState()` and returns to the US view. Do not use it as "dismiss the sheet" — drag `button.hu-sheet-grab` down twice instead.
- operators-map insets get `.gv-insets.hide` once a state is selected. By design.
- multi-lens-map AK/HI insets are DESKTOP-ONLY: `buildInsets()` returns early under 700px and `.lv-insets{display:none}` under 699. They also fade out once a state is selected. Both by design.
- multi-lens-map county grain intentionally pins to the latest data year, so stepping the year does NOT recolour the county choropleth (the card says so). Test year recolour at US scope.
- multi-lens-map's side-drawer form is `@media (min-width:1100px)` only; 700-1099 keeps the bottom sheet. The resize grabber also no-ops under 1100.
- multi-lens-map `LENS_CONFIG` / `STATE_DATA` / `DATA_YEARS` each carry a `_readme` key, so `Object.keys().length` is 8 for 7 lenses.
- vendor-directory `#selSector` is `display:none` at ≥1100px by design (the sidebar carries sector there) — test that popover at ≤1099.
- vendor-directory `#vdApplied` (the applied-filter chip strip) is `display:none` at ≥1100 for the same reason. Playwright will resolve `.ac-x` and then hang on "element is not visible". Test chips at ≤1099.
- vendor-directory's detail panel overlays the toolbar at 1280 and 1024, so `#selViews` is not mouse-reachable while a vendor is open. It is `role="dialog"`; keyboard still reaches the trigger.
- Deep-linking a vendor does NOT move focus into the panel (no user action preceded it). Defensible, not a finding.
- hospital-map `?unit=icu` is an invalid id (real one is `nicu`); falls back to the welcome panel and keeps the stale param. Graceful.
- `.pop-opt` 30px / sheet close 24px measured without touch emulation is a HARNESS artifact — see [[test-harness-quirks]]. Real touch = 44px.
- The `a.skip-to-main` 1x1 hit in every tap-target sweep is the standard off-screen skip link. Not a finding.
- MapLibre's own attribution links (15px tall) and its ⓘ summary are third-party chrome.

## Component track record (pass streak; 3 = skim next time)

| Component | Streak | Notes |
|---|---|---|
| operators-map full control surface (7 layers, only/type chips, county metric, state→county→facility, search, insets, drawer resize, URL) | 1 | run 8 = 12/12 after the module extraction |
| operators-map AK/HI insets (2 canvases, badges track layers, click-to-jump) | 1 | the retyped tuple path |
| operators-map desktop drawer resize (`.gv-resize`, `--drawer-w`, localStorage) | 1 | |
| multi-lens-map data plumbing (3 JSON blocks → 3 globals, 62 metrics, 51 states, choropleth, legend, Rankings) | 1 | run 7 = clean after the JSON+module extraction |
| multi-lens-map AK/HI insets (2 canvases, tinted, click-to-jump) | 1 | desktop-only by design |
| multi-lens-map county drill + deep-link restore + Back-one-step | 1 | |
| multi-lens-map desktop drawer resize (`--drawer-w`, localStorage, ≥1100px only) | 1 | |
| assignment-compass calc surface (states, hourly/annual, two-offer, presets, breakeven, licensure, share card, deep link) | 1 | run 6 = 12/12 after the module extraction |
| assignment-compass methodology sheet (open, X, Esc, focus in/out, inert) | 1 | exemplary |
| vendor-directory full control surface (search, 3 selects, sort, sector, HQ map, presets, chips, carousel, detail panel) | 2 | run 5 = 13/13 after the module extraction |
| vendor-directory card keyboard access (Tab/Enter/Space, focus return) | 1 | |
| HUKit.pop contract on atlas / career-tree / iceberg / vendor (7 checks each) | 1 | 28/28 in run 4; only vendor re-smoked in run 5 |
| HUKit.urlState scope-push / tweak-replace / back / forward / deep link | 3 | **skim next run.** operators re-verified run 8 |
| phone popover → bottom sheet conversion (4 tools) | 3 | **skim next run.** MLM catalog re-verified run 8 |
| career phone flow: deck grid → ladder → sheet, one level per Back | 2 | |
| career-tree tablist: 4 tabs, URL per tab, back walks tabs | 3 | **skim next run** |
| no horizontal overflow at 360/390/430, all 14 pages | 5 | **skim next run.** 21 combos clean run 10. BUT the doc metric is blind to `overflow:hidden` bars — walk the bar children too |
| zero console errors on all 14 pages | 5 | **skim next run.** Only noise: goatcounter localhost, MapLibre circle-11, compass perdiem 404, my own `.11ty` abort |
| hospital-map legend rail: 8/8 chips reachable + tap filters units | 1 | run 10, after the wrap fix |
| atlas breadcrumb: fits, scrolls, one-level back-walk | 1 | run 10 |
| multi-lens metric label (phone drops lens prefix, desktop keeps it) | 1 | run 10 |
| phone map pan + pinch, page does not scroll (both maps) | 3 | **skim next run** |
| map sheet detent walk (half → peek → dismissed) | 3 | **skim next run.** operators re-verified run 8 |
| hospital-map sheet open/close/reopen | 2 | |
| iceberg-map hardware back / popstate | 2 | |
| atlas lazy search-graph: 0 bytes idle, 1 fetch per page on focus/keystroke/hex-select | 2 | run 12; run 12b added the loading→resolved/hidden states |
| operators state→county→second-state county-data flow (fetch on select, idempotent, real values) | 2 | run 12, 12b |
| multi-lens state card repairs after the deferred county fetch (4 entry paths incl. deep links) | 1 | run 12b, after the fix |
| atlas controls 44x44 and on-screen portrait | 2 | |
| hospital-map + career-tree light theme | 1 | |
