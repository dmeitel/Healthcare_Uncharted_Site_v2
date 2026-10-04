'use strict';
// build-vital-stats-systems.js · the health system games for Vital Stats.
//
// David, 2026-10-01: "include some stats about specific hospital systems so we could look at like
// Kaiser or Intermountain or somewhere on the east coast or HCA ... a fun game that you can play
// with people within your company so that you can kind of get to know your company even more."
//
// The lobby's third choice, "A health system", deals questions about one system's hospitals. They
// live in one small file per system, so the everyday game never carries them:
//
//   src/assets/data/vital-stats-systems/index.json     the picker: every system that can fill a game
//   src/assets/data/vital-stats-systems/<id>.json      that system's questions
//
// Where the numbers come from:
//   - which hospital belongs to which system: AHRQ's Compendium of U.S. Health Systems, 2023, joined
//     to CMS's hospital list by CCN (the `sys` field in us-hospitals.json)
//   - beds, ICU beds, days, discharges, payer days, employees, residents: each hospital's Medicare
//     cost report (scripts/data/hospital-cost-reports.json, from scripts/pull/hcris.js)
//   - critical access: CMS's hospital list. Outside a metro area: CMS's Provider of Services file.
//   - the featured systems' own numbers (clinics, caregivers, plan members): scripts/data/
//     vital-stats-systems-curated.json, each read live on the system's own page on its `checked` date
//
// Left out on purpose, after spot checks against hospitals David knows (2026-10-01): the Provider
// of Services file's staff counts and unit flags (it lists McKay-Dee with 58 nurses and no burn unit
// at Intermountain Medical Center), and the cost report's burn ICU line (McKay-Dee files 32 burn
// beds). Payer shares count managed care: traditional Medicare or Medicaid days alone put Primary
// Children's at 13 percent Medicaid, when its Medicaid managed care days take it to 44.
//
// Every question carries `sys` (the system id) and `k` (its template, prefixed sy-), so a deal asks
// each template once. A question about one hospital also carries `h`, the hospital's short name,
// which the reveal strip uses to light its dot among the system's other hospitals.
//
// DETERMINISTIC. No clock, no network. tests/vital-stats-systems.test.js re-runs build() and compares.
// Run: node scripts/build-vital-stats-systems.js   (npm run build:vital-stats runs both builders)

const fs = require('fs');
const path = require('path');
const { STATE_NAMES, CATS, Q, commas, joinNames, ordinal, tally, round } = require('./build-vital-stats.js');

const ROOT = path.join(__dirname, '..');
const ASSETS = path.join(ROOT, 'src', 'assets', 'data');
const OUT_DIR = path.join(ASSETS, 'vital-stats-systems');
const HCRIS = path.join(__dirname, 'data', 'hospital-cost-reports.json');
const CURATED = path.join(__dirname, 'data', 'vital-stats-systems-curated.json');
/** @param {string} p */
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

/** the four David named; the picker shows them first */
const FEATURED = ['Intermountain Health', 'Kaiser Permanente', 'HCA Healthcare', 'Northwell Health'];
/** AHRQ's 2023 name, then the name the system goes by now */
const RENAMED = { 'Intermountain Healthcare': 'Intermountain Health' };
/** federal hospitals file no Medicare cost report, so these systems cannot fill a game */
const FEDERAL = new Set(['Veterans Health Administration (VA)', 'U.S. Military Health System (DoD)']);
/** template -> how many questions, and whether the map shows their number: for the link report only, never shipped
 *  @type {Record<string, {n:number, exact:boolean, gap:string}>} */
const SYS_LINKS = {};
const PER_TEMPLATE = 60;    // hospitals asked about per template; a game asks one, the strip draws them all
const MIN_HOSPITALS = 3, MIN_TEMPLATES = 8, MIN_QUESTIONS = 12;

const AHRQ = {
  s: 'ahrq', src: "AHRQ Compendium of U.S. Health Systems, 2023, matched to CMS's hospital list (the site's June 2026 pull)",
  url: 'https://www.ahrq.gov/chsp/data-resources/compendium.html', year: 2023, checked: '2026-06'
};
const CMS_LIST = {
  s: 'cms', src: "CMS Care Compare, Hospital General Information (the site's June 2026 pull), matched to AHRQ's 2023 Compendium",
  url: 'https://data.cms.gov/provider-data/dataset/xubh-q36u', year: 2026, checked: '2026-06'
};

// ─── hospital names: CMS's all-caps list, as people say them ────────────────────────────────

