#!/usr/bin/env node
'use strict';
/**
 * pull/oews-states.js · median annual pay by STATE for ten healthcare jobs, from the
 * BLS Occupational Employment and Wage Statistics (OEWS) survey.
 *
 * Written 2026-09-24 for Vital Stats' state games (David: "pay by state"), which had one
 * Workforce question per state. The file is plain data any tool can read:
 *
 *   src/assets/data/state-pay.json
 *     { source, url, period: "May 2025", year, checked, occupations: {
 *         "29-1141": { occ: "Registered Nurses", pay: { AL: 67000, ... } }, ... } }
 *
 * THE SOURCE. The BLS public data API, one series per job per state:
 *   OEU S <area 7> <industry 6> <occupation 6> <datatype 2>
 *   OEUS 4900000  000000        291141         13          = Utah, all industries, RNs, annual median
 * The API answers without a key: 25 series a request, 25 requests a day. Ten jobs times
 * 51 states is 510 series, 21 requests, so a full pull fits one day's allowance. Every
 * answer is cached under scripts/.cache/oews-states/ and a re-run spends nothing;
 * --refresh asks again. A state where BLS suppresses a figure (too few respondents) is
 * simply absent, never guessed.
 *
 *   node scripts/pull/oews-states.js            dry run: pull (or read the cache), summarize. Writes nothing.
 *   node scripts/pull/oews-states.js --write    also write src/assets/data/state-pay.json
 *   node scripts/pull/oews-states.js --refresh  ignore the cache
 *
 * Source: https://www.bls.gov/oes/  (the figures are the May 2025 estimates)
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const { FIPS_ABBR } = require('../lib/fips');

const ROOT = path.join(__dirname, '..', '..');
const CACHE = path.join(ROOT, 'scripts', '.cache', 'oews-states');
const OUT = path.join(ROOT, 'src', 'assets', 'data', 'state-pay.json');
const API = 'https://api.bls.gov/publicAPI/v2/timeseries/data/';
const UA = 'HealthcareUncharted/1.0 (david.eitel.pcpal@gmail.com)';
const WRITE = process.argv.includes('--write');
const REFRESH = process.argv.includes('--refresh');

/** the jobs, by SOC code, with the name BLS gives them */
const JOBS = {
  '29-1141': 'Registered Nurses',
  '29-1126': 'Respiratory Therapists',
  '29-2061': 'Licensed Practical and Licensed Vocational Nurses',
  '29-1171': 'Nurse Practitioners',
  '29-1071': 'Physician Assistants',
  '29-1051': 'Pharmacists',
  '29-2034': 'Radiologic Technologists and Technicians',
  '31-1131': 'Nursing Assistants',
  '31-9092': 'Medical Assistants',
  '11-9111': 'Medical and Health Services Managers'
};

/** @param {string} fips @param {string} soc */
const seriesId = (fips, soc) => 'OEUS' + fips + '00000' + '000000' + soc.replace('-', '') + '13';

/** @param {string[]} ids @returns {Promise<any>} */
function post(ids) {
  const body = JSON.stringify({ seriesid: ids });
  return new Promise((resolve, reject) => {
    const req = https.request(API, { method: 'POST', headers: { 'Content-Type': 'application/json', 'User-Agent': UA, 'Content-Length': Buffer.byteLength(body) } }, (res) => {
      let t = ''; res.on('data', (c) => { t += c; });
      res.on('end', () => { try { resolve(JSON.parse(t)); } catch (e) { reject(new Error('BLS answered with something that is not JSON: ' + t.slice(0, 200))); } });
    });
    req.on('error', reject); req.setTimeout(60000, () => req.destroy(new Error('BLS took longer than a minute')));
    req.end(body);
  });
}

