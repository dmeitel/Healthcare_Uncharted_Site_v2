#!/usr/bin/env node
'use strict';
/**
 * pull/ooh.js: refreshes the Career Tree's pay and outlook (src/assets/data/career-tree-bls.json)
 * from the BLS Occupational Outlook Handbook and the Employment Projections table that feeds it.
 * Written 2026-09-23, when the file was a year behind (May 2024 wages, 2024-34 projections) and
 * had been compiled by hand, so nothing could say when it went stale.
 *
 * Per occupation in the file (the SOC keys and names stay as they are; the file owns the list):
 *   - pay, low, high: the Handbook page's median and 10th/90th percentile for the occupation the
 *     file NAMES. A page that covers several jobs (radiologic and MRI technologists, EMTs and
 *     paramedics) prints a median and a percentile pair for each, in the same order.
 *   - growth, openings: the page's projection when the page is about that occupation (or that
 *     group, like nurse anesthetists, midwives and practitioners); otherwise the projections
 *     table row for the SOC code, so MRI technologists never show the whole group's openings.
 *   - Occupations with no Handbook wage line (health specialties teachers, ophthalmic medical
 *     technicians) take the projections table's median, growth and openings, and no range.
 *   - Every Handbook median that has a table row is checked against the table; a mismatch
 *     stops the write.
 *
 * SAFE BY DEFAULT, same shape as the other fetchers:
 *   node scripts/pull/ooh.js            dry run: fetch, parse, validate, print the diff
 *   node scripts/pull/ooh.js --write    apply to career-tree-bls.json
 *   node scripts/pull/ooh.js --refresh  ignore the page cache (scripts/.cache/ooh/)
 * BLS answers scripts only with a descriptive User-Agent that carries a contact address.
 * The Handbook updates each September; the projections table the same week.
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.join(__dirname, '..', '..');
const DATA = path.join(ROOT, 'src', 'assets', 'data', 'career-tree-bls.json');
const CACHE = path.join(ROOT, 'scripts', '.cache', 'ooh');
const EP_URL = 'https://www.bls.gov/emp/tables/occupational-projections-and-characteristics.htm';
const UA = 'HealthcareUncharted/1.0 (david.eitel.pcpal@gmail.com)';
const WRITE = process.argv.includes('--write');
const REFRESH = process.argv.includes('--refresh');

/** @param {string} url @returns {Promise<string>} */
function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': UA, Accept: 'text/html' } }, (res) => {
      if (res.statusCode !== 200) { res.resume(); return reject(new Error('HTTP ' + res.statusCode + ' for ' + url)); }
      let body = ''; res.setEncoding('utf8');
      res.on('data', (c) => { body += c; }); res.on('end', () => resolve(body));
    }).on('error', reject);
  });
}
const sleep = (/** @type {number} */ ms) => new Promise((r) => setTimeout(r, ms));
/** @param {string} url */
async function cached(url) {
  const file = path.join(CACHE, url.replace(/^https?:\/\//, '').replace(/[^a-z0-9.-]+/gi, '_'));
  if (!REFRESH && fs.existsSync(file)) return fs.readFileSync(file, 'utf8');
  const body = await get(url);
  fs.mkdirSync(CACHE, { recursive: true }); fs.writeFileSync(file, body);
  await sleep(1000);                                               // one request a second
  return body;
}
/** @param {string} html */
const plain = (html) => html
  .replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ')
  .replace(/<\/(p|li|tr|td|th|h\d|div)>/g, '$&\n').replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&rsquo;/g, "'").replace(/&#8211;|&ndash;/g, '-')
  .replace(/[ \t]+/g, ' ');
const money = (/** @type {string} */ s) => +s.replace(/[$,]/g, '');
// Two names are the same occupation when their words are, in any order ("Opticians, dispensing" is
// "dispensing opticians"), plurals and "and" aside.
const words = (/** @type {string} */ s) => [...new Set(s.toLowerCase().replace(/[^a-z ]/g, ' ').split(/\s+/).filter((w) => w && w !== 'and').map((w) => w.replace(/s$/, '')))].sort().join(' ');
const same = (/** @type {string} */ a, /** @type {string} */ b) => !!a && !!b && words(a) === words(b);

/** Parse one Handbook page. Arrays keep page order and drop the repeated print copy. */
function parsePage(/** @type {string} */ html) {
  const t = plain(html);
  const uniq = (/** @type {any[]} */ a) => a.filter((x, i) => a.findIndex((y) => JSON.stringify(y) === JSON.stringify(x)) === i);
  const medians = uniq([...t.matchAll(/median annual wage for ([^$.]{3,160}?) was \$([\d,]+) in May (20\d\d)/g)]
    .map((m) => ({ who: m[1].trim(), pay: money(m[2]), year: m[3] })).filter((m) => m.who !== 'all workers'));
  const ranges = uniq([...t.matchAll(/lowest 10 percent earned less than \$([\d,]+),? and the highest 10 percent earned more than \$([\d,]+)/g)]
    .map((m) => [money(m[1]), money(m[2])]));
  const growth = [...t.matchAll(/mployment of ([^.]{3,160}?) is projected to (grow|decline) (\d+) percent from (20\d\d) to (20\d\d)/g)]
    .map((m) => ({ who: m[1].trim(), pct: (m[2] === 'decline' ? -1 : 1) * +m[3], span: m[4] + '-' + m[5].slice(2) }));
  const flat = t.match(/mployment of ([^.]{3,160}?) is projected to show little or no change from (20\d\d) to (20\d\d)/);
  if (!growth.length && flat) growth.push({ who: flat[1].trim(), pct: 0, span: flat[2] + '-' + flat[3].slice(2) });
  const open = t.match(/[Aa]bout ([\d,]+) openings for ([^.]{3,160}?) are projected each year/);
  return { medians, ranges, growth: growth[0] || null, openings: open ? { who: open[2].trim(), n: money(open[1]) } : null };
}

/** The projections table, keyed by SOC code. */
function parseEP(/** @type {string} */ html) {
  /** @type {Record<string, {title:string, pct:number, openings:number, pay:number|null}>} */
  const out = {};
  for (const row of html.matchAll(/<tr[\s\S]*?<\/tr>/g)) {
    const c = [...row[0].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map((x) => plain(x[1]).trim());
    if (c.length < 12 || !/^\d\d-\d{4}$/.test(c[1])) continue;
    const n = (/** @type {string} */ s) => (/^-?[\d,.]+$/.test(s) ? +s.replace(/,/g, '') : null);
    out[c[1]] = { title: c[0], pct: n(c[8]), openings: n(c[10]) == null ? null : Math.round(n(c[10]) * 10) * 100, pay: n(c[11]) };
  }
  return out;
}

(async () => {
  const file = JSON.parse(fs.readFileSync(DATA, 'utf8'));
  console.log('Refreshing Career Tree pay and outlook from the BLS Occupational Outlook Handbook.');
  console.log(`Mode: ${WRITE ? 'WRITE' : 'DRY RUN (no files touched)'}${REFRESH ? ' · cache bypassed' : ''}\n`);
  const ep = parseEP(await cached(EP_URL));
  if (Object.keys(ep).length < 500) throw new Error('the projections table parsed to ' + Object.keys(ep).length + ' rows; the page changed shape');

  const next = JSON.parse(JSON.stringify(file));
  const problems = [], lines = [];
  let wageYear = '', span = '';
  for (const [soc, o] of Object.entries(next.occupations)) {
    const e = ep[soc] || null;
    const isOoh = /\/ooh\//.test(o.url);
    const page = isOoh ? parsePage(await cached(o.url)) : null;
    // The median the file means, in order: the one the page names after this occupation; the one it
    // names after the SOC title; the table's own row when that row IS this occupation and the page
    // only covers a wider group (clinical and counseling psychologists on the psychologists page);
    // the page's only median (a group the file names as a group).
    let i = page ? page.medians.findIndex((m) => same(m.who, o.occ)) : -1;
    if (page && i < 0 && e) i = page.medians.findIndex((m) => same(m.who, e.title));
    const tableIsExact = !!(e && e.pay && same(e.title, o.occ));
    if (page && i < 0 && page.medians.length === 1 && (!tableIsExact || page.medians[0].pay === e.pay)) i = 0;   // same number, same job ("opticians" is "opticians, dispensing")
    const med = i > -1 ? page.medians[i] : null;
    const was = { pay: o.pay, low: o.low, high: o.high, growth: o.growth, openings: o.openings };
    if (med) {
      o.pay = med.pay; wageYear = wageYear || 'May ' + med.year;
      const r = page.ranges.length === page.medians.length ? page.ranges[i] : null;
      if (r && r[0] < med.pay && med.pay < r[1]) { o.low = r[0]; o.high = r[1]; }
      else problems.push(`${soc} ${o.occ}: the page's pay range could not be matched to its median`);
      if (e && e.pay && same(e.title, med.who) && e.pay !== med.pay) problems.push(`${soc} ${o.occ}: Handbook median ${med.pay} but the table says ${e.pay}`);
    } else if (e && e.pay) {
      o.pay = e.pay; delete o.low; delete o.high;              // the table carries no percentiles
    } else problems.push(`${soc} ${o.occ}: no median found on the page or in the table`);
    if (med && o.payText) delete o.payText;                    // an exact median replaces a top-coded "$239,200+"
    // Outlook: the page's own projection when the page is about this occupation or this group (one
    // median on it); on a page that splits jobs, the table row for this SOC.
    const g = page && page.growth;
    if (g && med && (page.medians.length === 1 || same(g.who, o.occ))) {
      o.growth = g.pct; span = span || g.span;
      if (page.openings) o.openings = page.openings.n;
    } else if (e && e.pct != null) {
      o.growth = Math.round(e.pct);
      if (e.openings != null) o.openings = e.openings;
    } else problems.push(`${soc} ${o.occ}: no growth found`);
    if (!isOoh || !med) o.url = EP_URL;                        // the link goes where the number is printed (the old per-occupation wage pages are gone, 2026)
    const d = ['pay', 'low', 'high', 'growth', 'openings'].filter((k) => was[k] !== o[k]).map((k) => `${k} ${was[k] ?? '-'} -> ${o[k] ?? '-'}`);
    lines.push(`  ${soc.padEnd(8)} ${o.occ.slice(0, 44).padEnd(45)} ${d.length ? d.join(' · ') : 'unchanged'}`);
  }
  next.wageYear = wageYear || next.wageYear;
  if (span) next.projYears = span.replace('-', '–');
  console.log(lines.join('\n'));
  console.log(`\n  wageYear ${file.wageYear} -> ${next.wageYear} · projYears ${file.projYears} -> ${next.projYears}`);
  if (problems.length) { console.log('\nPROBLEMS (nothing written):\n  ' + problems.join('\n  ')); process.exitCode = 1; return; }
  if (!WRITE) { console.log('\nDry run. Re-run with --write to apply.'); return; }
  fs.writeFileSync(DATA, JSON.stringify(next));
  console.log('\nWrote ' + path.relative(ROOT, DATA) + '. Run npm run build so it flows to the site.');
})().catch((e) => { console.error(e); process.exit(1); });