/** @type {Record<string, string>} */
const ACRO = {
  LDS: 'LDS', HCA: 'HCA', UCLA: 'UCLA', UCSF: 'UCSF', UCI: 'UCI', UC: 'UC', NYU: 'NYU', UPMC: 'UPMC', CHI: 'CHI', SSM: 'SSM',
  OSF: 'OSF', JFK: 'JFK', LIJ: 'LIJ', UNC: 'UNC', UAB: 'UAB', VCU: 'VCU', MUSC: 'MUSC', OU: 'OU', WVU: 'WVU', UVA: 'UVA',
  LSU: 'LSU', OHSU: 'OHSU', UW: 'UW', UNM: 'UNM', UK: 'UK', AMITA: 'AMITA', HSHS: 'HSHS', SCL: 'SCL', ECU: 'ECU', IU: 'IU',
  II: 'II', III: 'III', IV: 'IV', USA: 'USA', ER: 'ER', HEALTHONE: 'HealthONE', CHRISTUS: 'CHRISTUS', UT: 'UT', TX: 'TX', NE: 'NE', SE: 'SE'
};
const SMALL = new Set(['OF', 'AND', 'THE', 'AT', 'FOR', 'IN', 'ON', 'A']);
/** @param {string} w @param {boolean} first */
function titleWord(w, first) {
  if (!w) return w;
  if (ACRO[w]) return ACRO[w];
  if (w === 'ST' || w === 'ST.') return 'St.';
  if (w === 'MT' || w === 'MT.') return 'Mount';
  if (w === 'FT' || w === 'FT.') return 'Fort';
  if (!first && SMALL.has(w)) return w.toLowerCase();
  if (/[-/]/.test(w)) return w.split(/([-/])/).map((p) => (p === '-' || p === '/' ? p : titleWord(p, true))).join('');
  if (/^[A-Z]{2,4}$/.test(w) && !/[AEIOUY]/.test(w)) return w;          // initials, not a word: NS, LDS
  if (/^MC[A-Z]{2,}/.test(w)) return 'Mc' + w.charAt(2) + w.slice(3).toLowerCase();
  if (/^O'[A-Z]/.test(w)) return "O'" + w.charAt(2) + w.slice(3).toLowerCase();
  return w.charAt(0) + w.slice(1).toLowerCase();
}
/** @param {string} s */
const titleName = (s) => s.split(' ').map((w, i) => titleWord(w, i === 0)).join(' ');

/** words a name cut off at 50 characters most often ends in: "SURGERY CE" is a CENTER, "MEDICAL CENT" too */
const COMPLETE = ['CENTER', 'HOSPITAL', 'CAMPUS', 'NETWORK', 'HEALTHCARE', 'DOWNTOWN', 'MEDICAL', 'REGIONAL', 'MEMORIAL', 'COMMUNITY',
  'BEHAVIORAL', 'UNIVERSITY', 'SYSTEM', 'SERVICES', 'INSTITUTE', 'REHABILITATION', 'SURGICAL', 'ORTHOPEDIC', 'PAVILION', 'SPECIALTY', 'HEALTH'];
const JOINER = /^(OF|AND|&|AT|THE|A|-)$/;
/** CMS's list stores a name in 50 characters; a name that fills them lost its end mid-word @param {string} s */
function mend(s) {
  if (s.length < 50 || /\s+A (PART|CAMPUS) OF\b|\s+WITH\s|\bDBA\s/.test(s)) return s;   // those rules cut the tail off anyway
  const toks = s.split(' ');
  const last = toks[toks.length - 1], hy = last.lastIndexOf('-'), frag = hy > -1 ? last.slice(hy + 1) : last;
  const fits = frag.length >= 2 ? COMPLETE.filter((w) => w.startsWith(frag) && w !== frag) : [];
  if (fits.length === 1) toks[toks.length - 1] = (hy > -1 ? last.slice(0, hy + 1) : '') + fits[0];
  else if (!COMPLETE.includes(frag)) {
    if (hy > 0) toks[toks.length - 1] = last.slice(0, hy); else toks.pop();
    const j = toks.length - 2;                                          // "HOSPITAL OF PORT" loses the dangling "OF PORT"
    if (j > 0 && JOINER.test(toks[j])) toks.splice(j);
    if (JOINER.test(toks[toks.length - 1])) toks.pop();
  }
  return toks.join(' ');
}

/** @param {{n:string,c:string}} h @param {string} sysName */
function shortName(h, sysName) {
  let s = mend(String(h.n).replace(/\s+/g, ' ').trim());
  s = s.replace(/\s*&\s*/g, ' & ').replace(/\.$/, '');
  if (/,\s*THE$/.test(s)) s = 'THE ' + s.replace(/,\s*THE$/, '');      // "MEMORIAL HOSPITAL, THE"
  s = s.replace(/,?\s+DBA$/, '').replace(/^.*\bDBA\s+/, '').replace(/\s+A (PART|CAMPUS) OF\b.*$/, '').replace(/\s+WITH\s.*$/, '');
  s = s.replace(/,?\s+(INC\.?|LLC|L\.L\.C\.|CORP\.?|CORPORATION)(?=\s|$)/g, '').replace(/,$/, '');
  s = s.replace(/\bHOSP\b/g, 'HOSPITAL').replace(/\bMED CTR\b/g, 'MEDICAL CENTER').replace(/\b(CTR|CNTR)\b/g, 'CENTER')
    .replace(/\bMEM\b/g, 'MEMORIAL').replace(/\bREG\b/g, 'REGIONAL').replace(/\bMED\b/g, 'MEDICAL').replace(/\bHLTH\b/g, 'HEALTH')
    .replace(/\bSYS\b/g, 'SYSTEM').replace(/\bBEH\b/g, 'BEHAVIORAL').replace(/\bHRT\b/g, 'HEART').replace(/\bUNIV\b/g, 'UNIVERSITY')
    .replace(/\bCHILDS\b/g, "CHILDREN'S").replace(/^PROV\b/, 'PROVIDENCE');
  // Kaiser files nearly every hospital as "Kaiser Foundation Hospital" and a place
  const k = s.match(/^KAISER (?:FOUNDATION |PERMANENTE )?(?:HOSPITAL)?\s*[-,]?\s*(.*)$/);
  if (k) {
    let rest = k[1].replace(/^SO\b/, 'SOUTH').trim();
    if (!rest || /^AND REHAB/.test(rest)) rest = String(h.c).toUpperCase();
    s = 'KAISER ' + rest;
  }
  s = s.replace(/^NS\/LIJ HS\s+/, '');                                    // Northwell's old North Shore-LIJ prefix
  const pre = sysName.toUpperCase() + ' ';
  if (s.startsWith(pre) && s.slice(pre.length).split(' ').length >= 2) s = s.slice(pre.length);
  return titleName(s);
}

/** @param {string} name */
const slugOf = (name) => name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40).replace(/-+$/, '');

// ─── the cost report: one hospital's period, and the templates asked of it ─────────────────

/** @param {{fyb:string,fye:string}} o */
function periodOf(o) {
  const y = Number(o.fye.slice(0, 4));
  const calendar = o.fyb.slice(5) === '01-01' && o.fye.slice(5) === '12-31';
  return { y, label: calendar ? String(y) : 'fiscal ' + y };
}
/** @param {number} part @param {number} whole */
const pctOf = (part, whole) => commas(part / whole * 100, 0) + ' percent';

