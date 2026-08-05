#!/usr/bin/env node
/*
 * build-hospital-prices.js — Utah pilot: hospital-posted price transparency basket.
 *
 * WHAT THIS PULLS
 *   Every hospital must publish a machine-readable file (MRF) of ALL standard
 *   charges under 45 CFR 180.50, discoverable via /cms-hpt.txt at the hospital's
 *   domain root (required since July 2024; v3.0 schema effective Jan 2026).
 *   We pull the Utah hospitals' MRFs, keep ONLY a small basket of recognizable
 *   services, and ship gross charge / discounted cash / payer min / payer max.
 *
 * SOURCES (discovery files, re-fetched every run)
 *   Intermountain  https://intermountainhealthcare.org/cms-hpt.txt  (wide v3.0 CSV, zipped)
 *   HCA/MountainStar https://www.mountainstar.com/cms-hpt.txt       (v2.2 JSON, ~240MB each)
 *   CommonSpirit   https://mountain.commonspirit.org/cms-hpt.txt    (wide v3.0 CSV, ~700MB each)
 *   Lifepoint      castleviewhospital.net + ashleyregional.com      (wide v3.0 CSV, zipped)
 *   Quorum         mountainwestmc.com (ParaRev-hosted CSV)
 *   San Juan       sanjuanhealth.org (goredde-hosted CSV)
 *   University of Utah: 43GB uncompressed tall CSV. NOT pulled by default.
 *     Run with --uofu to stream it (no disk cache). Expect a long download.
 *
 * NOT COVERED (and why): U of U (size, see flag), VA (exempt), Utah State
 *   Hospital + Marian Center (state/psych, no MRF found), UHS psych x2,
 *   Western Peaks, and 7 independent CAHs with no discoverable cms-hpt.txt.
 *   Blue Mountain Hospital at bluemountainhospital.org is the OREGON district
 *   (EIN 93-), not Blanding UT. Skipped on purpose.
 *
 * DATA GUARDS
 *   - values <= 0 or >= 9e8 dropped (999999999 is the industry placeholder)
 *   - billing_class 'professional' rows dropped (facility prices only)
 *   - setting must match the basket item (or be 'both'/blank)
 *   - multiple chargemaster rows for one code -> MEDIAN of gross and cash,
 *     true min of payer-min, true max of payer-max, row count kept as n
 *
 * CACHE: scripts/.cache/mrf/  (gitignored). Delete a file to force re-pull.
 *   MRF URLs rotate quarterly for some systems (Lifepoint paths carry mrf2q26);
 *   discovery is re-read each run so new URLs are picked up automatically.
 *
 * OUTPUT: src/assets/data/hospital-prices.json (minified, ~15KB)
 *   { _meta:{...}, byId:{ CCN: { up, fmt, px:{ key:[gross,cash,min,max,n] } } } }
 */

const fs = require('fs');
const path = require('path');
const { spawnSync, spawn } = require('child_process');

const ROOT = path.join(__dirname, '..');
const CACHE = path.join(__dirname, '.cache', 'mrf');
const OUT = path.join(ROOT, 'src', 'assets', 'data', 'hospital-prices.json');
const CDM_OUT = path.join(ROOT, 'src', 'assets', 'data', 'hospital-cdm-ut.json');
const WANT_UOFU = process.argv.includes('--uofu');

/* ---------------- service basket ----------------
 * k: stable key (append-only contract, mirrors the enrich svcOrder rule)
 * type: DRG matches any code-type containing DRG; CPT matches CPT or HCPCS
 * set: which care setting's rows count for this item
 */
