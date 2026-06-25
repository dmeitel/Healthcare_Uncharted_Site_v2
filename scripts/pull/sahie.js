#!/usr/bin/env node
'use strict';
/**
 * pull/sahie.js — uninsured rate (payer lens) from the Census Small Area Health
 * Insurance Estimates, county-native.
 *
 * SAHIE ships as a zip with one big (~94MB) CSV and NO API key. To stay
 * dependency-free we extract the single zip entry with built-in zlib (parse the
 * central directory, inflateRaw the deflate stream). The CSV has a verbose data
 * dictionary preamble; the real rows are comma values in documented order:
 *   f[2]=statefips f[3]=countyfips f[4]=geocat(40 state/50 county)
 *   f[5]=agecat f[6]=racecat f[7]=sexcat f[8]=iprcat  f[15]=PCTUI (% uninsured)
 * The headline "uninsured, under 65, all" rate = the row with every demographic
 * category 0. geocat 40 gives the official state value, 50 the county value, so
 * both grains come straight from SAHIE (no rollup).
 *
 * SAFE BY DEFAULT
 *   node scripts/pull/sahie.js            dry run (writes nothing)
 *   node scripts/pull/sahie.js --write    apply
 *   node scripts/pull/sahie.js --refresh  re-download (ignore cache)
 *
 * Source: https://www.census.gov/programs-surveys/sahie.html
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const zlib = require('zlib');

const ROOT = path.join(__dirname, '..', '..');
const P = (...p) => path.join(ROOT, ...p);
const CACHE = P('scripts', '.cache');
const UA = 'HealthcareUncharted/1.0 (david.eitel.pcpal@gmail.com)';
const SOURCE_URL = 'https://www.census.gov/programs-surveys/sahie.html';

const LENS = 'payer', INDEX = '0';   // Uninsured rate (single lens, no mirror)
const TRY_YEARS = ['2024', '2023', '2022'];
const urlFor = (y) => `https://www2.census.gov/programs-surveys/sahie/datasets/time-series/estimates-acs/sahie-${y}-csv.zip`;

const STFIPS = { '01':'AL','02':'AK','04':'AZ','05':'AR','06':'CA','08':'CO','09':'CT','10':'DE','11':'DC','12':'FL','13':'GA','15':'HI','16':'ID','17':'IL','18':'IN','19':'IA','20':'KS','21':'KY','22':'LA','23':'ME','24':'MD','25':'MA','26':'MI','27':'MN','28':'MS','29':'MO','30':'MT','31':'NE','32':'NV','33':'NH','34':'NJ','35':'NM','36':'NY','37':'NC','38':'ND','39':'OH','40':'OK','41':'OR','42':'PA','44':'RI','45':'SC','46':'SD','47':'TN','48':'TX','49':'UT','50':'VT','51':'VA','53':'WA','54':'WV','55':'WI','56':'WY' };

const WRITE = process.argv.includes('--write'), REFRESH = process.argv.includes('--refresh');
const read = (rel) => JSON.parse(fs.readFileSync(P(rel), 'utf8'));
const readIf = (rel) => { try { return read(rel); } catch { return null; } };
const round1 = (n) => Math.round(n * 10) / 10;

function downloadBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': UA } }, (res) => {
      if (res.statusCode !== 200) { res.resume(); return reject(new Error('HTTP ' + res.statusCode)); }
      const chunks = []; res.on('data', (d) => chunks.push(d)); res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

// extract the single entry of a zip via the central directory + inflateRaw
function unzipSingle(buf) {
  let i = buf.length - 22;
  while (i >= 0 && buf.readUInt32LE(i) !== 0x06054b50) i--;        // End Of Central Directory
  if (i < 0) throw new Error('not a zip (no EOCD)');
  const cdOff = buf.readUInt32LE(i + 16);
  const method = buf.readUInt16LE(cdOff + 10);
  const csize = buf.readUInt32LE(cdOff + 20);
  const lho = buf.readUInt32LE(cdOff + 42);                        // local header offset
  const ds = lho + 30 + buf.readUInt16LE(lho + 26) + buf.readUInt16LE(lho + 28);
  const comp = buf.slice(ds, ds + csize);
  return method === 0 ? comp : zlib.inflateRawSync(comp);
}

async function getCsv() {
  for (const y of TRY_YEARS) {
    const cacheFile = path.join(CACHE, `sahie-${y}.zip`);
    let zip;
    if (!REFRESH && fs.existsSync(cacheFile)) zip = fs.readFileSync(cacheFile);
    else {
      try { zip = await downloadBuffer(urlFor(y)); fs.mkdirSync(CACHE, { recursive: true }); fs.writeFileSync(cacheFile, zip); }
      catch (e) { continue; }
    }
    return { csv: unzipSingle(zip).toString('utf8'), year: +y };
  }
  throw new Error('no SAHIE file for ' + TRY_YEARS.join('/'));
}

const fmtDelta = (d) => (d > 0 ? '+' : '') + d.toFixed(1);

(async () => {
  const stateData = read('src/_data/stateData.json');
  const expectedStates = new Set(Object.keys(stateData[LENS][INDEX]));
  console.log('Refreshing uninsured rate from Census SAHIE (county + official state rows).');
  console.log(`Mode: ${WRITE ? 'WRITE' : 'DRY RUN (no files touched)'}${REFRESH ? ' · cache bypassed' : ''}\n`);

  const { csv, year } = await getCsv();
  const county = {}, stateValues = {};
  for (const line of csv.split('\n')) {
    if (!/^\s*\d{4},/.test(line)) continue;                        // skip dictionary/preamble
    const f = line.split(',');
    if (f.length < 16) continue;
    if (f[5] !== '0' || f[6] !== '0' || f[7] !== '0' || f[8] !== '0') continue;   // all demographics only
    const st = f[2].padStart(2, '0');
    if (!STFIPS[st]) continue;
    const pct = parseFloat(f[15]);
    if (!Number.isFinite(pct)) continue;
    if (f[4] === '40') { if (expectedStates.has(STFIPS[st])) stateValues[STFIPS[st]] = round1(pct); }   // state
    else if (f[4] === '50') county[st + f[3].padStart(3, '0')] = round1(pct);                            // county
  }

  const drift = [...expectedStates].filter((s) => stateValues[s] == null);
  console.log(`  COUNTY: ${Object.keys(county).length} counties stored (SAHIE ${year})`);
  console.log(`  STATE:  ${Object.keys(stateValues).length}/51  ${drift.length ? 'DRIFT, missing: ' + drift.join(',') : 'OK'}`);

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
  console.log(`\nSAHIE vintage: ${year}.  Source: ${SOURCE_URL}`);

  if (drift.length) { console.log('\nUnexpected missing states (drift). Not safe to write.'); process.exitCode = 1; return; }
  if (!WRITE) { console.log('\nDry run complete. Nothing written. Re-run with --write to apply (county + state).'); return; }

  const cfg = read('src/_data/metricsConfig.json');
  const item = (cfg[LENS] && cfg[LENS].items && cfg[LENS].items[+INDEX]) || {};
  const countyData = readIf('src/assets/data/countyData.json') || { _readme: 'County-grain metric values per lens. lens -> metricIndex -> FIPS -> value. State values in src/_data/stateData.json.' };
  countyData[LENS] = countyData[LENS] || {};
  countyData[LENS][INDEX] = county;
  countyData.meta = countyData.meta || {};
  countyData.meta[LENS] = countyData.meta[LENS] || {};
  countyData.meta[LENS][INDEX] = { name: item.name || 'Uninsured rate', unit: item.unit || '%', dir: item.dir == null ? -1 : item.dir, year };
  fs.writeFileSync(P('src/assets/data/countyData.json'), JSON.stringify(countyData, null, 2) + '\n');

  stateData[LENS][INDEX] = stateValues;
  fs.writeFileSync(P('src/_data/stateData.json'), JSON.stringify(stateData, null, 2) + '\n');

  const dataYears = read('src/_data/dataYears.json');
  if (dataYears[LENS]) dataYears[LENS][INDEX] = year;
  fs.writeFileSync(P('src/_data/dataYears.json'), JSON.stringify(dataYears, null, 2) + '\n');

  const now = new Date();
  item.source = 'Census SAHIE (county + state, under-65 uninsured)';
  item.sourceUrl = SOURCE_URL;
  item.retrievedDate = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  fs.writeFileSync(P('src/_data/metricsConfig.json'), JSON.stringify(cfg, null, 2) + '\n');

  console.log('\nWrote countyData.json (uninsured added), stateData.json, dataYears.json, metricsConfig.json.');
  console.log('Next: npm run build.');
})().catch((e) => { console.error('\npull/sahie FAILED:', e.message); process.exitCode = 1; });
