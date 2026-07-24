#!/usr/bin/env node
'use strict';
/**
 * pull/chr.js — the OUTCOMES layer: premature death (YPLL) and low birthweight
 * from County Health Rankings & Roadmaps (UWPHI/RWJF), county-native.
 *
 * Same loop + "store finest, derive state" model as the other fetchers. The CHR
 * analytic CSV ships county rows AND official state rows (county code 000), so
 * state values come straight from the file — no rollup. No API key.
 *
 * COLUMN DISCOVERY, NOT COLUMN FAITH
 *   The analytic CSV has a two-row header: row 1 is human names ("Premature
 *   death raw value"), row 2 is variable codes (v001_rawvalue). Codes are
 *   stable by contract but we trust NEITHER alone: each measure is located by
 *   row-1 NAME REGEX and its row-2 code must match /v\d+_rawvalue/. Zero or
 *   multiple matches abort the run and print the candidate headers — the dry
 *   run diagnoses itself.
 *
 * PROPORTION vs PERCENT
 *   CHR stores percentage measures as proportions (0.081 = 8.1%). Each measure
 *   declares scale handling; the range guard validates AFTER conversion, so a
 *   scale surprise cannot slip through as plausible-looking garbage.
 *
 * NEW-METRIC APPEND (same pattern as pull/acs.js): both metric definitions
 * live HERE and are appended to metricsConfig on first --write. Later runs
 * resolve them by stable id like every other fetcher.
 *
 * SAFE BY DEFAULT
 *   node scripts/pull/chr.js            dry run (writes nothing)
 *   node scripts/pull/chr.js --write    apply
 *   node scripts/pull/chr.js --refresh  re-download (ignore cache)
 *
 * Source: https://www.countyhealthrankings.org/health-data
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.join(__dirname, '..', '..');
const P = (...p) => path.join(ROOT, ...p);
const CACHE = P('scripts', '.cache');
const UA = 'HealthcareUncharted/1.0 (david.eitel.pcpal@gmail.com)';
const SOURCE_URL = 'https://www.countyhealthrankings.org/health-data';
const CHR_SRC = 'County Health Rankings (UWPHI/RWJF), county-native, official state rows';

// newest first; _v2 (revised) beats the original within a year
const TRY_YEARS = [2026, 2025, 2024];
const urlsFor = (y) => [
  `https://www.countyhealthrankings.org/sites/default/files/media/document/analytic_data${y}_v2.csv`,
  `https://www.countyhealthrankings.org/sites/default/files/media/document/analytic_data${y}.csv`,
];

const { metricIndexById } = require('../lib/metric-id');
const STFIPS = require('../lib/fips').FIPS_ABBR;

const MEASURES = [
  {
    metric: 'patient/premature-death',
    header: /^premature death raw value$/i,
    // YPLL is already a rate per 100k — never rescale
    scale: 'rate', round: 0,
    stateMin: 3000, stateMax: 16000, countyMin: 1500, countyMax: 35000,
    def: {
      id: 'patient/premature-death',
      name: 'Premature death (YPLL)',
      sub: 'Years of potential life lost before 75, per 100k',
      unit: '/100k',
      dir: -1,
      defn: 'Years of potential life lost before age 75 per 100,000 population, age-adjusted. The standard summary measure of early mortality: every death before 75 contributes its missing years, so deaths at younger ages weigh more.',
      method: 'County Health Rankings analytic release, computed from NCHS mortality files over a three-year window.',
      source: CHR_SRC,
      updated: 'Annual, ~3 year data lag',
      sourceUrl: SOURCE_URL,
      retrievedDate: '2026-07',
      caveat: 'Three-year window; suppressed in very small counties, so sparse rural coverage is expected.',
    },
  },
  {
    metric: 'patient/low-birthweight',
    header: /^low birth ?weight raw value$/i,
    // stored as a proportion (0.081) — convert to percent, then range-check
    scale: 'proportion', round: 1,
    stateMin: 4, stateMax: 15, countyMin: 2, countyMax: 25,
    def: {
      id: 'patient/low-birthweight',
      name: 'Low birthweight',
      sub: 'Live births under 2,500 grams',
      unit: '%',
      dir: -1,
      defn: 'Percentage of live births weighing under 2,500 grams. A leading indicator of maternal and infant health, and the closest reliable county-level signal for birth-outcome risk.',
      method: 'County Health Rankings analytic release, computed from NCHS natality files over a multi-year window.',
      source: CHR_SRC,
      updated: 'Annual, ~2 year data lag',
      sourceUrl: SOURCE_URL,
      retrievedDate: '2026-07',
      caveat: 'Suppressed in counties with few births. There is no national county-level birth defects dataset; this is the honest adjacent measure.',
    },
  },
];

const WRITE = process.argv.includes('--write'), REFRESH = process.argv.includes('--refresh');
const read = (rel) => JSON.parse(fs.readFileSync(P(rel), 'utf8'));
const readIf = (rel) => { try { return read(rel); } catch { return null; } };
const roundTo = (n, d) => Math.round(n * 10 ** d) / 10 ** d;

// GET with redirect-following (the CHR site hops through www/CDN redirects)
function fetchText(url, hops) {
  if ((hops || 0) > 3) return Promise.reject(new Error('too many redirects'));
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': UA, Accept: 'text/csv,*/*' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        const next = new URL(res.headers.location, url).href;
        return resolve(fetchText(next, (hops || 0) + 1));
      }
      if (res.statusCode !== 200) { res.resume(); return reject(new Error('HTTP ' + res.statusCode)); }
      let b = ''; res.on('data', (d) => (b += d)); res.on('end', () => resolve(b));
    }).on('error', reject);
  });
}