const BASKET = [
  { k: 'er4',      code: '99284', type: 'CPT', set: 'outpatient', label: 'ER visit, level 4' },
  { k: 'mribrain', code: '70551', type: 'CPT', set: 'outpatient', label: 'MRI brain, no contrast' },
  { k: 'ctabd',    code: '74177', type: 'CPT', set: 'outpatient', label: 'CT abdomen + pelvis, contrast' },
  { k: 'xray',     code: '71046', type: 'CPT', set: 'outpatient', label: 'Chest X-ray, 2 views' },
  { k: 'usabd',    code: '76700', type: 'CPT', set: 'outpatient', label: 'Abdominal ultrasound' },
  { k: 'mammo',    code: '77067', type: 'CPT', set: 'outpatient', label: 'Screening mammogram' },
  { k: 'colon',    code: '45378', type: 'CPT', set: 'outpatient', label: 'Colonoscopy, diagnostic' },
  { k: 'gallbl',   code: '47562', type: 'CPT', set: 'outpatient', label: 'Gallbladder removal (lap)' },
  { k: 'kneescope',code: '29881', type: 'CPT', set: 'outpatient', label: 'Knee arthroscopy' },
  { k: 'cbc',      code: '85025', type: 'CPT', set: 'outpatient', label: 'Blood count (CBC)' },
  { k: 'cmp',      code: '80053', type: 'CPT', set: 'outpatient', label: 'Metabolic panel' },
  { k: 'joint',    code: '470',   type: 'DRG', set: 'inpatient',  label: 'Hip or knee replacement' },
  { k: 'vagdel',   code: '807',   type: 'DRG', set: 'inpatient',  label: 'Vaginal delivery' },
  { k: 'csect',    code: '788',   type: 'DRG', set: 'inpatient',  label: 'C-section delivery' },
];

/* ---------------- discovery registry ----------------
 * map keys are normalized location-names as they appear in each cms-hpt.txt
 * (lowercased, whitespace collapsed, "intermountain health " prefix stripped).
 * Hand-checked against src/assets/data/us-hospitals.json CCNs 2026-07-26.
 */
const SOURCES = [
  {
    sys: 'Intermountain Health',
    hpt: 'https://intermountainhealthcare.org/cms-hpt.txt',
    map: {
      'alta view hospital': '460044',
      'american fork hospital': '460023',
      'bear river valley hospital': '460039',
      'cedar city hospital': '460007',
      'delta community hospital': '461300',
      'fillmore community hospital': '461301',
      'garfield memorial hospital': '461333',
      'heber valley hospital': '461307',
      'intermountain medical center': '460010',
      'layton hospital': '460061',
      'logan regional hospital': '460015',
      'lds hospital': '460006',
      'mckay-dee hospital': '460004',
      'orem community hospital': '460043',
      'park city hospital': '460057',
      "primary children's hospital": '463301',
      'riverton hospital': '460058',
      'sanpete valley hospital': '461303',
      'sevier valley hospital': '460026',
      'st. george regional hospital': '460021',
      'spanish fork hospital': '460062',
      'utah valley hospital': '460001',
    },
  },
  {
    sys: 'HCA / MountainStar',
    hpt: 'https://www.mountainstar.com/cms-hpt.txt',
    map: {
      'brigham city community hospital': '460017',
      'cache valley hospital': '460054',
      'lakeview hospital': '460042',
      'lone peak hospital': '460060',
      'mountain view hospital': '460013',
      'ogden regional medical center': '460005',
      "st mark's hospital": '460047',
      'timpanogos regional medical center': '460052',
    },
  },
  {
    sys: 'CommonSpirit Health',
    hpt: 'https://mountain.commonspirit.org/cms-hpt.txt',
    map: {
      'holy cross hospital - davis': '460041',
      'holy cross hospital - jordan valley': '460051',
      'holy cross hospital - salt lake': '460003',
    },
  },
  { sys: 'Lifepoint Health', hpt: 'https://www.castleviewhospital.net/cms-hpt.txt', map: { 'castleview hospital': '460011' } },
  { sys: 'Lifepoint Health', hpt: 'https://www.ashleyregional.com/cms-hpt.txt', map: { 'ashley regional medical center': '460030' } },
  { sys: 'Quorum Health', hpt: 'https://mountainwestmc.com/cms-hpt.txt', map: { 'mountain west medical center': '460014' } },
  { sys: 'San Juan Health', hpt: 'https://sanjuanhealth.org/cms-hpt.txt', map: { 'san juan health': '461308' } },
  // round-21 hunt (2026-07-27): independents + psych found one by one
  { sys: 'Blue Mountain (Blanding)', hpt: 'https://bmhutah.org/cms-hpt.txt', map: { 'blue mountain hospital': '461310' } },
  { sys: 'Kane County Hospital', hpt: 'https://kchosp.net/cms-hpt.txt', map: { 'kane county hospital': '461309' } },
  { sys: 'Central Valley Medical Center', hpt: 'https://www.centralvalleymedicalcenter.com/cms-hpt.txt', map: { 'central valley medical center': '461304' } },
  { sys: 'UHS Behavioral', hpt: 'https://saltlakebehavioralhealth.com/cms-hpt.txt', map: { 'salt lake behavioral health': '464013' } },
  { sys: 'UHS Behavioral', hpt: 'https://www.aspengrovehospital.com/cms-hpt.txt', map: { 'aspen grove behavioral hospital': '464014' } },
];

