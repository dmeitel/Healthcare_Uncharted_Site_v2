#!/usr/bin/env node
'use strict';
/**
 * pull/compass.js — county-grain cost + risk data for the Assignment Compass
 * (/tools/assignment-compass/). Phase 2 of the tool: replaces state-index
 * housing math with real county numbers and auto-generates insurance
 * blind-spot flags from FEMA risk ratings.
 *
 * Sources, one file each in scripts/.cache/:
 *   Census ACS 5-year API  — median gross rent (B25064), median home value
 *                            (B25077), median household income (B19013),
 *                            population (B01003), median real estate taxes
 *                            (B25103), mean commute (S0801_C01_046E).
 *                            County + state + national rows, official.
 *   Zillow Research        — ZORI (rents) + ZHVI (home values), county CSVs,
 *                            latest month. Better market signal than the ACS
 *                            5-year average where Zillow covers the county.
 *   FEMA National Risk Index — county hazard RATINGS via the official
 *                            FEMA_NationalRiskIndex ArcGIS FeatureServer
 *                            (the static zip on hazards.fema.gov sits behind
 *                            a WAF that 403s scripts). "Very High" or
 *                            "Relatively High" on wildfire / flood / quake /
 *                            hurricane / tornado / hail becomes an insurance
 *                            flag in the tool.
 *   Tax Foundation         — combined state + average local sales tax,
 *                            2025 table, hardcoded below (10 minutes a year
 *                            to re-key; not worth scraping).
 *
 * NOT here: EIA-861 county electricity blends. The 861 ships as xlsx
 * workbooks that need a spreadsheet parser plus a utility-territory blend;
 * deferred rather than done badly. Utilities stay on the MERIC state index.
 *
 * Writes ONE served file: src/assets/data/assignment-compass-counties.json
 * (~300KB, fetched lazily by the tool when a county enters the picture).
 * This is compass-only data, deliberately NOT merged into countyData.json:
 * it is not part of the lens/metric system and carries its own vocabulary.
 *
 * KEY: same Census key handling as pull/acs.js (CENSUS_API_KEY env var or
 * scripts/.cache/census-key.txt).
 *
 * SAFE BY DEFAULT
 *   node scripts/pull/compass.js            dry run (writes nothing)
 *   node scripts/pull/compass.js --write    apply
 *   node scripts/pull/compass.js --refresh  re-download (ignore cache)
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const zlib = require('zlib');

const ROOT = path.join(__dirname, '..', '..');
const P = (...p) => path.join(ROOT, ...p);
const CACHE = P('scripts', '.cache');
const UA = 'HealthcareUncharted/1.0 (david.eitel.pcpal@gmail.com)';
const OUT = 'src/assets/data/assignment-compass-counties.json';

const STFIPS = require('../lib/fips').FIPS_ABBR;
const WRITE = process.argv.includes('--write');
const REFRESH = process.argv.includes('--refresh');

const ACS_YEARS = [2024, 2023];
const ZORI_URL = 'https://files.zillowstatic.com/research/public_csvs/zori/County_zori_uc_sfrcondomfr_sm_sa_month.csv';
const ZHVI_URL = 'https://files.zillowstatic.com/research/public_csvs/zhvi/County_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv';
const NRI_SVC = 'https://services.arcgis.com/XG15cJAlne2vxtgt/arcgis/rest/services/National_Risk_Index_Counties/FeatureServer/0/query';

/* Tax Foundation, combined state + avg local sales tax, 2025 (%). Re-key
   annually from https://taxfoundation.org/data/all/state/2025-sales-taxes/ */
const SALES_TAX = {
  AL: 9.29, AK: 1.82, AZ: 8.38, AR: 9.45, CA: 8.85, CO: 7.81, CT: 6.35, DE: 0,
  DC: 6.0, FL: 7.0, GA: 7.38, HI: 4.5, ID: 6.03, IL: 8.86, IN: 7.0, IA: 6.94,
  KS: 8.65, KY: 6.0, LA: 10.12, ME: 5.5, MD: 6.0, MA: 6.25, MI: 6.0, MN: 8.04,
  MS: 7.06, MO: 8.39, MT: 0, NE: 6.97, NV: 8.24, NH: 0, NJ: 6.63, NM: 7.62,
  NY: 8.53, NC: 7.0, ND: 7.04, OH: 7.24, OK: 8.99, OR: 0, PA: 6.34, RI: 7.0,
  SC: 7.5, SD: 6.11, TN: 9.55, TX: 8.2, UT: 7.25, VT: 6.36, VA: 5.77, WA: 9.38,
  WV: 6.57, WI: 5.7, WY: 5.44
};

/* NRI hazard prefixes -> short flag codes the tool renders as cards.
   IFLD is what NRI v1.20 calls riverine/inland flooding (was RFLD). */
