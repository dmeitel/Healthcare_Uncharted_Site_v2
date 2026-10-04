#!/usr/bin/env node
'use strict';
/**
 * pull/accreditors.js: the second source for the Schools layer. Each program the map draws from IPEDS (federal college
 * data) is also listed by the body that accredits it, so the two lists can be held against each other
 * (scripts/check-schools.js). Built 2026-10-03 after David asked how we know the school data is solid: Noorda College
 * of Osteopathic Medicine in Provo is accredited and teaching, but not in IPEDS at all.
 *
 *   md   LCME, Accredited U.S. Programs: one table, program, city, state, status (Full, Provisional, Preliminary)
 *   do   AACOM, U.S. Colleges of Osteopathic Medicine: every college with its campuses (AACOM is the colleges'
 *        association; COCA accredits them, and every college on the list holds COCA accreditation or is on its way)
 *   pa   ARC-PA, Currently Accredited Programs (entry level): program, state, status, first accredited
 *   rt   CoARC, the printable list of accredited programs: program number, city, state, ZIP, degree, category, status
 *   rn   nursing programs: CCNE (baccalaureate, by state) and ACEN (diploma, associate, baccalaureate)
 *   dnp  CCNE's DNP programs (by state) and ACEN's doctoral programs
 * Nurse practitioner programs have no list of their own: CCNE and ACEN accredit a school's master's and certificate
 * programs as a whole, NP tracks or not, so NP is not checked.
 *
 * Only what identifies a program is kept: names, places, statuses and dates. The lists also carry each program
 * director's name, email and phone; none of that is read.
 *
 *   node scripts/pull/accreditors.js            dry run: fetch (cached) and count, write nothing
 *   node scripts/pull/accreditors.js --write    write data-build/accreditors.json (then npm run check:schools)
 *   node scripts/pull/accreditors.js --refresh  ignore the cache
 * Safe by default like every pull, since pull/all.js runs them all (it wrote on a dry run until 2026-10-03).
 * The raw pages cache in scripts/.cache/accred. A source that parses to far fewer rows than last time stops the run,
 * since that means its page changed shape, not that half the programs closed.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const CACHE = path.join(ROOT, 'scripts', '.cache', 'accred');
const OUT = path.join(ROOT, 'data-build', 'accreditors.json');
const REFRESH = process.argv.includes('--refresh'), WRITE = process.argv.includes('--write');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128 Safari/537.36';

const SOURCES = {
  lcme: { label: 'LCME, Accredited U.S. Programs', url: 'https://lcme.org/directory/accredited-u-s-programs/', updated: '' },
  aacom: { label: 'AACOM, U.S. Colleges of Osteopathic Medicine', url: 'https://www.aacom.org/explore-med-schools/choose-do-explorer?startRow=0&rowsPerPage=200' },
  arcpa: { label: 'ARC-PA, Currently Accredited Programs', url: 'https://www.arc-pa.org/entry-level-program/currently-accredited-programs/' },
  coarc: { label: 'CoARC, Accredited Programs', url: 'https://coarc.com/students/find-an-accredited-program/print-accredited-programs/' },
  ccne: { label: 'CCNE, Accredited Programs (by state)', url: 'https://directory.ccnecommunity.org/reports/accprog.asp' },
  acen: { label: 'ACEN, Search Programs', url: 'https://www.acenursing.org/search-programs/' }
};

const STATE_ABBR = Object.fromEntries(JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'assets', 'data', 'geo', 'us-states.json'), 'utf8'))
  .features.map((/** @type {any} */ f) => [f.properties.name, f.properties.abbr]));
const ABBRS = Object.values(STATE_ABBR);

