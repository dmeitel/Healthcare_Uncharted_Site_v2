# Data Expansion + Map UX — Morning QA
### Sessions 2026-07-22/23 · one uncommitted changeset · 24 files

You went to bed, the build kept going. The Census key came in this morning and
the ACS pull is DONE — so everything below is data on disk. What's left for
you: visual QA and the commit.

---

## What landed overnight (all verified, nothing committed)

**Eight new metrics + four county-grain upgrades.** Patient lens 8 → 15,
baseline 13 → 14, and 62 metrics total (16 with county drill-down):

| Metric | Source | Counties | States |
|---|---|---|---|
| Adult smoking rate | CDC PLACES | 2,956 | 49 (KY/PA restricted) |
| COPD prevalence | CDC PLACES | 2,956 | 49 |
| Asthma prevalence | CDC PLACES | 2,956 | 49 |
| High blood pressure | CDC PLACES | 2,956 | 49 |
| Depression prevalence | CDC PLACES | 2,956 | 49 |
| Premature death (YPLL) | County Health Rankings | 3,082 | 51 |
| Low birthweight | County Health Rankings | 3,043 | 51 |
| Average household size (NEW) | Census ACS 2024 5-yr | 3,142 | 51 |
| Median age (now county-grain) | Census ACS 2024 5-yr | 3,143 | 51 |
| Population under 18 (now county-grain) | Census ACS 2024 5-yr | 3,141 | 51 |
| Population 65+ (now county-grain) | Census ACS 2024 5-yr | 3,141 | 51 |

ACS also refreshed the under-18 / 65+ state values from the stale 2022
hand-entered vintage to 2024 (real drift, e.g. UT under-18 29.8 → 27.8).

Spot-checked against known epidemiology: UT 6,429 YPLL vs MS 13,328. MS leads
low birthweight at 12.2%. McDowell County WV at 24,029 YPLL. The data is real.

**Stable metric IDs are live.** All 61 metrics carry `id: "lens/slug"`. Pull
scripts resolve by id (zero hardcoded indices), `build:entities` fails on
missing/duplicate ids. Data files still key on index, so APPEND-ONLY still
rules. DATA.md updated.

**Navigation followed the data in**, like you said it would:
- Metric popover has type-ahead searching ALL lenses; picking a foreign-lens
  metric jumps the lens with it
- ‹ › steppers on the metric pill, one metric per tap, position counter
- COUNTY_IDX derives itself from countyData.json at runtime — future pulls
  light up county choropleths with no map-code edits

**Plus the 07-22 UX fixes**: theme-corrected lines/labels/halos on both maps,
cluster-count halos, chip-rail divider + visible scrollbar, honest phone
filter pill, dark-theme attribution.

---

## Morning checklist

### 00000000. ROUND NINE — bigger table + resizable drawer (monitor only)
- [ ] Table sizes up: values 17px, ranks 14px, roomier cells
- [ ] Desktop: hover the drawer's LEFT edge → teal glow, ew-resize cursor;
      drag to resize 300–640px; FABs slide with it; width remembered and
      SHARED across both maps
- [ ] Phone/tablet (<1100px): no grip, sheet behavior untouched

