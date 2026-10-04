#!/usr/bin/env node
'use strict';
/**
 * pull/ipeds.js: every U.S. school that graduated registered nurses, physicians (MD and DO), physician assistants,
 * nurse practitioners (and DNPs) or respiratory therapists, with how many it graduated. Feeds the Schools layer of the Hospital Operations Map.
 *
 * Source: IPEDS, the federal survey every college that takes federal student aid answers (NCES).
 *   C<yr>_A.zip   Completions: one row per school, program (CIP 2020 code), first or second major and award level,
 *                 with the number of awards. C2024_A covers awards from July 1, 2023 to June 30, 2024.
 *   HD<yr>.zip    the directory: name, city, state, county, latitude and longitude, public or private, website.
 *   EF<yr-1>A_DIST.zip  fall enrollment by distance education: the share of a school's students who study only
 *                 online (fall 2023 for the 2023-24 awards). An online school's graduates live everywhere but count
 *                 where its office is (Western Governors University puts 5,592 RN graduates in Salt Lake City), so the
 *                 cards say so.
 * WHICH RELEASE. Each file's own dictionary says, on its first page, "(Provisional release)" or "(Final/revised
 * release)", and the pull reads that line rather than trusting a date. It matters: the NCES schedule page lists the
 * 2024-25 collection's final fall data for 2026-09-08, but on 2026-10-03 C2024_A.zip was still the provisional file
 * posted 2025-09-21. When the final lands, a re-run picks up both the new counts and the new label.
 *
 * The rules, one per program. A program is on the map when the school awarded at least one first-major award in it
 * at one of these levels during the year. First majors only, so a degree is counted once.
 *   RN   51.3801 Registered Nursing, at a diploma or certificate (levels 2, 4), associate (3) or bachelor's (5).
 *        Bachelor's counts include nurses finishing an RN to BSN; IPEDS does not separate them.
 *   MD   51.1201 Medicine, doctor's degree, professional practice (18).
 *   DO   51.1202 Osteopathic Medicine (CIP 2020 moved it here from 51.1901), professional practice doctorate (18).
 *   PA   51.0912 Physician Assistant, master's (7) or doctor's (17, 18, 19). Entry to the field is a master's.
 *   NP   the nurse practitioner population codes, at a graduate certificate (6, 8), master's (7) or doctor's
 *        (17, 18, 19): 51.3803 adult health, 51.3805 family, 51.3806 maternal, child and neonatal, 51.3809 pediatric,
 *        51.3810 psychiatric and mental health, 51.3821 geriatric, 51.3822 women's health. The federal CIP to SOC
 *        crosswalk ties nurse practitioners to more codes than these (nursing administration, nursing science, the
 *        DNP code 51.3818 among them), and those also hold programs that are not NP programs, so they are left out.
 *        A school that reports its NP program only under general nursing or as a DNP shows under DNP or not at all.
 *   DNP  the doctor of nursing practice: 51.3818 Nursing Practice at any doctor's level (17, 18, 19), or 51.3801
 *        Registered Nursing at the professional practice doctorate (18, 19), which is where the University of Utah
 *        files its DNP (checked 2026-10-03: 91 awards at level 18, none under 51.3818). Many nurse practitioner
 *        doctorates sit here beside DNPs for nurse leaders, and neither code separates them, so DNP is its own
 *        program on the map rather than counted as NP. A PhD in nursing (51.3801 at 17) is not a DNP and stays out.
 *   RT   51.0908 Respiratory Care Therapy, associate (3), bachelor's (5) or master's (7), and 51.0812 Respiratory
 *        Therapy Technician/Assistant at associate or bachelor's. The technician title is a leftover: there is no
 *        entry-level technician credential any more, and the accreditor cross-check (scripts/check-schools.js,
 *        2026-10-03) found the schools filing degrees under it are CoARC-accredited therapist programs (Carrington
 *        College's campuses, Mandl School, Kettering, Highline, Salt Lake Community College). Its certificates (level 2,
 *        Oklahoma's technology centers) stay out; the partner college awards those students' degree.
 * A school is kept when its directory row has a location, it is open (CLOSEDAT "-2", CYACTIVE 1) and its state is
 * one of the 52 the map draws (the 50, DC and Puerto Rico).
 *
 * SAFE BY DEFAULT
 *   node scripts/pull/ipeds.js            dry run (writes nothing)
 *   node scripts/pull/ipeds.js --write    write src/assets/data/us-health-schools.json
 *   node scripts/pull/ipeds.js --refresh  re-download (ignore the cache)
 */
