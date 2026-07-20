# HU UI GRAMMAR
### The site-wide surface classification, phone discipline, and the plan to get there
Drafted 2026-07-19 from a full audit of our 9 interactive tools plus pattern research on Google Maps, Zillow, Redfin, roadmap.sh, O*NET My Next Move, CareerOneStop, LinkedIn Career Explorer, CareerExplorer, Residency Explorer, FREIDA, levels.fyi, and the games industry's skill trees. David reviews, edits, approves. Nothing builds until then.

---

## 1 · WHY

A week of phone testing found two problems: visual clutter and delay. The audit confirms both and names the causes.

Every tool grew its own chrome. The bottom sheet exists in five tools built three different ways. Zoom works four different ways (d3.zoom wheel and drag, custom touch-only pinch, none at all, and one vestigial pinch UI with no handler wired). Search sits in three different places on the career tree alone. The operators map floats FIVE absolute overlays over the canvas plus a fixed bottom deck. The Atlas politely tells phone users it is "best on a desktop screen," which is the exact trap Residency Explorer fell into and the one thing every good tool refuses to do.

None of this is because any one tool was built badly. It is because there was no shared grammar. This document is that grammar.

---

## 2 · WHERE WE ARE (the audit)

| Tool | Mobile today | First-load weight | Biggest phone problem |
|---|---|---|---|
| Pop Health Multi-Lens Map | Best on the site: 4 breakpoints, sheets, touch-gated pinch | 292KB county + CDN topojson, metrics inline | Overloaded bottom bar (Mode, Trend, Year, legend, Sources on one strip), blocking 12-card tutorial |
| Operators map | Full treatment, but undisciplined | 1.3MB hospitals; 6.2MB pharmacy on switch | Five absolute HUD overlays stacked over a shrunken canvas |
| Career tree | Sheet view is phone-ready; boards are desktop-first | 4 JSON files | AOE stacks lens dock + select + search + top strip; 520ms motion reads as lag |
| Hospital blueprint | Full, clean (in-flow panel with drag handle) | none, all inline | Low risk |
| Vendor directory | Full, clean | 102KB | Low risk |
| Iceberg map | Full (55vh sheet, h-scroll strips) | none, all inline | Desktop layers dropped rather than reflowed |
| SQL mystery | Full (slide-in drawers) | ~1MB WASM | Init delay, spinner-guarded |
| Atlas | PARTIAL, self-declared desktop-first | 9.4MB search graph (lazy) | Heaviest mismatch on the site |
| Data observatory | Partial (h-scroll strip) | 18KB | Secret page, low priority |

What we already got right, and will canonize: the selector-pop contract (popover on desktop, bottom sheet on phone, one open at a time), view-gated toolbar clusters, the applied-filter chip, guidance that collapses once you explore, one modal primitive, LOD text that drops at far zoom, chrome that leaves when its job is done. Also: no accounts and no data leaving the browser. Every reference tool that feels bad on phones put a wall before first value. We never will.

GPS exists nowhere in the codebase today.

---

## 3 · WHAT THE BEST TOOLS DO

### 3a · The map family grammar (Google Maps, Zillow, Redfin)

1. SEARCH PILL, top, persistent. After a search it collapses to show current scope. Tap reopens a full takeover, not an inline dropdown.
2. FILTER CHIPS in a horizontal rail under the pill. Chips never navigate. They apply instantly or open a small sheet whose commit button states the result count ("See 213 homes").
3. THE BOTTOM SHEET with three detents: peek (title plus one fact row, ~20% of screen), half (scrollable, map still live above), full (near-fullscreen, map sliver stays visible). Nonmodal at peek and half. Grabber PLUS a visible X, because users miss grabbers.
4. PIN TAP GETS A CARD, NOT A PAGE. Selection lives on the map (enlarged pin) and in the card at once; dismissing one clears both. Zillow's card swipes horizontally to the next result, turning the map into a deck.
5. CLUSTERING: dots at distance, data pills up close. Cluster tap ONLY zooms to bounds, never opens detail.
6. LIST/MAP TOGGLE as a mode switch that preserves filters, scroll, and selection. NN/g's finding: list is the better default for pure finding tasks; the map earns primacy only when spatial distribution IS the content.
7. LOCATE ME: crosshair FAB, bottom-right, floating above the sheet's peek. Permission requested ON TAP, never on load. Manual ZIP/state fallback for denials.
8. PANNING DECLUTTERS. Map drag means "I want to see the map": cards dismiss, sheet drops to peek, only the pill and FABs persist. "Search this area" appears when the viewport invalidates results.
9. DRAW BOUNDARY (BUILT, 2026-07-19): explicit mode that freezes pan, freehand loop auto-closes, becomes the scope, composes with filters. The pencil FAB on the operations map.
10. LOADING: basemap paints first, viewport-bounded data second, list fills third. Queries fire on gesture END. Skeletons always. At low zoom, cap what renders.