/* MRFs found by hand where the domain root serves no cms-hpt.txt:
 * - Uintah Basin: their cms-hpt.txt lives on the site CDN (s46669.pcdn.co, dated
 *   path that will rotate) and points at a stable Craneware API endpoint.
 * - Moab: WordPress upload linked from mrhmoab.org/price-transparency/.
 * Re-verify these two URLs on each quarterly run; they have no discovery anchor.
 * STILL MISSING after the 2026-07-27 hunt: Gunnison Valley 461306 (posts XLSX
 * worksheets only, non-compliant format), Milford 461305, Beaver Valley 461335,
 * Western Peaks 460063, Utah State Hospital 464001, Marian Center 464012 (nothing
 * discoverable), VA 46002F (federal, exempt).
 */
const DIRECT = [
  { sys: 'Uintah Basin Healthcare', ccn: '460019', name: 'Uintah Basin Medical Center',
    url: 'https://apim.services.craneware.com/api-pricing-transparency/api/public/6e8a5a2ffad6b97f31198aa99dbc26b1/charges/mrf' },
  { sys: 'Moab Regional Hospital', ccn: '461302', name: 'Moab Regional Hospital',
    url: 'https://mrhmoab.org/wp-content/uploads/2024/07/870543342_MoabRegionalHospital_Standardcharges-1-1.csv' },
];

const UOFU = { ccn: '460009', url: 'https://md.utah.edu/pricing/876000525_UNIVERSITY-OF-UTAH-HOSPITAL-AND-CLINICS_standardcharges.csv' };

/* ---------------- helpers ---------------- */
const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim().replace(/^intermountain health /, '');
const num = (v) => {
  const n = parseFloat(String(v == null ? '' : v).replace(/[$,\s]/g, ''));
  // 999999999 = the industry placeholder; sub-cent "prices" are entry junk
  return isFinite(n) && n >= 0.01 && n < 9e8 ? n : null;
};
const median = (a) => {
  if (!a.length) return null;
  const s = a.slice().sort((x, y) => x - y);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
// whole dollars read best, but chargemasters carry $0.37 drug lines —
// rounding those to $0 fails the >0 guard AND lies. Keep cents under $10.
const money = (v) => v >= 10 ? Math.round(v) : Math.round(v * 100) / 100;
const codeKey = (code, type) => {
  const t = String(type || '').toUpperCase();
  const c = String(code || '').trim().toUpperCase();
  if (/DRG/.test(t)) return 'DRG:' + c.replace(/^0+/, '');
  if (t === 'CPT' || t === 'HCPCS') return 'CPT:' + c;
  return null;
};
const BASKET_BY = {};
BASKET.forEach((b) => { BASKET_BY[b.type + ':' + (b.type === 'DRG' ? b.code.replace(/^0+/, '') : b.code)] = b; });

/* Full-CDM second output: EVERY comparable code, not just the basket.
 * Strict shapes so mislabeled chargemaster line numbers can't leak in:
 * CPT = 5 digits, HCPCS = letter + 4 digits, DRG = 1-3 digits (D-prefixed key). */
const codeKeyAll = (code, type) => {
  const t = String(type || '').toUpperCase();
  const c = String(code || '').trim().toUpperCase();
  if (/DRG/.test(t)) { const d = c.replace(/^0+/, ''); return /^[0-9]{1,3}$/.test(d) ? 'D' + d : null; }
  if ((t === 'CPT' || t === 'HCPCS') && (/^[0-9]{5}$/.test(c) || /^[A-Z][0-9]{4}$/.test(c))) return c;
  return null;
};

function curl(url, dest) {
  const r = spawnSync('curl', ['-sL', '--compressed', '--max-time', '3000', '-o', dest, url], { stdio: ['ignore', 'inherit', 'inherit'] });
  if (r.status !== 0) throw new Error('curl exit ' + r.status + ' for ' + url);
}
function fetchText(url) {
  const r = spawnSync('curl', ['-sL', '--compressed', '--max-time', '60', url], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  if (r.status !== 0) throw new Error('curl exit ' + r.status + ' for ' + url);
  return r.stdout;
}
function expandZip(zip, destDir) {
  fs.rmSync(destDir, { recursive: true, force: true });
  const r = spawnSync('powershell.exe', ['-NoProfile', '-Command', `Expand-Archive -LiteralPath '${zip}' -DestinationPath '${destDir}' -Force`], { stdio: 'ignore' });
  if (r.status !== 0) throw new Error('Expand-Archive failed for ' + zip);
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    if (e.name === '__MACOSX') return [];
    const p = path.join(d, e.name);
    return e.isDirectory() ? walk(p) : (/\.(csv|json)$/i.test(e.name) ? [p] : []);
  });
  const files = walk(destDir);
  if (!files.length) throw new Error('no csv/json inside ' + zip);
  return files[0];
}

