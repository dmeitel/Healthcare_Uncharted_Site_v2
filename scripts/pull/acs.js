#!/usr/bin/env node
'use strict';
/**
 * pull/acs.js — demographics from the Census American Community Survey 5-year
 * estimates, county-native: median age, average household size, % under 18,
 * % 65 and older.
 *
 * Same loop + "store finest, derive state" model as the other fetchers. Like
 * SAIPE, the ACS API ships official state rows, so state values come straight
 * from the source (no rollup needed). Metrics are addressed by stable id
 * (scripts/lib/metric-id.js) — indices are resolved from metricsConfig at boot.
 *
 * Two API endpoints, both keyless at this volume:
 *   detailed:  B01002_001E (median age), B25010_001E (avg household size)
 *   subject:   S0101_C02_022E (% under 18), S0101_C02_030E (% 65+)
 *
 * GUARD: subject-table variable codes are the one fragile thing here. Every
 * metric with existing state values must land within DRIFT_TOLERANCE of them
 * (median absolute delta) or the run aborts — a wrong variable code produces
 * obviously wrong numbers, and this catches it before anything is written.
 *
 * KEY REQUIRED: api.census.gov requires a (free) API key on every request.
 * Sign up at https://api.census.gov/data/key_signup.html (instant, email
 * activation), then either set the CENSUS_API_KEY environment variable or
 * drop the key into scripts/.cache/census-key.txt (gitignored). Without a
 * key the run stops immediately with this pointer.
 *
 * NEW-METRIC APPEND: baseline/avg-household-size is DEFINED HERE and appended
 * to metricsConfig on first --write, so the config never carries a metric the
 * data can't back yet. Every later run resolves it by id like the others.
 *
 * SAFE BY DEFAULT
 *   node scripts/pull/acs.js            dry run (writes nothing)
 *   node scripts/pull/acs.js --write    apply
 *   node scripts/pull/acs.js --refresh  re-download (ignore cache)
 *
 * Source: https://www.census.gov/programs-surveys/acs.html
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.join(__dirname, '..', '..');
const P = (...p) => path.join(ROOT, ...p);
const CACHE = P('scripts', '.cache');
const UA = 'HealthcareUncharted/1.0 (david.eitel.pcpal@gmail.com)';
const SOURCE_URL = 'https://www.census.gov/programs-surveys/acs.html';
const TRY_YEARS = [2024, 2023];   // 5-year vintages, newest first

const { metricIndexById } = require('../lib/metric-id');
const STFIPS = require('../lib/fips').FIPS_ABBR;

// endpoint: 'detail' -> /acs/acs5, 'subject' -> /acs/acs5/subject
// def: full item definition, appended to metricsConfig when the id is new.
const MEASURES = [
  { v: 'B01002_001E',    endpoint: 'detail',  metric: 'patient/median-age',           name: 'Median age',             round: 1, min: 20,  max: 70, tol: 4 },
  { v: 'B25010_001E',    endpoint: 'detail',  metric: 'baseline/avg-household-size',  name: 'Average household size', round: 2, min: 1.5, max: 5,  tol: 0.6,
    def: {
      id: 'baseline/avg-household-size',
      name: 'Average household size',
      sub: 'People per occupied household',
      unit: 'ppl',
      dir: 0,
      defn: 'Average number of people per occupied housing unit. A proxy for family size and multigenerational living patterns that shape pediatric demand and caregiver load.',
      method: 'American Community Survey 5-year estimates, table B25010.',
      source: 'Census ACS 5-year (county + state, official estimates)',
      updated: 'Annual (rolling 5-year average)',
      sourceUrl: SOURCE_URL,
      retrievedDate: '2026-07',
    } },
  { v: 'S0101_C02_022E', endpoint: 'subject', metric: 'baseline/pop-under-18',        name: 'Population under 18',    round: 1, min: 4,   max: 45, tol: 4 },
  { v: 'S0101_C02_030E', endpoint: 'subject', metric: 'baseline/pop-65-plus',         name: 'Population 65 and older', round: 1, min: 4,  max: 45, tol: 4 },
];

// the (free) key: env var first, gitignored key file second
function apiKey() {
  if (process.env.CENSUS_API_KEY) return process.env.CENSUS_API_KEY.trim();
  try { return fs.readFileSync(path.join(CACHE, 'census-key.txt'), 'utf8').trim(); } catch { return null; }
}

const WRITE = process.argv.includes('--write'), REFRESH = process.argv.includes('--refresh');
const read = (rel) => JSON.parse(fs.readFileSync(P(rel), 'utf8'));
const readIf = (rel) => { try { return read(rel); } catch { return null; } };
const roundTo = (n, d) => Math.round(n * 10 ** d) / 10 ** d;

function getJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } }, (res) => {
      if (res.statusCode !== 200) { res.resume(); return reject(new Error('HTTP ' + res.statusCode + ' for ' + url)); }
      let b = ''; res.on('data', (d) => (b += d));
      res.on('end', () => { try { resolve(JSON.parse(b)); } catch { reject(new Error('bad JSON from ' + url)); } });
    }).on('error', reject);
  });
}

const API = (year, endpoint) => `https://api.census.gov/data/${year}/acs/acs5${endpoint === 'subject' ? '/subject' : ''}`;

// One request per (endpoint, geo): all of that endpoint's variables together.
async function pull(year, endpoint, geo) {
  const vars = MEASURES.filter((m) => m.endpoint === endpoint).map((m) => m.v);
  const cacheFile = path.join(CACHE, `acs5-${year}-${endpoint}-${geo}.json`);
  if (!REFRESH && fs.existsSync(cacheFile)) return JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
  const url = `${API(year, endpoint)}?get=${vars.join(',')}&for=${geo}:*&key=${apiKey()}`;
  const rows = await getJSON(url);
  fs.mkdirSync(CACHE, { recursive: true });
  fs.writeFileSync(cacheFile, JSON.stringify(rows));
  return rows;
}

// Census API shape: first row is the header, geo FIPS columns trail the values.
function parseRows(rows, geo) {
  const [head, ...body] = rows;
  const col = Object.fromEntries(head.map((h, i) => [h, i]));
  const out = [];
  for (const r of body) {
    const st = r[col.state];
    if (!STFIPS[st]) continue;                     // 50 + DC only, drops PR
    out.push({ st, fips: geo === 'county' ? st + r[col.county] : null, get: (v) => parseFloat(r[col[v]]) });
  }
  return out;
}

const fmtDelta = (d) => (d > 0 ? '+' : '') + d;
const median = (a) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };

(async () => {
  if (!apiKey()) {
    console.error('No Census API key. Sign up (free, instant) at https://api.census.gov/data/key_signup.html');
    console.error('then either  set CENSUS_API_KEY  or write the key to scripts/.cache/census-key.txt');
    process.exitCode = 1; return;
  }
  const stateData = read('src/_data/stateData.json');
  const cfg = read('src/_data/metricsConfig.json');
  for (const m of MEASURES) {
    try {
      const r = metricIndexById(cfg, m.metric);
      m.lens = r.lens; m.index = r.index;
    } catch (e) {
      // a measure that carries its own definition appends on --write
      if (!m.def) throw e;
      m.lens = m.metric.split('/')[0]; m.index = '(new)'; m.pendingAppend = true;
    }
  }
  const expectedStates = new Set(Object.keys(stateData.patient['0']));   // the canonical 51
  console.log('Refreshing demographics from Census ACS 5-year (county + official state rows).');
  console.log(`Mode: ${WRITE ? 'WRITE' : 'DRY RUN (no files touched)'}${REFRESH ? ' · cache bypassed' : ''}\n`);

  // newest vintage that answers wins
  let year = null, county = {}, state = {};
  for (const y of TRY_YEARS) {
    try {
      for (const endpoint of ['detail', 'subject']) {
        county[endpoint] = parseRows(await pull(y, endpoint, 'county'), 'county');
        state[endpoint] = parseRows(await pull(y, endpoint, 'state'), 'state');
      }
      year = y;
      break;
    } catch (e) { console.log(`  ACS ${y} 5-year not available (${e.message}) — trying older vintage`); }
  }
  if (!year) throw new Error('no ACS 5-year vintage answered for ' + TRY_YEARS.join('/'));
  console.log(`  Vintage: ACS ${year} 5-year\n`);

  const results = [];
  let problems = 0;
  for (const m of MEASURES) {
    const cvals = {}, svals = {};
    for (const row of county[m.endpoint]) {
      const v = row.get(m.v);
      if (Number.isFinite(v) && v >= m.min && v <= m.max) cvals[row.fips] = roundTo(v, m.round);
    }
    for (const row of state[m.endpoint]) {
      const v = row.get(m.v);
      if (Number.isFinite(v) && v >= m.min && v <= m.max && expectedStates.has(STFIPS[row.st])) svals[STFIPS[row.st]] = roundTo(v, m.round);
    }

    const drift = [...expectedStates].filter((s) => svals[s] == null);
    // the variable-mapping guard: existing state values are the reference
    const current = stateData[m.lens][m.index] || {};
    const deltas = [];
    for (const st of expectedStates) {
      const o = current[st], n = svals[st];
      if (o == null || n == null) continue;
      deltas.push({ st, o, n, d: roundTo(n - o, m.round) });
    }
    const medAbs = median(deltas.map((x) => Math.abs(x.d)));
    const suspect = deltas.length >= 40 && medAbs > m.tol;
    if (drift.length || suspect) problems++;

    deltas.sort((a, b) => Math.abs(b.d) - Math.abs(a.d));
    const changed = deltas.filter((x) => x.d !== 0);
    console.log(`  [${m.v} -> ${m.lens}[${m.index}]] ${m.name}`);
    console.log(`     COUNTY: ${Object.keys(cvals).length} counties stored`);
    console.log(`     STATE:  ${Object.keys(svals).length}/51  ${drift.length ? 'DRIFT, missing: ' + drift.join(',') : 'OK'}`);
    console.log(`     ${changed.length} states changed vs current (median |Δ| ${medAbs}).` +
      (suspect ? '  SUSPECT: exceeds tolerance ' + m.tol + ' — variable code may not mean what we think. NOT safe to write.' : '') +
      (changed.length ? '  Largest: ' + changed.slice(0, 5).map((x) => `${x.st} ${x.o}→${x.n} (${fmtDelta(x.d)})`).join('  ') : ''));
    console.log('');

    results.push({ m, cvals, svals });
  }

  console.log(`ACS vintage: ${year} 5-year.  Source: ${SOURCE_URL}`);
  if (problems) { console.log('\nProblems found (drift or suspect mapping). Nothing will be written. Investigate first.'); process.exitCode = 1; return; }
  if (!WRITE) { console.log('\nDry run complete. Nothing written. Re-run with --write to apply (county + state).'); return; }

  // ── apply: append any measure whose metric definition is new to the config ──
  for (const m of MEASURES) {
    if (!m.pendingAppend) continue;
    cfg[m.lens].items.push(m.def);
    m.index = String(cfg[m.lens].items.length - 1);
    console.log(`Appended new metric ${m.metric} at ${m.lens}[${m.index}].`);
  }

  // ── apply: county grain (+ self-describing meta) ──
  const countyData = readIf('src/assets/data/countyData.json') || { _readme: 'County-grain metric values per lens. lens -> metricIndex -> FIPS -> value. State values in src/_data/stateData.json.' };
  countyData.meta = countyData.meta || {};
  for (const { m, cvals } of results) {
    const item = cfg[m.lens].items[+m.index] || {};
    countyData[m.lens] = countyData[m.lens] || {};
    countyData[m.lens][m.index] = cvals;
    countyData.meta[m.lens] = countyData.meta[m.lens] || {};
    countyData.meta[m.lens][m.index] = { name: item.name || m.name, unit: item.unit || null, dir: item.dir == null ? 0 : item.dir, year };
  }
  // minified: runtime-fetched by both maps, rides the deploy
  fs.writeFileSync(P('src/assets/data/countyData.json'), JSON.stringify(countyData) + '\n');

  // ── apply: official state values ──
  for (const { m, svals } of results) stateData[m.lens][m.index] = svals;
  fs.writeFileSync(P('src/_data/stateData.json'), JSON.stringify(stateData, null, 2) + '\n');

  // ── apply: vintage ──
  const dataYears = read('src/_data/dataYears.json');
  for (const { m } of results) { dataYears[m.lens] = dataYears[m.lens] || {}; dataYears[m.lens][m.index] = year; }
  fs.writeFileSync(P('src/_data/dataYears.json'), JSON.stringify(dataYears, null, 2) + '\n');

  // ── apply: metricsConfig provenance ──
  const now = new Date();
  const stamp = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  for (const { m } of results) {
    const item = cfg[m.lens].items[+m.index];
    if (!item) continue;
    item.source = 'Census ACS 5-year (county + state, official estimates)';
    item.method = item.method && item.method.includes('B25010')
      ? item.method
      : `American Community Survey 5-year estimates (${m.v.split('_')[0]}).`;
    item.sourceUrl = SOURCE_URL;
    item.retrievedDate = stamp;
  }
  fs.writeFileSync(P('src/_data/metricsConfig.json'), JSON.stringify(cfg, null, 2) + '\n');

  console.log('\nWrote countyData.json (demographics added), stateData.json (official state rows), dataYears.json, metricsConfig.json.');
  console.log('Next: npm run build.');
})().catch((e) => { console.error('\npull/acs FAILED:', e.message); process.exitCode = 1; });