### 3b · The career family grammar (roadmap.sh, O*NET, LinkedIn, FREIDA, Duolingo and kin)

1. THREE-DOOR ENTRY: search, browse, or "ask me questions." Novices take the quiz door, experts search, browsers wander.
2. NODE TAP OPENS A SHEET, NEVER A NAVIGATION. The canvas stays put; detail is a dismissible layer with what-it-is, two or three stats, and the pin/track actions. The full page is a link inside the sheet.
3. GRAPH TO BROWSE, VERTICAL PATH TO ACT. Duolingo killed its branching tree for a vertical path and completion jumped. The lesson is not "delete the boards." It is that the browse structure and the do structure are different views, and on a phone the do view is a vertical scroll. Our My Path sheet already IS this. Canonize it as the phone default once a path exists.
4. DETAIL PAGES ARE CARD STACKS. CareerOneStop ships 12 default cards with 6 more behind an "edit page" control. levels.fyi leads with one median and one range as a stat tile and demotes the table. O*NET renders education as filled marks (2 of 4), outlook as a badge, salary as exactly three figures. Glanceable at phone width.
5. SAVED ITEMS ARE A WORKSPACE: rank, annotate, compare, export (FREIDA's dashboard). The moment users can reorder and note their saved items, the tool becomes THEIR document.
6. EVERYTHING SCORES RELATIVE TO YOU. LinkedIn's similarity score, Residency Explorer's your-marker-on-the-middle-80%. Gaps read as named credentials, not percentages. We already do this in Next Steps; the boards can carry proximity cues.
7. PROGRESS IS A TINY STATE MACHINE PLUS ONE NUMBER. Done, in progress, not started; one chip totals it.
8. CHECKPOINTS PAY OUT, LISTS GET CUT OFF. Long flows reward each section. Suggestion lists cap at 5 to 10, never a ranked flood.

Anti-patterns, named: "optimized for desktop devices" (Residency Explorer, and currently our Atlas), and account walls before first value (we have no accounts; that stays).

---

## 4 · THE GRAMMAR: SURFACE CLASSES AND BUDGETS

Every UI element in every tool is one of nine classes. New surfaces must declare their class or they do not ship.

| Class | What it is | Desktop form | Phone form |
|---|---|---|---|
| Canvas | The map, board, or grid. One per view. | Fills the shell | Fills the screen; gestures own it |
| Nav | Tabs, view switching, breadcrumb | Top bar | Top bar, thumb-reachable actions sink low |
| Toolbar | Persistent controls, view-scoped | tb-ctx clusters in the top bar | Collapses to essentials plus a ⋯ overflow |
| Search | Scope-setting query | Toolbar-adjacent input | ONE placement standard: top pill, tap = takeover |
| Selector | Choice menus, filters | Popover, one open at a time | Bottom sheet (already our contract) |
| Inspector | Detail for a selected thing | Docked right panel; camera yields width | THE three-detent bottom sheet: peek/half/full |
| HUD | Status chips floating on canvas | Corner-anchored, minimal | At most ONE chip row; yields to any open sheet |
| Guide | Hints, legends, onboarding, spotlight | Inline or popover | Collapses after first interaction; never floats over canvas |
| Modal | Blocking overlay | Rare: onboarding, data loss | Same, full-screen |

### The budget rules (the teeth)

1. PHONE SCREEN BUDGET: Canvas + Nav + toolbar + AT MOST ONE transient surface (Selector, Inspector, Guide, or search takeover). Opening one closes the others. Desktop budget: two.
2. CANVAS GESTURES DECLUTTER: pan or zoom means "show me the canvas." HUDs fade, cards drop to peek, guides collapse. Only Nav and the search pill persist.
3. ONE BOTTOM SHEET IMPLEMENTATION site-wide, three detents, grabber plus X, nonmodal at peek and half. Every tool's Inspector and Selector rides it. We currently have four bespoke versions; they converge.
4. ONE ZOOM CONTRACT PER FAMILY. Geo maps: pinch and drag plus wheel on desktop, locate FAB, fit button. Concept boards: the career-tree contract (drag pans, wheel per board rule, toolbar minus/plus/fit, Free look). No more one-off gesture schemes.
5. MOTION: 250ms ceiling on phones (desktop keeps 520ms), prefers-reduced-motion always honored.
6. TOUCH FLOOR: 44px minimum targets, primary actions in the bottom half of the screen.
7. WEIGHT: nothing over ~300KB fetches before first paint. Datasets load on intent (tab open, dataset switch) with a visible loading signal, viewport-bounded where possible. The 6.2MB pharmacy file never loads whole on a phone.
8. GPS: locate-me FAB only, permission requested on tap, high accuracy off (county grain does not need it), 10s timeout, manual state/ZIP fallback. Nothing leaves the browser.
9. MODALS: one live at a time, blocking only for onboarding or data-loss confirmation.
10. GUIDANCE LEAVES: every Guide surface has a collapse trigger tied to demonstrated use (the hints-min pattern), not a timer.

---

## 5 · THE TWO FAMILIES

**GEO MAPS** (Pop Health Multi-Lens Map, operators map): adopt the full map-family grammar. Search pill, chip rail, detent sheet, pin-to-card, clustering, locate me, pan-declutters, viewport loading. The goal is that a Zillow user's thumbs already know our maps.

**CONCEPT BOARDS** (career tree, Atlas, iceberg, blueprint): adopt the career-family grammar. Boards to browse, the sheet to act, node tap opens the detent sheet, three-state progress, stat-tile detail cards. Do NOT chase map grammar here; these are not POI maps and a locate button means nothing on a hex board.

**GRIDS AND WORKSPACES** (vendor directory, SQL mystery, My Path sheet): card stacks and drawers. Already closest to correct; they converge on the shared sheet and chip components.

Every tool declares its family in this doc's registry when it is built or retrofitted.

---

## 5b · THE FULL-MAP STANDARD (added 2026-07-19, David's call: "standardize our maps")

Any tool whose canvas is a full geographic map builds from THIS parts list and nothing else. Current members: operators map, Pop Health Multi-Lens Map, the geo-v2 pilot. Future members inherit it on day one.

| # | Surface | The standard | Kit piece |
|---|---------|--------------|-----------|
| 1 | Search | ONE pill, top of canvas, full-width on phone. Tap = takeover with results list. | (pill is per-tool; results list converges Phase 3) |
| 2 | Scope + back | ONE row: scope pill ("New Mexico") and back chip side by side. Never a stacked block. Eyebrow text is desktop-only. | `.map-hud` row pattern |
| 3 | Filters | Type/category toggles are CHIPS in one horizontal rail. Scrolls, never wraps, never a paragraph. | `.hu-chiprail` / `.hu-chip` |
| 4 | Legend | One row. Caption/hint text is desktop-only (`.lg-cap` convention: caption spans carry the class, phones drop them). The scale itself stays because it IS the data. | `.lg-cap` |
| 4b | Color | Choropleth color ONLY when the user picked the metric (a labeled control plus a legend). A tint the user never chose reads as unexplained decoration; numbers carry defaults. (David's call, 2026-07-19.) | (rule) |
| 11 | Markers | Facilities wear SHAPES, not just colors: a cross is a hospital, a drop is dialysis, a pill is a pharmacy. Canvas-drawn sprites, type-colored, dark rim. | `installIcons` pattern |
| 12 | Labels | Region labels sit INSIDE their region (`HUKit.innerPoint`, never bbox centers), scale with zoom, and any number a user could misread names itself (units, "Pop.", year tags, "est."). | `HUKit.innerPoint` |
| 13 | Insets | Alaska + Hawaii ride corner mini-map insets at the national view (desktop; phones frame both in portrait). Click flies there. | inset pattern |
| 14 | Back | The browser back button unwinds the drill (county to state to nation) before it leaves the page: scope changes push history, tweaks replace. | scopeKey pattern |
| 5 | Detail | Pin/region tap opens a CARD on the detent sheet (peek → half → full), never a navigation. Selection marked on the map and card together; dismissing one clears both. | `HUKit.sheet`, `.shell-sheet` |
| 6 | Locate | Crosshair FAB, bottom-right, above attribution. Permission on tap. Thematic maps target "your county/state," POI maps fly to you. | `.hu-fab`, `HUKit.locate` |
| 7 | Toolbar | Dataset/metric selectors dock BOTTOM on phone (thumb zone), popovers open as sheets above them. | `.selector` + sheet contract |
| 8 | Yields | Canvas gestures fade all floating chrome (`.gesturing`); any open sheet fades it too (`.sheet-open`). Both restore on release. | class contract, per-tool CSS |
| 9 | Motion | Every camera move through `dcap()`: full on desktop, 250ms phone, 0 reduced-motion. | `HUKit.dcap` |
| 10 | Loading | Basemap/canvas first, data second with a visible signal, list third. Any fetch after first paint announces itself. | status banner pattern |

The test: screenshot the tool at 390px in its busiest state. Count what floats over the canvas. If it is more than the scope row, one chip rail or legend row, and one card, it fails the standard.

The reference implementations (post-swap, 2026-07-19): /tools/healthcare-operators-map/ for the full POI stack, /tools/multi-lens-map/ for the thematic stack; /secret-menu/design/ shows every part with its class names. The D3 v1s live in archive/.

---

## 6 · THE GEO STACK DECISION (for the map v2 work)

Verified July 2026, every piece keyless, accountless, static-host friendly:

- MapLibre GL JS 5.x. 268KB gzipped, loaded ONLY on map pages. GPU vector rendering is what makes pinch feel like Google Maps instead of a slideshow.
- Basemap tiles from OpenFreeMap's public instance: no keys, no registration, no stated limits, donation-funded, fully self-hostable if it ever wobbles (that is the hedge, plus our current D3 maps remain as fallback).
- Our overlays served from our own Netlify deploy: Census cartographic boundaries (states 20m is 186KB zipped; counties 5m is 3MB) as GeoJSON/TopoJSON or small PMTiles. A multi-gigabyte US basemap does NOT go in the deploy; that math does not work on Netlify bandwidth.
- Clustering via MapLibre's built-in (supercluster under the hood): dots at distance, pills up close, cluster tap zooms to bounds.
- Geolocation: one-shot getCurrentPosition on FAB tap, permissions.query to render button state without prompting.

---

## 7 · THE ROADMAP (slow, in order, each phase ships alone)

**Phase 0 · Adopt.** David edits and approves this doc. The budget rules become the review checklist for all UI work. No code.

**Phase 1 · Career tree phone discipline.** The freshest tool becomes the reference implementation of the budgets: enforce one-transient-surface on phone, collapse the AOE chrome stack, unify search placement, 250ms phone motion, Inspector converges on the detent sheet, My Path vertical flow becomes the phone default once a build exists. Measure before and after: surfaces on screen at 390px, time to first interaction.

**Phase 2 · Extract the shared kit.** ONE bottom-sheet component (three detents), chip rail, locate FAB (built, not yet used), stat tiles. Retrofit the operators map's five HUD overlays and the Pop Health Multi-Lens bottom bar onto it. No new features, pure consolidation.

**Phase 3 · Geo v2 pilot: operators map.** MapLibre + OpenFreeMap + clustering + viewport-driven loading + the pin-to-card sheet + locate me + "search this area." The 6.2MB pharmacy dataset loads by viewport, never whole. This is the Zillow-feel milestone.

**Phase 4 · Pop Health Multi-Lens county upgrade.** Real county boundaries at proper resolutions, GPS "find my county," chip-rail filters. It keeps its choropleth identity; it is a thematic map, not a POI map.

**Phase 5 · Atlas verdict.** Either an honest restack (roadmap.sh style: the graph inside a scrolling article page with a text fallback around it) or a deliberate, stated desktop-first framing. Decide from GoatCounter mobile share after deploy, not from taste.

**Ongoing.** GoatCounter watches mobile bounce and tool dwell after each phase. The numbers pick the next phase's priority.

---

## 8 · SUCCESS CRITERIA (the phone test, per tool)

- At 390px: canvas visible, at most one transient surface, no stacked fixed overlays beyond the budget.
- Every primary action reachable in the bottom half of the screen at 44px or better.
- First canvas paint under 2 seconds on a mid-range phone over 4G; every fetch after that is signaled.
- A Zillow user's gestures work on our geo maps; a roadmap.sh user's instincts work on our boards.
- Deselect works every time, with a sloppy thumb.

## 9 · OPEN DECISIONS FOR DAVID

1. OpenFreeMap dependency: accept the donor-funded public instance with self-host as the hedge, or budget for self-hosting from day one?
2. Atlas: restack for phones or own the desktop-first framing?
3. Draw-boundary search: worth it for the operators map, or skip?
4. Does the vertical My Path stepper become the phone LANDING view of the career tree, or stay one tab among four?
5. Naming: "surface classes" language OK, or rename to match how you think about zones?
