#!/usr/bin/env node
'use strict';
/**
 * pull/saipe.js — median household income (economics lens) from the Census
 * Small Area Income and Poverty Estimates, county-native.
 *
 * Same loop + "store finest, derive state" model as the other fetchers, but
 * SAIPE is clean: a single plain-text file (no zip, no API key), and it ships
 * BOTH county rows AND the official state rows, so state values come straight
 * from SAIPE (county FIPS '000' is the statewide row) rather than a rollup.
 *
 * Field layout (whitespace-delimited; the name fields trail AFTER the numbers,
 * so splitting on whitespace is safe up to the income field):
 *   f[0] = state FIPS, f[1] = county FIPS (0 = statewide), f[20] = median HH income ($)
 *
 * SAFE BY DEFAULT
 *   node scripts/pull/saipe.js            dry run (writes nothing)
 *   node scripts/pull/saipe.js --write    apply
 *   node scripts/pull/saipe.js --refresh  re-download (ignore cache)
 *
 * Source: https://www.census.gov/programs-surveys/saipe.html
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.join(__dirname, '..', '..');
const P = (...p) => path.join(ROOT, ...p);
const CACHE = P('scripts', '.cache');
const UA = 'HealthcareUncharted/1.0 (david.eitel.pcpal@gmail.com)';
const SOURCE_URL = 'https://www.census.gov/programs-surveys/saipe.html';

const LENS = 'economics', INDEX = '0';
const MIRROR = [{ lens: 'economics', index: '0' }, { lens: 'baseline', index: '0' }];
const TRY_YEARS = ['24', '23', '22'];   // newest first; first that exists wins
const urlFor = (yy) => `https://www2.census.gov/programs-surveys/saipe/datasets/20${yy}/20${yy}-state-and-county/est${yy}all.txt`;

const STFIPS = require('../lib/fips').FIPS_ABBR;   // one shared table — scripts/lib/fips.js

const WRITE = process.argv.includes('--write'), REFRESH = process.argv.includes('--refresh');
const read = (rel) => JSON.parse(fs.readFileSync(P(rel), 'utf8'));
const readIf = (rel) => { try { return read(rel); } catch { return null; } };

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': UA, Accept: 'text/plain' } }, (res) => {
      if (res.statusCode !== 200) { res.resume(); return reject(new Error('HTTP ' + res.statusCode)); }
      let b = ''; res.on('data', (d) => (b += d)); res.on('end', () => resolve(b));
    }).on('error', reject);
  });
}

async function getData() {
  for (const yy of TRY_YEARS) {
    const cacheFile = path.join(CACHE, `saipe-est${yy}.txt`);
    if (!REFRESH && fs.existsSync(cacheFile)) return { text: fs.readFileSync(cacheFile, 'utf8'), year: 2000 + +yy };
    try {
      const text = await fetchText(urlFor(yy));
      fs.mkdirSync(CACHE, { recursive: true });
      fs.writeFileSync(cacheFile, text);
      return { text, year: 2000 + +yy };
    } catch (e) { /* try older year */ }
  }
  throw new Error('no SAIPE est file found for ' + TRY_YEARS.join('/'));
}

const fmtDelta = (d) => (d > 0 ? '+' : '') + d;

(async () => {
  const stateData = read('src/_data/stateData.json');
  const expectedStates = new Set(Object.keys(stateData[LENS][INDEX]));
  console.log('Refreshing median household income from Census SAIPE (county + official state rows).');
  console.log(`Mode: ${WRITE ? 'WRITE' : 'DRY RUN (no files touched)'}${REFRESH ? ' · cache bypassed' : ''}\n`);

  const { text, year } = await getData();
  const county = {}, stateValues = {};
  for (const line of text.split('\n')) {
    if (line.length < 30) continue;
    const f = line.trim().split(/\s+/);
    const st = f[0], co = f[1], mhi = parseInt(f[20], 10);
    if (!STFIPS[st] || !Number.isFinite(mhi)) continue;
    const kv = Math.round(mhi / 1000);                 // dollars -> $k (whole, matches existing)
    if (co === '0') { if (expectedStates.has(STFIPS[st])) stateValues[STFIPS[st]] = kv; }   // statewide row
    else county[st + co.padStart(3, '0')] = kv;        // county row
  }

  const drift = [...expectedStates].filter((s) => stateValues[s] == null);
  console.log(`  COUNTY: ${Object.keys(county).length} counties stored (SAIPE ${year})`);
  console.log(`  STATE:  ${Object.keys(stateValues).length}/51  ${drift.length ? 'DRIFT, missing: ' + drift.join(',') : 'OK'}`);

  const current = stateData[LENS][INDEX] || {};
  const deltas = [];
  for (const st of expectedStates) {
    const o = current[st], n = stateValues[st];
    if (n == null) continue;
    if (o == null) deltas.push({ st, o: null, n, d: 0 });
    else { const d = n - o; if (d !== 0) deltas.push({ st, o, n, d }); }
  }
  deltas.sort((a, b) => Math.abs(b.d) - Math.abs(a.d));
  console.log(`  ${deltas.length} states changed.` + (deltas.length ? '  Largest: ' +
    deltas.slice(0, 6).map((x) => `${x.st} ${x.o ?? '—'}→${x.n} (${fmtDelta(x.d)})`).join('  ') : ''));
  console.log(`\nSAIPE vintage: ${year}.  Source: ${SOURCE_URL}`);

  if (drift.length) { console.log('\nUnexpected missing states (drift). Not safe to write.'); process.exitCode = 1; return; }
  if (!WRITE) { console.log('\nDry run complete. Nothing written. Re-run with --write to apply (county + state).'); return; }

  const cfg = read('src/_data/metricsConfig.json');
  const item = (cfg[LENS] && cfg[LENS].items && cfg[LENS].items[+INDEX]) || {};
  const countyData = readIf('src/assets/data/countyData.json') || { _readme: 'County-grain metric values per lens. lens -> metricIndex -> FIPS -> value. State values in src/_data/stateData.json.' };
  countyData[LENS] = countyData[LENS] || {};
  countyData[LENS][INDEX] = county;
  countyData.meta = countyData.meta || {};
  countyData.meta[LENS] = countyData.meta[LENS] || {};
  countyData.meta[LENS][INDEX] = { name: item.name || 'Median household income', unit: item.unit || '$k', dir: item.dir == null ? 1 : item.dir, year };
  fs.writeFileSync(P('src/assets/data/countyData.json'), JSON.stringify(countyData, null, 2) + '\n');

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
    it.source = 'Census SAIPE (county + state, median household income)';
    it.sourceUrl = SOURCE_URL;
    it.retrievedDate = stamp;
  }
  fs.writeFileSync(P('src/_data/metricsConfig.json'), JSON.stringify(cfg, null, 2) + '\n');

  console.log('\nWrote countyData.json (income added), stateData.json (both lenses), dataYears.json, metricsConfig.json.');
  console.log('Next: npm run build.');
})().catch((e) => { console.error('\npull/saipe FAILED:', e.message); process.exitCode = 1; });