/* Parse a cms-hpt.txt into [{name, url}] */
function parseHpt(text) {
  const out = [];
  let cur = null;
  text.split(/\r?\n/).forEach((line) => {
    const m = line.match(/^\s*([a-z-]+)\s*:\s*(.+?)\s*$/i);
    if (!m) return;
    const key = m[1].toLowerCase(); const val = m[2];
    if (key === 'location-name') { cur = { name: val, url: null }; out.push(cur); }
    else if (key === 'mrf-url' && cur) cur.url = val;
  });
  return out.filter((e) => e.url);
}

/* ---------------- CSV streaming (v3.0 wide/tall, 3 header rows) ----------------
 * Stateful tokenizer: handles quoted fields, embedded commas/newlines, CRLF.
 * onRow(cells, rowIndex) is called per record. Returns a Promise.
 */
function streamCsv(stream, onRow) {
  return new Promise((resolve, reject) => {
    let field = '', row = [], inQ = false, rowIdx = 0, pendCR = false;
    const endField = () => { row.push(field); field = ''; };
    const endRow = () => { endField(); if (row.length > 1 || row[0] !== '') onRow(row, rowIdx++); row = []; };
    stream.on('data', (chunk) => {
      const s = chunk.toString('utf8');
      for (let i = 0; i < s.length; i++) {
        const ch = s[i];
        if (pendCR && ch === '\n' && !inQ) { pendCR = false; continue; }
        pendCR = false;
        if (inQ) {
          if (ch === '"') {
            if (s[i + 1] === '"') { field += '"'; i++; } else inQ = false;
          } else field += ch;
        } else if (ch === '"') inQ = true;
        else if (ch === ',') endField();
        else if (ch === '\n') endRow();
        else if (ch === '\r') { endRow(); pendCR = true; }
        else field += ch;
      }
    });
    stream.on('end', () => { if (field !== '' || row.length) endRow(); resolve(); });
    stream.on('error', reject);
  });
}

/* Extract basket prices from a v3.0 CSV file (or stream).
 * cdm (optional) = { hits: {code:[{g,c}]}, descs: {code:{desc:count}} } — the
 * full-CDM sink, fed from the SAME single pass. */
