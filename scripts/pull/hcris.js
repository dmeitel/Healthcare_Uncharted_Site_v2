#!/usr/bin/env node
'use strict';
/**
 * pull/hcris.js: beds, ICU beds, patient days, discharges and staff for every hospital that
 * files a Medicare cost report (HCRIS, form CMS-2552-10).
 *
 * Every Medicare hospital files a cost report each fiscal year. CMS publishes them as
 * HOSP10FY<year>.ZIP: three headerless CSVs. This reads two of them.
 *   _RPT   one row per report: RPT_REC_NUM, PRVDR_CTRL_TYPE_CD, PRVDR_NUM (the CCN), NPI,
 *          RPT_STUS_CD, FY_BGN_DT, FY_END_DT, PROC_DT, ...
 *   _NMRC  every number on every worksheet: RPT_REC_NUM, WKSHT_CD, LINE_NUM, CLMN_NUM, ITM_VAL_NUM
 * Worksheet S-3 Part I (S300001) is the hospital's statistics page. LINE_NUM is the line times
 * 100 ("00800" is line 8, "01201" is line 12.01), CLMN_NUM the same for columns.
 *   lines   8 ICU, 9 coronary care, 10 burn ICU, 11 surgical ICU, 12 other special care (NICU,
 *           PICU and the like, with subscripts), 13 nursery, 14 total for the hospital (adults
 *           and peds plus every special care unit and the nursery), 27 total for the facility
 *   columns 2 beds, 3 bed days available, 6 Medicare days, 7 Medicaid days, 8 all patient days,
 *           9 interns and residents (FTE), 10 employees on payroll (FTE), 15 all patient discharges
 * The NMRC file unpacks to well over a gigabyte, so it streams: the zip entry inflates as it is
 * read and only S-3 Part I rows are kept. No dependencies.
 *
 * SAFE BY DEFAULT
 *   node scripts/pull/hcris.js            dry run (writes nothing)
 *   node scripts/pull/hcris.js --write    write scripts/data/hospital-cost-reports.json
 *   node scripts/pull/hcris.js --refresh  re-download (ignore the cache)
 *
 * Feeds: scripts/build-vital-stats.js (the health system games).
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const zlib = require('zlib');
const readline = require('readline');

const ROOT = path.join(__dirname, '..', '..');
const P = (...p) => path.join(ROOT, ...p);
const CACHE = P('scripts', '.cache');
const OUT = P('scripts', 'data', 'hospital-cost-reports.json');
const UA = 'HealthcareUncharted/1.0 (david.eitel.pcpal@gmail.com)';

const FY = 2024;
const ZIP_URL = `https://downloads.cms.gov/files/hcris/hosp10fy${FY}.zip`;
const SOURCE_URL = 'https://www.cms.gov/data-research/statistics-trends-and-reports/cost-reports/cost-reports-fiscal-year';

const WRITE = process.argv.includes('--write'), REFRESH = process.argv.includes('--refresh');

/** @param {string} url @param {string} file */
function download(url, file) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': UA } }, (res) => {
      if (res.statusCode !== 200) { res.resume(); return reject(new Error('HTTP ' + res.statusCode + ' ' + url)); }
      fs.mkdirSync(path.dirname(file), { recursive: true });
      const tmp = file + '.part', out = fs.createWriteStream(tmp);
      res.pipe(out);
      res.on('error', reject); out.on('error', reject);
      out.on('finish', () => out.close(() => { fs.renameSync(tmp, file); resolve(undefined); }));
    }).on('error', reject);
  });
}

/* the zip's table of contents, read from the central directory at the end of the file */
function zipEntries(file) {
  const fd = fs.openSync(file, 'r');
  const size = fs.fstatSync(fd).size;
  const tailLen = Math.min(size, 65557), tail = Buffer.alloc(tailLen);
  fs.readSync(fd, tail, 0, tailLen, size - tailLen);
  let i = tailLen - 22;
  while (i >= 0 && tail.readUInt32LE(i) !== 0x06054b50) i--;
  if (i < 0) throw new Error('not a zip (no end of central directory)');
  const count = tail.readUInt16LE(i + 10), cdSize = tail.readUInt32LE(i + 12), cdOff = tail.readUInt32LE(i + 16);
  const cd = Buffer.alloc(cdSize); fs.readSync(fd, cd, 0, cdSize, cdOff);
  const out = [];
  for (let p = 0, n = 0; n < count; n++) {
    if (cd.readUInt32LE(p) !== 0x02014b50) throw new Error('bad central directory entry');
    const method = cd.readUInt16LE(p + 10), csize = cd.readUInt32LE(p + 20), usize = cd.readUInt32LE(p + 24);
    const nl = cd.readUInt16LE(p + 28), xl = cd.readUInt16LE(p + 30), cl = cd.readUInt16LE(p + 32), lho = cd.readUInt32LE(p + 42);
    const name = cd.toString('utf8', p + 46, p + 46 + nl);
    const lh = Buffer.alloc(30); fs.readSync(fd, lh, 0, 30, lho);
    const start = lho + 30 + lh.readUInt16LE(26) + lh.readUInt16LE(28);
    out.push({ name, method, csize, usize, start });
    p += 46 + nl + xl + cl;
  }
  fs.closeSync(fd);
  return out;
}