const fs = require('fs');
const path = require('path');
const { download, zipEntries, entryBuffer, xlsxSheets, csvRows } = require('../lib/zip');

const ROOT = path.join(__dirname, '..', '..');
const CACHE = path.join(ROOT, 'scripts', '.cache', 'ipeds');
const OUT = path.join(ROOT, 'src', 'assets', 'data', 'us-health-schools.json');
const STATES = path.join(ROOT, 'src', 'assets', 'data', 'geo', 'us-states.json');

const YR = 2024;
const BASE = 'https://nces.ed.gov/ipeds/datacenter/data/';
const SOURCE_URL = `https://nces.ed.gov/ipeds/datacenter/DataFiles.aspx?year=${YR}`;
const AWARDS = 'July 1, 2023 to June 30, 2024';
const ONLINE_TERM = 'fall 2023';
const ONLINE_AT = 50;   // a school is "mostly online" when at least this percent of its students study only online
const WRITE = process.argv.includes('--write'), REFRESH = process.argv.includes('--refresh');

const NP_LEVELS = [6, 7, 8, 17, 18, 19];
/** each program: its CIP codes, and for each code the award levels that count @type {Record<string, {label: string, codes: Record<string, number[]>, range: [number, number]}>} */
const PROGRAMS = {
  rn: { label: 'Registered nursing', codes: { '51.3801': [2, 3, 4, 5] }, range: [1500, 2300] },
  md: { label: 'Medicine (MD)', codes: { '51.1201': [18] }, range: [140, 180] },
  do: { label: 'Osteopathic medicine (DO)', codes: { '51.1202': [18] }, range: [30, 70] },
  pa: { label: 'Physician assistant', codes: { '51.0912': [7, 17, 18, 19] }, range: [240, 360] },
  np: { label: 'Nurse practitioner', codes: Object.fromEntries(['51.3803', '51.3805', '51.3806', '51.3809', '51.3810', '51.3821', '51.3822'].map((c) => [c, NP_LEVELS])), range: [250, 900] },
  dnp: { label: 'Doctor of nursing practice (DNP)', codes: { '51.3818': [17, 18, 19], '51.3801': [18, 19] }, range: [200, 500] },
  rt: { label: 'Respiratory therapy', codes: { '51.0908': [3, 5, 7], '51.0812': [3, 5] }, range: [300, 480] }
};
// the dictionary's own words (C2024_A_Dict, Frequencies sheet), shortened for a card
const LEVELS = { 2: 'Certificate, 1 to 2 years', 3: 'Associate', 4: 'Certificate, 2 to 4 years', 5: "Bachelor's", 6: 'Postbaccalaureate certificate', 7: "Master's",
  8: "Post-master's certificate", 17: 'Doctorate, research', 18: 'Doctorate, professional practice', 19: 'Doctorate, other' };
const CONTROL = { 1: 'Public', 2: 'Private nonprofit', 3: 'Private for-profit' };

/** @param {string} name */
async function rows(name) {
  const zip = path.join(CACHE, name + '.zip');
  if (REFRESH || !fs.existsSync(zip)) { console.log('downloading ' + BASE + name + '.zip'); await download(BASE + name + '.zip', zip); }
  return csvRows(zip);
}
const web = (/** @type {string} */ s) => { s = String(s || '').trim(); if (!s || s === '-2') return ''; return /^https?:\/\//i.test(s) ? s : 'https://' + s; };
/* a file's release, read off the first page of its own dictionary: "Provisional release", "Final/revised release",
   or the directory's "Release 1" */
/** @param {string} name */
async function releaseOf(name) {
  const zip = path.join(CACHE, name + '_Dict.zip');
  if (REFRESH || !fs.existsSync(zip)) await download(BASE + name + '_Dict.zip', zip);
  const inner = zipEntries(zip).find((x) => /\.xlsx$/i.test(x.name));
  if (!inner) throw new Error('no xlsx in ' + zip);
  const x = zip + '.xlsx';
  fs.writeFileSync(x, entryBuffer(zip, inner));
  const intro = (xlsxSheets(x).Introduction || []).slice(0, 4).map((r) => r[0] || '').join(' ');
  const m = intro.match(/\(([^)]*release[^)]*)\)/i);
  if (!m) throw new Error('no release line in the ' + name + ' dictionary: ' + intro.slice(0, 120));
  return m[1];
}

