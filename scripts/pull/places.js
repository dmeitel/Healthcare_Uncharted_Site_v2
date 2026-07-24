#!/usr/bin/env node
'use strict';
/**
 * pull/places.js — the first SOURCE FETCHER. Refreshes the patient-lens metrics
 * that come from CDC PLACES, straight from the live CDC dataset.
 *
 * This is the worked example of the refresh loop in
 * /learn/healthcare-data-sources/ : pull -> clean -> validate -> diff -> (write).
 *
 * STORE FINEST, DERIVE STATE
 *   PLACES is county-native. So we STORE the county grain (one value per county
 *   FIPS) and DERIVE the state value as a population-weighted rollup of those
 *   counties. State is a *view* of county, never a separate hand-keyed dataset,
 *   so the two can never disagree. County tools read the fine layer; state tools
 *   read the rollup.
 *
 *   - County source: PLACES County Data 2025 release (swc5-untb, BRFSS 2022/23),
 *     crude prevalence. locationid is the 5-digit county FIPS.
 *   - State = sum(countyValue * adultPop) / sum(adultPop). Crude pop-weighting is
 *     the honest state estimate and matched existing values (UT diabetes 8.2->8.5).
 *
 * SAFE BY DEFAULT
 *   node scripts/pull/places.js            dry run: pull, compute, validate, DIFF. Writes nothing.
 *   node scripts/pull/places.js --write    apply: countyData.json + stateData.json (rollup) + dataYears + metricsConfig.
 *   node scripts/pull/places.js --refresh  ignore the local cache and re-pull from CDC.
 *
 * Source: https://data.cdc.gov/d/swc5-untb
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.join(__dirname, '..', '..');
const P = (...p) => path.join(ROOT, ...p);
const CACHE = P('scripts', '.cache');

const DATASET = 'swc5-untb';                 // PLACES County Data, 2025 release
const SOURCE_URL = 'https://data.cdc.gov/d/swc5-untb';
const VALUE_TYPE = 'Crude prevalence';
const CACHE_VER = 'v2';                       // bump when the $select changes (invalidates old cache)

// PLACES measureid -> the stable metric id it feeds. Array position is
// resolved from metricsConfig at boot (scripts/lib/metric-id.js) — indices
// are never hardcoded here, so config inserts can't repoint a write.
const MEASURES = [
  { id: 'GHLTH',      metric: 'patient/fair-poor-health',       name: 'Adults reporting fair or poor health' },
  { id: 'DIABETES',   metric: 'patient/diabetes',               name: 'Diabetes prevalence' },
  { id: 'CHD',        metric: 'patient/coronary-heart-disease', name: 'Coronary heart disease prevalence' },
  { id: 'OBESITY',    metric: 'patient/obesity',                name: 'Obesity prevalence' },
  { id: 'CHECKUP',    metric: 'patient/routine-checkup',        name: 'Routine checkup in past year' },
  { id: 'CSMOKING',   metric: 'patient/current-smoking',        name: 'Adult smoking rate' },
  { id: 'COPD',       metric: 'patient/copd',                   name: 'COPD prevalence' },
  { id: 'CASTHMA',    metric: 'patient/asthma',                 name: 'Asthma prevalence' },
  { id: 'BPHIGH',     metric: 'patient/high-blood-pressure',    name: 'High blood pressure prevalence' },
  { id: 'DEPRESSION', metric: 'patient/depression',             name: 'Depression prevalence' },
];
const LENS = 'patient';
const { metricIndexById } = require('../lib/metric-id');

// PLACES county data is suppressed for these states by their own data-use
// restriction (KY and PA bar county-level release of these measures). There is
// no county data to store for them, and the state rollup carries the existing
// state value forward. Absence of ANY OTHER state means the source drifted.
const KNOWN_RESTRICTED = new Set(['KY', 'PA']);

const WRITE   = process.argv.includes('--write');
const REFRESH = process.argv.includes('--refresh');

const read = (rel) => JSON.parse(fs.readFileSync(P(rel), 'utf8'));
const readIf = (rel) => { try { return read(rel); } catch { return null; } };
const round1 = (n) => Math.round(n * 10) / 10;

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { Accept: 'application/json', 'User-Agent': 'HealthcareUncharted-datafetch' } }, (res) => {
      if (res.statusCode !== 200) { res.resume(); return reject(new Error('HTTP ' + res.statusCode + ' for ' + url)); }
      let body = '';
      res.on('data', (d) => (body += d));
      res.on('end', () => { try { resolve(JSON.parse(body)); } catch (e) { reject(new Error('bad JSON from ' + url)); } });
    }).on('error', reject);
  });
}

// Pull every county row for one measure (crude prevalence), with caching.
async function pullMeasure(m) {
  const cacheFile = path.join(CACHE, `places-${CACHE_VER}-${m.id}.json`);
  if (!REFRESH && fs.existsSync(cacheFile)) return JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
  const q = new URLSearchParams({
    '$select': 'locationid,stateabbr,data_value,totalpop18plus,year',
    '$where': `measureid='${m.id}' AND data_value_type='${VALUE_TYPE}'`,
    '$limit': '6000',
  });
  const url = `https://data.cdc.gov/resource/${DATASET}.json?${q.toString()}`;
  const rows = await get(url);
  fs.mkdirSync(CACHE, { recursive: true });
  fs.writeFileSync(cacheFile, JSON.stringify(rows));
  return rows;
}

// The county grain we STORE: one crude prevalence per county FIPS. Only real
// 5-digit county FIPS within the 51 states (drops the national aggregate row).
function countyMap(rows, expectedStates) {
  const out = {};
  for (const r of rows) {
    const fips = r.locationid;
    const v = parseFloat(r.data_value);
    if (/^\d{5}$/.test(fips) && expectedStates.has(r.stateabbr) && Number.isFinite(v)) out[fips] = round1(v);
  }
  return out;
}

// The state view we DERIVE: population-weight county crude prevalences up to states.
function rollup(rows, expectedStates) {
  const acc = {};
  let year = null;
  for (const r of rows) {
    const st = r.stateabbr;
    if (!expectedStates.has(st)) continue;     // drop US row / territories
    if (r.year && (!year || r.year > year)) year = r.year;
    const v = parseFloat(r.data_value);
    const p = parseFloat(r.totalpop18plus);
    if (!acc[st]) acc[st] = { wv: 0, w: 0 };
    if (Number.isFinite(v) && Number.isFinite(p) && p > 0) { acc[st].wv += v * p; acc[st].w += p; }
  }
  const out = {};
  for (const [st, a] of Object.entries(acc)) if (a.w > 0) out[st] = round1(a.wv / a.w);
  return { values: out, year };
}

const fmtDelta = (d) => (d > 0 ? '+' : '') + d.toFixed(1);

(async () => {
  const stateData = read('src/_data/stateData.json');
  const countyData = readIf('src/assets/data/countyData.json') || { _readme: 'County-grain metric values per lens. Keys: lens -> metricIndex -> countyFIPS -> value. Generated by scripts/pull/*. Served at /assets/data/countyData.json for runtime fetch (operations map). State values in src/_data/stateData.json are the population-weighted rollup of these.' };
  const expectedStates = new Set(Object.keys(stateData[LENS]['0']));   // the canonical 51
  // resolve every measure's CURRENT index from its stable id, before any pull
  const bootCfg = read('src/_data/metricsConfig.json');
  for (const m of MEASURES) {
    const r = metricIndexById(bootCfg, m.metric);
    if (r.lens !== LENS) throw new Error(`${m.metric} resolved to lens "${r.lens}", expected "${LENS}"`);
    m.index = Number(r.index);
  }
  console.log(`Refreshing ${LENS} lens from CDC PLACES (${DATASET}). Store COUNTY, derive STATE (crude, pop-weighted).`);
  console.log(`Mode: ${WRITE ? 'WRITE' : 'DRY RUN (no files touched)'}${REFRESH ? ' · cache bypassed' : ''}\n`);

  const results = [];
  let dataYear = null;
  let problems = 0;

  for (const m of MEASURES) {
    const rows = await pullMeasure(m);
    const county = countyMap(rows, expectedStates);
    const { values: stateValues, year } = rollup(rows, expectedStates);
    if (year && (!dataYear || year > dataYear)) dataYear = year;

    // derive: carry restricted states' EXISTING state value forward. A NEW
    // metric has no history to carry — KY/PA stay null (the map paints
    // no-data, which is the honest read). Any OTHER missing state is drift.
    const current = stateData[LENS][String(m.index)] || {};
    const carried = [], restrictedNull = [], drift = [];
    for (const st of expectedStates) {
      if (stateValues[st] != null) continue;
      if (KNOWN_RESTRICTED.has(st)) {
        if (current[st] != null) { stateValues[st] = current[st]; carried.push(st); }
        else restrictedNull.push(st);
      }
      else drift.push(st);
    }
    const ok = drift.length === 0;
    if (!ok) problems++;

    // state diff vs current
    const deltas = [];
    for (const st of expectedStates) {
      const oldV = current[st], newV = stateValues[st];
      if (newV == null || carried.includes(st)) continue;
      if (oldV == null) deltas.push({ st, oldV: null, newV, d: 0 });
      else { const d = round1(newV - oldV); if (d !== 0) deltas.push({ st, oldV, newV, d }); }
    }
    deltas.sort((a, b) => Math.abs(b.d) - Math.abs(a.d));

    // county diff vs current (first run = brand new layer)
    const prevCounty = (countyData[LENS] && countyData[LENS][String(m.index)]) || null;
    const countyChanged = prevCounty ? Object.keys(county).filter((f) => round1(prevCounty[f]) !== county[f]).length : null;

    console.log(`  [${m.id} -> ${LENS}[${m.index}]] ${m.name}`);
    console.log(`     COUNTY: ${Object.keys(county).length} counties stored` + (countyChanged == null ? ' (new layer)' : `, ${countyChanged} changed`));
    console.log(`     STATE:  ${Object.keys(stateValues).length}/51  ${ok ? 'OK' : 'DRIFT, missing: ' + drift.join(',')}` +
      (carried.length ? `  ·  carried forward (restricted): ${carried.join(', ')}` : '') +
      (restrictedNull.length ? `  ·  restricted, no history — stays no-data: ${restrictedNull.join(', ')}` : ''));
    console.log(`     ${deltas.length} states changed.` + (deltas.length ? '  Largest: ' +
      deltas.slice(0, 5).map((x) => `${x.st} ${x.oldV ?? '—'}→${x.newV} (${fmtDelta(x.d)})`).join('  ') : ''));
    console.log('');

    results.push({ m, county, stateValues });
  }

  console.log(`PLACES data vintage: ${dataYear}.  Source: ${SOURCE_URL}`);

  if (problems) { console.log(`\n${problems} measure(s) had unexpected missing states (drift). Not safe to write. Investigate before --write.`); process.exitCode = 1; return; }

  if (!WRITE) {
    console.log('\nDry run complete. Nothing written. Re-run with --write to apply (county + state).');
    return;
  }

  // ── apply: county grain (+ self-describing meta so runtime tools can label it) ──
  const cfgForMeta = read('src/_data/metricsConfig.json');
  countyData.meta = countyData.meta || {};
  countyData.meta[LENS] = countyData.meta[LENS] || {};
  for (const { m, county } of results) {
    countyData[LENS] = countyData[LENS] || {};
    countyData[LENS][String(m.index)] = county;
    const item = (cfgForMeta[LENS] && cfgForMeta[LENS].items && cfgForMeta[LENS].items[m.index]) || {};
    countyData.meta[LENS][String(m.index)] = {
      name: item.name || m.name,
      unit: item.unit || null,
      dir: item.dir == null ? 0 : item.dir,        // 1 higher=better, -1 lower=better, 0 neutral
      year: parseInt(dataYear, 10) || null,
    };
  }
  // minified: this file is runtime-fetched by both maps and rides the deploy
  fs.writeFileSync(P('src/assets/data/countyData.json'), JSON.stringify(countyData) + '\n');

  // ── apply: state rollup ──
  for (const { m, stateValues } of results) stateData[LENS][String(m.index)] = stateValues;
  fs.writeFileSync(P('src/_data/stateData.json'), JSON.stringify(stateData, null, 2) + '\n');

  // ── apply: dataYears vintage ──
  const dataYears = read('src/_data/dataYears.json');
  const yr = parseInt(dataYear, 10);
  if (Number.isFinite(yr)) for (const { m } of results) dataYears[LENS][String(m.index)] = yr;
  fs.writeFileSync(P('src/_data/dataYears.json'), JSON.stringify(dataYears, null, 2) + '\n');

  // ── apply: metricsConfig provenance (fix stale URL + stamp retrieval) ──
  const cfg = read('src/_data/metricsConfig.json');
  const now = new Date();
  const stamp = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  for (const { m } of results) {
    const item = cfg[LENS] && cfg[LENS].items && cfg[LENS].items[m.index];
    if (!item) continue;
    item.source = 'CDC PLACES (County 2025 release), county-native, state = pop-weighted rollup';
    item.sourceUrl = SOURCE_URL;
    item.retrievedDate = stamp;
  }
  fs.writeFileSync(P('src/_data/metricsConfig.json'), JSON.stringify(cfg, null, 2) + '\n');

  console.log('\nWrote countyData.json (new), stateData.json (rollup), dataYears.json, metricsConfig.json.');
  console.log('Next: wire countyData into the metrics adapter (county describes-edges) + light it up on the operations map, then npm run build.');
})().catch((e) => { console.error('\npull/places FAILED:', e.message); process.exitCode = 1; });