/* one zip entry as a stream of text lines, inflated as it is read */
function entryLines(file, e) {
  const raw = fs.createReadStream(file, { start: e.start, end: e.start + e.csize - 1 });
  const body = e.method === 0 ? raw : raw.pipe(zlib.createInflateRaw());
  return readline.createInterface({ input: body, crlfDelay: Infinity });
}

const num = (s) => { const v = parseFloat(String(s).replace(/"/g, '')); return isFinite(v) ? v : 0; };
const cell = (s) => String(s || '').replace(/"/g, '').trim();
const isoDate = (s) => { s = cell(s); const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); return m ? `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}` : s.slice(0, 10); };

(async () => {
  console.log(`Medicare cost reports (HCRIS 2552-10), fiscal year ${FY} file.`);
  console.log(`Mode: ${WRITE ? 'WRITE' : 'DRY RUN (no files touched)'}${REFRESH ? ' · cache bypassed' : ''}\n`);

  const zip = path.join(CACHE, `hcris-hosp10fy${FY}.zip`);
  if (REFRESH || !fs.existsSync(zip)) { console.log('downloading ' + ZIP_URL); await download(ZIP_URL, zip); }
  const entries = zipEntries(zip);
  const rptE = entries.find((e) => /_RPT\.CSV$/i.test(e.name)), nmrcE = entries.find((e) => /_NMRC\.CSV$/i.test(e.name));
  if (!rptE || !nmrcE) throw new Error('expected _RPT and _NMRC files, found ' + entries.map((e) => e.name).join(', '));

  /* every report: who filed it and for what period */
  const reports = new Map();
  for await (const line of entryLines(zip, rptE)) {
    const f = line.split(',');
    if (f.length < 8) continue;
    reports.set(cell(f[0]), { ccn: cell(f[2]), fyb: isoDate(f[5]), fye: isoDate(f[6]), proc: isoDate(f[7]) });
  }
  console.log(`${reports.size.toLocaleString()} reports`);

  /* S-3 Part I numbers per report */
  const WANT = new Set([2, 3, 6, 7, 8, 9, 10, 15]);
  const s3 = new Map();
  let rows = 0;
  for await (const line of entryLines(zip, nmrcE)) {
    if (line.indexOf('S300001') < 0) continue;
    const f = line.split(',');
    if (cell(f[1]) !== 'S300001') continue;
    const ln = num(f[2]) / 100, col = num(f[3]) / 100, v = num(f[4]);
    if (!WANT.has(col)) continue;
    const base = Math.floor(ln + 1e-9);
    if (ln !== 2 && (base < 8 || (base > 14 && base !== 27))) continue;
    rows++;
    const rec = cell(f[0]);
    let r = s3.get(rec); if (!r) { r = { L2: {}, L14: {}, L27: {}, icuBeds: 0, icuDays: 0, burn: 0, nursery: 0 }; s3.set(rec, r); }
    if (ln === 2) r.L2[col] = v;
    else if (ln === 14) r.L14[col] = v;
    else if (ln === 27) r.L27[col] = v;
    else if (base >= 8 && base <= 12) { if (col === 2) r.icuBeds += v; if (col === 8) r.icuDays += v; if (base === 10 && col === 2) r.burn += v; }
    else if (base === 13 && col === 2) r.nursery += v;
  }
  console.log(`${rows.toLocaleString()} S-3 Part I numbers across ${s3.size.toLocaleString()} reports`);

  /* one report per hospital: the latest period, then the latest processed */
  const best = new Map();
  for (const [rec, r] of reports) {
    if (!s3.has(rec) || !r.ccn) continue;
    const cur = best.get(r.ccn);
    if (!cur || r.fye > cur.fye || (r.fye === cur.fye && r.proc > cur.proc)) best.set(r.ccn, Object.assign({ rec }, r));
  }

  const byCcn = {}, dropped = [];
  const rnd =(v, dp) => { const k = Math.pow(10, dp || 0); return Math.round(v * k) / k; };
  for (const [ccn, r] of best) {
    const x = s3.get(r.rec), a = x.L14, t = x.L27;
    const pd = Math.round((Date.parse(r.fye) - Date.parse(r.fyb)) / 864e5) + 1;
    const o = {
      b: rnd(a[2] || 0, 0),             // beds, line 14
      ba: rnd(a[3] || 0, 0),            // bed days available
      icu: rnd(x.icuBeds, 0),           // every intensive and special care bed, lines 8 to 12
      burn: rnd(x.burn, 0),
      nur: rnd(x.nursery, 0),
      d: rnd(a[8] || 0, 0),             // all patient days
      icud: rnd(x.icuDays, 0),
      mcr: rnd(a[6] || 0, 0),           // Medicare days, traditional (fee for service)
      mcd: rnd(a[7] || 0, 0),           // Medicaid days, traditional
      mcrh: rnd((x.L2 || {})[6] || 0, 0), // line 2, HMO: Medicare Advantage days
      mcdh: rnd((x.L2 || {})[7] || 0, 0), // line 2, HMO: Medicaid managed care days
      dc: rnd(a[15] || 0, 0),           // discharges
      res: rnd(Math.max(a[9] || 0, t[9] || 0), 1),
      fte: rnd(Math.max(a[10] || 0, t[10] || 0), 0),
      fyb: r.fyb, fye: r.fye, pd,
    };
    if (!o.b && !o.d && !o.fte) continue;
    /* a typo in a report is a typo in the game: one hospital files 1.4 million employees. A big academic
       center runs about 25 staff a bed, so past 35 a bed (or 60,000 in one building) the count is dropped. */
    if (o.fte > 35 * Math.max(o.b, 10) || o.fte > 60000) { dropped.push(ccn + ' fte ' + o.fte); o.fte = 0; }
    if (o.icu > o.b) { dropped.push(ccn + ' icu ' + o.icu + ' > beds ' + o.b); o.icu = 0; }
    byCcn[ccn] = o;
  }
  console.log(`dropped as implausible: ${dropped.length} (${dropped.slice(0, 6).join('; ')}${dropped.length > 6 ? '; ...' : ''})`);

  /* sanity: national totals land where the AHA's do (about 900,000 beds, about 33 million admissions) */
  const all = Object.values(byCcn);
  const sum = (k) => all.reduce((s, o) => s + (o[k] || 0), 0);
  console.log(`${all.length.toLocaleString()} hospitals with a usable report`);
  console.log(`national totals: ${sum('b').toLocaleString()} beds, ${sum('icu').toLocaleString()} ICU and special care beds, ${sum('dc').toLocaleString()} discharges, ${sum('fte').toLocaleString()} employee FTEs`);
  const hosp = JSON.parse(fs.readFileSync(P('src', 'assets', 'data', 'us-hospitals.json'), 'utf8')).hospitals;
  const withSys = hosp.filter((h) => h.sys);
  console.log(`system hospitals covered: ${withSys.filter((h) => byCcn[h.id]).length} of ${withSys.length}`);
  for (const name of ['INTERMOUNTAIN MEDICAL CENTER', 'LDS HOSPITAL', "PRIMARY CHILDREN'S HOSPITAL", 'MCKAY-DEE HOSPITAL']) {
    const h = hosp.find((x) => x.n === name); const o = h && byCcn[h.id];
    console.log(`  ${name}: ${o ? JSON.stringify(o) : 'no report'}`);
    if (o && o.d) console.log(`    Medicare ${Math.round(100 * o.mcr / o.d)}% + Advantage ${Math.round(100 * o.mcrh / o.d)}%, Medicaid ${Math.round(100 * o.mcd / o.d)}% + managed ${Math.round(100 * o.mcdh / o.d)}%`);
  }
  const share = (k) => Math.round(100 * sum(k) / sum('d'));
  console.log(`national day shares: Medicare ${share('mcr')}% + Advantage ${share('mcrh')}%, Medicaid ${share('mcd')}% + managed ${share('mcdh')}%`);
  const fteSorted = all.map((o) => o.fte).sort((p, q) => q - p);
  console.log(`largest employee FTE reports: ${fteSorted.slice(0, 8).join(', ')}`);

  if (sum('b') < 500000 || sum('b') > 1300000) throw new Error('national bed total out of range; the line or column map is wrong');

  const out = {
    _meta: {
      source: 'CMS Healthcare Cost Report Information System (HCRIS), hospital form 2552-10, Worksheet S-3 Part I',
      file: ZIP_URL, page: SOURCE_URL, fiscalYearFile: FY, pulled: new Date().toISOString().slice(0, 10),
      fields: 'b beds (line 14 col 2), ba bed days available, icu ICU and special care beds (lines 8-12 col 2), burn burn ICU beds, nur nursery beds, d all patient days, icud ICU days, mcr Medicare days, mcd Medicaid days, dc discharges (col 15), res interns and residents FTE, fte employees on payroll FTE, fyb/fye the report period, pd days in it',
    },
    byCcn,
  };
  if (fs.existsSync(OUT)) {
    const prev = JSON.parse(fs.readFileSync(OUT, 'utf8')).byCcn || {};
    const changed = Object.keys(byCcn).filter((k) => JSON.stringify(prev[k]) !== JSON.stringify(byCcn[k])).length;
    console.log(`diff vs current file: ${changed} hospitals changed, ${Object.keys(byCcn).filter((k) => !prev[k]).length} new`);
  }
  if (WRITE) { fs.writeFileSync(OUT, JSON.stringify(out)); console.log('\nwrote ' + path.relative(ROOT, OUT)); }
  else console.log('\ndry run: nothing written (add --write)');
})().catch((e) => { console.error(e); process.exit(1); });