(async () => {
  const release = { completions: await releaseOf(`C${YR}_A`), directory: await releaseOf(`HD${YR}`), online: await releaseOf(`EF${YR - 1}A_DIST`) };
  console.log(`IPEDS Completions ${YR - 1}-${String(YR).slice(2)} (C${YR}_A, ${release.completions}) + directory (HD${YR}, ${release.directory}) + ${ONLINE_TERM} distance education (EF${YR - 1}A_DIST, ${release.online}).`);
  console.log(`Mode: ${WRITE ? 'WRITE' : 'DRY RUN (no files touched)'}${REFRESH ? ' · cache bypassed' : ''}\n`);

  /* the share of each school's students who study only online: EFDELEV 1 is all students, EFDEEXC those enrolled
     exclusively in distance education */
  const online = new Map();
  for (const r of await rows(`EF${YR - 1}A_DIST`)) if (+r.EFDELEV === 1 && +r.EFDETOT > 0) online.set(r.UNITID, Math.round(+r.EFDEEXC / +r.EFDETOT * 100));

  const onMap = new Set(JSON.parse(fs.readFileSync(STATES, 'utf8')).features.map((/** @type {any} */ f) => f.properties.abbr));
  /** "CIP/level" -> program key; a code can feed two programs at different levels (51.3801: RN and DNP) */
  const keyOf = new Map(Object.entries(PROGRAMS).flatMap(([k, p]) => Object.entries(p.codes).flatMap(([c, lvs]) => lvs.map((l) => [c + '/' + l, k]))));

  /* the programs: school x program -> {level: awards} */
  /** @type {Map<string, Map<string, Record<number, number>>>} */
  const by = new Map();
  for (const r of await rows(`C${YR}_A`)) {
    if (r.MAJORNUM !== '1') continue;
    const k = keyOf.get(r.CIPCODE + '/' + r.AWLEVEL), lv = +r.AWLEVEL, n = +r.CTOTALT;
    if (!k || !(n > 0)) continue;
    if (!by.has(r.UNITID)) by.set(r.UNITID, new Map());
    const m = /** @type {Map<string, Record<number, number>>} */ (by.get(r.UNITID));
    const lvs = m.get(k) || {}; lvs[lv] = (lvs[lv] || 0) + n; m.set(k, lvs);
  }

  /* the schools they belong to */
  const dir = new Map((await rows(`HD${YR}`)).map((r) => [r.UNITID, r]));
  const schools = [], programs = [], drop = { noRow: 0, closed: 0, offMap: 0, noPlace: 0 };
  for (const [u, m] of [...by].sort((a, b) => (a[0] < b[0] ? -1 : 1))) {
    const h = dir.get(u);
    if (!h) { drop.noRow++; continue; }
    if (h.CLOSEDAT !== '-2' || h.CYACTIVE !== '1') { drop.closed++; continue; }
    if (!onMap.has(h.STABBR)) { drop.offMap++; continue; }
    const lo = +h.LONGITUD, la = +h.LATITUDE;
    if (!isFinite(lo) || !isFinite(la) || !lo || !la) { drop.noPlace++; continue; }
    // [unitid, name, city, state, county, lon, lat, control (1 public, 2 nonprofit, 3 for-profit), website,
    //  percent of students studying only online (-1 when the school filed no distance education count)]
    schools.push([u, h.INSTNM, h.CITY, h.STABBR, h.COUNTYNM === '-2' ? '' : h.COUNTYNM, Math.round(lo * 1e4) / 1e4, Math.round(la * 1e4) / 1e4, +h.CONTROL > 0 ? +h.CONTROL : 0, web(h.WEBADDR),
      online.has(u) ? online.get(u) : -1]);
    for (const k of Object.keys(PROGRAMS)) {
      const lvs = m.get(k); if (!lvs) continue;
      // [unitid, program, awards by level as "level:count|level:count"]
      programs.push([u, k, Object.keys(lvs).map(Number).sort((a, b) => a - b).map((l) => l + ':' + lvs[l]).join('|')]);
    }
  }

  /* check: each program inside the range a real year should land in, every school placed in its state's box */
  const per = {}, grads = {};
  for (const [, k, lv] of programs) { per[k] = (per[k] || 0) + 1; grads[k] = (grads[k] || 0) + lv.split('|').reduce((s, x) => s + +x.split(':')[1], 0); }
  let bad = 0;
  for (const [k, p] of Object.entries(PROGRAMS)) {
    const ok = per[k] >= p.range[0] && per[k] <= p.range[1];
    if (!ok) bad++;
    console.log(`${k.toUpperCase().padEnd(3)} ${String(per[k] || 0).padStart(5)} schools ${String(grads[k] || 0).padStart(8)} graduates  ${ok ? 'ok' : 'OUT OF RANGE ' + p.range.join('-')}`);
  }
  console.log(`\n${schools.length.toLocaleString()} schools, ${programs.length.toLocaleString()} programs. Dropped: ${JSON.stringify(drop)}`);
  const ol = schools.filter((s) => s[9] >= ONLINE_AT);
  console.log(`${ol.length} schools mostly online (${ONLINE_AT}%+ of students), ${schools.filter((s) => s[9] < 0).length} with no distance education count; biggest: ` +
    ol.map((s) => [s, programs.filter((p) => p[0] === s[0]).reduce((a, p) => a + p[2].split('|').reduce((b, x) => b + +x.split(':')[1], 0), 0)])
      .sort((a, b) => b[1] - a[1]).slice(0, 5).map(([s, g]) => `${s[1]} (${s[3]}, ${s[9]}%, ${g})`).join('; '));
  if (bad) { console.error('\nrefusing to write: a program count fell outside its range, so the source or a rule changed'); process.exit(1); }

  const file = { _meta: {
    source: `IPEDS Completions ${YR - 1}-${String(YR).slice(2)} (C${YR}_A), the IPEDS directory (HD${YR}) and ${ONLINE_TERM} enrollment by distance education (EF${YR - 1}A_DIST), National Center for Education Statistics`,
    url: SOURCE_URL, release, provisional: /provisional/i.test(release.completions),
    awards: AWARDS, year: `${YR - 1}-${String(YR).slice(2)}`, onlineTerm: ONLINE_TERM, onlineAt: ONLINE_AT, pulled: new Date().toISOString().slice(0, 10),
    rule: 'A program shows when the school awarded at least one first-major award in it at the listed levels during the year.',
    programs: Object.fromEntries(Object.entries(PROGRAMS).map(([k, p]) => [k, { label: p.label, codes: p.codes }])),
    levels: LEVELS, control: CONTROL,
    fields: { schools: 'unitid, name, city, state, county, lon, lat, control, website, percent studying only online (-1 unknown)', programs: 'unitid, program, awards by level ("level:count|...")' }
  }, schools, programs };
  const text = '{"_meta":' + JSON.stringify(file._meta) + ',\n"schools":[\n' + schools.map((s) => JSON.stringify(s)).join(',\n') +
    '\n],\n"programs":[\n' + programs.map((p) => JSON.stringify(p)).join(',\n') + '\n]}\n';

  if (fs.existsSync(OUT)) {
    const old = JSON.parse(fs.readFileSync(OUT, 'utf8'));
    const key = (/** @type {any[]} */ p) => p[0] + '/' + p[1];
    const was = new Map(old.programs.map((/** @type {any[]} */ p) => [key(p), p[2]]));
    const now = new Map(programs.map((p) => [key(p), p[2]]));
    const added = [...now.keys()].filter((k) => !was.has(k)).length, gone = [...was.keys()].filter((k) => !now.has(k)).length;
    const changed = [...now.keys()].filter((k) => was.has(k) && was.get(k) !== now.get(k)).length;
    console.log(`diff vs current file: ${added} programs new, ${gone} gone, ${changed} with new counts`);
  } else console.log('no current file: all new');
  console.log(`size ${(Buffer.byteLength(text) / 1024).toFixed(0)} KB`);

  if (!WRITE) { console.log('\ndry run: nothing written (add --write)'); return; }
  fs.writeFileSync(OUT, text);
  console.log('\nwrote ' + path.relative(ROOT, OUT));
})().catch((e) => { console.error(e); process.exit(1); });
