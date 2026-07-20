#!/usr/bin/env node
'use strict';
/**
 * pull/bls.js — SECOND source fetcher. Refreshes the unemployment metric
 * (economics lens) from BLS Local Area Unemployment Statistics, county-native.
 *
 * Same loop as pull/places.js: pull -> clean -> validate -> diff -> (write),
 * and the same "store finest, derive state" model.
 *
 *   - County source: BLS LAUS bulk county file (la.data.64.County). The series id
 *     encodes the county FIPS; measure 03 = unemployment rate, 04 = unemployed,
 *     06 = labor force. We take the published county RATE, and derive the state
 *     rate EXACTLY as sum(unemployed)/sum(labor force) over its counties (a
 *     labor-force-weighted rollup, not a population one — unemployment demands it).
 *   - Period M13 is the annual average. We use the latest year present.
 *
 * BLS NOTES (the access reality):
 *   - The old laucnty<yy>.txt flat files now 404. The bulk time-series server is
 *     the reliable source, but it REQUIRES a descriptive User-Agent (with a
 *     contact email) or it 403s. No API key needed.
 *   - The county file is ~336MB. It is cached under scripts/.cache (gitignored);
 *     --refresh re-pulls it.
 *
 * SAFE BY DEFAULT
 *   node scripts/pull/bls.js            dry run: pull, compute, validate, DIFF. Writes nothing.
 *   node scripts/pull/bls.js --write    apply: countyData.json + stateData.json (rollup) + dataYears + metricsConfig.
 *   node scripts/pull/bls.js --refresh  re-download the BLS file (ignore cache).
 *
 * Source: https://www.bls.gov/lau/  (BLS Local Area Unemployment Statistics)
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const readline = require('readline');

const ROOT = path.join(__dirname, '..', '..');
const P = (...p) => path.join(ROOT, ...p);
const CACHE_FILE = P('scripts', '.cache', 'bls-la-county.txt');

const URL = 'https://download.bls.gov/pub/time.series/la/la.data.64.County';
const SOURCE_URL = 'https://www.bls.gov/lau/';
const UA = 'HealthcareUncharted/1.0 (david.eitel.pcpal@gmail.com)';   // BLS requires a descriptive UA

// Unemployment lives in two near-duplicate lenses in metricsConfig. County goes
// under the canonical one (economics); both state values are kept in sync.
const LENS = 'economics';
const INDEX = '1';
const MIRROR = [{ lens: 'economics', index: '1' }, { lens: 'baseline', index: '1' }];

// state FIPS -> abbr for the 50 states + DC (territories like PR 72 are dropped).
const STFIPS = require('../lib/fips').FIPS_ABBR;   // one shared table — scripts/lib/fips.js

const WRITE   = process.argv.includes('--write');
const REFRESH = process.argv.includes('--refresh');

const read = (rel) => JSON.parse(fs.readFileSync(P(rel), 'utf8'));
const readIf = (rel) => { try { return read(rel); } catch { return null; } };
const round1 = (n) => Math.round(n * 10) / 10;

function download(url, dest) {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    const f = fs.createWriteStream(dest);
    https.get(url, { headers: { 'User-Agent': UA, Accept: 'text/plain' } }, (res) => {
      if (res.statusCode !== 200) { res.resume(); return reject(new Error('HTTP ' + res.statusCode + ' for ' + url)); }
      res.pipe(f);
      f.on('finish', () => f.close(() => resolve()));
    }).on('error', (e) => { fs.unlink(dest, () => reject(e)); });
  });
}

// Stream the county file once: pull the annual (M13) rate / unemployed / labor
// force for the latest year, for the 50 states + DC.
function parse(file) {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({ input: fs.createReadStream(file) });
    const want = { '03': 'rate', '04': 'unemp', '06': 'labf' };
    const byYear = {};   // year -> { rate:{fips:v}, unemp:{}, labf:{} }
    let maxYear = 0;
    rl.on('line', (line) => {
      if (line[0] !== 'L') return;                 // skip header / blanks
      const p = line.split('\t');
      if (p.length < 4) return;
      const sid = p[0].trim();
      if (p[2].trim() !== 'M13') return;           // annual average only
      const measure = want[sid.slice(-2)];
      if (!measure) return;
      const stfips = sid.substr(5, 2);
      if (!STFIPS[stfips]) return;                 // drop PR / territories
      const year = +p[1];
      const val = parseFloat(p[3]);
      if (!Number.isFinite(val)) return;
      const fips = sid.substr(5, 5);
      (byYear[year] = byYear[year] || { rate: {}, unemp: {}, labf: {} })[measure][fips] = val;
      if (year > maxYear) maxYear = year;
    });
    rl.on('close', () => resolve({ ...byYear[maxYear], year: maxYear }));
    rl.on('error', reject);
  });
}

const fmtDelta = (d) => (d > 0 ? '+' : '') + d.toFixed(1);

(async () => {
  const stateData = read('src/_data/stateData.json');
  const expectedStates = new Set(Object.keys(stateData[LENS][INDEX]));
  console.log('Refreshing unemployment from BLS LAUS (county-native, state = labor-force-weighted rollup).');
  console.log(`Mode: ${WRITE ? 'WRITE' : 'DRY RUN (no files touched)'}${REFRESH ? ' · cache bypassed' : ''}\n`);

  if (REFRESH || !fs.existsSync(CACHE_FILE)) {
    console.log('Downloading BLS county file (~336MB, one time)…');
    await download(URL, CACHE_FILE);
  }
  const { rate, unemp, labf, year } = await parse(CACHE_FILE);

  // county grain we store: the published county unemployment rate (50 states + DC)
  const county = {};
  for (const [fips, v] of Object.entries(rate)) county[fips] = round1(v);

  // state view: exact rate = sum(unemployed)/sum(labor force) per state
  const acc = {};
  for (const fips of Object.keys(labf)) {
    const st = STFIPS[fips.substr(0, 2)];
    if (!st || !expectedStates.has(st)) continue;
    if (!acc[st]) acc[st] = { u: 0, l: 0 };
    acc[st].u += unemp[fips] || 0;
    acc[st].l += labf[fips] || 0;
  }
  const stateValues = {};
  for (const [st, a] of Object.entries(acc)) if (a.l > 0) stateValues[st] = round1((a.u / a.l) * 100);

  // ── validate ──
  const drift = [...expectedStates].filter((s) => stateValues[s] == null);
  console.log(`  COUNTY: ${Object.keys(county).length} counties stored (BLS annual ${year})`);
  console.log(`  STATE:  ${Object.keys(stateValues).length}/51  ${drift.length ? 'DRIFT, missing: ' + drift.join(',') : 'OK'}`);

  // ── diff vs current ──
  const current = stateData[LENS][INDEX] || {};
  const deltas = [];
  for (const st of expectedStates) {
    const o = current[st], n = stateValues[st];
    if (n == null) continue;
    if (o == null) deltas.push({ st, o: null, n, d: 0 });
    else { const d = round1(n - o); if (d !== 0) deltas.push({ st, o, n, d }); }
  }
  deltas.sort((a, b) => Math.abs(b.d) - Math.abs(a.d));
  console.log(`  ${deltas.length} states changed.` + (deltas.length ? '  Largest: ' +
    deltas.slice(0, 6).map((x) => `${x.st} ${x.o ?? '—'}→${x.n} (${fmtDelta(x.d)})`).join('  ') : ''));
  console.log(`\nBLS data vintage: ${year}.  Source: ${SOURCE_URL}`);

  if (drift.length) { console.log('\nUnexpected missing states (drift). Not safe to write.'); process.exitCode = 1; return; }
  if (!WRITE) { console.log('\nDry run complete. Nothing written. Re-run with --write to apply (county + state).'); return; }

  // ── apply: county grain (+ meta) ──
  const cfg = read('src/_data/metricsConfig.json');
  const item = (cfg[LENS] && cfg[LENS].items && cfg[LENS].items[+INDEX]) || {};
  const countyData = readIf('src/assets/data/countyData.json') || { _readme: 'County-grain metric values per lens. lens -> metricIndex -> FIPS -> value. Served for runtime fetch. State values in src/_data/stateData.json are the rollup.' };
  countyData[LENS] = countyData[LENS] || {};
  countyData[LENS][INDEX] = county;
  countyData.meta = countyData.meta || {};
  countyData.meta[LENS] = countyData.meta[LENS] || {};
  countyData.meta[LENS][INDEX] = { name: item.name || 'Unemployment rate', unit: item.unit || '%', dir: item.dir == null ? -1 : item.dir, year };
  fs.writeFileSync(P('src/assets/data/countyData.json'), JSON.stringify(countyData, null, 2) + '\n');

  // ── apply: state rollup into both mirrored lenses ──
  for (const m of MIRROR) stateData[m.lens][m.index] = stateValues;
  fs.writeFileSync(P('src/_data/stateData.json'), JSON.stringify(stateData, null, 2) + '\n');

  const dataYears = read('src/_data/dataYears.json');
  for (const m of MIRROR) if (dataYears[m.lens]) dataYears[m.lens][m.index] = year;
  fs.writeFileSync(P('src/_data/dataYears.json'), JSON.stringify(dataYears, null, 2) + '\n');

  const now = new Date();
  const stamp = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  for (const m of MIRROR) {
    const it = cfg[m.lens] && cfg[m.lens].items && cfg[m.lens].items[+m.index];
    if (!it) continue;
    it.source = 'BLS LAUS (county annual averages), state = labor-force-weighted rollup';
    it.sourceUrl = SOURCE_URL;
    it.retrievedDate = stamp;
  }
  fs.writeFileSync(P('src/_data/metricsConfig.json'), JSON.stringify(cfg, null, 2) + '\n');

  console.log('\nWrote countyData.json (economics added), stateData.json (rollup, both lenses), dataYears.json, metricsConfig.json.');
  console.log('Next: npm run build, then check the operations map county "Unemployment" layer.');
})().catch((e) => { console.error('\npull/bls FAILED:', e.message); process.exitCode = 1; });
