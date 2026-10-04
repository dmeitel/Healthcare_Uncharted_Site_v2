# Data source fetchers

Each file here pulls one public source, cleans it, validates it, and (on `--write`)
updates the site's data. They are the reproducible refresh layer behind
`/learn/healthcare-data-sources/`.

## How to refresh

```bash
npm run pull:all            # dry run everything — pull, validate, DIFF. Writes nothing.
# review the diffs printed per source, then:
npm run pull:all -- --write # apply everything
npm run build               # regenerate the entity graph + site so it flows everywhere
```

Per-source: `npm run pull:places`, `npm run pull:bls` (same `--write` / `--refresh` flags).

**Safe by default.** Every fetcher dry-runs unless given `--write`, validates the
full state set before writing, and refuses to write on unexpected drift. So a
scheduled dry run is a zero-risk "is there new data?" check: if a fetcher reports
states changed, a fresh release landed and it's time to `--write`.

## Sources

| Fetcher | Source | Dataset | Grain | Refresh cadence | Feeds |
|---|---|---|---|---|---|
| `places.js` | CDC PLACES | County 2025 release `swc5-untb` (BRFSS) | county → state rollup | annual (~summer), ~2yr lag | patient lens (10 metrics: health status + smoking, COPD, asthma, BP, depression) |
| `bls.js` | BLS LAUS | bulk `la.data.64.County` | county → state rollup | annual averages (~spring) + monthly | economics + baseline unemployment |
| `acs.js` | Census ACS 5-year | API `acs/acs5` + `acs5/subject` | county + official state rows | annual (~December) | median age (patient), household size + age mix (baseline) |
| `ooh.js` | BLS Occupational Outlook Handbook + Employment Projections table 1.2 | one page per occupation in `career-tree-bls.json` | national, per occupation | annual (~September) | Career Tree pay, 10th to 90th percentile, growth, openings |
| `oews-states.js` | BLS Occupational Employment and Wage Statistics | public data API, series `OEUS<state>00000000000<soc>13` (annual median), 25 series a request, cached | state, per occupation (10 healthcare jobs) | annual (~spring, May estimates) | `src/assets/data/state-pay.json`: Vital Stats state pay questions; since 2026-10-02 also the Population Health Map's ten pay measures (Clinical lens, `clinical/pay-*` in stateData.json) |
| `hcris.js` | CMS hospital cost reports (HCRIS, form 2552-10) | `hosp10fy<year>.zip` from downloads.cms.gov (129 MB, cached), Worksheet S-3 Part I | hospital (CCN) | annual; a fiscal year's file keeps filling for about two years | `scripts/data/hospital-cost-reports.json`: Vital Stats health system games, and (since 2026-10-02) the Hospital Operations Map's cost report cards via `src/assets/data/us-hospital-cost-reports.json`, written by `build-vital-stats-systems.js` with the questions' own rules (beds, ICU beds, days, discharges, payer days incl. managed care, employees, residents). Spot-checked 2026-10-01: the burn ICU line and the POS file's staff counts did not survive, so neither is used |
| `ipeds.js` | NCES IPEDS (the federal college survey) | `C<yr>_A.zip` completions, `HD<yr>.zip` directory and `EF<yr-1>A_DIST.zip` distance education enrollment from nces.ed.gov/ipeds/datacenter/data/ (about 6 MB, cached), plus each file's `_Dict.zip`, whose first page says provisional or final | school (UNITID) x program | annual: provisional each fall, final a year later; re-run when the final lands (on 2026-10-03 the 2023-24 completions were still the provisional file of 2025-09-21) | `src/assets/data/us-health-schools.json`: the Schools layer of the Hospital Operations Map (RN, NP, DNP, MD, DO, PA, RT programs, graduates by award level, online share). The program rules (CIP codes x award levels) are written once, at the top of the script |
| `telehealth.js` | CMS Medicare Telehealth Trends (Original Medicare Part B claims) | the dataset's data-viewer (data.cms.gov data-api, dataset `939226be-b107-476e-8777-f199a840138a`) names the current CSV, `TMEDTREND_PUBLIC_<date>.csv` (about 3 MB, cached) | state | quarterly; the measure uses the latest calendar year with all four quarters (2025 on 2026-10-03), and CMS calls its periods preliminary | clinical: Medicare telehealth use (`clinical/medicare-telehealth-use`), the share of Medicare patients with a telehealth-eligible service who had a telehealth visit. Replaced the hand-entered "Telehealth adoption" on 2026-10-03 |
| `accreditors.js` | The program accreditors: LCME (MD), AACOM (DO colleges and campuses), ARC-PA (PA), CoARC (RT), CCNE and ACEN (nursing) | their public program lists (CCNE state by state, ACEN 60 a page), cached in scripts/.cache/accred; names, places, statuses and dates only | program | before each IPEDS re-run, and whenever a school question comes up; refuses to write a list that shrank by a third | `data-build/accreditors.json` (with `--write`; a dry run by default), read by `scripts/check-schools.js` (`npm run check:schools`), which matches each program to an IPEDS school and writes docs/HU-SCHOOLS-CROSSCHECK.md and the map's `src/assets/data/us-health-schools-accred.json`. Run it after every `pull:ipeds --write`: a test fails until the check matches the school file |
| `chr.js` | County Health Rankings | analytic CSV (`analytic_data<yr>[_v2].csv`) | county + official state rows | annual (~spring) | outcomes: premature death + low birthweight (patient) |

Fetchers address metrics by **stable id** (`lens/slug` in `metricsConfig.json`),
resolved to array position at boot via `scripts/lib/metric-id.js`. Never hardcode
an index in a fetcher again.

## Access gotchas (learned the hard way)

- **BLS** flat files (`laucnty<yy>.txt`) now 404. The bulk server works but **requires a
  descriptive User-Agent with a contact email** or it 403s. No API key. The county
  file is ~336MB; cached under `scripts/.cache/` (gitignored), `--refresh` re-pulls.
- **Census API** now **requires a key** (302 → missing_key). `acs.js` uses it: sign up
  free at https://api.census.gov/data/key_signup.html, then `set CENSUS_API_KEY` or
  drop the key into `scripts/.cache/census-key.txt` (gitignored). SAIPE/SAHIE dodge
  this by riding static files.
- **KY & PA** also gate NEW PLACES measures: with no prior state value to carry
  forward, they stay null and the map honestly shows no-data for those two states.
- **CDC PLACES** dropped its State file; we pull County and population-weight to states.
- **KY & PA** bar county-level release of PLACES chronic-disease measures — carried
  forward + flagged, not treated as missing.
- **CT & AK** changed county geography (CT planning regions 091xx; AK borough split).
  Data uses the new FIPS; the base map still draws the old shapes, so the operations
  map crosswalks them at render time. (Registry vintage fix is a tracked follow-up.)

## Adding a source

Write one `scripts/pull/<source>.js` on the same shape (pull → clean → validate →
diff → write on `--write`; store finest grain, derive state). `pull:all` auto-runs it.
Store county grain in `src/assets/data/countyData.json` (served, runtime fetch) and
state values in `src/_data/stateData.json` (build-time inject). Add metric metadata to
`countyData.meta` so tools can label it.

## Scheduling

`npm run pull:all` (dry run) is the unit a scheduled job runs to detect new releases.
It writes nothing; a human reviews the diff and applies `--write` + `npm run build`.