async function harvestCsv(stream, cdm) {
  let header = null, meta = {};
  const hits = {}; // basketKey -> [{g,c,mn,mx}]
  let idx = null;
  let metaHeader = null;
  await streamCsv(stream, (row, i) => {
    if (i === 0) { metaHeader = row.map((h) => h.trim().toLowerCase()); return; }
    if (i === 1) {
      const j = metaHeader.indexOf('last_updated_on');
      if (j >= 0) meta.up = row[j];
      const v = metaHeader.indexOf('version');
      if (v >= 0) meta.ver = row[v];
      return;
    }
    if (i === 2) {
      header = row.map((h) => h.trim().toLowerCase().replace(/\s*\|\s*/g, '|'));
      idx = {
        codes: [], // [codeCol, typeCol]
        desc: header.indexOf('description'),
        setting: header.indexOf('setting'),
        billing: header.indexOf('billing_class'),
        g: header.indexOf('standard_charge|gross'),
        c: header.indexOf('standard_charge|discounted_cash'),
        mn: header.indexOf('standard_charge|min'),
        mx: header.indexOf('standard_charge|max'),
      };
      header.forEach((h, j) => {
        const m = h.match(/^code\|(\d+)$/);
        if (m) {
          const t = header.indexOf('code|' + m[1] + '|type');
          if (t >= 0) idx.codes.push([j, t]);
        }
      });
      return;
    }
    if (!idx) return;
    const bill = idx.billing >= 0 ? String(row[idx.billing] || '').toLowerCase() : '';
    if (bill === 'professional') return;
    // full-CDM sink: every well-shaped code on the row, gross/cash, desc votes
    if (cdm) {
      let ck = null;
      for (const [cj, tj] of idx.codes) { ck = codeKeyAll(row[cj], row[tj]); if (ck) break; }
      if (ck) {
        const g0 = idx.g >= 0 ? num(row[idx.g]) : null;
        const c0 = idx.c >= 0 ? num(row[idx.c]) : null;
        if (g0 != null || c0 != null) {
          // tall-format files repeat one code across hundreds of payer rows
          // with the same gross/cash — keep DISTINCT price points, capped
          const arr = cdm.hits[ck] = cdm.hits[ck] || [];
          if (arr.length < 400) {
            const seen = cdm.seen[ck] = cdm.seen[ck] || new Set();
            const sig = g0 + '|' + c0;
            if (!seen.has(sig)) { seen.add(sig); arr.push({ g: g0, c: c0 }); }
          }
          if (idx.desc >= 0 && row[idx.desc]) {
            const d = String(row[idx.desc]).trim().replace(/^HC\s+/i, '').slice(0, 80);
            if (d) { const m = cdm.descs[ck] = cdm.descs[ck] || {}; m[d] = (m[d] || 0) + 1; }
          }
        }
      }
    }
    let item = null;
    for (const [cj, tj] of idx.codes) {
      const key = codeKey(row[cj], row[tj]);
      if (key && BASKET_BY[key]) { item = BASKET_BY[key]; break; }
    }
    if (!item) return;
    const setting = idx.setting >= 0 ? String(row[idx.setting] || '').toLowerCase() : '';
    if (setting && setting !== 'both' && setting !== item.set) return;
    const g = idx.g >= 0 ? num(row[idx.g]) : null;
    const c = idx.c >= 0 ? num(row[idx.c]) : null;
    const mn = idx.mn >= 0 ? num(row[idx.mn]) : null;
    const mx = idx.mx >= 0 ? num(row[idx.mx]) : null;
    if (g == null && c == null) return;
    (hits[item.k] = hits[item.k] || []).push({ g, c, mn, mx });
  });
  return { meta, hits };
}

/* ---------------- JSON streaming (HCA v2.2) ----------------
 * Never JSON.parse a 240MB file. Scan for elements of the
 * standard_charge_information array (string/escape aware, depth-tracked)
 * and JSON.parse each ~small element individually.
 */