/**
 * @typedef {{b:number,ba:number,icu:number,d:number,mcr:number,mcd:number,mcrh:number,mcdh:number,dc:number,res:number,fte:number,fyb:string,fye:string,pd:number}} Report
 * @typedef {{k:string,cat:string,unit:string,suf?:string,dp:number,ok:(o:Report)=>boolean,a:(o:Report)=>number,
 *   q:(N:string,P:string)=>string,sub:string,w:(v:number)=>string,rank:{more:string,low:string,top:string},note:(o:Report)=>string}} Template
 */
// One wording per template (David, 2026-10-01: variation "leads to misinterpretation"). The question names the
// thing, the hospital and the year; `sub` says how it is counted, so nobody answers a different question.
const ICU_SUB = 'Every intensive and special care unit counts: adult, cardiac, surgical, burn, neonatal and pediatric.';
const DC_SUB = 'Each inpatient stay that ended counts once, whoever paid for it.';
const MCR_SUB = 'Medicare Advantage plans included. Counted in days spent in a bed, not in people.';
const MCD_SUB = 'Medicaid managed care plans included. Counted in days spent in a bed, not in people.';
const RES_SUB = 'Interns and residents: doctors training after medical school. Two half-time count as one.';
/** @type {Template[]} */
const HT = [
  { k: 'beds', cat: 'Hospitals', unit: 'beds', dp: 0, ok: (o) => o.b >= 5, a: (o) => o.b,
    q: (N, P) => `How many beds did ${N} report to Medicare for ${P}?`,
    sub: 'Beds on its Medicare cost report. A licensed bed count usually runs higher.',
    w: (v) => commas(v) + ' beds', rank: { more: 'reports more', low: 'fewest', top: 'has the most' }, note: () => '' },
  { k: 'icu', cat: 'Hospitals', unit: 'beds', dp: 0, ok: (o) => o.icu >= 4 && o.b > 0, a: (o) => o.icu,
    q: (N, P) => `How many intensive care beds did ${N} report to Medicare for ${P}?`, sub: ICU_SUB,
    w: (v) => commas(v) + ' ICU beds', rank: { more: 'reports more', low: 'fewest', top: 'has the most' },
    note: (o) => `That is ${pctOf(o.icu, o.b)} of its ${commas(o.b)} beds.` },
  { k: 'dc', cat: 'Hospitals', unit: 'discharges', dp: 0, ok: (o) => o.dc >= 100, a: (o) => o.dc,
    q: (N, P) => `How many inpatient discharges did ${N} report for ${P}?`, sub: DC_SUB,
    w: (v) => commas(v), rank: { more: 'discharged more', low: 'fewest', top: 'discharged the most' },
    note: (o) => `About ${commas(o.dc / o.pd, 0)} a day.` },
  { k: 'los', cat: 'Hospitals', unit: 'days', dp: 1, ok: (o) => o.dc >= 200 && o.d / o.dc >= 1.5 && o.d / o.dc <= 30, a: (o) => o.d / o.dc,
    q: (N, P) => `How many days did the average inpatient stay last at ${N} in ${P}?`,
    sub: 'All inpatient days divided by discharges. Answer in days, like 4.5.',
    w: (v) => commas(v, 1) + ' days', rank: { more: 'kept patients longer', low: 'shortest', top: 'ran longest' },
    note: () => `Across the cost reports of U.S. general hospitals it averages ${commas(NAT.los, 1)} days.` },
  { k: 'occ', cat: 'Hospitals', unit: 'percent', suf: '%', dp: 0, ok: (o) => o.ba > 0 && o.d / o.ba >= 0.1 && o.d / o.ba <= 1, a: (o) => o.d / o.ba * 100,
    q: (N, P) => `On an average day in ${P}, what percent of ${N}'s beds had a patient in them?`,
    sub: 'Patient days divided by the bed days it had available.',
    w: (v) => commas(v, 0) + ' percent', rank: { more: 'ran fuller', low: 'emptiest', top: 'ran fullest' }, note: () => '' },
  { k: 'mcr', cat: 'Coverage', unit: 'percent', suf: '%', dp: 0,
    ok: (o) => o.d >= 1000 && (o.mcr + o.mcrh) / o.d >= 0.01 && (o.mcr + o.mcrh) / o.d <= 0.95, a: (o) => (o.mcr + o.mcrh) / o.d * 100,
    q: (N, P) => `What percent of ${N}'s inpatient days in ${P} were for Medicare patients?`, sub: MCR_SUB,
    w: (v) => commas(v, 0) + ' percent', rank: { more: 'runs higher', low: 'lowest', top: 'runs highest' },
    note: (o) => `Traditional Medicare was ${pctOf(o.mcr, o.d)} and Medicare Advantage plans ${pctOf(o.mcrh, o.d)}.` },
  { k: 'mcd', cat: 'Coverage', unit: 'percent', suf: '%', dp: 0,
    ok: (o) => o.d >= 1000 && (o.mcd + o.mcdh) / o.d >= 0.01 && (o.mcd + o.mcdh) / o.d <= 0.95, a: (o) => (o.mcd + o.mcdh) / o.d * 100,
    q: (N, P) => `What percent of ${N}'s inpatient days in ${P} were for Medicaid patients?`, sub: MCD_SUB,
    w: (v) => commas(v, 0) + ' percent', rank: { more: 'runs higher', low: 'lowest', top: 'runs highest' },
    note: (o) => `Traditional Medicaid was ${pctOf(o.mcd, o.d)} and Medicaid managed care plans ${pctOf(o.mcdh, o.d)}.` },
  { k: 'fte', cat: 'Workforce', unit: 'employees (full-time equivalent)', dp: 0, ok: (o) => o.fte >= 25, a: (o) => o.fte,
    q: (N, P) => `How many full-time-equivalent employees did ${N} have on its payroll in ${P}?`,
    sub: 'Two half-time employees count as one. Hospital payroll only: not clinics, not contract staff.',
    w: (v) => commas(v), rank: { more: 'reports more', low: 'fewest', top: 'has the most' },
    note: (o) => (o.b ? `About ${commas(o.fte / o.b, 1)} for every bed.` : '') },
  { k: 'res', cat: 'Workforce', unit: 'residents (full-time equivalent)', dp: 0, ok: (o) => o.res >= 5, a: (o) => Math.round(o.res),
    q: (N, P) => `How many full-time-equivalent resident physicians trained at ${N} in ${P}?`, sub: RES_SUB,
    w: (v) => commas(v), rank: { more: 'trains more', low: 'fewest', top: 'trains the most' }, note: () => '' }
];

