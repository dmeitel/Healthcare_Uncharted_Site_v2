# HU Design Crit — Apple-lens review (2026-07-09)

**Status: REVIEW INPUT.** The judging question for every pixel: does it show data, or help someone act on data? If neither, it goes. Read alongside HU-CONTROL-ARCHITECTURE-V2.md; items here feed that work.

## Verdicts

### 1. Ornament impersonating instrumentation — DEMOTE
The graticule implies coordinates that don't exist; the compass rose sits on a projection with no meaningful north; the chart stamp is flavor. Deference rule: chrome never competes with content, and decoration is never mistakable for data. KEEP: brackets, ruler ticks (honest framing), mono readouts, tabular numerals, hairlines. DEMOTE to near-invisible or CUT: graticule, rose, stamp. The instrument identity lives in precision, not props.

### 2. Direct manipulation — ADOPT AS PRINCIPLE (feeds v2)
Every readout that CAN be a control SHOULD be:
- Legend buckets tap-to-isolate their range on the map.
- Inspector rows (hospital types, ownership) tap-to-filter the canvas.
- Trend charts scrub on drag.
The data becomes its own interface; "data front and center" turns literal.

### 3. Views need addresses — HIGHEST-VALUE FUNCTIONAL INVESTMENT
Every configured view gets a URL (`?res=dialysis&metric=stars&state=TX`). Buys simultaneously: working back button, refresh-safe state, shareable exact views, and Rounds posts that deep-link to the map view proving their point (the Atlas-linking vision generalized to every tool). Atlas already has hash deep-links; extend the pattern sitewide with one shared serializer convention documented in the shell doc.

### 4. Presets: curation over configuration
Each tool ships 2-3 authored starting views with editorial names ("For-profit dialysis concentration"). Presets = onboarding + editorial voice + shareable artifacts. Depends on #3. Presets can live in tools.js or per-tool front matter.

### 5. Phone ergonomics
- v2 selectors dock BOTTOM on phone (thumb zone; the Safari/Maps precedent), above the sheet zone.
- 44px touch-target floor on coarse pointers: current 11px chips are ~26px tall; add a `(hover:none)` padding bump.

### 6. Type-role discipline (anti label-soup)
Mono-uppercase-tracked text is reserved for true metadata: control-group labels, source lines, live readouts. Never content, never headings-in-disguise. Floor 10px. Add to shell doc.
Plus the HU lexicon — one word per concept, canon in the shell doc: Lens (what angle), Metric (what number), Layer (what's drawn), Grain (state/county), View (a configured state of a tool), Inspector (the detail dock), Scale (the color key). Kill synonyms in UI copy ("Color by" → "Metric" everywhere, or the reverse; pick once).

### 7. Motion + feedback grammar
- Every tap acknowledged <100ms: control state flips optimistically, canvas catches up.
- Popovers scale-fade from their trigger; sheets slide from their edge; 200ms ease-out standard, 300ms sheets; camera moves hold the focal point.
- Skeletons over spinners where layout is known.
- All through the existing reduced-motion `dur()` pattern. Write into shell doc like the z-scale.

## Suggested order of attack
1. Type-role + lexicon rules (words in a doc, cheap) and the ornament demotion (CSS deletions) — one sitting. **DONE 2026-07-08:** graticule/rose/stamp cut from Operators + Multi-Lens (the only two carriers); lexicon + type-role + no-ornament rules codified in HU-TOOL-SHELL.md; UI copy fixed ("Color by"/"Color" → Metric, "Key" → Legend, Multi-Lens Snapshot/Change toggle → Trend). Deferred: the 10px mono floor sweep (rule is in the doc; enforcement rides with the v2 pilot).
2. Control Architecture v2 pilot WITH direct-manipulation legends and bottom-docked phone selectors baked into the primitive designs (cheaper than retrofitting). **DONE 2026-07-08:** primitives in hu-global.css, Operators Map converted (3 chip rows → 2 selectors), legend buckets isolate, type legend filters, phone bottom dock + sheet popovers. Awaiting review.
3. URL state serializer on the Operators pilot, then everywhere. **DONE on the pilot 2026-07-09:** full view state round-trips (?res/metric/state/org/county/band/hide/fac), back button walks views, restore runs before first paint, defaults keep the bare path. Convention documented in HU-CONTROL-ARCHITECTURE-V2.md; sitewide after review.
4. Presets once URLs exist. **DONE where URLs exist 2026-07-09:** Operators (3 authored Views) and Multi-Lens (4) ship preset pins; Career Tree / Iceberg / Vendor have URL state but no authored views yet — writing those is editorial work, not plumbing. Atlas stays on hash links. **Steps 2-3 also fully rolled out 2026-07-09** — all tools migrated to v2 controls, URL state everywhere it applies; see HU-CONTROL-ARCHITECTURE-V2.md rollout outcomes.

## What survives the crit untouched
Tokens, shell, breakpoints, fixed-viewBox scaling, a11y layer, icon vocabulary, quiet-status pattern, scene palettes as content-bearing identity. The foundation is right; the crit is about the next layer, not rework.
