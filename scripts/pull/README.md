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
| `places.js` | CDC PLACES | County 2025 release `swc5-untb` (BRFSS) | county → state rollup | annual (~summer), ~2yr lag | patient lens (5 metrics) |
| `bls.js` | BLS LAUS | bulk `la.data.64.County` | county → state rollup | annual averages (~spring) + monthly | economics + baseline unemployment |

## Access gotchas (learned the hard way)

- **BLS** flat files (`laucnty<yy>.txt`) now 404. The bulk server works but **requires a
  descriptive User-Agent with a contact email** or it 403s. No API key. The county
  file is ~336MB; cached under `scripts/.cache/` (gitignored), `--refresh` re-pulls.
- **Census API** now **requires a key** (302 → missing_key). Not used yet; SAHIE/ACS
  fetchers will need a static-CSV path or a key.
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