/** national figures the notes compare against, filled in by build() */
const NAT = { los: 0, mcr: 0, mcd: 0 };

/* THE MAP'S CARDS (2026-10-02, David: "put the cost report numbers on the hospital cards"). The operations map shows a
   hospital's cost report numbers, and a system's totals, from a file this builder writes with the same templates and
   the same totals the questions use, so a card and a question can never disagree. */
const CARD_OUT = path.join(ASSETS, 'us-hospital-cost-reports.json');
/** a hospital's card numbers, in HT order, each rounded as its question rounds it, null where the question would not ask
 *  @param {Report} o */
const hospitalCard = (o) => HT.map((T) => (T.ok(o) ? round(T.a(o), T.dp) : null));
/**
 * A system's totals across its hospitals with a full year on file, each null below the line its question needs.
 * @param {Report[]} reps
 */
function totalsOf(reps) {
  const sum = (/** @type {(o:Report)=>number} */ f) => reps.reduce((s, o) => s + f(o), 0);
  const years = tally(reps, (o) => String(periodOf(o).y));
  const yr = Number(Object.keys(years).sort((a, b) => years[b] - years[a] || b.localeCompare(a))[0]);
  const beds = sum((o) => o.b), icu = sum((o) => o.icu), dc = sum((o) => o.dc), fte = sum((o) => o.fte), days = sum((o) => o.d);
  const m = days >= 10000 ? sum((o) => o.mcr + o.mcrh) / days * 100 : 0, d = days >= 10000 ? sum((o) => o.mcd + o.mcdh) / days * 100 : 0;
  const res = sum((o) => o.res), teach = reps.filter((o) => o.res >= 5).length;
  return { yr, beds, icu: icu >= 10 ? icu : null, dc: dc >= 1000 ? dc : null, fte: fte >= 100 ? fte : null,
    mcr: m >= 1 ? m : null, mcd: d >= 1 ? d : null, res: res >= 20 && teach ? Math.round(res) : null };
}

/**
 * @param {[string, number][]} list [hospital id, value]
 * @param {string} id @param {(id:string)=>string} nameOf @param {(v:number)=>string} fmt
 * @param {string} SN @param {{more:string,low:string,top:string}} words
 */
function rankLine(list, id, nameOf, fmt, SN, words) {
  const s = list.slice().sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
  const i = s.findIndex((x) => x[0] === id), n = s.length;
  if (n < 3 || i < 0) return '';
  if (i === 0) return `No other ${SN} hospital ${words.more}; ${nameOf(s[1][0])} is next at ${fmt(s[1][1])}.`;
  if (i === n - 1) return `That is the ${words.low} of ${n} ${SN} hospitals; ${nameOf(s[0][0])} ${words.top}, ${fmt(s[0][1])}.`;
  return `That ranks ${ordinal(i + 1)} of ${n} ${SN} hospitals; ${nameOf(s[0][0])} ${words.top}, ${fmt(s[0][1])}.`;
}

// ─── one system ───────────────────────────────────────────────────────────────────────────

/**
 * @param {string} name the display name
 * @param {any[]} hosp its hospitals from us-hospitals.json
 * @param {{byCcn:Record<string,Report>, _meta:any}} hc the cost reports
 * @param {any} ctx everything shared: state counts, the rural flags, the curated facts
 */