function harvestJson(file, cdm) {
  return new Promise((resolve, reject) => {
    const hits = {};
    const meta = {};
    let head = '';
    let inArr = false, depth = 0, inStr = false, esc = false, buf = '', capturing = false;
    const MARK = '"standard_charge_information"';
    let tail = '';
    const feed = (s) => {
      if (!inArr) {
        head += s;
        const at = head.indexOf(MARK);
        if (at < 0) { head = head.slice(-MARK.length); return; }
        const um = head.match(/"last_updated_on"\s*:\s*"([^"]+)"/); if (um) meta.up = um[1];
        const vm = head.match(/"version"\s*:\s*"([^"]+)"/); if (vm) meta.ver = vm[1];
        const br = head.indexOf('[', at);
        if (br < 0) { head = head.slice(at); return; }
        inArr = true; s = head.slice(br + 1); head = '';
      }
      for (let i = 0; i < s.length; i++) {
        const ch = s[i];
        if (capturing) buf += ch;
        if (inStr) {
          if (esc) esc = false;
          else if (ch === '\\') esc = true;
          else if (ch === '"') inStr = false;
          continue;
        }
        if (ch === '"') { inStr = true; continue; }
        if (ch === '{') { if (depth === 0) { capturing = true; buf = '{'; } depth++; }
        else if (ch === '}') {
          depth--;
          if (depth === 0 && capturing) { capturing = false; takeItem(buf); buf = ''; }
        } else if (ch === ']' && depth === 0) { inArr = false; return; }
      }
    };
    const takeItem = (txt) => {
      let it; try { it = JSON.parse(txt); } catch (e) { return; }
      if (cdm) {
        let ck = null;
        for (const ci of (it.code_information || [])) { ck = codeKeyAll(ci.code, ci.type); if (ck) break; }
        if (ck) (it.standard_charges || []).forEach((sc) => {
          if (String(sc.billing_class || '').toLowerCase() === 'professional') return;
          const g0 = num(sc.gross_charge), c0 = num(sc.discounted_cash);
          if (g0 == null && c0 == null) return;
          const arr = cdm.hits[ck] = cdm.hits[ck] || [];
          if (arr.length < 400) {
            const seen = cdm.seen[ck] = cdm.seen[ck] || new Set();
            const sig = g0 + '|' + c0;
            if (!seen.has(sig)) { seen.add(sig); arr.push({ g: g0, c: c0 }); }
          }
          if (it.description) {
            const d = String(it.description).trim().replace(/^HC\s+/i, '').slice(0, 80);
            if (d) { const m = cdm.descs[ck] = cdm.descs[ck] || {}; m[d] = (m[d] || 0) + 1; }
          }
        });
      }
      const codes = (it.code_information || []).map((ci) => codeKey(ci.code, ci.type)).filter(Boolean);
      let item = null;
      for (const k of codes) { if (BASKET_BY[k]) { item = BASKET_BY[k]; break; } }
      if (!item) return;
      (it.standard_charges || []).forEach((sc) => {
        const setting = String(sc.setting || '').toLowerCase();
        if (setting && setting !== 'both' && setting !== item.set) return;
        if (String(sc.billing_class || '').toLowerCase() === 'professional') return;
        const g = num(sc.gross_charge), c = num(sc.discounted_cash), mn = num(sc.minimum), mx = num(sc.maximum);
        if (g == null && c == null && mn == null && mx == null) return;
        (hits[item.k] = hits[item.k] || []).push({ g, c, mn, mx });
      });
    };
    const rs = fs.createReadStream(file, { encoding: 'utf8', highWaterMark: 1 << 20 });
    rs.on('data', feed);
    rs.on('end', () => resolve({ meta, hits }));
    rs.on('error', reject);
  });
}

/* ---------------- aggregate + main ---------------- */
function fold(hits) {
  const px = {};
  Object.keys(hits).forEach((k) => {
    const rows = hits[k];
    const gs = rows.map((r) => r.g).filter((v) => v != null);
    const cs = rows.map((r) => r.c).filter((v) => v != null);
    const mns = rows.map((r) => r.mn).filter((v) => v != null);
    const mxs = rows.map((r) => r.mx).filter((v) => v != null);
    if (!gs.length && !cs.length) return;
    px[k] = [
      gs.length ? money(median(gs)) : null,
      cs.length ? money(median(cs)) : null,
      mns.length ? money(Math.min.apply(null, mns)) : null,
      mxs.length ? money(Math.max.apply(null, mxs)) : null,
      rows.length,
    ];
  });
  return px;
}

