# UI GRAMMAR · PHASE 3: Geo v2 Demo
### Build notes, 2026-07-19. The Zillow-feel milestone. Round 2 same day: David said test only on a working demo that is DIFFERENT, so the bare pilot grew into the full-map standard, live.

## What and where

**New page: /secret-menu/geo-v2/** (noindex, excluded from collections, linked from the secret menu). The PRODUCTION operators map is untouched. That is deliberate: the doc's own hedge says the D3 maps stay as fallback, and the OpenFreeMap dependency question (§9 decision 1) is still open. This page is how you answer it: load it on your phone, pinch around, and decide if this is the feel we chase.

## The stack, exactly as the strategy doc specified

- MapLibre GL JS 5.6.0 from jsdelivr (pinned version), loaded ONLY on this page. GPU vector rendering.
- Basemap: OpenFreeMap's public styles, theme-paired: "fiord" (dark navy) in dark mode, "positron" in light. Keyless, no registration, nothing configured.
- Overlay: our own /assets/data/us-hospitals.json (1.3MB, already in the deploy). All 5,366 hospitals have coordinates; verified in the build.
- Clustering: MapLibre's built-in (supercluster). Blue-to-teal dots by count, labels on the GPU.

## The map grammar, implemented

- Cluster tap ONLY zooms toward expansion. Never opens detail.
- Pin tap gets a CARD, not a page: the shared kit sheet opens at peek (name + city), drag up for stats (CMS stars, beds, trauma level as kit stat tiles) and system. Selection shows on the map too (amber ring) and clears together with the card.
- Panning declutters: map drag drops the card back to peek.
- Basemap paints first; the hospital fetch starts after map load with a visible status chip; the chip reports success and fades.
- Locate me: the kit FAB, permission requested on tap, dot marker plus a capped fly-to. Denial degrades to a "pan to your area" message.
- One zoom contract: pinch and drag; rotation disabled.
- Motion rides HUKit.dcap: 250ms camera ceiling on phones.

## Round 2: the working demo (every numbered part of the §5b standard)

1. SEARCH PILL, top, persistent. Tap = full takeover with typed results (name, city, state, system). Pick = fly-to + card, and the pill keeps the name as the current scope with an ✕ to clear.
2. Scope and back fold into the top row (back chip + pill), nothing stacked.
3. + 4. FILTER CHIPS: all eight hospital types as colored kit chips in one rail. They re-cluster the source live (setData, not a paint filter), so counts and clusters are always true. Chips never navigate.
5. PIN → CARD on the detent sheet at peek; drag up for stat tiles; amber ring marks the selection on the map; dismissing either clears both.
6. LOCATE FAB via HUKit.locate.
7. LIST/MAP DUALITY: a "List · N in view" pill in the thumb zone opens the sheet at half with everything in the current viewport, biggest first. Pan the map, the list follows. Tap a row: fly-to + card with a "Back to list" path. This is the NN/g finding in code: list for finding, map for distribution.
8. PAN DECLUTTERS: dragging drops the card to peek.
9. THEME-AWARE BASEMAP: OpenFreeMap hosts a dark set: fiord (dark navy, nearly the HU palette) for dark mode, positron for light. The site's theme toggle swaps styles live and the data layers reinstall without duplicating listeners.
10. Every camera move rides dcap (250ms phone ceiling); the data fetch is signaled; basemap paints first.

## Round 3: selectable states and counties (David's ask)

- NEW boundary data in OUR deploy at /assets/data/geo/: states (52 features, 74KB, Census-derived lon/lat, coordinates rounded to ~11m) load with the hospitals; counties are split into 52 per-state files (2.2MB total, 10-225KB each) that load ONLY when their state is selected, cached, with a "Loading New Mexico counties…" signal. Rule 7, working as designed.
- TAP A STATE: the camera fits its bounds, a teal boundary lights, and the sheet opens a state card at peek: hospital count, total beds, average CMS star (all recomputed live under the active type chips), plus the three biggest hospitals as tappable rows.
- TAP A COUNTY (once its state is selected): amber highlight, county card at half with the same stats computed by POINT-IN-POLYGON against the actual county line, not by address text. Verified against real data: Bernalillo catches 7 of NM's hospitals; 44/45 NM hospitals land in a county (one ZIP-centroid sits just over a line; CMS geocoding grain, documented and expected).
- ONE CLICK ROUTER owns priority: pin over cluster over county over state, so tapping a dot inside a county inside a state does the right thing every time.
- THE X WALKS YOU BACK OUT: pin card → county card → state card → United States. Drag-down always dismisses fully.
- Filter chips recompute open state/county cards live.

## The pharmacy milestone (built; the last engineering gate on the real conversion)

- scripts/build-geo-serving.js is now the ONE reproducible generator for every geo-v2 serving artifact: the camera-safe states file, the 52 per-state county files, and NEW: 54 per-state pharmacy shards cut from the 6.15MB supplier file (ready-to-serve GeoJSON, title-cased, all 40,606 points preserved, verified). Sources cache in scripts/.cache like the rest of the pipeline.
- The demo grew a dataset switch: Hospitals / Pharmacies chips lead the filter rail. Pharmacy mode loads a state's shard ONLY when that state is selected (signaled, cached); at U.S. zoom the map is honest about it ("Pharmacies load per state. Tap a state"). Worst-case single fetch is New York at 711KB. A phone never sees the 6.15MB file. That is rule 7 proven end to end, and the exact pattern the real operators-map conversion uses.
- Cards, list, search, and counts all follow the active dataset; type chips are hospital vocabulary and leave in pharmacy mode; county cards show pharmacies per 10k residents.

## THE CONVERSION MAP (David's green light, 2026-07-19: "apply the operations map and the Pop Health map to this type of mapping")

Both conversions run on this stack. Feature-by-feature, here is where each production capability lands:

**Operators map → this stack.** Already proven in the demo: state/county drill with real profiles (was: D3 zoom-to-bounds), dataset switching with shard loading (was: whole-file fetch, 6.15MB worst case), type filtering that re-clusters (was: paint-opacity toggling), search with fly-to (was: dropdown), clustering (was: hand-rolled grid clusters + spiderfy), county choropleth overlay (was: countyMetric), locate me (was: nothing), facility profiles with ownership / ER / CMS ID / Google Maps link, HEALTH SYSTEM drill-through (tap the system name on any card → its whole national footprint framed, profiled, listed), and shareable URLs (?ds=&types=&state=&county=&sys=). Remaining for the production swap: the dialysis/ASC/DME/optical/orthotics datasets get sharded exactly like pharmacy (the script is one loop away), the US-grain metric choropleth on states, and the URL contract matched to the old page's parameters so old links keep working. Then /tools/healthcare-operators-map/ swaps its body and the D3 version moves to archive/.

**Pop Health Multi-Lens → this stack.** The conversion KEEPS its identity: the lens strip, metric system, year slider, compare mode, rankings, and trends are data machinery, not canvas; they move over unchanged. What swaps: the D3 AlbersUsa SVG becomes the MapLibre canvas, which buys real county boundaries at every zoom (the demo's county files), the quantile choropleth as a paint expression (the demo's shade-counties IS this), GPS find-my-county (already live on the production page via the kit), pinch that feels like a map instead of a scaled SVG, and the basemap context that makes a county recognizable by its roads. Its bottom bar and sheets already follow the kit.

**Order:** operators first (the demo is 80% of it), Multi-Lens second (bigger identity, more data machinery to carry). Both as parallel pages until tested, then URL swap, same discipline as this demo.

## Rounds 13-16: the demo passed the operators map (all David-approved)

- ALL SEVEN DATASETS, AS LAYERS NOT MODES: toggles that stack on one map, each non-hospital layer in its own color, hospitals keeping the type palette. Only pharmacy needed shards; dialysis/ASC/DME/optical/orthotics (0.8-1.5MB each) load whole on first toggle, signaled and cached. The union feeds counts, list, search, cards, shading, and URLs (?layers=hosp,dial,pharm).
- THE GEO-1 NATIONAL READ: at country zoom the map is shaded states with the count dead center: no dots, no clusters until z4.6. Count shading is the default, so the page opens looking like the old operators map and drills like Zillow.
- COUNTS BROKEN OUT EVERYWHERE: live in-view tallies ON each chip; desktop state hover decomposes a state's total per layer with colored dots; state and county cards carry per-layer breakdown rows.
- OLD-LINK COMPAT: ?res/?org/?hide/?fac all translate, so no existing bookmark breaks at swap time.
- Alaska/Hawaii insets: the AlbersUsa relocation is synthetic and impossible on a real basemap, so the answer became two corner inset mini-maps at the national view. BUILT in round 18.
- Per-type marker ICONS: BUILT in round 18. Fourteen canvas-drawn shapes (cross, triangle, drop, pill and friends), type-colored with a dark rim, registered as sprites.

## THE SWAP: EXECUTED 2026-07-19 (David: "archive all V1s and put these in their places")

- /tools/healthcare-operators-map/ IS the v2 (all seven layers, icons, draw search, insets, system drill, county profiles, GPS). The D3 v1: archive/operators-map-2026-07-19-d3-v1.html.
- /tools/multi-lens-map/ IS the v2 (six lenses, 40+ metrics, year model with est. labeling, sparklines, rankings, compare, county grain, GPS). The D3 v1: archive/multi-lens-map-2026-07-19-d3-v1.html.
- Both pages carry production front matter, identity pills, the HU attribution strip (OSM credit moved bottom-left), and FULL old-link compatibility (operators: ?res/?org/?hide/?fac; multi-lens: ?lens/?metric-slug/?state). The secret-menu pilots are deleted and their URLs 301 to the production tools.
- Known v1 features NOT carried, by scope call: the multi-lens entity panels (top hospitalization causes / systems / insurers per state), its compare-two-in-URL mode, the colorblind toggle, and the 12-card tutorial. The operators v1's per-state number toggle and legend-band isolation died with the D3 canvas (the v2 answers differently: numbers-by-default, chips, hover breakdowns). If any of these are missed in practice, they are ports, not rebuilds.

## Verification record

- Eleventy build clean (43 files). All 6 inline scripts on the built page parse.
- 15/15 checks: pinned CDN URLs, kit wiring (sheet, locate, dcap), cluster-tap-zooms, pan-drops-card, load-order and signaling, rotation off.
- Data repro against the deployed JSON: 5,366/5,366 records carry valid lon/lat in the right order; every feature has id and name.
- Live HEAD checks: tiles.openfreemap.org styles fiord/positron/dark/bright all 200, jsdelivr MapLibre 5.6.0 → 200.
- Demo round: 17/17 checks (standard parts wired, theme reinstall guarded, XSS-safe name injection) plus logic repros on the real data: type filter counts exact (cah+rural = 1,419), viewport scan over a New Mexico box plausible, search "santa fe" hits, list sorts biggest-first.
- Not headless-verifiable: tile rendering, gesture feel, cluster animation, the actual point of this page. Phone required.

## The decision this page exists to answer (doc §9, decision 1)

If the pilot feels like Zillow on your phone: the full Phase 3 conversion goes ahead on the operators map (MapLibre replaces the D3 canvas there, pharmacy gets sharded for viewport loading, search moves to a pill, the deck's selectors stay). If OpenFreeMap ever wobbles, the hedge is self-hosting or falling back to the D3 map, which never left.

Rollback: delete src/secret-menu/geo-v2/ and the card on the secret menu index. Nothing else references it.