function systemQuestions(name, hosp, hc, ctx) {
  const slug = slugOf(name), SN = name;
  /** @type {any[]} */
  const out = [];
  /** the sources this system's questions cite, written once at the top of its file: a question names one by `s`
   *  @type {Record<string, {src:string,url:string,checked:string}>} */
  const srcs = {};
  /** the lines under the questions, the same way: each written once, a question names its line by `u`
   *  @type {string[]} */
  const subs = [];
  /** where to see it (2026-10-02): the system, or one of its hospitals, on the operations map, which names systems by
   *  AHRQ's spelling. Written once each, a question names its view by `v`, as build-vital-stats.js explains `see`.
   *  @type {string[]} */
  const sees = [];
  const mapName = ctx.ahrqName[name];
  const HC = {
    s: 'hc', src: `Medicare hospital cost reports (CMS HCRIS, Worksheet S-3), fiscal year ${hc._meta.fiscalYearFile} file`,
    url: 'https://www.cms.gov/data-research/statistics-trends-and-reports/cost-reports/cost-reports-fiscal-year',
    checked: String(hc._meta.pulled)
  };
  /** @param {any} o */
  const add = (o) => {
    /** @type {any} */
    const rec = Q(Object.assign({ pre: '', suf: '', dp: 0 }, o, { k: o.k.indexOf('cur-') === 0 ? o.k : 'sy-' + o.k }));
    if (o.s) {
      srcs[o.s] = { src: rec.src, url: rec.url, checked: rec.checked };
      delete rec.src; delete rec.url; delete rec.checked;
      rec.s = o.s;
    }
    if (rec.sub) {
      let u = subs.indexOf(rec.sub);
      if (u < 0) { u = subs.length; subs.push(rec.sub); }
      rec.u = u;
    }
    rec.sys = slug;
    if (o.h) rec.h = o.h;
    const see = 'ops|sys=' + encodeURIComponent(mapName) + (o.hid ? '&fac=' + o.hid : '') + '|' + (o.hid ? o.h : name);
    let v = sees.indexOf(see);
    if (v < 0) { v = sees.length; sees.push(see); }
    rec.v = v;
    out.push(rec);
  };

  // names, made unique inside the system
  /** @type {Record<string, string>} */
  const nm = {};
  const counts = tally(hosp.map((h) => shortName(h, name)), (x) => x);
  for (const h of hosp) {
    const s = shortName(h, name);
    nm[h.id] = counts[s] > 1 ? `${s} (${titleName(String(h.c).toUpperCase())})` : s;
  }
  const nameOf = (/** @type {string} */ id) => nm[id];

  // the hospitals with a full year on file
  const rep = hosp.map((h) => ({ h, o: hc.byCcn[h.id] })).filter((x) => x.o && x.o.pd >= 300);

  // 1. one question per template per hospital
  for (const T of HT) {
    let elig = rep.filter((x) => T.ok(x.o));
    const vals = /** @type {[string, number][]} */ (elig.map((x) => [x.h.id, T.a(x.o)]));
    if (elig.length > PER_TEMPLATE) elig = elig.slice().sort((a, b) => b.o.b - a.o.b || (a.h.id < b.h.id ? -1 : 1)).slice(0, PER_TEMPLATE);
    for (const { h, o } of elig) {
      const id = `sy-${T.k}-${h.id.toLowerCase()}`;
      const P = periodOf(o);
      const a = T.a(o);
      const why = [rankLine(vals, h.id, nameOf, T.w, SN, T.rank), T.note(o)].filter(Boolean).join(' ');
      add(Object.assign({}, HC, { id, k: T.k, cat: T.cat, unit: T.unit, suf: T.suf || '', dp: T.dp, a, year: P.y,
        q: T.q(nameOf(h.id), P.label), sub: T.sub, why: why || T.sub, h: nameOf(h.id), hid: h.id }));
    }
  }

  // 2. the system as a whole
  const n = hosp.length;
  const byState = tally(hosp, (h) => h.s);
  const states = Object.keys(byState).sort((a, b) => byState[b] - byState[a] || a.localeCompare(b));
  const multi = states.length >= 2;
  const stName = (/** @type {string} */ st) => STATE_NAMES[st];
  const breakdown = states.length <= 6
    ? joinNames(states.map((st) => `${stName(st)} ${byState[st]}`))
    : states.slice(0, 3).map((st) => `${stName(st)} ${byState[st]}`).join(', ') + ` and ${states.length - 3} more states`;
  const cid = `sy-${slug}`;

  const FED = 'From AHRQ\'s 2023 list of who owns which hospital, matched to Medicare\'s hospital list.';
  add(Object.assign({}, AHRQ, { id: cid + '-count', k: 'count', cat: 'Hospitals', unit: 'hospitals', a: n,
    q: `How many hospitals does ${SN} run, by the federal list of health systems?`, sub: FED,
    why: (multi ? breakdown + '.' : `All of them are in ${stName(states[0])}.`) +
      ' A system\'s own count can differ: it may count campuses on their own, or hospitals that joined after 2023.' }));

  if (multi) {
    add(Object.assign({}, AHRQ, { id: cid + '-states', k: 'states', cat: 'Hospitals', unit: 'states', a: states.length,
      q: `In how many states does ${SN} run a hospital, by the federal list?`, sub: FED,
      why: states.length <= 8 ? joinNames(states.map(stName).sort()) + '.' : `The most are in ${joinNames(states.slice(0, 3).map((st) => `${stName(st)} (${byState[st]})`))}.` }));
    for (const st of states) {
      const id = `${cid}-state-${st.toLowerCase()}`;
      add(Object.assign({}, AHRQ, { id, k: 'state', cat: 'Hospitals', unit: 'hospitals', a: byState[st], st,
        q: `How many ${SN} hospitals are in ${stName(st)}, by the federal list?`, sub: FED,
        why: `That is ${byState[st]} of the ${ctx.stateCount[st]} hospitals in ${stName(st)} on CMS's list.` }));
    }
  }
  // its share of its biggest state
  const top = states[0], c = byState[top], tot = ctx.stateCount[top];
  if (c >= 2 && c / tot >= 0.05) {
    const rivals = Object.entries(ctx.sysByState[top] || {}).filter(([s]) => s !== ctx.ahrqName[name]).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    const rival = rivals[0];
    add(Object.assign({}, CMS_LIST, { id: cid + '-share', k: 'share', cat: 'Hospitals', unit: 'percent', suf: '%', a: c / tot * 100, st: top,
      q: `What percent of the hospitals in ${stName(top)} belong to ${SN}?`,
      sub: `Out of every hospital in ${stName(top)} on Medicare's list, every kind counted.`,
      why: `${c} of ${tot}.` + (rival ? ` The next biggest system there, ${RENAMED[rival[0]] || rival[0]}, has ${rival[1]}.` : '') }));
  }
  /** a short list reads better than a count it repeats @param {any[]} hs */
  const named = (hs) => hs.length <= 8 ?`They are ${joinNames(hs.map((h) => nameOf(h.id)).sort())}.` : '';
  const cahs = hosp.filter((h) => h.t === 'cah');
  if (cahs.length >= 1) {
    add(Object.assign({}, CMS_LIST, { id: cid + '-cah', k: 'cah', cat: 'Hospitals', unit: 'hospitals', a: cahs.length,
      q: `How many of ${SN}'s hospitals are critical access hospitals?`,
      /* the definition is the main bank's, checked 2026-09-24 on cms.gov */
      sub: 'Small rural hospitals with 25 inpatient beds at most, paid by Medicare on their costs.',
      why: named(cahs) || `${cahs.length} of its ${n} hospitals on the federal list.` }));
  }
  const rurals = hosp.filter((h) => ctx.rural[h.id]);
  if (rurals.length >= 1 && rurals.length < n) {
    add({ id: cid + '-rural', k: 'rural', cat: 'Hospitals', unit: 'hospitals', a: rurals.length,
      s: 'pos', src: "CMS Provider of Services file (April 2026), matched to AHRQ's 2023 Compendium",
      url: 'https://data.cms.gov/provider-characteristics/hospitals-and-other-facilities/provider-of-services-file-hospital-non-hospital-facilities',
      year: 2026, checked: ctx.posPulled,
      q: `How many of ${SN}'s hospitals are outside a metropolitan area?`,
      sub: 'By the county each hospital sits in, as CMS records it.',
      why: named(rurals) || `The other ${n - rurals.length} are in metro areas.` });
  }

  // totals from the cost reports
  if (rep.length >= 2) {
    const tt = totalsOf(rep.map((x) => x.o)), yr = tt.yr, beds = tt.beds;   // the same totals the map's system card shows
    const from = rep.length === n ? `From all ${n} hospitals' latest cost reports, mostly ${yr}.`
      : `From ${rep.length} of the ${n} hospitals' latest cost reports, mostly ${yr}; the others had no full year on file.`;
    const T = Object.assign({}, HC, { year: yr });
    add(Object.assign({}, T, { id: cid + '-beds-all', k: 'beds-all', cat: 'Hospitals', unit: 'beds', a: beds,
      q: `How many beds do ${SN}'s hospitals report to Medicare, added together?`,
      sub: 'Every one of its hospitals\' latest Medicare cost report, added up.', why: from }));
    const big = rep.slice().sort((a, b) => b.o.b - a.o.b || (a.h.id < b.h.id ? -1 : 1));
    if (big.length >= 3 && big[0].o.b >= 5) {
      add(Object.assign({}, T, { id: cid + '-biggest', k: 'beds', cat: 'Hospitals', unit: 'beds', a: big[0].o.b, year: periodOf(big[0].o).y,
        q: `How many beds does ${SN}'s biggest hospital report to Medicare?`, h: nameOf(big[0].h.id), hid: big[0].h.id,
        sub: 'Biggest by beds on its cost report. The answer names the hospital.',
        why: `It is ${nameOf(big[0].h.id)}. ${nameOf(big[1].h.id)} is next, with ${commas(big[1].o.b)}.` }));
    }
    const icu = tt.icu;
    if (icu != null) add(Object.assign({}, T, { id: cid + '-icu-all', k: 'icu-all', cat: 'Hospitals', unit: 'beds', a: icu,
      q: `How many intensive care beds do ${SN}'s hospitals report to Medicare, added together?`, sub: ICU_SUB,
      why: `That is ${pctOf(icu, beds)} of their ${commas(beds)} beds. ${from}` }));
    const dc = tt.dc;
    if (dc != null) add(Object.assign({}, T, { id: cid + '-dc-all', k: 'dc-all', cat: 'Hospitals', unit: 'discharges', a: dc,
      q: `How many inpatient discharges did ${SN}'s hospitals report in a year, added together?`, sub: DC_SUB,
      why: `About ${commas(dc / 365, 0)} a day. ${from}` }));
    if (tt.fte != null) add(Object.assign({}, T, { id: cid + '-fte-all', k: 'fte-all', cat: 'Workforce', unit: 'employees (full-time equivalent)', a: tt.fte,
      q: `How many full-time-equivalent employees do ${SN}'s hospitals have on payroll, added together?`,
      sub: 'Two half-time employees count as one. Hospital payrolls only: clinics, offices and any health plan are left out.',
      why: from }));
    if (tt.mcr != null) add(Object.assign({}, T, { id: cid + '-mcr-all', k: 'mcr-all', cat: 'Coverage', unit: 'percent', suf: '%', a: tt.mcr,
      q: `Across all of ${SN}'s hospitals, what percent of inpatient days were for Medicare patients?`, sub: MCR_SUB,
      why: `Across every U.S. hospital's cost report it is ${commas(NAT.mcr, 0)} percent.` }));
    if (tt.mcd != null) add(Object.assign({}, T, { id: cid + '-mcd-all', k: 'mcd-all', cat: 'Coverage', unit: 'percent', suf: '%', a: tt.mcd,
      q: `Across all of ${SN}'s hospitals, what percent of inpatient days were for Medicaid patients?`, sub: MCD_SUB,
      why: `Across every U.S. hospital's cost report it is ${commas(NAT.mcd, 0)} percent.` }));
    const teach = rep.filter((x) => x.o.res >= 5);
    if (tt.res != null) {
      const t0 = teach.slice().sort((a, b) => b.o.res - a.o.res)[0];
      add(Object.assign({}, T, { id: cid + '-res-all', k: 'res-all', cat: 'Workforce', unit: 'residents (full-time equivalent)', a: tt.res,
        q: `How many full-time-equivalent resident physicians train in ${SN}'s hospitals, added together?`, sub: RES_SUB,
        why: `${teach.length === 1 ? 'One of its hospitals reports' : teach.length + ' of its hospitals report'} residents; ${nameOf(t0.h.id)} trains the most, ${commas(t0.o.res, 0)}.` }));
    }
  }

  // 3. the system's own numbers, read live on its own pages
  for (const c of (ctx.curated[name] || [])) {
    add({ id: `${cid}-own-${c.id}`, k: c.k || 'cur-' + c.id, cat: c.cat, q: c.q, sub: c.sub, a: c.a, unit: c.unit, pre: c.pre, suf: c.suf, dp: c.dp,
      src: c.src, url: c.url, year: c.year, checked: c.checked, why: c.why });
  }
  return { slug, out, srcs, subs, sees };
}