const HAZARDS = [
  ['WFIR', 'WF'],  // wildfire
  ['IFLD', 'FL'],  // inland (riverine) flooding
  ['CFLD', 'CF'],  // coastal flooding
  ['ERQK', 'EQ'],  // earthquake
  ['HRCN', 'HU'],  // hurricane
  ['TRND', 'TO'],  // tornado
  ['HAIL', 'HA']   // hail
];
const FLAG_RATINGS = new Set(['Very High', 'Relatively High']);

/* ── plumbing ─────────────────────────────────────────────────── */
function apiKey() {
  if (process.env.CENSUS_API_KEY) return process.env.CENSUS_API_KEY.trim();
  try { return fs.readFileSync(path.join(CACHE, 'census-key.txt'), 'utf8').trim(); } catch { return null; }
}

function download(url, redirects) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': UA } }, (res) => {
      if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location && (redirects || 0) < 4) {
        res.resume();
        return resolve(download(new URL(res.headers.location, url).href, (redirects || 0) + 1));
      }
      if (res.statusCode !== 200) { res.resume(); return reject(new Error('HTTP ' + res.statusCode + ' for ' + url)); }
      const chunks = [];
      res.on('data', (d) => chunks.push(d));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

async function cached(name, url) {
  const file = path.join(CACHE, name);
  if (!REFRESH && fs.existsSync(file)) return fs.readFileSync(file);
  process.stdout.write(`  downloading ${name} ... `);
  const buf = await download(url);
  fs.mkdirSync(CACHE, { recursive: true });
  fs.writeFileSync(file, buf);
  console.log((buf.length / 1048576).toFixed(1) + ' MB');
  return buf;
}

/* zip: walk the central directory, inflate one entry by name substring.
   Same approach as pull/sahie.js, generalized to multi-entry archives. */
function unzipEntry(buf, nameMatch) {
  let i = buf.length - 22;
  while (i >= 0 && buf.readUInt32LE(i) !== 0x06054b50) i--;
  if (i < 0) throw new Error('not a zip (no EOCD)');
  let off = buf.readUInt32LE(i + 16);
  const count = buf.readUInt16LE(i + 10);
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(off) !== 0x02014b50) throw new Error('bad central directory');
    const method = buf.readUInt16LE(off + 10);
    const nameLen = buf.readUInt16LE(off + 28);
    const extraLen = buf.readUInt16LE(off + 30);
    const cmtLen = buf.readUInt16LE(off + 32);
    const lho = buf.readUInt32LE(off + 42);
    const name = buf.toString('utf8', off + 46, off + 46 + nameLen);
    if (name.toLowerCase().includes(nameMatch.toLowerCase())) {
      const lnl = buf.readUInt16LE(lho + 26), lxl = buf.readUInt16LE(lho + 28);
      const start = lho + 30 + lnl + lxl;
      const csize = buf.readUInt32LE(off + 20);
      const raw = buf.subarray(start, start + csize);
      return method === 0 ? raw : zlib.inflateRawSync(raw);
    }
    off += 46 + nameLen + extraLen + cmtLen;
  }
  throw new Error('no zip entry matching "' + nameMatch + '"');
}

