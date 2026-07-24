# Healthcare Uncharted — Data Contract

This is the spine. Every dataset, tool, and round on the site joins through the
canonical keys defined here. The goal: tap different datasets, overlay them, and
move between the granular (one hospital) and the macro (national counts) without
re-deriving anything or guessing how two files relate.

If you are adding data, conform to this. If a new need does not fit, change this
doc first, then the data.

---

## The model in one breath

A small set of **reference (dimension) files** define the shared vocabulary and
keys. A few large **fact files** hold the raw rows and reference the dimensions by
key. A **build step** rolls facts up to shared grains so macro views always agree
with the granular source. Templates read rollups at build time; tools fetch the
derived JSON at runtime.

```
reference (small, committed)        fact (large)                derived (generated)
  registries/geo.json                assets/data/us-hospitals     assets/data/derived/*.json
  registries/counties.json           assets/data/us-counties      _data/facility.js (in-template)
  registries/facility-types.json     _data/stateData.json
  registries/ownership.json          _data/metricsConfig.json
  registries/taxonomy.json
  registries/systems.json
```

---

## Canonical identifiers (the only keys you join on)

| Entity | Canonical key | Format | Where it lives | Notes |
|--------|---------------|--------|----------------|-------|
| **State** | `stateAbbr` | 2-letter (`AL`) | `registries/geo.json` | Also carries `fips` + `name`. |
| **State (numeric)** | `stateFips` | 2-digit string (`01`) | `registries/geo.json` | `countyFips.slice(0,2) === stateFips`. |
| **County** | `countyFips` | 5-digit string (`01001`) | `registries/counties.json` | Carries `name`, `stateFips`, `stateAbbr`. |
| **Facility** | `ccn` | CMS cert number (`010001`) | `us-hospitals.json` (`id`) | Gold-standard hospital key. |
| **Health system** | `systemId` | kebab slug (`hca-healthcare`) | `registries/systems.json` | Slug of the system name; registry adds metadata. |
| **Metric** | `metricId` | `lens/slug` (`patient/diabetes`) | `metricsConfig.json` (`items[].id`) | Live since 2026-07. Writers resolve id → index via `scripts/lib/metric-id.js`; data files still KEY on index — see "Known debt". |
| **Domain** | `domain` id | kebab (`provider-ops`) | `registries/taxonomy.json` | One classification for everything. |
| **Content node** | `nodeId` | kebab (`prior-auth`) | atlas graph | `{parent}-{child}` for hierarchy. |
| **Time** | `year` | 4-digit int (`2024`) | per-dataset | First-class facet; enables time series. |

**Rule:** never reuse a code for a new meaning, and never rename a code in place —
add a new one and crosswalk it. Labels can change freely; codes cannot.

---

## Reference files

### `registries/geo.json`
State spine. `states[abbr] = { fips, abbr, name }`. 50 states + DC + 5 territories.
Regenerate with `npm run build:geo`.

### `registries/counties.json`
`counties[countyFips] = { name, stateFips, stateAbbr }`. 3,231 counties.
Generated from us-atlas. This is the file that lets facility data (which carries
county **names**) join to county population (which is keyed by **FIPS**).

### `registries/facility-types.json`
Controlled vocabulary for the facility `t` field: `acute, cah, psych, child, ltac,
rural, va, dod`, each with label, definition, and group.

### `registries/ownership.json`
Controlled vocabulary for the facility `o` field: `gov, np, fp`.

### `registries/taxonomy.json`
The one canonical classification (`domains`) plus crosswalks that map the three
legacy vocabularies onto it:
- **lens** (4Ps map): `patient, clinical, operations, payer, policy, economics, baseline`
- **fourPs** (rounds tags): `patient, provider-p2a, provider-p2b, payer, policy`
- **atlasZone**: `patient, provider, payer, policy, pubhealth, medsci, techeco`

Classify new content by `domain` id; the crosswalks keep the old tags working.

### `registries/systems.json`
Health-system registry, seeded from facility data (`systemId -> name, facilityCount,
stateCount`). Hand-enrich it (ownership class, PE-owned, faith-based, etc.). Once it
exists, `build-data` will not overwrite it.

---

## Fact files

### `assets/data/us-hospitals.json`
The granular roster. ~5,366 facilities. Fields (compact keys to keep it small):
`id` (ccn), `n` name, `c` city, `s` stateAbbr, `co` county name, `z` zip, `t` type,
`o` ownership, `od` ownership detail, `e` ER, `r` CMS star, `la/lo` lat/lng,
`beds`, `trauma`, `sys` system name. Sourced from CMS Care Compare + CovidCareMap +
HIFLD + AHRQ Compendium (see its `_meta`).