// ─── check, assemble ──────────────────────────────────────────────────────────────────────

/** @param {any[]} qs @param {Set<string>} seen @param {Record<string, any>} srcs */
function validate(qs, seen, srcs) {
  for (const q of qs) {
    const tag = '[vital-stats-systems] ' + q.id + ': ';
    if (seen.has(q.id)) throw new Error(tag + 'duplicate id');
    seen.add(q.id);
    if (!/^[a-z0-9-]{3,64}$/.test(q.id)) throw new Error(tag + 'bad id');
    if (!CATS.includes(q.cat)) throw new Error(tag + 'unknown category ' + q.cat);
    if (typeof q.a !== 'number' || !Number.isFinite(q.a) || q.a <= 0) throw new Error(tag + 'answer must be a finite positive number');
    const S = q.s ? srcs[q.s] : q;
    if (!S) throw new Error(tag + 'names a source the file does not carry: ' + q.s);
    for (const k of ['src', 'checked']) if (!S[k] || typeof S[k] !== 'string') throw new Error(tag + 'missing ' + k);
    for (const k of ['q', 'unit', 'why', 'sys', 'k']) if (!q[k] || typeof q[k] !== 'string') throw new Error(tag + 'missing ' + k);
    if (!q.q.endsWith('?')) throw new Error(tag + 'a question ends with a question mark');
    if (!Number.isInteger(q.year) || q.year < 2000 || q.year > 2100) throw new Error(tag + 'bad year');
    if ('st' in q && !STATE_NAMES[q.st]) throw new Error(tag + 'unknown state ' + q.st);
    if ('sub' in q && !(typeof q.sub === 'string' && /\.$/.test(q.sub) && !/\?/.test(q.sub) && q.sub.length <= 140)) throw new Error(tag + 'a sub line is one or two plain sentences, 140 characters at most');
    if (/\u2014/.test(JSON.stringify(q))) throw new Error(tag + 'an em dash got in');
  }
}