/* minimal quoted-field CSV line splitter (NRI + Zillow both quote names) */
function splitCsv(line) {
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

const round = (n) => Math.round(n);
const getJSON = async (url) => JSON.parse((await download(url)).toString('utf8'));

/* ── ACS ──────────────────────────────────────────────────────── */
const DETAIL_VARS = ['B25064_001E', 'B25077_001E', 'B19013_001E', 'B01003_001E', 'B25103_001E'];
const SUBJECT_VARS = ['S0801_C01_046E'];

async function pullAcs() {
  const key = apiKey();
  if (!key) throw new Error('No Census API key (env CENSUS_API_KEY or scripts/.cache/census-key.txt)');
  for (const year of ACS_YEARS) {
    try {
      const out = { year, county: {}, state: {}, us: {} };
      for (const [endpoint, vars] of [['detail', DETAIL_VARS], ['subject', SUBJECT_VARS]]) {
        const base = `https://api.census.gov/data/${year}/acs/acs5${endpoint === 'subject' ? '/subject' : ''}?get=${vars.join(',')}`;
        for (const geo of ['county', 'state', 'us']) {
          const file = path.join(CACHE, `compass-acs-${year}-${endpoint}-${geo}.json`);
          let rows;
          if (!REFRESH && fs.existsSync(file)) rows = JSON.parse(fs.readFileSync(file, 'utf8'));
          else {
            rows = await getJSON(`${base}&for=${geo}:*&key=${key}`);
            fs.mkdirSync(CACHE, { recursive: true });
            fs.writeFileSync(file, JSON.stringify(rows));
          }
          const [head, ...body] = rows;
          const col = Object.fromEntries(head.map((h, j) => [h, j]));
          for (const r of body) {
            let id;
            if (geo === 'county') {
              if (!STFIPS[r[col.state]]) continue;
              id = r[col.state] + r[col.county];
            } else if (geo === 'state') {
              if (!STFIPS[r[col.state]]) continue;
              id = STFIPS[r[col.state]];
            } else id = 'US';
            const tgt = geo === 'us' ? out.us : out[geo][id] || (out[geo][id] = {});
            for (const v of vars) {
              const val = parseFloat(r[col[v]]);
              if (Number.isFinite(val) && val > 0) tgt[v] = val;
            }
            if (geo === 'us') out.us = tgt;
          }
        }
      }
      return out;
    } catch (e) {
      console.log(`  ACS ${year} not available (${e.message}) — trying older vintage`);
    }
  }
  throw new Error('no ACS vintage answered');
}

/* ── Zillow: latest non-empty month per county ────────────────── */
function parseZillow(buf) {
  const lines = buf.toString('utf8').split(/\r?\n/).filter(Boolean);
  const head = splitCsv(lines[0]);
  const iSt = head.indexOf('StateCodeFIPS');
  const iCo = head.indexOf('MunicipalCodeFIPS');
  if (iSt < 0 || iCo < 0) throw new Error('Zillow CSV shape changed (no FIPS columns)');
  const firstMonth = head.findIndex((h) => /^\d{4}-\d{2}-\d{2}$/.test(h));
  const out = {};
  let month = null;
  for (let i = 1; i < lines.length; i++) {
    const f = splitCsv(lines[i]);
    const fips = String(f[iSt]).padStart(2, '0') + String(f[iCo]).padStart(3, '0');
    for (let j = f.length - 1; j >= firstMonth; j--) {
      const v = parseFloat(f[j]);
      if (Number.isFinite(v) && v > 0) {
        out[fips] = v;
        if (!month || head[j] > month) month = head[j];
        break;
      }
    }
  }
  return { values: out, month };
}

/* ── FEMA NRI: hazard rating flags per county, paged FeatureServer ── */
async function pullNri() {
  const cacheFile = path.join(CACHE, 'compass-nri-features.json');
  let features;
  if (!REFRESH && fs.existsSync(cacheFile)) features = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
  else {
    features = [];
    const fields = ['STCOFIPS'].concat(HAZARDS.map(([pre]) => pre + '_RISKR')).join(',');
    for (let offset = 0; ; offset += 2000) {
      const url = `${NRI_SVC}?where=1%3D1&outFields=${fields}&returnGeometry=false&f=json&resultOffset=${offset}&resultRecordCount=2000`;
      const page = await getJSON(url);
      if (page.error) throw new Error('NRI query error: ' + JSON.stringify(page.error.details || page.error.message));
      features = features.concat(page.features || []);
      if (!page.features || page.features.length < 2000) break;
    }
    fs.mkdirSync(CACHE, { recursive: true });
    fs.writeFileSync(cacheFile, JSON.stringify(features));
  }
  const out = {};
  for (const f of features) {
    const a = f.attributes || {};
    const fips = String(a.STCOFIPS || '').padStart(5, '0');
    if (fips.length !== 5 || fips === '00000') continue;
    const flags = [];
    for (const [pre, code] of HAZARDS) if (FLAG_RATINGS.has(a[pre + '_RISKR'])) flags.push(code);
    if (flags.length) out[fips] = flags;
  }
  return out;
}

/* ── main ─────────────────────────────────────────────────────── */
(async () => {
  console.log('Assignment Compass county data pull.');
  console.log(`Mode: ${WRITE ? 'WRITE' : 'DRY RUN (no files touched)'}${REFRESH ? ' · cache bypassed' : ''}\n`);

  const acs = await pullAcs();
  console.log(`  ACS vintage: ${acs.year} 5-year · ${Object.keys(acs.county).length} counties, ${Object.keys(acs.state).length} states`);

  const zori = parseZillow(await cached('compass-zori.csv', ZORI_URL));
  const zhvi = parseZillow(await cached('compass-zhvi.csv', ZHVI_URL));
  console.log(`  Zillow ZORI: ${Object.keys(zori.values).length} counties (latest ${zori.month}) · ZHVI: ${Object.keys(zhvi.values).length} counties (latest ${zhvi.month})`);

  const nri = await pullNri();
  console.log(`  FEMA NRI: ${Object.keys(nri).length} counties carry at least one high-risk flag\n`);

  /* assemble */
  const counties = {};
  for (const fips of Object.keys(acs.county)) {
    const a = acs.county[fips];
    const row = {};
    if (a.B25064_001E) row.r = round(a.B25064_001E);            // ACS median gross rent
    if (zori.values[fips]) row.z = round(zori.values[fips]);    // ZORI market rent
    if (a.B25077_001E) row.v = round(a.B25077_001E);            // ACS median home value
    if (zhvi.values[fips]) row.h = round(zhvi.values[fips]);    // ZHVI market value
    if (a.B19013_001E) row.i = round(a.B19013_001E);            // median HH income
    if (a.B01003_001E) row.p = round(a.B01003_001E);            // population
    if (a.S0801_C01_046E) row.c = Math.round(a.S0801_C01_046E * 10) / 10;  // mean commute
    if (a.B25103_001E) row.t = round(a.B25103_001E);            // median RE taxes paid
    if (nri[fips]) row.k = nri[fips];                           // risk flags
    if (Object.keys(row).length) counties[fips] = row;
  }
  const states = {};
  for (const ab of Object.keys(acs.state)) {
    const a = acs.state[ab];
    states[ab] = {
      r: round(a.B25064_001E || 0), v: round(a.B25077_001E || 0), i: round(a.B19013_001E || 0),
      s: SALES_TAX[ab] != null ? SALES_TAX[ab] : null
    };
  }
  const national = {
    r: round(acs.us.B25064_001E || 0), v: round(acs.us.B25077_001E || 0), i: round(acs.us.B19013_001E || 0)
  };

  /* ── validate before anything is written ── */
  const problems = [];
  const nRent = Object.values(counties).filter((c) => c.r).length;
  if (nRent < 2800) problems.push(`only ${nRent} counties have ACS rent (expected 2800+)`);
  if (Object.keys(states).length !== 51) problems.push(`${Object.keys(states).length} states (expected 51)`);
  if (!(national.r > 900 && national.r < 2500)) problems.push(`national median rent ${national.r} outside sanity band`);
  if (!(national.v > 200000 && national.v < 600000)) problems.push(`national median home value ${national.v} outside sanity band`);
  const spot = [
    ['49035', 'Salt Lake UT', (c) => c.r > 900 && c.r < 3000],
    ['06067', 'Sacramento CA', (c) => c.r > 1200 && c.r < 3500],
    ['53033', 'King WA', (c) => c.r > 1400 && c.r < 4000]
  ];
  for (const [fips, label, ok] of spot) {
    if (!counties[fips] || !ok(counties[fips])) problems.push(`spot check failed: ${label} (${JSON.stringify(counties[fips])})`);
  }
  const missingSales = Object.keys(states).filter((ab) => states[ab].s == null);
  if (missingSales.length) problems.push('no sales tax for: ' + missingSales.join(','));

  console.log('  Sample rows:');
  for (const [fips, label] of [['49035', 'Salt Lake UT'], ['06067', 'Sacramento CA'], ['04013', 'Maricopa AZ'], ['53033', 'King WA'], ['16001', 'Ada ID']]) {
    console.log(`    ${label} (${fips}): ${JSON.stringify(counties[fips])}`);
  }
  console.log(`  National: rent ${national.r} · home ${national.v} · income ${national.i}`);

  if (problems.length) {
    console.log('\nPROBLEMS — nothing will be written:');
    for (const p of problems) console.log('  · ' + p);
    process.exitCode = 1;
    return;
  }

  const out = {
    _meta: {
      note: 'County-grain housing, income, and risk data for the Assignment Compass. Keys per county: r=ACS median gross rent, z=ZORI rent, v=ACS median home value, h=ZHVI value, i=median household income, p=population, c=mean commute minutes, t=median annual real estate taxes, k=FEMA NRI high-risk flags (WF wildfire, FL riverine flood, CF coastal flood, EQ earthquake, HU hurricane, TO tornado, HA hail). States: r/v/i same idea + s=combined state and avg local sales tax %.',
      acsVintage: acs.year + ' 5-year',
      zoriMonth: zori.month, zhviMonth: zhvi.month,
      nriSource: 'FEMA National Risk Index county layer (FEMA_NationalRiskIndex FeatureServer), flags = Very High or Relatively High rating',
      salesTaxSource: 'Tax Foundation 2025 combined state + avg local',
      retrieved: new Date().toISOString().slice(0, 10)
    },
    national, states, counties
  };

  const json = JSON.stringify(out);
  console.log(`\nOutput: ${(json.length / 1024).toFixed(0)} KB, ${Object.keys(counties).length} counties.`);
  if (!WRITE) { console.log('Dry run complete. Nothing written. Re-run with --write to apply.'); return; }
  fs.writeFileSync(P(OUT), json + '\n');
  console.log('Wrote ' + OUT);
})().catch((e) => { console.error('\npull/compass FAILED:', e.message); process.exitCode = 1; });