### 0000000. ROUND EIGHT — the primary table (your spec, verbatim)
Cards restructured: primary metric = a comparison TABLE, secondary metrics
fold behind ONE switch. Check:
- [ ] County card: rows Value/Rank/Population × columns County | UT state.
      County ranks in-state (#1 of 29 in UT); STATE ranks in the NATION
      (#23 of 51 US) — the new cell
- [ ] Population row: county AND state (rolled from the county file; UT
      should read 3.5M, nation 340M on the state card)
- [ ] State card: same table, State | Nation columns (nation shows the avg)
- [ ] "More metrics · N" switch below the table holds ALL ◯/★ tiles;
      closed by default, stays open across cards once flipped
- [ ] No-data counties (Piute) read cleanly: "no data" cell, ranks "—"
- [ ] Rank cells color: teal top-tier, amber bottom-tier

### 000000. ROUND SEVEN — "This view" block + sub-text readability
- [ ] Display tab now OPENS with "This view": Color = <metric> with its full
      definition + source/year, then ◯ Size and ★ Card rows — the whole
      composition readable as one piece; updates live as you change anything
- [ ] Sub text bumped drawer-wide on BOTH maps: t3→t2 + 1-2px up (option
      tags, section subs, card tile labels, source lines, facts). Squint test
      in both themes
- [ ] Overlay section slimmed (its explainer moved into This view)

### 00000. ROUND SIX — pins (variables 3+) and readable headers
The map's two channels are full; more variables ride the CARD. Check:
- [ ] Every metric row now has ☆ next to ◯ — tap ☆ to pin (amber ★ when on)
- [ ] Pin up to FOUR; the fifth gets refused with a message
- [ ] Every state/county card gains a ★ tile per pin: value + rank (county
      grain where it exists, state value labeled otherwise)
- [ ] Fill and overlay metrics never double up as pin tiles
- [ ] "Pinned to cards" section in Display: chips with ✕, count "n/4"
- [ ] Switching Display → Details re-renders the card fresh (no stale tiles)
- [ ] URL carries ?pins= — the whole multi-variable view is shareable
- [ ] Section headers are REAL headers now (both maps): bold display face,
      mono meta on the right ("Patient · 2/15", "only = solo")

### 0000. ROUND FIVE — two metrics, one view (the overlay)
Color = fill metric, SIZE = a second metric as circles. Hard cap of two.
Try the pairing you named: Patient · Coronary heart disease, then tap the ◯
next to Clinical · Registered nurses per 100k. Check:
- [ ] Blue circles appear per state, sized by RN density; red states with
      small circles = the mismatch story, visible at a glance
- [ ] Drill into a state: circles re-bucket per county (county-grain overlay
      metrics only; others show no county circles — honest)
- [ ] Legend gains "· ◯ size = …"; pill face gains "+ ◯ …"
- [ ] State/county cards show BOTH values (◯ tile with rank)
- [ ] Display tab: Overlay section shows the pairing + ✕ Clear;
      ⬤ marks the overlaid metric in the list
- [ ] Picking the overlay metric as fill auto-clears the overlay
- [ ] URL carries ?ov= — shareable two-metric views survive reload
- [ ] Circles never block state/county taps

### 000. ROUND FOUR — nav left, view right, ONE destination
Your call: no more filter on one side, display on the other. Check:
- [ ] Multi-lens: bar reads left→right as [ident][◀ scope] ......... [‹ pill ›]
      — the view group parks RIGHT, stacked over the drawer
- [ ] The metric pill OPENS THE DRAWER's Display tab (the floating popover is
      gone; ⚙ is gone — pill and drawer are the same destination now)
- [ ] Display tab leads with the metric browser: search + all lenses as
      sections, current lens first, "Metric · Patient · 3/15" header
- [ ] Desktop: picking a metric keeps the drawer open, map repaints beside it
      (browse mode); phone: picking closes the sheet (canvas mode)
- [ ] Operators: Layers/Types pills also park right, over their drawer
- [ ] Steppers ‹ › still one-tap shuffle with the drawer closed

### 00. ROUND THREE — the chrome refactor (variant A, trial run)
The whole control surface was rebuilt to the new grammar (one bar, one
drawer, one cluster — HU-UI-GRAMMAR.md §9). Check:
- [ ] Operators: chip rail GONE. Bar shows "Layers · Hospitals" and
      "Types · All" readout pills; tapping either opens the drawer's
      Display tab. Under 850px they fold into one ⚙ Display pill
- [ ] Display tab holds: Layers, Hospital types (each type has a one-tap
      "only"), Shade counties by, Map labels switches. Live counts on chips
- [ ] State card now links "◩ Shade counties by a metric…" into Display
- [ ] Labels FAB is gone from BOTH maps (its switches live in Display);
      corner cluster is locate+draw (operators) / locate (multi-lens)
- [ ] Multi-lens: lens chip rail GONE. Pill reads "Patient · Adult smoking
      rate · 9/15 · 2023"; the picker lists ALL lenses as sections (current
      lens first); search still jumps lenses; ⚙ button opens Display