/** @returns {Record<string, string>} file name in OUT_DIR -> its text */
function build() {
  const H = readJson(path.join(ASSETS, 'us-hospitals.json')).hospitals;
  const enrich = readJson(path.join(ASSETS, 'hospital-enrich.json'));
  const hc = readJson(HCRIS);
  const cur = fs.existsSync(CURATED) ? readJson(CURATED) : { systems: {} };

  // national comparisons: general hospitals only for the stay, every report for the payer shares
  const acute = new Set(H.filter((h) => h.t === 'acute').map((h) => h.id));
  /** @type {Report[]} */
  const allRep = Object.values(hc.byCcn).filter((o) => o.pd >= 300);
  const acuteRep = Object.entries(hc.byCcn).filter(([id, o]) => acute.has(id) && o.pd >= 300 && o.dc >= 200).map(([, o]) => o);
  NAT.los = acuteRep.reduce((s, o) => s + o.d, 0) / acuteRep.reduce((s, o) => s + o.dc, 0);
  const allDays = allRep.reduce((s, o) => s + o.d, 0);
  NAT.mcr = allRep.reduce((s, o) => s + o.mcr + o.mcrh, 0) / allDays * 100;
  NAT.mcd = allRep.reduce((s, o) => s + o.mcd + o.mcdh, 0) / allDays * 100;

  /** @type {Record<string, any[]>} */
  const bySys = {};
  for (const h of H) if (h.sys && !FEDERAL.has(h.sys)) (bySys[h.sys] = bySys[h.sys] || []).push(h);
  /** @type {Record<string, Record<string, number>>} */
  const sysByState = {};
  for (const h of H) if (h.sys) { const m = (sysByState[h.s] = sysByState[h.s] || {}); m[h.sys] = (m[h.sys] || 0) + 1; }
  /** @type {Record<string, boolean>} */
  const rural = {};
  for (const h of H) { const e = enrich.byId[h.id]; if (e && e.ur === 1) rural[h.id] = true; }
  /** @type {Record<string, string>} display name -> AHRQ name */
  const ahrqName = {};
  for (const s of Object.keys(bySys)) ahrqName[RENAMED[s] || s] = s;
  const ctx = { stateCount: tally(H, (h) => h.s), sysByState, rural, ahrqName, posPulled: String(enrich._meta.pulled), curated: cur.systems || {} };

  for (const f of FEATURED) if (!ahrqName[f]) throw new Error('[vital-stats-systems] featured system missing from the hospital file: ' + f);
  for (const name of Object.keys(ctx.curated)) if (!ahrqName[name]) throw new Error('[vital-stats-systems] curated facts for an unknown system: ' + name);

  /** @type {Record<string, string>} */
  const files = {};
  /** @type {any[]} */
  const index = [];
  const seen = new Set(), slugs = new Set();
  const names = Object.keys(bySys).map((s) => RENAMED[s] || s)
    .sort((a, b) => bySys[ahrqName[b]].length - bySys[ahrqName[a]].length || a.localeCompare(b));
  for (const name of names) {
    const hosp = bySys[ahrqName[name]].slice().sort((a, b) => (a.id < b.id ? -1 : 1));
    if (hosp.length < MIN_HOSPITALS) continue;
    const { slug, out, srcs, subs, sees } = systemQuestions(name, hosp, hc, ctx);
    const ks = new Set(out.map((q) => q.k));
    if (ks.size < MIN_TEMPLATES || out.length < MIN_QUESTIONS) {
      if (FEATURED.includes(name)) throw new Error('[vital-stats-systems] featured system cannot fill a game: ' + name);
      continue;
    }
    if (slugs.has(slug)) throw new Error('[vital-stats-systems] two systems share the id ' + slug);
    slugs.add(slug);
    validate(out, seen, srcs);
    /* for the link report: the system card counts its hospitals and states, and since 2026-10-02 the hospital and
       system cards carry the cost report numbers from buildCard(), made by the same templates and totals */
    for (const q of out) {
      /* a system's own published figure (an "-own-" fact) shares its template's key so a game never deals both, but it
         is the system's number, not the cost report's, so it is never exact */
      const own = /-own-/.test(q.id), key = own ? q.k + ' (the system\'s own figure)' : q.k;
      /* the system card's "By state" rows (2026-10-02) carry each state's count and the system's share of it; its
         "By type" rows carry the critical access count and the hospitals outside a metro area */
      const exact = !own && (q.k === 'sy-count' || q.k === 'sy-states' || q.k === 'sy-state' || q.k === 'sy-share' ||
        q.k === 'sy-cah' || q.k === 'sy-rural' ||
        HT.some((T) => q.k === 'sy-' + T.k) || /^sy-(beds|icu|dc|fte|mcr|mcd|res)-all$/.test(q.k));
      const L = SYS_LINKS[key] || (SYS_LINKS[key] = { n: 0, exact, gap: exact ? '' : own ? 'The system publishes this itself; the map shows the cost report figures beside it.'
        : 'The system\'s card on the map shows its hospitals, states and cost report totals, not this.' });
      L.n++;
    }
    const qs = CATS.flatMap((c) => out.filter((q) => q.cat === c));
    const src = Object.fromEntries(Object.keys(srcs).sort().map((k) => [k, srcs[k]]));
    /** the shipped row names its line by `u`; the page puts the text back on load @param {any} q */
    const ship = (q) => { const r = Object.assign({}, q); delete r.sub; return r; };
    files[slug + '.json'] = '{"v":1,"id":' + JSON.stringify(slug) + ',"name":' + JSON.stringify(name) + ',"built":' + JSON.stringify(String(hc._meta.pulled)) +
      ',"src":' + JSON.stringify(src) + ',"subs":' + JSON.stringify(subs) + ',"sees":' + JSON.stringify(sees) + ',"questions":[\n' + qs.map((q) => JSON.stringify(ship(q))).join(',\n') + '\n]}\n';
    const byState = tally(hosp, (h) => h.s);
    /** @type {any} */
    const row = { id: slug, name, n: hosp.length, st: Object.keys(byState).sort((a, b) => byState[b] - byState[a] || a.localeCompare(b)), q: qs.length };
    if (FEATURED.includes(name)) row.f = FEATURED.indexOf(name) + 1;
    index.push(row);
  }
  files['index.json'] = '{"v":1,"built":' + JSON.stringify(String(hc._meta.pulled)) + ',"systems":[\n' + index.map((r) => JSON.stringify(r)).join(',\n') + '\n]}\n';
  return files;
}