async function main() {
  fs.mkdirSync(CACHE, { recursive: true });
  const all = [];
  for (const soc of Object.keys(JOBS)) for (const fips of Object.keys(FIPS_ABBR).sort()) all.push({ soc, fips, id: seriesId(fips, soc) });
  /** @type {Record<string, {year:number, value:number}>} */
  const got = {};
  let asked = 0;
  for (let i = 0; i < all.length; i += 25) {
    const batch = all.slice(i, i + 25);
    const file = path.join(CACHE, 'batch-' + String(i / 25).padStart(2, '0') + '.json');
    let res;
    if (!REFRESH && fs.existsSync(file)) res = JSON.parse(fs.readFileSync(file, 'utf8'));
    else {
      res = await post(batch.map((b) => b.id)); asked++;
      if (res.status !== 'REQUEST_SUCCEEDED') throw new Error('BLS refused the request: ' + JSON.stringify(res.message || res.status));
      fs.writeFileSync(file, JSON.stringify(res));
      await new Promise((r) => setTimeout(r, 1200));   // be polite: one request a second or so
    }
    for (const s of (res.Results && res.Results.series) || []) {
      const d = (s.data || []).find((x) => x.period === 'A01' && /^\d+$/.test(String(x.value)));
      if (d) got[s.seriesID] = { year: Number(d.year), value: Number(d.value) };
    }
  }
  const years = new Set(Object.values(got).map((g) => g.year));
  if (years.size !== 1) throw new Error('the answers span more than one year: ' + [...years].join(', '));
  const year = [...years][0];
  /** @type {Record<string, {occ:string, pay:Record<string, number>}>} */
  const occupations = {};
  const gaps = [];
  for (const soc of Object.keys(JOBS)) {
    /** @type {Record<string, number>} */
    const pay = {};
    for (const fips of Object.keys(FIPS_ABBR).sort()) {
      const g = got[seriesId(fips, soc)];
      if (g) pay[FIPS_ABBR[fips]] = g.value; else gaps.push(JOBS[soc] + ' in ' + FIPS_ABBR[fips]);
    }
    // a sanity floor: a state median under $20,000 or over $400,000 a year is a parse error, not a wage
    for (const [st, v] of Object.entries(pay)) if (v < 20000 || v > 400000) throw new Error(`implausible ${JOBS[soc]} median in ${st}: ${v}`);
    occupations[soc] = { occ: JOBS[soc], pay: Object.fromEntries(Object.entries(pay).sort(([a], [b]) => a.localeCompare(b))) };
  }
  const out = {
    source: 'U.S. Bureau of Labor Statistics, Occupational Employment and Wage Statistics (OEWS), state estimates, annual median wage',
    url: 'https://www.bls.gov/oes/',
    period: 'May ' + year, year,
    checked: new Date().toISOString().slice(0, 10),
    occupations
  };
  const n = Object.values(occupations).reduce((s, o) => s + Object.keys(o.pay).length, 0);
  console.log(`oews-states: ${n} state medians for ${Object.keys(JOBS).length} jobs, May ${year} (${asked} new BLS requests, the rest from the cache)`);
  if (gaps.length) console.log('  suppressed or missing (' + gaps.length + '): ' + gaps.join('; '));
  console.log('  RN in Utah: $' + (occupations['29-1141'].pay.UT || '?') + ' · RT in Utah: $' + (occupations['29-1126'].pay.UT || '?'));
  if (WRITE) {
    // `checked` changes every run; keep the old date when nothing else did, so a re-run is not a diff
    let prev = null; try { prev = JSON.parse(fs.readFileSync(OUT, 'utf8')); } catch (e) { /* first run */ }
    if (prev && JSON.stringify(Object.assign({}, prev, { checked: '' })) === JSON.stringify(Object.assign({}, out, { checked: '' }))) out.checked = prev.checked;
    fs.writeFileSync(OUT, JSON.stringify(out) + '\n');
    console.log('  wrote ' + path.relative(ROOT, OUT));
  } else console.log('  dry run: add --write to write ' + path.relative(ROOT, OUT));
}

main().catch((e) => { console.error('oews-states: ' + (e && e.message || e)); process.exit(1); });