- [ ] Details|Display tabs on both sheets; Esc/X back-walk still sane
- [ ] Phone: sheet tabs reachable, no rail anywhere, thumb flow intact

### 0. Round-two additions (from your live QA, 07-23)
- [ ] Label hierarchy: county labels bold, basemap city names muted secondary
- [ ] Year pill matches the metric's data year (cancer mortality = 2021, axis
      2015–2021; every metric gets its own honest 7-year axis)
- [ ] State VALUES under state names at the national view; hand off to county
      labels on zoom
- [ ] Labels FAB (layers icon, both maps): State names / City names toggles,
      persisted + shared between maps, survive theme swaps; data labels exempt
- [ ] Open call: Premature death's axis ends 2025 (CHR release year); pin to
      the data window instead if that reads wrong

### 1. Visual QA (dev server, both themes)
- [ ] Multi-lens: metric pill shows "1/15 · 2023"; ‹ › steps and wraps
- [ ] Popover: type "smok" → Adult smoking rate; type "income" → hits from
      two lenses with lens tags; picking one switches the lens chip
- [ ] Patient lens → Adult smoking rate: KY + PA render no-data gray.
      CORRECT — their data-use restriction, not a bug
- [ ] Premature death: drill into a state, county labels show YPLL values;
      sparse rural counties gray (CHR suppression, expected)
- [ ] LIGHT theme: state/county boundary lines visible (dark ink now),
      state count numbers on operators map dark, cluster counts readable
- [ ] Operators map: rail has a divider before "All types", thin scrollbar
      under the chips; state card "Shade counties by" now has Smoking + COPD
- [ ] Attribution chip bottom-left readable in dark theme

### 2. The Census key — DONE ✓
Key received 07-23 morning, stored in `scripts/.cache/census-key.txt`
(gitignored, verified). ACS 2024 5-year pulled, drift guard passed (median
age matched existing values exactly — variable mapping proven), written,
rebuilt. Note: a fresh key can 302 for a minute after activation before the
API accepts it; that's propagation, not a broken key.

Extra QA now possible:
- [ ] Patient lens → Median age: county drill-down works (was state-only)
- [ ] Baseline lens → Average household size: UT darkest/largest (2.97)
- [ ] Popover search "household" → finds it in baseline

### 3. Commit
One changeset, 24 files. Data files (countyData/stateData/dataYears/
metricsConfig) and derived files (entities, search-graph, datamap) all
regenerated and consistent. Verification: 25 checks green (values spot-checked
against known epidemiology and demography).

---

## Known/expected states, not bugs
- KY/PA gray on the 5 new PLACES metrics (restriction; documented in
  scripts/pull/README.md)
- YPLL/LBW gaps in small rural counties (CHR suppression)
- New metrics have no trend model → year pill dims on them. Honest.
- countyData.json now minified: 707 KB carrying 16 county layers (the old
  pretty-printed file was about the same size carrying 8)

## Deliberately left as your calls
- Choropleth SCALE ramp is still one palette for both themes
- "Six lenses" copy now reads "Six lenses + baseline" — veto if wrong
- Type-chip solo/radio behavior on the operators map rail
- Which county-shade metrics belong in the operators map picker (now 6)

## Next sources when you want them
- CDC WONDER natality (teen births, prenatal care) — API is clunky but keyless
- USDA Food Access Research Atlas — county food deserts
- HRSA HPSA shapefiles — county shortage-area overlay for the operators map