/**
 * The operations map's cost report file: every hospital with a full year on file (the same line the questions use)
 * and every system with two or more, one line each so a refresh diffs small.
 *   h:   CCN -> [period label, ...one value per template in `fields`]
 *   sys: the map's system name -> [hospitals with a full year, hospitals on the list, the most common year, beds, icu, dc, fte, mcr, mcd, res]
 */
function buildCard() {
  const H = readJson(path.join(ASSETS, 'us-hospitals.json')).hospitals;
  const hc = readJson(HCRIS);
  const full = (/** @type {Report|undefined} */ o) => !!o && o.pd >= 300;
  const onMap = new Set(H.map((h) => h.id));   // a cost report for a hospital the map does not draw has no card to sit on
  const ids = Object.keys(hc.byCcn).filter((id) => onMap.has(id) && full(hc.byCcn[id])).sort();
  /** @type {Record<string, any[]>} */
  const bySys = {};
  for (const h of H) if (h.sys) (bySys[h.sys] = bySys[h.sys] || []).push(h);
  const sysRows = Object.keys(bySys).sort().map((s) => {
    const reps = bySys[s].map((h) => hc.byCcn[h.id]).filter(full);
    if (reps.length < 2) return null;
    const t = totalsOf(reps), r0 = (/** @type {number|null} */ v) => (v == null ? null : round(v, 0));
    return JSON.stringify(s) + ':' + JSON.stringify([reps.length, bySys[s].length, t.yr, r0(t.beds), r0(t.icu), r0(t.dc), r0(t.fte), r0(t.mcr), r0(t.mcd), t.res]);
  }).filter(Boolean);
  const meta = { source: `Medicare hospital cost reports (CMS HCRIS, Worksheet S-3), fiscal year ${hc._meta.fiscalYearFile} file`,
    url: 'https://www.cms.gov/data-research/statistics-trends-and-reports/cost-reports/cost-reports-fiscal-year',
    pulled: String(hc._meta.pulled), built_by: 'scripts/build-vital-stats-systems.js (the same numbers Vital Stats asks)' };
  return '{"_meta":' + JSON.stringify(meta) + ',"fields":' + JSON.stringify(HT.map((T) => T.k)) + ',"h":{\n' +
    ids.map((id) => JSON.stringify(id) + ':' + JSON.stringify([periodOf(hc.byCcn[id]).label, ...hospitalCard(hc.byCcn[id])])).join(',\n') +
    '\n},"sys":{\n' + sysRows.join(',\n') + '\n}}\n';
}

if (require.main === module) {
  fs.writeFileSync(CARD_OUT, buildCard());
  console.log(`vital-stats systems: the operations map's cost report cards -> ${path.relative(ROOT, CARD_OUT)} (${(fs.statSync(CARD_OUT).size / 1024).toFixed(0)} KB)`);
  const files = build();
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const f of fs.readdirSync(OUT_DIR)) if (!files[f]) fs.unlinkSync(path.join(OUT_DIR, f));   // a system that left the list
  let bytes = 0;
  for (const [f, text] of Object.entries(files)) { fs.writeFileSync(path.join(OUT_DIR, f), text); bytes += Buffer.byteLength(text); }
  const index = JSON.parse(files['index.json']).systems;
  const qn = index.reduce((s, r) => s + r.q, 0);
  console.log(`vital-stats systems: ${index.length} systems, ${qn} questions, ${(bytes / 1024 / 1024).toFixed(1)} MB -> ${path.relative(ROOT, OUT_DIR)}`);
  for (const r of index.filter((x) => x.f)) console.log(`  ${r.name}: ${r.n} hospitals in ${r.st.join(' ')}, ${r.q} questions`);
}

module.exports = { build, buildCard, CARD_OUT, OUT_DIR, shortName, SYS_LINKS };