async function getData() {
  for (const y of TRY_YEARS) {
    const cacheFile = path.join(CACHE, `chr-analytic-${y}.csv`);
    if (!REFRESH && fs.existsSync(cacheFile)) return { text: fs.readFileSync(cacheFile, 'utf8'), year: y };
    for (const url of urlsFor(y)) {
      try {
        const text = await fetchText(url);
        if (!/raw value/i.test(text.slice(0, 20000))) throw new Error('not the analytic CSV');
        fs.mkdirSync(CACHE, { recursive: true });
        fs.writeFileSync(cacheFile, text);
        console.log(`  downloaded ${url}`);
        return { text, year: y };
      } catch (e) { /* try the next candidate */ }
    }
  }
  throw new Error('no CHR analytic CSV found for ' + TRY_YEARS.join('/'));
}

// minimal CSV line parser: quotes, escaped quotes, commas inside quotes
function csvLine(line) {
  const out = [];
  let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else inQ = false; }
      else cur += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ',') { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

const fmtDelta = (d) => (d > 0 ? '+' : '') + d;

(async () => {
  const stateData = read('src/_data/stateData.json');
  const cfg = read('src/_data/metricsConfig.json');
  for (const m of MEASURES) {
    try {
      const r = metricIndexById(cfg, m.metric);
      m.lens = r.lens; m.index = r.index;
    } catch {
      m.lens = m.metric.split('/')[0]; m.index = '(new)'; m.pendingAppend = true;
    }
  }
  const expectedStates = new Set(Object.keys(stateData.patient['0']));   // the canonical 51
  console.log('Refreshing outcomes from County Health Rankings (county + official state rows).');
  console.log(`Mode: ${WRITE ? 'WRITE' : 'DRY RUN (no files touched)'}${REFRESH ? ' · cache bypassed' : ''}\n`);

  const { text, year } = await getData();
  const lines = text.split(/\r?\n/).filter((l) => l.length);
  const names = csvLine(lines[0]);   // row 1: human names
  const codes = csvLine(lines[1]);   // row 2: variable codes
  const fipsCol = codes.indexOf('fipscode');
  const countyCodeCol = codes.indexOf('countycode');
  const stateCodeCol = codes.indexOf('statecode');
  if (fipsCol === -1 || countyCodeCol === -1 || stateCodeCol === -1)
    throw new Error('key columns missing (fipscode/countycode/statecode) — header layout changed');

  // locate each measure by NAME, verify the CODE shape (self-diagnosing)
  for (const m of MEASURES) {
    const hits = names.map((n, i) => ({ n, i })).filter((x) => m.header.test(x.n.trim()));
    if (hits.length !== 1) {
      const near = names.filter((n) => /raw value/i.test(n) && /birth|premature|death/i.test(n));
      throw new Error(`expected exactly 1 header matching ${m.header} — found ${hits.length}. Nearby raw-value headers: ${near.join(' | ') || '(none)'}`);
    }
    m.col = hits[0].i;
    if (!/^v\d+_rawvalue$/.test(codes[m.col]))
      throw new Error(`${hits[0].n} maps to code "${codes[m.col]}" — expected v###_rawvalue. Layout drifted.`);
    console.log(`  matched "${hits[0].n.trim()}" -> ${codes[m.col]} (col ${m.col})`);
  }
  console.log('');

  const results = [];
  let problems = 0;
  for (const m of MEASURES) {
    const cvals = {}, svals = {};
    let scaled = null;   // decided from the first finite value when scale=proportion
    for (let li = 2; li < lines.length; li++) {
      const row = csvLine(lines[li]);
      const st = row[stateCodeCol];
      if (!STFIPS[st]) continue;                       // 50 + DC only, drops the US row
      let v = parseFloat(row[m.col]);
      if (!Number.isFinite(v)) continue;
      if (m.scale === 'proportion') { if (scaled == null) scaled = v < 1; if (scaled) v *= 100; }
      v = roundTo(v, m.round);
      if (row[countyCodeCol] === '000') {
        if (v >= m.stateMin && v <= m.stateMax && expectedStates.has(STFIPS[st])) svals[STFIPS[st]] = v;
      } else {
        if (v >= m.countyMin && v <= m.countyMax) cvals[row[fipsCol]] = v;
      }
    }
    if (m.scale === 'proportion') console.log(`  [${m.metric}] proportion scale: ${scaled ? 'converted ×100 to percent' : 'already percent, left as-is'}`);

    const drift = [...expectedStates].filter((s) => svals[s] == null);
    if (drift.length) problems++;
    const current = (stateData[m.lens] || {})[m.index] || {};
    const deltas = [];
    for (const st of expectedStates) {
      const o = current[st], n = svals[st];
      if (o == null || n == null) continue;
      const d = roundTo(n - o, m.round);
      if (d !== 0) deltas.push({ st, o, n, d });
    }
    deltas.sort((a, b) => Math.abs(b.d) - Math.abs(a.d));

    console.log(`  [${m.metric}${m.pendingAppend ? ' (new — appends on write)' : ` -> ${m.lens}[${m.index}]`}] ${m.def.name}`);
    console.log(`     COUNTY: ${Object.keys(cvals).length} counties stored (suppression gaps expected in small counties)`);
    console.log(`     STATE:  ${Object.keys(svals).length}/51  ${drift.length ? 'DRIFT, missing: ' + drift.join(',') : 'OK'}`);
    console.log(`     ${deltas.length} states changed vs current.` + (deltas.length ? '  Largest: ' +
      deltas.slice(0, 5).map((x) => `${x.st} ${x.o}→${x.n} (${fmtDelta(x.d)})`).join('  ') : ''));
    console.log('');

    results.push({ m, cvals, svals });
  }

  console.log(`CHR release: ${year}.  Source: ${SOURCE_URL}`);
  if (problems) { console.log('\nUnexpected missing states (drift). Not safe to write. Investigate first.'); process.exitCode = 1; return; }
  if (!WRITE) { console.log('\nDry run complete. Nothing written. Re-run with --write to apply (county + state).'); return; }

  // ── apply: append new metric definitions ──
  for (const { m } of results) {
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
    countyData.meta[m.lens][m.index] = { name: item.name || m.def.name, unit: item.unit || null, dir: item.dir == null ? -1 : item.dir, year };
  }
  // minified: runtime-fetched by both maps, rides the deploy
  fs.writeFileSync(P('src/assets/data/countyData.json'), JSON.stringify(countyData) + '\n');

  // ── apply: official state values ──
  for (const { m, svals } of results) stateData[m.lens][m.index] = svals;
  fs.writeFileSync(P('src/_data/stateData.json'), JSON.stringify(stateData, null, 2) + '\n');

  // ── apply: vintage (release year; the defn carries the lag) ──
  const dataYears = read('src/_data/dataYears.json');
  for (const { m } of results) { dataYears[m.lens] = dataYears[m.lens] || {}; dataYears[m.lens][m.index] = year; }
  fs.writeFileSync(P('src/_data/dataYears.json'), JSON.stringify(dataYears, null, 2) + '\n');

  // ── apply: metricsConfig provenance ──
  const now = new Date();
  const stamp = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  for (const { m } of results) {
    const item = cfg[m.lens].items[+m.index];
    if (!item) continue;
    item.source = CHR_SRC;
    item.sourceUrl = SOURCE_URL;
    item.retrievedDate = stamp;
  }
  fs.writeFileSync(P('src/_data/metricsConfig.json'), JSON.stringify(cfg, null, 2) + '\n');

  console.log('\nWrote countyData.json (outcomes added), stateData.json (official state rows), dataYears.json, metricsConfig.json.');
  console.log('Next: npm run build.');
})().catch((e) => { console.error('\npull/chr FAILED:', e.message); process.exitCode = 1; });