async function main() {
  fs.mkdirSync(CACHE, { recursive: true });
  const byId = {};
  const jobs = []; // {ccn, sys, name, url}

  for (const src of SOURCES) {
    let entries;
    try { entries = parseHpt(fetchText(src.hpt)); }
    catch (e) { console.warn('DISCOVERY FAILED', src.hpt, e.message); continue; }
    const seen = new Set();
    entries.forEach((e) => {
      const ccn = src.map[norm(e.name)];
      if (!ccn || seen.has(ccn)) return;
      seen.add(ccn);
      let url = e.url.trim();
      if (!/^https?:/i.test(url)) url = 'https://' + url;
      jobs.push({ ccn, sys: src.sys, name: e.name.trim(), url });
    });
    const missing = Object.entries(src.map).filter(([, ccn]) => !seen.has(ccn));
    missing.forEach(([n, ccn]) => console.warn('NOT IN DISCOVERY:', src.sys, n, ccn));
  }
  DIRECT.forEach((d) => jobs.push({ ccn: d.ccn, sys: d.sys, name: d.name, url: d.url }));
  console.log('mapped ' + jobs.length + ' hospitals to MRF urls');

  const CDMBY = {};   // ccn -> code -> [medGross, medCash, lines]
  const DESCS = {};   // code -> desc -> votes (across all hospitals)
  const foldCdm = (ccn, cdm) => {
    const codes = {};
    Object.keys(cdm.hits).forEach((k) => {
      const rows = cdm.hits[k];
      const gs = rows.map((r) => r.g).filter((v) => v != null);
      const cs = rows.map((r) => r.c).filter((v) => v != null);
      if (!gs.length && !cs.length) return;
      codes[k] = [gs.length ? money(median(gs)) : null, cs.length ? money(median(cs)) : null, rows.length];
    });
    if (Object.keys(codes).length) CDMBY[ccn] = codes;
    Object.keys(cdm.descs).forEach((k) => {
      const M = DESCS[k] = DESCS[k] || {};
      Object.entries(cdm.descs[k]).forEach(([d, n]) => { M[d] = (M[d] || 0) + n; });
    });
    return Object.keys(codes).length;
  };

  for (const job of jobs) {
    const isJson = /\.json(\?|$)|hcadam\.com/i.test(job.url);
    const isZip = /\.zip(\?|$)|\.ashx(\?|$)/i.test(job.url);
    const ext = isJson ? 'json' : isZip ? 'zip' : 'csv';
    const cached = path.join(CACHE, 'mrf-' + job.ccn + '.' + ext);
    try {
      if (!fs.existsSync(cached) || !fs.statSync(cached).size) {
        console.log('pull ' + job.ccn + ' ' + job.name + ' <- ' + job.url.slice(0, 90));
        curl(job.url, cached);
      } else console.log('cache ' + job.ccn + ' ' + job.name);
      let res;
      const cdm = { hits: {}, descs: {}, seen: {} };
      if (isJson) res = await harvestJson(cached, cdm);
      else {
        const csv = isZip ? expandZip(cached, path.join(CACHE, 'x-' + job.ccn)) : cached;
        res = await harvestCsv(fs.createReadStream(csv, { highWaterMark: 1 << 20 }), cdm);
        if (isZip) fs.rmSync(path.join(CACHE, 'x-' + job.ccn), { recursive: true, force: true });
      }
      const nCodes = foldCdm(job.ccn, cdm);
      const px = fold(res.hits);
      const got = Object.keys(px).length;
      if (got) byId[job.ccn] = { up: res.meta.up || null, v: res.meta.ver || null, px };
      else console.warn('  zero basket hits for ' + job.ccn + ' (kept in the CDM file if coded)');
      console.log('  ' + got + '/' + BASKET.length + ' services · ' + nCodes + ' coded lines · updated ' + (res.meta.up || '?'));
    } catch (e) {
      console.warn('  FAILED ' + job.ccn + ' ' + job.name + ': ' + e.message);
    }
  }

  // U of U: 43GB tall CSV, streamed without touching disk. The FOLDED harvest
  // (a few hundred KB) is cached, so every later run gets U of U for free;
  // pass --uofu to re-stream fresh (do this on quarterly refreshes).
  const UCACHE = path.join(CACHE, 'uofu-harvest.json');
  if (WANT_UOFU) {
    console.log('pull 460009 University of Utah (43GB stream, no raw cache) ...');
    try {
      const c = spawn('curl', ['-sL', UOFU.url]);
      const cdm = { hits: {}, descs: {}, seen: {} };
      const res = await harvestCsv(c.stdout, cdm);
      const nCodes = foldCdm(UOFU.ccn, cdm);
      const px = fold(res.hits);
      if (Object.keys(px).length) byId[UOFU.ccn] = { up: res.meta.up || null, v: res.meta.ver || null, px };
      fs.writeFileSync(UCACHE, JSON.stringify({ meta: res.meta, px, codes: CDMBY[UOFU.ccn] || {}, descs: cdm.descs }));
      console.log('  UofU: ' + Object.keys(px).length + '/' + BASKET.length + ' services · ' + nCodes + ' coded lines · harvest cached');
    } catch (e) { console.warn('  UofU FAILED: ' + e.message); }
  } else if (fs.existsSync(UCACHE)) {
    try {
      const u = JSON.parse(fs.readFileSync(UCACHE, 'utf8'));
      if (Object.keys(u.px || {}).length) byId[UOFU.ccn] = { up: u.meta.up || null, v: u.meta.ver || null, px: u.px };
      if (Object.keys(u.codes || {}).length) CDMBY[UOFU.ccn] = u.codes;
      Object.keys(u.descs || {}).forEach((k) => {
        const M = DESCS[k] = DESCS[k] || {};
        Object.entries(u.descs[k]).forEach(([d, n]) => { M[d] = (M[d] || 0) + n; });
      });
      console.log('cache 460009 University of Utah (folded harvest; --uofu re-streams)');
    } catch (e) { console.warn('  UofU cache unreadable: ' + e.message); }
  }

  const basket = {};
  BASKET.forEach((b) => { basket[b.k] = { code: b.code, type: b.type, set: b.set, label: b.label }; });
  const out = {
    _meta: {
      built: new Date().toISOString().slice(0, 10),
      pilot: 'UT',
      source: 'Hospital-posted price transparency machine-readable files (45 CFR 180.50), discovered via each domain\'s cms-hpt.txt',
      script: 'scripts/build-hospital-prices.js',
      fields: 'px[key] = [gross, discounted_cash, payer_min, payer_max, rows_matched] · dollars, medians across matching chargemaster rows · nulls where a hospital did not post that value',
      guards: 'placeholder values (>=9e8) and sub-cent or non-positive values dropped; professional billing_class rows dropped',
      order: BASKET.map((b) => b.k),
      basket,
    },
    byId,
  };
  fs.writeFileSync(OUT, JSON.stringify(out));
  console.log('\nwrote ' + OUT + ' · ' + Object.keys(byId).length + ' hospitals · ' + (fs.statSync(OUT).size / 1024).toFixed(1) + 'KB');

  // ── second output: the full code-level extract behind the price finder ──
  const usH = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'assets', 'data', 'us-hospitals.json'), 'utf8'));
  const HN = {}; (usH.hospitals || []).forEach((h) => { HN[h.id] = h; });
  const hosp = {};
  Object.keys(CDMBY).forEach((ccn) => {
    const h = HN[ccn] || {};
    hosp[ccn] = { n: h.n || ccn, c: h.c || '', up: (byId[ccn] && byId[ccn].up) || null };
  });
  const descs = {};
  Object.keys(DESCS).forEach((k) => {
    let best = '', bn = 0;
    Object.entries(DESCS[k]).forEach(([d, n]) => { if (n > bn) { best = d; bn = n; } });
    if (best) descs[k] = best;
  });
  const codes = {};
  Object.keys(CDMBY).forEach((ccn) => Object.keys(CDMBY[ccn]).forEach((k) => {
    (codes[k] = codes[k] || {})[ccn] = CDMBY[ccn][k];
  }));
  const cdmOut = {
    _meta: {
      built: new Date().toISOString().slice(0, 10),
      pilot: 'UT',
      source: 'Hospital-posted price transparency machine-readable files (45 CFR 180.50), discovered via each domain\'s cms-hpt.txt',
      script: 'scripts/build-hospital-prices.js',
      fields: 'codes[code][ccn] = [gross, cash, pts] · dollars, medians across that hospital\'s DISTINCT posted price points for the code (capped 400) · code keys: 5-digit CPT, letter+4 HCPCS, D<n> = MS-DRG · descs = the most-posted hospital wording per code',
      guards: 'placeholder values (>=9e8) and sub-cent or non-positive values dropped; professional billing_class rows dropped',
      hospitals: Object.keys(hosp).length,
      codes: Object.keys(codes).length,
    },
    hosp, descs, codes,
  };
  fs.writeFileSync(CDM_OUT, JSON.stringify(cdmOut));
  console.log('wrote ' + CDM_OUT + ' · ' + Object.keys(hosp).length + ' hospitals · ' + Object.keys(codes).length + ' codes · ' + (fs.statSync(CDM_OUT).size / 1048576).toFixed(2) + 'MB');
}

main().catch((e) => { console.error(e); process.exit(1); });