const sleep = (/** @type {number} */ ms) => new Promise((r) => setTimeout(r, ms));
/** a page, from the cache when it is there @param {string} url @param {string} file */
async function page(url, file) {
  const f = path.join(CACHE, file);
  if (!REFRESH && fs.existsSync(f)) return fs.readFileSync(f, 'utf8');
  for (let i = 0; ; i++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA } });
      if (!r.ok) throw new Error(r.status + ' ' + url);
      const t = await r.text();
      fs.mkdirSync(CACHE, { recursive: true });
      fs.writeFileSync(f, t);
      await sleep(400);   // one request at a time, a little apart
      return t;
    } catch (e) { if (i >= 2) throw e; await sleep(2000 * (i + 1)); }
  }
}
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '-', mdash: '-', rsquo: "'", lsquo: "'" };
/** plain text: tags out, entities decoded, spaces collapsed @param {string} s */
const text = (s) => String(s).replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, ' ')
  .replace(/&#(\d+);/g, (_, n) => { const c = +n; return c === 8211 || c === 8212 ? '-' : c === 8217 || c === 8216 ? "'" : String.fromCharCode(c); })
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
  .replace(/&([a-z]+);/gi, (m, n) => ENT[/** @type {keyof typeof ENT} */ (n.toLowerCase())] ?? m)
  .replace(/\s+/g, ' ').trim();

/** @typedef {{ prog: string, src: string, name: string, city: string, st: string, status: string, since?: string, kind?: string, id?: string, addr?: string }} Row */

/** @returns {Promise<Row[]>} */
async function lcme() {
  const h = await page(SOURCES.lcme.url, 'lcme.html');
  const upd = (text(h).match(/last updated on ([A-Z][a-z]+ \d+, \d{4})/) || [])[1] || '';
  SOURCES.lcme.updated = upd;
  const body = (h.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/) || [])[1] || '';
  return [...body.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((m) => {
    const c = [...m[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((x) => text(x[1]));
    return { prog: 'md', src: 'lcme', name: c[1], city: c[2], st: STATE_ABBR[c[0]] || c[0], status: c[4], since: c[5] };
  }).filter((r) => r.name);
}
/** @returns {Promise<Row[]>} */
async function aacom() {
  const h = await page(SOURCES.aacom.url, 'aacom-all.html');
  /** @type {Row[]} */
  const out = [];
  for (const card of h.split('item-list__item card').slice(1)) {
    const name = text((card.match(/item-list__title">([\s\S]*?)<\/span>/) || [])[1] || '');
    const loc = (card.match(/item-list__location">([\s\S]*?)<\/div>/) || [])[1] || '';
    // the location is the college; a description line made only of places ("Elmira, NY; Greensburg, PA") is its
    // other campuses
    const home = [...loc.matchAll(/<span>([\s\S]*?)<\/span>/g)].map((x) => text(x[1])).filter(Boolean);
    const more = [...card.matchAll(/<li class="item-list__item">([\s\S]*?)<\/li>/g)].map((x) => text(x[1]))
      .filter((s) => /^[^;,]+,\s*[A-Z]{2}(;\s*[^;,]+,\s*[A-Z]{2})*$/.test(s)).flatMap((s) => s.split(';'));
    if (!home.length) console.warn('aacom: no place for ' + name);
    home.concat(more).map((s) => s.trim()).forEach((p, i) => {
      const m = p.match(/^(.+),\s*([A-Z]{2})$/);
      if (m) out.push({ prog: 'do', src: 'aacom', name, city: m[1], st: m[2], status: i ? 'Campus' : 'College' });
      else console.warn('aacom: unread place "' + p + '" for ' + name);
    });
  }
  return out;
}
/** @returns {Promise<Row[]>} */
async function arcpa() {
  const h = await page(SOURCES.arcpa.url, 'arcpa.html');
  /** @type {Row[]} */
  const out = [];
  for (const m of h.matchAll(/<tr class="row-\d+[^"]*">([\s\S]*?)<\/tr>/g)) {
    const c = [...m[1].matchAll(/<td class="column-(\d)">([\s\S]*?)<\/td>/g)].map((x) => text(x[2]));
    if (c.length < 5 || !/^[A-Z]{2}$/.test(c[0])) continue;
    // the status cell carries footnote marks ("**Probation , F , #"); the word is what counts
    const status = /probation/i.test(c[2]) ? 'Probation' : /provisional/i.test(c[2]) ? 'Provisional' : /continued/i.test(c[2]) ? 'Continued' : c[2];
    out.push({ prog: 'pa', src: 'arcpa', name: c[1], city: '', st: c[0], status, since: c[4] });
  }
  return out;
}
/** @returns {Promise<Row[]>} */
async function coarc() {
  const h = await page(SOURCES.coarc.url, 'coarc-print.html');
  /** @type {Row[]} */
  const out = [];
  for (const m of h.matchAll(/<td class="hidden">(\{[\s\S]*?\})<\/td>/g)) {
    let j; try { j = JSON.parse(m[1]); } catch (e) { continue; }
    // a withdrawn program stays on the printable list with its withdrawal date; the sleep and advanced practice
    // programs teach working therapists, not new ones
    if (/withdraw/i.test(j.program_status) || !j.program_status || /sleep|advanced practice/i.test(j.program_type)) continue;
    // director names, emails and phones are in this object too; only the program's own fields are kept
    out.push({ prog: 'rt', src: 'coarc', id: j.program_number, name: text(j.program_name), city: text(j.program_city), st: j.program_state,
      status: j.program_status, kind: [j.degree, j.program_type].filter(Boolean).join(', '),
      // the program's own street address (an institution's, never a person's), so a campus can be placed exactly
      addr: [text(j.mailing_address), text(j.program_city), j.program_state, String(j.program_zip || '').slice(0, 5)].filter(Boolean).join(', ') });
  }
  return out;
}
/** @returns {Promise<Row[]>} */
async function ccne() {
  /** @type {Row[]} */
  const out = [];
  for (const [prog, type, label] of /** @type {[string, string, string][]} */ ([['rn', '1,12', 'bacc'], ['dnp', '3', 'dnp']])) {
    for (const st of ABBRS) {
      const url = SOURCES.ccne.url + '?opt1=state&drpState1=' + st + '&drpProgramType1=' + encodeURIComponent(type) + '&submit1=Search+for+Accredited+Programs';
      const h = await page(url, 'ccne-' + label + '-' + st + '.html');
      if (/VBScript runtime error/.test(h)) throw new Error('CCNE refused ' + url);
      for (const block of h.split('id="finder"').slice(1)) {
        const nm = text((block.match(/<h3>((?:(?!<b>)[\s\S])*?)<\/h3>/) || [])[1] || '').replace(/\s+-\s+[A-Z]{2}$/, '');
        // the address is lines split by <br>; the city is the line that ends in a state and ZIP
        const lines = ((block.match(/<\/h3>([\s\S]*?)(?:<a |Chief Nurse)/) || [])[1] || '').split(/<br\s*\/?>/i).map(text);
        const at = lines.map((l) => l.match(/^(.+?),\s*([A-Z]{2})\s+\d{5}/)).find(Boolean);
        const progs = [...block.matchAll(/<tr>\s*<td><h3><b>([\s\S]*?)<\/b><\/h3><\/td>\s*<td><\/td>\s*<td>([^<]*)<\/td>/g)].map((x) => [text(x[1]), text(x[2])]);
        for (const [p, since] of progs) {
          if (/^Program$/i.test(p)) continue;
          out.push({ prog, src: 'ccne', name: nm, city: at ? at[1].trim() : '', st: at ? at[2] : st, status: 'Accredited', since, kind: p });
        }
      }
    }
  }
  return out;
}
/** @returns {Promise<Row[]>} */
async function acen() {
  /** @type {Row[]} */
  const out = [];
  const KIND = { Diploma: 'rn', Associate: 'rn', Baccalaureate: 'rn', 'Clinical Doctorate': 'dnp' };
  for (let n = 1; n < 200; n++) {
    const h = await page(SOURCES.acen.url + (n > 1 ? '?64ccb808_page=' + n : ''), 'acen-' + n + '.html');
    const items = h.split('role="listitem" class="w-dyn-item"').slice(1);
    let got = 0;
    for (const it of items) {
      const name = text((it.match(/fs-cmsfilter-field="governing-org"[^>]*>([\s\S]*?)<\/div>/) || [])[1] || '');
      const type = text((it.match(/fs-cmsfilter-field="program-type"[^>]*>([\s\S]*?)<\/div>/) || [])[1] || '');
      const places = [...it.matchAll(/fs-cmsfilter-field="State"[^>]*>([\s\S]*?)<\/div>/g)].map((x) => text(x[1]));
      const country = text((it.match(/fs-cmsfilter-field="Country"[^>]*>([\s\S]*?)<\/div>/) || [])[1] || '');
      const status = text((it.match(/fs-cmsfilter-field="status"[^>]*>([\s\S]*?)<\/div>/) || [])[1] || '');
      if (!name) continue;
      got++;
      const prog = KIND[/** @type {keyof typeof KIND} */ (type)];
      if (!prog || (country && country !== 'United States')) continue;
      out.push({ prog, src: 'acen', name, city: places[0] || '', st: STATE_ABBR[places[1]] || places[1] || '', status, kind: type });
    }
    if (!got) break;
    if (!/_page=\d+/.test(h.slice(h.lastIndexOf('w-dyn-items')))) break;   // no next link: the last page
  }
  return out;
}

(async () => {
  const checked = new Date().toISOString().slice(0, 10);
  /** @type {Record<string, Row[]>} */
  const by = {};
  for (const [k, fn] of /** @type {[string, () => Promise<Row[]>][]} */ ([['lcme', lcme], ['aacom', aacom], ['arcpa', arcpa], ['coarc', coarc], ['ccne', ccne], ['acen', acen]])) {
    by[k] = await fn();
    console.log(`${k.padEnd(6)} ${String(by[k].length).padStart(5)} rows`);
  }
  // a list that shrank by a third since the last run changed its page, most likely; stop rather than write a hole
  if (fs.existsSync(OUT)) {
    const old = JSON.parse(fs.readFileSync(OUT, 'utf8'));
    for (const k of Object.keys(by)) {
      const was = (old.rows || []).filter((/** @type {any} */ r) => r[1] === k).length;
      if (was && by[k].length < was * 0.67) { console.error(`refusing to write: ${k} parsed ${by[k].length} rows, ${was} last time`); process.exit(1); }
    }
  }
  const rows = Object.values(by).flat().filter((r) => ABBRS.includes(r.st))
    .map((r) => [r.prog, r.src, r.name, r.city, r.st, r.status, r.since || '', r.kind || '', r.id || '', r.addr || '']);
  const meta = { checked, sources: Object.fromEntries(Object.entries(SOURCES).map(([k, s]) => [k, s])),
    fields: 'program, source, name, city, state, status, since, kind, id, street address (CoARC)', note: 'Names, places, statuses and dates only. Built by scripts/pull/accreditors.js.' };
  /** @type {Record<string, number>} */
  const per = {}; for (const r of rows) per[r[0]] = (per[r[0]] || 0) + 1;
  if (!WRITE) { console.log('\nby program: ' + JSON.stringify(per) + '\ndry run: nothing written (add --write)'); return; }
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, '{"_meta":' + JSON.stringify(meta) + ',\n"rows":[\n' + rows.map((r) => JSON.stringify(r)).join(',\n') + '\n]}\n');
  console.log('\nby program: ' + JSON.stringify(per) + '\nwrote ' + path.relative(ROOT, OUT));
})().catch((e) => { console.error(e); process.exit(1); });