### `assets/data/us-counties.json`
`countyFips -> { p: population }`. 3,144 counties.

### `_data/stateData.json`, `metricsConfig.json`, `dataYears.json`
The 4Ps-map metric layer. State-level values keyed `lens -> metricIndex -> stateAbbr`.

---

## Derived files (generated — never hand-edit)

`npm run build:data` reads the facts + registries and writes:

| File | Shape | Use |
|------|-------|-----|
| `data-build/national-summary.json` | totals + `byType` + `byOwnership` + join stats | macro headline numbers |
| `data-build/facilities-by-state.json` | `states[abbr] = { total, byType, byOwnership, beds, population, per100k }` | overlay onto the 4Ps state map |
| `data-build/facilities-by-county.json` | `counties[fips] = { total, byType, population, per100k }` | county choropleths |
| `data-build/facilities-by-system.json` | systems sorted by facility count | operator views |

The same rollups are available **in templates** via `_data/facility.js`
(e.g. `{{ facility.national.byType.cah }}`), computed by the same `aggregate()`
engine so in-page numbers and fetched JSON never drift.

---

## The join contract (worked examples)

- **Facility → county population:** `us-hospitals.s` + normalized `us-hospitals.co`
  → `countyFips` (via `counties.json`) → `us-counties[countyFips].p`.
- **Facility → state population:** sum `us-counties[fips].p` where
  `fips.slice(0,2) === geo.states[abbr].fips`.
- **Facility rollup → 4Ps state map:** both are keyed by `stateAbbr`, so
  `facilities-by-state[abbr]` overlays directly on `stateData[lens][i][abbr]`.
- **Round → atlas node:** `rounds[].map_node` + `map_connections` reference `nodeId`s
  (wiring still pending — see "Known debt").

County-name joining is normalized in `scripts/lib/aggregate.js` (`normCounty`):
case, accents, periods/apostrophes, directional abbreviations, `Saint`, and the
`County/Parish/Borough` suffixes. Current match rate **99.83%**; the ~9 misses are
genuine typos in the CMS source and are logged on every run.

---

## How to add a dataset

1. Decide the grain (facility / county / state / national) and the `domain`.
2. Reference geography by `stateAbbr` or `countyFips`, systems by `systemId`,
   classification by `domain` — never by ad-hoc strings.
3. Large + runtime-fetched → `assets/data/`. Small + build-time → `_data/`.
4. If it rolls up, add it to `scripts/lib/aggregate.js` so the rollup is the one
   source of truth, and expose it through `_data/facility.js` and/or a derived file.
5. Document its schema and keys here.

## Refreshing

- `npm run build:geo` — re-pull state/county names (rarely needed).
- `npm run build:data` — re-derive rollups after the facility roster changes. Runs
  automatically before `npm run build`.

## Known debt (tracked, not done in this pass)

- **Metric identity: ids are live, data-file keys are not.** Every `metricsConfig`
  item now carries a stable `id` (`lens/slug`); pull scripts resolve id → index at
  boot (`scripts/lib/metric-id.js`), and `build:entities` fails on missing or
  duplicate ids. Still index-keyed: `stateData`/`countyData`/`dataYears` storage
  keys, `cross-links.js` `METRIC_EXPECT`, and the multi-lens map internals — so
  APPEND-only remains the rule until those re-key by id.
- **map_node / map_connections are defined but unwired** — and superseded. The
  linking rule became "content deep-links to existing tiles, never its own node",
  and `atlasLinks` (in `_data/rounds.js`) is the wired mechanism as of 2026-07-09:
  index-card pills and post-meta pills link INTO `/atlas/#zone/node`, and the atlas
  HUD's Connected column lists linking content back OUT (`CONTENT_LINKS`, emitted
  at build time in `src/atlas/index.njk`). Remove map_node/map_connections or
  repurpose them when article-level nodes are revisited. Learn modules and talks
  joined the loop 2026-07-10: `atlasLinks` authored in `_data/learn.js` (live
  modules 📘 + talks 🎤 now emit into CONTENT_LINKS alongside rounds 📋), with
  hand-placed pill rows in each page hero. `learn.js` modules[] was synced to
  the live pages for this (the coming-soon entries are still the old aspirational
  list); the file remains unconsumed by templates otherwise.
- **Atlas zone data is hardcoded in `src/atlas/index.njk`**, not in a registry.
- **~9 CMS county typos** unmatched; add an alias patch to `normCounty` if needed.
