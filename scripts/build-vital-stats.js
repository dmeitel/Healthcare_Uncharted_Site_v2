'use strict';
// build-vital-stats.js · the question bank for Vital Stats (src/secret-menu/vital-stats/).
//
// Vital Stats asks one healthcare NUMBER a round, everyone guesses, everyone bets on
// the closest guess without going over, then the answer shows with its source and
// one line of context. This script writes that bank:
//
//   src/assets/data/vital-stats-questions.json
//
// Two kinds of question go in:
//   1. CURATED: national headline numbers in scripts/data/vital-stats-curated.json. Each
//      one was read live on the publisher's page on its `checked` date, and the file
//      keeps the sentence it came from (`quote`) so the next check is a comparison.
//      The quote stays in that file; it is not shipped.
//   2. FROM THE SITE'S OWN DATA: state and county metrics (stateData.json,
//      countyData.json, metricsConfig.json), BLS pay and projections
//      (career-tree-bls.json), credential exam stats (career-tree-creds.json), and
//      counts from the CMS facility files (hospitals, dialysis, ASCs) and the Utah
//      price pull. `src` says where each number came from and that it is a count or
//      a median when the builder computed it.
//
// Choosing states: the everyday mix asks at most six states per metric, picked by
// hand below from the extremes, the big states and Utah. A STATE GAME (the lobby's
// "State by state", added 2026-09-24 on David's ask) needs every state, so every
// state metric and every per-state count is also written for all fifty states and
// DC. Those extras carry `more: 1` and only a state game deals them. Every question
// about one state carries `st` (its postal code), and every question built from a
// template carries `k` (the template), so a deal can avoid asking obesity three
// times in one game. Only metrics fed by the repeatable pull scripts are
// used (retrievedDate 2026 in metricsConfig). The older hand-entered metrics were
// left out on purpose: spot checks found some that no longer match their source.
//
// DETERMINISTIC. No clock, no randomness, no network. Same inputs, same bytes out;
// tests/vital-stats-questions.test.js re-runs build() and compares. When a data file
// changes, re-run this and commit the new bank with it.
//
// Run: node scripts/build-vital-stats.js

const fs = require('fs');
const path = require('path');
const { metricIndexById } = require('./lib/metric-id');

const ROOT = path.join(__dirname, '..');
const DATA = path.join(ROOT, 'src', '_data');
const ASSETS = path.join(ROOT, 'src', 'assets', 'data');
const OUT = path.join(ASSETS, 'vital-stats-questions.json');
const CURATED = path.join(__dirname, 'data', 'vital-stats-curated.json');

const CATS = ['Workforce', 'Coverage', 'Hospitals', 'Money', 'Health'];

/** @param {string} p */
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

// The CMS facility files (hospitals, dialysis, ASCs) were pulled in June 2026
// (src/tools/operators-map/index.html names the pull). The files carry no date.
const FACILITY_PULL = { year: 2026, checked: '2026-06', label: 'June 2026' };
// career-tree-bls.json was refreshed from the Handbook by scripts/pull/ooh.js on
// 2026-09-23; the RN and RT medians match OEWS Table 1 (May 2025) read that day.
const BLS_CHECKED = '2026-09-23';

const STATE_NAMES = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', DC: 'the District of Columbia',
  FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois',
  IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana',
  ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota',
  MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada',
  NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York',
  NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon',
  PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota',
  TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia',
  WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming'
};
const STATES_50 = Object.keys(STATE_NAMES).filter((s) => s !== 'DC');

// ─── formatting helpers (hand-rolled so the output never depends on ICU) ────

/** @param {number} v @param {number} dp */
function round(v, dp) {
  const f = Math.pow(10, dp);
  return Math.round(v * f) / f;
}
/** @param {number} v @param {number} [dp] */
function commas(v, dp = 0) {
  const s = round(v, dp).toFixed(dp);
  const [int, frac] = s.split('.');
  const withCommas = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return frac ? withCommas + '.' + frac : withCommas;
}
const pct = (v, dp = 1) => commas(v, dp) + ' percent';
const usd = (v) => '$' + commas(v, 0);
/** @param {string[]} names */
function joinNames(names) {
  if (names.length === 1) return names[0];
  if (names.length === 2) return names[0] + ' and ' + names[1];
  return names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1];
}
/** @param {number} n 1-based rank */
function ordinal(n) {
  const words = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];
  if (words[n]) return words[n];
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
/** a median that handles even counts @param {number[]} xs */
function median(xs) {
  const s = xs.slice().sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
/** Title Case a CMS all-caps name, keeping short joiners low. @param {string} s */
function titleCase(s) {
  const small = new Set(['of', 'and', 'the', 'at', 'for', 'in']);
  return s.toLowerCase().split(' ').map((w, i) => (i > 0 && small.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1))).join(' ');
}

// ─── the sayings ─────────────────────────────────────────────────────────────
//
// David, 2026-09-24: "the questions lack variety or different sayings". Every template now has
// two or three ways to ask it, and a question's id picks one (a hash, so the bank stays
// deterministic). The first saying is always the original.

/** FNV-1a, 32 bits: the same id always picks the same saying @param {string} str */
function hash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h >>> 0;
}
/** @template T @param {string} id @param {T[]} list @returns {T} */
function pickSaying(id, list) { return list[hash(id) % list.length]; }

// ─── the question record, keys always in the same order ─────────────────────

/**
 * @param {{id:string,cat:string,q:string,a:number,unit:string,pre?:string,suf?:string,dp:number,
 *          src:string,url?:string,year:number,checked:string,why:string,st?:string,k?:string,f?:string,more?:boolean}} o
 */
function Q(o) {
  const rec = {
    id: o.id, cat: o.cat, q: o.q, a: round(o.a, o.dp), unit: o.unit,
    pre: o.pre || '', suf: o.suf || '', dp: o.dp, src: o.src
  };
  if (o.url) rec.url = o.url;
  rec.year = o.year;
  rec.checked = o.checked;
  rec.why = o.why;
  if (o.st) rec.st = o.st;          // the one state the question is about
  if (o.k) rec.k = o.k;             // its template, shared by the same question about other states
  if (o.f) rec.f = o.f;             // its form when it is not the plain number: 'in' (one in N), 'hr' (per hour), 'rank'
  if (o.more) rec.more = 1;         // dealt only in a state game
  return rec;
}

// ─── 1. curated national set ─────────────────────────────────────────────────

function curatedQuestions() {
  const cur = readJson(CURATED);
  return cur.questions.map((c) => Q({
    id: c.id, cat: c.cat, q: c.q, a: c.a, unit: c.unit, pre: c.pre, suf: c.suf, dp: c.dp,
    src: c.src, url: c.url, year: c.year, checked: c.checked, why: c.why
  }));
}

// ─── 2. state metrics from the Population Health Map data ───────────────────

const FAMILIES = {
  places: {
    src: (it) => 'CDC PLACES, ' + ((it.source.match(/(\d{4}) release/) || [])[1] || '') + ' release (county estimates rolled up to the state by population)',
    fmt: (v) => pct(v), unit: 'percent', pre: '', suf: '%', dp: 1
  },
  chr: {
    src: (it, y) => 'County Health Rankings and Roadmaps, ' + y + ' release',
    fmt: (v) => pct(v), unit: 'percent', pre: '', suf: '%', dp: 1
  },
  acs: {
    src: (it, y) => 'U.S. Census Bureau, American Community Survey 5-year estimates, ' + (y - 4) + ' to ' + y,
    fmt: (v) => pct(v), unit: 'percent', pre: '', suf: '%', dp: 1
  },
  sahie: {
    src: () => 'U.S. Census Bureau, Small Area Health Insurance Estimates (SAHIE)',
    fmt: (v) => pct(v), unit: 'percent', pre: '', suf: '%', dp: 1
  },
  saipe: {
    src: () => 'U.S. Census Bureau, Small Area Income and Poverty Estimates (SAIPE)',
    fmt: (v) => '$' + commas(v) + 'k', unit: 'thousand dollars', pre: '$', suf: 'k', dp: 0
  },
  laus: {
    src: (it, y) => 'BLS, Local Area Unemployment Statistics, ' + y + ' annual averages (counties rolled up to the state)',
    fmt: (v) => pct(v), unit: 'percent', pre: '', suf: '%', dp: 1
  }
};

// Per metric: the stable metricsConfig id, the family, the category, the states
// asked about, and the question. `q(S, y)` gets the state name and data year.
// Anything a family sets (unit, fmt, dp) a metric can override.
const STATE_METRICS = [
  { id: 'patient/fair-poor-health', slug: 'fair-poor-health', fam: 'places', cat: 'Health', states: ['WV', 'CA', 'UT'],
    q: (S, y) => `What percent of adults in ${S} rated their own health as fair or poor in ${y}?` },
  { id: 'patient/diabetes', slug: 'diabetes', fam: 'places', cat: 'Health', states: ['WV', 'TX', 'CO', 'UT'],
    q: (S, y) => `What percent of adults in ${S} had diagnosed diabetes in ${y}?` },
  { id: 'patient/coronary-heart-disease', slug: 'heart-disease', fam: 'places', cat: 'Health', states: ['KY', 'UT'],
    q: (S, y) => `What percent of adults in ${S} reported coronary heart disease, angina or a past heart attack in ${y}?` },
  { id: 'patient/obesity', slug: 'obesity', fam: 'places', cat: 'Health', states: ['WV', 'CO', 'TX', 'UT'],
    q: (S, y) => `What percent of adults in ${S} had obesity (BMI 30 or higher, from self-reported height and weight) in ${y}?` },
  { id: 'patient/routine-checkup', slug: 'checkup', fam: 'places', cat: 'Health', states: ['RI', 'AK', 'UT'],
    q: (S, y) => `What percent of adults in ${S} had a routine checkup within the past year, as of ${y}?` },
  { id: 'patient/current-smoking', slug: 'smoking', fam: 'places', cat: 'Health', states: ['WV', 'TN', 'CA', 'UT'],
    q: (S, y) => `What percent of adults in ${S} currently smoked cigarettes in ${y}?` },
  { id: 'patient/copd', slug: 'copd', fam: 'places', cat: 'Health', states: ['WV', 'CA', 'UT'],
    q: (S, y) => `What percent of adults in ${S} had diagnosed COPD in ${y}?` },
  { id: 'patient/asthma', slug: 'asthma', fam: 'places', cat: 'Health', states: ['ME', 'UT'],
    q: (S, y) => `What percent of adults in ${S} had current asthma in ${y}?` },
  { id: 'patient/high-blood-pressure', slug: 'high-bp', fam: 'places', cat: 'Health', states: ['MS', 'CO', 'UT'],
    q: (S, y) => `What percent of adults in ${S} had diagnosed high blood pressure in ${y}?` },
  { id: 'patient/depression', slug: 'depression', fam: 'places', cat: 'Health', states: ['WV', 'NJ', 'FL', 'UT'],
    q: (S, y) => `What percent of adults in ${S} had ever been diagnosed with depression, as of ${y}?` },
  { id: 'patient/premature-death', slug: 'ypll', fam: 'chr', cat: 'Health', states: ['MS', 'MA', 'UT'],
    unit: 'years per 100k', suf: '', dp: 0, fmt: (v) => commas(v),
    q: (S, y) => `In the County Health Rankings ${y} release, how many years of life were lost before age 75 per 100,000 people in ${S}?` },
  { id: 'patient/low-birthweight', slug: 'low-birthweight', fam: 'chr', cat: 'Health', states: ['MS', 'AK', 'UT'],
    q: (S, y) => `What percent of babies born in ${S} weighed under 2,500 grams, per the County Health Rankings ${y} release?` },
  { id: 'patient/median-age', slug: 'median-age', fam: 'acs', cat: 'Health', states: ['ME', 'FL', 'UT'],
    unit: 'years', suf: ' yrs', fmt: (v) => commas(v, 1) + ' years',
    q: (S, y) => `What was the median age of people living in ${S}, per the Census ${y - 4} to ${y} estimates, in years?` },
  { id: 'baseline/pop-65-plus', slug: 'age-65-plus', fam: 'acs', cat: 'Coverage', states: ['ME', 'FL', 'UT'],
    q: (S, y) => `What percent of people in ${S} were 65 or older, the age of Medicare eligibility, per the Census ${y - 4} to ${y} estimates?` },
  { id: 'payer/uninsured', slug: 'uninsured', fam: 'sahie', cat: 'Coverage', states: ['TX', 'OK', 'FL', 'CA', 'MA', 'UT'],
    q: (S, y) => `What percent of people under 65 in ${S} had no health insurance in ${y}?` },
  { id: 'economics/median-household-income', slug: 'income', fam: 'saipe', cat: 'Money', states: ['MS', 'MA', 'CA', 'TX', 'NY', 'UT'],
    q: (S, y) => `What was the median household income in ${S} in ${y}, in thousands of dollars?` },
  { id: 'economics/unemployment', slug: 'unemployment', fam: 'laus', cat: 'Workforce', states: ['SD', 'CA', 'UT'],
    q: (S, y) => `What was the average unemployment rate in ${S} in ${y}, as a percent?` }
];

// More ways to ask each state metric (the metric's own q is saying one). Keyed by slug.
/** @type {Record<string, ((S:string, y:number) => string)[]>} */
const SAYINGS = {
  'fair-poor-health': [(S, y) => `Asked to rate their own health, what percent of adults in ${S} said fair or poor in ${y}?`,
    (S, y) => `Out of every 100 adults in ${S}, how many called their own health fair or poor in ${y}?`],
  diabetes: [(S, y) => `Out of every 100 adults in ${S}, how many had been told by a doctor that they have diabetes, as of ${y}?`],
  'heart-disease': [(S, y) => `Out of every 100 adults in ${S}, how many reported coronary heart disease, angina or a past heart attack in ${y}?`],
  obesity: [(S, y) => `What share of adults in ${S} had a BMI of 30 or more in ${y}, going by the height and weight they reported, as a percent?`],
  checkup: [(S, y) => `What percent of adults in ${S} had been in for a routine checkup in the past year, as of ${y}?`,
    (S, y) => `Out of every 100 adults in ${S}, how many had a routine checkup within the year, as of ${y}?`],
  smoking: [(S, y) => `Out of every 100 adults in ${S}, how many were current cigarette smokers in ${y}?`],
  copd: [(S, y) => `Out of every 100 adults in ${S}, how many had been told they have COPD, emphysema or chronic bronchitis, as of ${y}?`],
  asthma: [(S, y) => `Out of every 100 adults in ${S}, how many were living with asthma in ${y}?`],
  'high-bp': [(S, y) => `Out of every 100 adults in ${S}, how many had been told they have high blood pressure, as of ${y}?`,
    (S, y) => `What share of adults in ${S} had diagnosed high blood pressure in ${y}, as a percent?`],
  depression: [(S, y) => `Out of every 100 adults in ${S}, how many had ever been told they have a depressive disorder, as of ${y}?`],
  ypll: [(S, y) => `Per 100,000 people in ${S}, how many years of life were lost to deaths before age 75, per the County Health Rankings ${y} release?`],
  'low-birthweight': [(S, y) => `Out of every 100 babies born in ${S}, how many weighed under 2,500 grams (about 5.5 pounds), per the County Health Rankings ${y} release?`],
  'median-age': [(S, y) => `Half the people in ${S} are older than what age, per the Census ${y - 4} to ${y} estimates, in years?`],
  'age-65-plus': [(S, y) => `Out of every 100 people in ${S}, how many were 65 or older, old enough for Medicare, per the Census ${y - 4} to ${y} estimates?`],
  uninsured: [(S, y) => `Out of every 100 people under 65 in ${S}, how many had no health insurance in ${y}?`,
    (S, y) => `What share of people under 65 in ${S} went without health insurance in ${y}, as a percent?`],
  income: [(S, y) => `Half the households in ${S} earned more than what amount in ${y}, in thousands of dollars?`,
    (S, y) => `What did a typical (median) household in ${S} earn in ${y}, in thousands of dollars?`],
  unemployment: [(S, y) => `Out of every 100 people in the labor force in ${S}, how many were out of work, on average, in ${y}?`]
};
// ONE IN HOW MANY: the same percent read as people, "about one in 7". Only where it reads naturally and the
// share sits between 3 and 50 percent (one in 2 is not a guess, one in 40 is a rounding game).
/** @type {Record<string, (S:string, y:number) => string>} */
const ONE_IN = {
  'fair-poor-health': (S, y) => `About one in how many adults in ${S} rated their own health as fair or poor in ${y}?`,
  diabetes: (S, y) => `About one in how many adults in ${S} had diagnosed diabetes in ${y}?`,
  'heart-disease': (S, y) => `About one in how many adults in ${S} reported coronary heart disease, angina or a past heart attack in ${y}?`,
  obesity: (S, y) => `About one in how many adults in ${S} had obesity (a BMI of 30 or more, self-reported) in ${y}?`,
  smoking: (S, y) => `About one in how many adults in ${S} smoked cigarettes in ${y}?`,
  copd: (S, y) => `About one in how many adults in ${S} had diagnosed COPD in ${y}?`,
  asthma: (S, y) => `About one in how many adults in ${S} had current asthma in ${y}?`,
  'high-bp': (S, y) => `About one in how many adults in ${S} had diagnosed high blood pressure in ${y}?`,
  depression: (S, y) => `About one in how many adults in ${S} had ever been diagnosed with depression, as of ${y}?`,
  uninsured: (S, y) => `About one in how many people under 65 in ${S} had no health insurance in ${y}?`,
  'age-65-plus': (S, y) => `About one in how many people in ${S} was 65 or older, per the Census ${y - 4} to ${y} estimates?`
};
// RANK: where a state places among all of them. top: which end is #1. Answers print as #7.
/** @type {Record<string, {top:'highest'|'lowest', q:(S:string, y:number, n:string) => string}>} */
const RANKS = {
  obesity: { top: 'highest', q: (S, y, n) => `Rank the ${n} by adult obesity in ${y}, highest first. What place is ${S}?` },
  smoking: { top: 'highest', q: (S, y, n) => `Line up the ${n} by adult smoking rate in ${y}, highest first. Where does ${S} land?` },
  uninsured: { top: 'highest', q: (S, y, n) => `Rank the ${n} by the share of people under 65 with no health insurance in ${y}, highest first. What place is ${S}?` },
  income: { top: 'highest', q: (S, y, n) => `Rank the ${n} by median household income in ${y}, richest first. What place is ${S}?` },
  'age-65-plus': { top: 'highest', q: (S, y, n) => `Rank the ${n} by the share of people 65 or older, oldest first (Census ${y - 4} to ${y}). What place is ${S}?` },
  'high-bp': { top: 'highest', q: (S, y, n) => `Rank the ${n} by adults with diagnosed high blood pressure in ${y}, highest first. What place is ${S}?` }
};
/** "the 50 states and DC", or "the 49 states and DC with data" @param {number} n @param {boolean} dc */
function field(n, dc) { return dc ? (n === 51 ? 'fifty states and DC' : (n - 1) + ' states and DC with data') : (n === 50 ? 'fifty states' : n + ' states with data'); }
/** 1-based place of st among the values, from the top end (ties share the better place) @param {Record<string, number|null>} vals @param {string} st @param {'highest'|'lowest'} top @param {string[]} among */
function placeOf(vals, st, top, among) {
  const v = Number(vals[st]);
  return 1 + among.filter((x) => typeof vals[x] === 'number' && (top === 'highest' ? Number(vals[x]) > v : Number(vals[x]) < v)).length;
}

/**
 * One plain sentence placing a state against the other states.
 * @param {Record<string, number|null>} vals @param {string} st @param {(v:number)=>string} show
 */
function rangeWhy(vals, st, show) {
  const have = STATES_50.filter((s) => typeof vals[s] === 'number');
  /** @param {string} s */
  const val = (s) => Number(vals[s]);
  const lo = Math.min(...have.map(val));
  const hi = Math.max(...have.map(val));
  /** @param {number} v */
  const at = (v) => have.filter((s) => val(s) === v).map((s) => STATE_NAMES[s]).sort();
  const loN = at(lo), hiN = at(hi);
  const scope = have.length === 50 ? 'No state' : 'No state with data';
  const v = vals[st];
  const verb = (list) => (list.length > 1 ? 'were' : 'was');
  if (v === hi && hiN.length === 1) return `${scope} was higher; ${joinNames(loN)} ${verb(loN)} lowest at ${show(lo)}.`;
  if (v === lo && loN.length === 1) return `${scope} was lower; ${joinNames(hiN)} ${verb(hiN)} highest at ${show(hi)}.`;
  if (v === hi) return `${joinNames(hiN)} tied for the highest; ${joinNames(loN)} ${verb(loN)} lowest at ${show(lo)}.`;
  if (v === lo) return `${joinNames(loN)} tied for the lowest; ${joinNames(hiN)} ${verb(hiN)} highest at ${show(hi)}.`;
  return `Across the states the range ran from ${show(lo)} in ${joinNames(loN)} to ${show(hi)} in ${joinNames(hiN)}.`;
}

function stateQuestions(cfg, stateData, years) {
  const out = [];
  for (const m of STATE_METRICS) {
    const { lens, index } = metricIndexById(cfg, m.id);
    const item = cfg[lens].items[Number(index)];
    const fam = FAMILIES[m.fam];
    const vals = stateData[lens][index];
    const y = Number(years[lens][index]);
    if (!/^2026/.test(String(item.retrievedDate))) throw new Error(`[vital-stats] ${m.id} is not a pipeline metric (retrievedDate ${item.retrievedDate})`);
    const show = m.fmt || fam.fmt;
    for (const st of Object.keys(STATE_NAMES)) {
      const v = vals[st];
      const core = m.states.includes(st);
      if (typeof v !== 'number' || !Number.isFinite(v)) {
        if (core) throw new Error(`[vital-stats] ${m.id} has no value for ${st}`);
        continue;   // the source has no estimate for this state (PLACES skips a few)
      }
      const id = m.slug + '-' + st.toLowerCase();
      const common = { cat: m.cat, src: fam.src(item, y), url: item.sourceUrl, year: y, checked: String(item.retrievedDate), st, k: m.slug };
      out.push(Q(Object.assign({}, common, {
        id, q: pickSaying(id, [m.q].concat(SAYINGS[m.slug] || []))(STATE_NAMES[st], y),
        a: v, unit: m.unit || fam.unit, pre: m.pre ?? fam.pre, suf: m.suf ?? fam.suf, dp: m.dp ?? fam.dp,
        why: rangeWhy(vals, st, show), more: !core
      })));
      // the same number as people: about one in N. The first core state gets it in the everyday mix.
      if (ONE_IN[m.slug] && v >= 3 && v <= 50) {
        const n = Math.round(100 / v);
        out.push(Q(Object.assign({}, common, {
          id: m.slug + '-1in-' + st.toLowerCase(), q: ONE_IN[m.slug](STATE_NAMES[st], y),
          a: n, unit: 'people', pre: '1 in ', suf: '', dp: 0, f: 'in',
          why: `That is ${pct(v)}. ${rangeWhy(vals, st, show)}`, more: st !== m.states[0]
        })));
      }
      // where the state places. The last core state gets it in the everyday mix.
      if (RANKS[m.slug]) {
        const R = RANKS[m.slug];
        const among = Object.keys(STATE_NAMES).filter((x) => typeof vals[x] === 'number');
        const place = placeOf(vals, st, R.top, among);
        const first = among.slice().sort((a, b) => (R.top === 'highest' ? Number(vals[b]) - Number(vals[a]) : Number(vals[a]) - Number(vals[b])) || a.localeCompare(b))[0];
        out.push(Q(Object.assign({}, common, {
          id: 'rank-' + m.slug + '-' + st.toLowerCase(), q: R.q(STATE_NAMES[st], y, field(among.length, among.includes('DC'))),
          a: place, unit: 'place', pre: '#', suf: '', dp: 0, f: 'rank',
          why: place === 1 ? `${STATE_NAMES[st]} was first at ${show(v)}.` : `${STATE_NAMES[st]} was at ${show(v)}; ${STATE_NAMES[first]} was first at ${show(Number(vals[first]))}.`,
          more: st !== m.states[m.states.length - 1]
        })));
      }
    }
  }
  return out;
}

// ─── 3. county uninsured (SAHIE county grain) ────────────────────────────────

function countyNames() {
  const dir = path.join(ASSETS, 'geo', 'counties');
  /** @type {Record<string,string>} */
  const names = {};
  for (const f of fs.readdirSync(dir).sort()) {
    const txt = fs.readFileSync(path.join(dir, f), 'utf8');
    for (const m of txt.matchAll(/"fips":"(\d{5})","name":"([^"]+)"/g)) names[m[1]] = m[2];
  }
  return names;
}

function countyQuestions(cfg, stateData, countyData, years) {
  const { lens, index } = metricIndexById(cfg, 'payer/uninsured');
  const item = cfg[lens].items[Number(index)];
  const vals = countyData[lens][index];
  const y = Number(years[lens][index]);
  const pop = readJson(path.join(ASSETS, 'us-counties.json'));
  const names = countyNames();
  const rows = Object.entries(vals).filter(([, v]) => typeof v === 'number');
  const big = rows.filter(([f]) => pop[f] && pop[f].p > 1000000);
  const maxOf = (rs) => rs.reduce((a, b) => (b[1] > a[1] ? b : a));
  const minOf = (rs) => rs.reduce((a, b) => (b[1] < a[1] ? b : a));
  /** checks a claim in a why line still holds before it ships */
  const must = (ok, msg) => { if (!ok) throw new Error('[vital-stats] county claim no longer true: ' + msg); };

  const picks = [
    { fips: '48165', why: () => { must(maxOf(rows)[0] === '48165', 'Gaines is the max'); return `No U.S. county had a higher estimate in ${y}.`; } },
    /* checked 2026-09-24, Young Center for Anabaptist and Pietist Studies (Elizabethtown College), Amish Population
       Profile 2025: the Holmes County settlement is second only to Lancaster County */
    { fips: '39075', why: () => 'Holmes County is the center of the second-largest Amish settlement in the world.' },
    { fips: '48113', why: () => { must(maxOf(big)[0] === '48113', 'Dallas is the max over 1M'); return 'No county of more than a million people had a higher estimate.'; } },
    { fips: '25017', why: () => { must(minOf(big)[0] === '25017', 'Middlesex is the min over 1M'); return 'No county of more than a million people had a lower estimate.'; } },
    { fips: '49035', why: () => `Utah's statewide rate was ${pct(stateData[lens][index].UT)}.` },
    { fips: '49049', why: () => `Salt Lake County, just to the north, was at ${pct(vals['49035'])}.` }
  ];
  /** @param {string} fips @param {string} st @param {() => string} why @param {boolean} more */
  const ask = (fips, st, why, more) => Q({
    id: 'uninsured-county-' + fips, cat: 'Coverage',
    q: `What percent of people under 65 in ${countyLabel(fips, names[fips], st)}, ${STATE_NAMES[st]}, had no health insurance in ${y}?`,
    a: vals[fips], unit: 'percent', pre: '', suf: '%', dp: 1,
    src: 'U.S. Census Bureau, Small Area Health Insurance Estimates (SAHIE), county estimates',
    url: item.sourceUrl, year: y, checked: String(item.retrievedDate), why: why(), st, k: 'uninsured-county', more
  });
  const out = picks.map((p) => {
    const st = Object.keys(STATE_NAMES).find((s) => stateFips(s) === p.fips.slice(0, 2));
    if (!names[p.fips] || !st) throw new Error('[vital-stats] no county name for ' + p.fips);
    return ask(p.fips, st, p.why, false);
  });
  // a state game also asks about each state's most populous county. Not DC (it is its own county) and not
  // Connecticut (its counties became planning regions in the Census files, with no county name to ask by).
  const picked = new Set(picks.map((p) => p.fips));
  for (const st of STATES_50) {
    if (st === 'CT') continue;
    const fp = stateFips(st);
    const top = Object.keys(pop).filter((f) => f.slice(0, 2) === fp && pop[f].p && typeof vals[f] === 'number')
      .sort((a, b) => pop[b].p - pop[a].p || a.localeCompare(b))[0];
    if (!top || picked.has(top) || !names[top]) continue;
    out.push(ask(top, st, () => `${STATE_NAMES[st]}'s statewide rate was ${pct(stateData[lens][index][st])}.`, true));
  }
  return out;
}

/** how a county reads in a sentence: Louisiana has parishes, Anchorage is a municipality, Kings is Brooklyn
 * @param {string} fips @param {string} name @param {string} st */
function countyLabel(fips, name, st) {
  if (fips === '02020') return 'the Municipality of Anchorage';
  if (fips === '36047') return 'Kings County (Brooklyn)';
  if (st === 'LA') return name + ' Parish';
  return name + ' County';
}

/** @param {string} st */
function stateFips(st) {
  const F = { AL: '01', AK: '02', AZ: '04', AR: '05', CA: '06', CO: '08', CT: '09', DE: '10', DC: '11', FL: '12', GA: '13', HI: '15', ID: '16', IL: '17', IN: '18', IA: '19', KS: '20', KY: '21', LA: '22', ME: '23', MD: '24', MA: '25', MI: '26', MN: '27', MS: '28', MO: '29', MT: '30', NE: '31', NV: '32', NH: '33', NJ: '34', NM: '35', NY: '36', NC: '37', ND: '38', OH: '39', OK: '40', OR: '41', PA: '42', RI: '44', SC: '45', SD: '46', TN: '47', TX: '48', UT: '49', VT: '50', VA: '51', WA: '53', WV: '54', WI: '55', WY: '56' };
  return F[st];
}

// ─── 4. BLS pay, growth and openings (career-tree-bls.json) ──────────────────

// soc -> [id slug, how the job reads inside a sentence]
const OCC = {
  '29-1141': ['rn', 'registered nurses'],
  '29-1171': ['aprn', 'nurse anesthetists, nurse midwives and nurse practitioners (one BLS group)'],
  '29-2061': ['lpn', 'licensed practical and vocational nurses'],
  '31-1131': ['cna', 'nursing assistants and orderlies'],
  '29-1071': ['pa', 'physician assistants'],
  '29-1210': ['physician', 'physicians and surgeons'],
  '29-1126': ['rt', 'respiratory therapists'],
  '29-2034': ['radtech', 'radiologic technologists'],
  '29-2032': ['sonographer', 'diagnostic medical sonographers'],
  '29-2072': ['med-records', 'medical records specialists'],
  '31-9097': ['phlebotomist', 'phlebotomists'],
  '31-9092': ['med-assistant', 'medical assistants'],
  '29-1123': ['pt', 'physical therapists'],
  '31-2021': ['pta', 'physical therapist assistants'],
  '29-1127': ['slp', 'speech-language pathologists'],
  '29-2042': ['emt', 'emergency medical technicians'],
  '29-2043': ['paramedic', 'paramedics'],
  '29-1051': ['pharmacist', 'pharmacists'],
  '31-1121': ['home-health-aide', 'home health and personal care aides'],
  '11-9111': ['health-manager', 'medical and health services managers'],
  '29-1292': ['hygienist', 'dental hygienists'],
  '29-1021': ['dentist', 'dentists'],
  '29-2055': ['surg-tech', 'surgical technologists'],
  '19-1041': ['epidemiologist', 'epidemiologists'],
  '29-1181': ['audiologist', 'audiologists']
};
const ASK = {
  pay: ['29-1141', '29-1171', '29-2061', '31-1131', '29-1071', '29-1210', '29-1126', '29-2034', '29-2032', '29-2072',
    '31-9097', '31-9092', '29-1123', '29-1127', '29-2042', '29-2043', '29-1051', '31-1121', '11-9111', '29-1292',
    '29-1021', '29-2055'],
  growth: ['29-1171', '11-9111', '31-2021', '29-1071', '19-1041', '31-1121', '29-1126', '29-1141', '29-1210', '29-2061'],
  openings: ['31-1121', '31-1131', '29-1141', '31-9092', '11-9111', '29-1210', '29-1126', '29-1181'],
  high: ['29-1210', '29-1141', '29-1126'],
  low: ['29-1126', '29-1210']
};

function blsQuestions() {
  const bls = readJson(path.join(ASSETS, 'career-tree-bls.json'));
  const wageYear = Number((String(bls.wageYear).match(/\d{4}/) || [])[0]);
  const wageLabel = 'May ' + wageYear;
  const span = String(bls.projYears).match(/(\d{4})\D+(\d{2,4})/);
  if (!wageYear || !span) throw new Error('[vital-stats] could not read wageYear/projYears from career-tree-bls.json');
  const p0 = Number(span[1]);
  const p1 = span[2].length === 2 ? Number(String(p0).slice(0, 2) + span[2]) : Number(span[2]);
  const projLabel = p0 + ' to ' + p1;
  const asked = (soc, kind) => ASK[kind].includes(soc);

  /** the context line: first fact about this job that is not itself a question */
  function why(soc, kind) {
    const o = bls.occupations[soc];
    const rangeAsked = asked(soc, 'high') || asked(soc, 'low');
    /** @type {Record<string, string|null>} */
    const facts = {
      range: !rangeAsked && o.low && o.high ? `The lowest-paid 10 percent earned under ${usd(o.low)} and the top 10 percent over ${usd(o.high)}.` : null,
      pay: o.pay ? `The median pay was ${usd(o.pay)} in ${wageLabel}.` : null,
      growth: typeof o.growth === 'number' ? `BLS projects ${o.growth} percent job growth from ${projLabel}.` : null,
      openings: o.openings ? `BLS projects about ${commas(o.openings)} openings a year over the decade.` : null
    };
    // the closest related fact first, and never one that another question asks
    const order = {
      pay: ['range', 'growth', 'openings'],
      growth: ['openings', 'pay', 'range'],
      openings: ['growth', 'pay', 'range'],
      high: ['pay', 'growth', 'openings'],
      low: ['pay', 'growth', 'openings']
    }[kind];
    for (const k of order) {
      if (!facts[k]) continue;
      if (k !== 'range' && asked(soc, k)) continue;
      return facts[k];
    }
    if ((kind === 'high' || kind === 'low') && o.note) return o.note;
    return {
      pay: 'Half of them earned more than this and half earned less.',
      growth: 'The projection is for the change in the number of jobs over ten years.',
      openings: 'Openings count new jobs plus the ones people leave behind.',
      high: 'This is the 90th percentile of pay for the job.',
      low: 'This is the 10th percentile of pay for the job.'
    }[kind];
  }

  const out = [];
  const src = { pay: 'BLS, Occupational Outlook Handbook (' + wageLabel + ' wages)', proj: 'BLS, Employment Projections ' + projLabel + ', via the Occupational Outlook Handbook' };
  const base = (soc) => {
    const o = bls.occupations[soc];
    if (!o || !OCC[soc]) throw new Error('[vital-stats] BLS occupation missing: ' + soc);
    return { o, slug: OCC[soc][0], job: OCC[soc][1] };
  };
  for (const soc of ASK.pay) {
    const { o, slug, job } = base(soc);
    out.push(Q({ id: 'pay-' + slug, cat: 'Workforce', q: pickSaying('pay-' + slug, [
        `What was the median annual pay for ${job} in the U.S. in ${wageLabel}, in dollars?`,
        `Half of U.S. ${job} earned more than what a year in ${wageLabel}, in dollars?`,
        `At the median, what did ${job} in the U.S. earn a year in ${wageLabel}, in dollars?`]),
      a: o.pay, unit: 'dollars', pre: '$', suf: '', dp: 0, src: src.pay, url: o.url, year: wageYear, checked: BLS_CHECKED, why: why(soc, 'pay') }));
  }
  for (const soc of ASK.growth) {
    const { o, slug, job } = base(soc);
    out.push(Q({ id: 'growth-' + slug, cat: 'Workforce', q: pickSaying('growth-' + slug, [
        `By what percent does BLS project U.S. employment of ${job} to grow from ${projLabel}?`,
        `BLS expects the number of jobs for ${job} in the U.S. to grow by what percent from ${projLabel}?`]),
      a: o.growth, unit: 'percent', pre: '', suf: '%', dp: 0, src: src.proj, url: o.url, year: p0, checked: BLS_CHECKED, why: why(soc, 'growth') }));
  }
  for (const soc of ASK.openings) {
    const { o, slug, job } = base(soc);
    out.push(Q({ id: 'openings-' + slug, cat: 'Workforce', q: pickSaying('openings-' + slug, [
        `On average, how many job openings a year does BLS project for ${job} in the U.S. from ${projLabel}?`,
        `How many openings for ${job} does BLS expect in the U.S. each year, on average, from ${projLabel}?`]),
      a: o.openings, unit: 'openings per year', pre: '', suf: '', dp: 0, src: src.proj, url: o.url, year: p0, checked: BLS_CHECKED, why: why(soc, 'openings') }));
  }
  for (const soc of ASK.high) {
    const { o, slug, job } = base(soc);
    out.push(Q({ id: 'pay-top10-' + slug, cat: 'Workforce', q: `In ${wageLabel}, the top-paid 10 percent of ${job} in the U.S. earned more than what amount a year, in dollars?`,
      a: o.high, unit: 'dollars', pre: '$', suf: '', dp: 0, src: src.pay, url: o.url, year: wageYear, checked: BLS_CHECKED, why: why(soc, 'high') }));
  }
  for (const soc of ASK.low) {
    const { o, slug, job } = base(soc);
    out.push(Q({ id: 'pay-bottom10-' + slug, cat: 'Workforce', q: `In ${wageLabel}, the lowest-paid 10 percent of ${job} in the U.S. earned less than what amount a year, in dollars?`,
      a: o.low, unit: 'dollars', pre: '$', suf: '', dp: 0, src: src.pay, url: o.url, year: wageYear, checked: BLS_CHECKED, why: why(soc, 'low') }));
  }
  return out;
}

// ─── 4b. pay by state (state-pay.json, BLS OEWS state estimates) ───────────
//
// Added 2026-09-24 for state games, which had one Workforce question a state. The file
// comes from scripts/pull/oews-states.js. OEWS codes are narrower than the Handbook's
// groups: 29-1171 is nurse practitioners alone, 31-1131 nursing assistants without orderlies.
const PAY_JOBS = {
  '29-1141': ['rn', 'registered nurses'],
  '29-1126': ['rt', 'respiratory therapists'],
  '29-2061': ['lpn', 'licensed practical and vocational nurses'],
  '29-1171': ['np', 'nurse practitioners'],
  '29-1071': ['pa', 'physician assistants'],
  '29-1051': ['pharmacist', 'pharmacists'],
  '29-2034': ['radtech', 'radiologic technologists and technicians'],
  '31-1131': ['cna', 'nursing assistants'],
  '31-9092': ['med-assistant', 'medical assistants'],
  '11-9111': ['health-manager', 'medical and health services managers']
};
/** the two that join the everyday mix; every other state and job is for state games */
const PAY_CORE = { '29-1141': ['CA'], '29-1126': ['UT'] };

function statePayQuestions() {
  const P = readJson(path.join(ASSETS, 'state-pay.json'));
  const out = [];
  for (const [soc, [slug, job]] of Object.entries(PAY_JOBS)) {
    const o = P.occupations[soc];
    if (!o) throw new Error('[vital-stats] state-pay.json has no ' + soc);
    for (const st of Object.keys(STATE_NAMES)) {
      const v = o.pay[st];
      const core = (PAY_CORE[soc] || []).includes(st);
      if (typeof v !== 'number') { if (core) throw new Error('[vital-stats] no ' + job + ' pay for ' + st); continue; }
      const S = STATE_NAMES[st], id = 'pay-' + slug + '-' + st.toLowerCase();
      const src = 'BLS, Occupational Employment and Wage Statistics, ' + P.period + ' state estimates';
      out.push(Q({
        id, cat: 'Workforce',
        q: pickSaying(id, [`What was the median annual pay for ${job} in ${S} in ${P.period}, in dollars?`,
          `Half of ${job} in ${S} earned more than what a year in ${P.period}, in dollars?`,
          `At the median, what did ${job} in ${S} earn a year in ${P.period}, in dollars?`]),
        a: v, unit: 'dollars', pre: '$', suf: '', dp: 0, src, url: P.url,
        year: P.year, checked: P.checked, why: rangeWhy(o.pay, st, usd), st, k: 'pay-' + slug, more: !core
      }));
      // per hour: BLS figures a full-time year at 2,080 hours, so the annual median is the hourly one times 2,080
      out.push(Q({
        id: 'pay-hr-' + slug + '-' + st.toLowerCase(), cat: 'Workforce',
        q: `What did the median ${JOB_ONE[soc]} in ${S} earn per hour in ${P.period}, in dollars?`,
        a: v / 2080, unit: 'dollars an hour', pre: '$', suf: '', dp: 2, f: 'hr',
        src: src + ' (the annual median divided by 2,080 hours, the full-time year BLS uses)', url: P.url,
        year: P.year, checked: P.checked, why: `That is ${usd(v)} a year over 2,080 hours.`, st, k: 'pay-' + slug, more: true
      }));
    }
  }
  // the spread between the best-paid and lowest-paid state, for four jobs, in the everyday mix
  for (const soc of ['29-1141', '29-1126', '29-1171', '31-1131']) {
    const [slug, job] = PAY_JOBS[soc];
    const pay = P.occupations[soc].pay;
    const sts = STATES_50.filter((x) => typeof pay[x] === 'number');
    const hi = sts.slice().sort((a, b) => pay[b] - pay[a] || a.localeCompare(b))[0];
    const lo = sts.slice().sort((a, b) => pay[a] - pay[b] || a.localeCompare(b))[0];
    out.push(Q({
      id: 'pay-gap-' + slug, cat: 'Workforce',
      q: `At the median, how many dollars a year separated the best-paid state for ${job} from the lowest-paid in ${P.period}?`,
      a: pay[hi] - pay[lo], unit: 'dollars', pre: '$', suf: '', dp: 0,
      src: 'BLS, Occupational Employment and Wage Statistics, ' + P.period + ' state estimates (the difference computed)', url: P.url,
      year: P.year, checked: P.checked, why: `${STATE_NAMES[hi]} paid ${usd(pay[hi])} and ${STATE_NAMES[lo]} ${usd(pay[lo])}.`
    }));
  }
  return out;
}
/** one worker, for "the median ___ in Utah" */
const JOB_ONE = {
  '29-1141': 'registered nurse', '29-1126': 'respiratory therapist', '29-2061': 'licensed practical or vocational nurse',
  '29-1171': 'nurse practitioner', '29-1071': 'physician assistant', '29-1051': 'pharmacist',
  '29-2034': 'radiologic technologist', '31-1131': 'nursing assistant', '31-9092': 'medical assistant',
  '11-9111': 'medical and health services manager'
};

// ─── 4c. how many states: one threshold across the map ────────────────────────
//
// Each is a count of the fifty states (not DC) at or over a line, from the same files the state
// questions read. The lines are chosen to land in the middle, not near 0 or 50.
function countQuestions(cfg, stateData, years) {
  const P = readJson(path.join(ASSETS, 'state-pay.json'));
  const out = [];
  /** @param {Record<string, number|null>} vals @param {number} line */
  const over = (vals, line) => STATES_50.filter((x) => typeof vals[x] === 'number' && Number(vals[x]) >= line);
  /** the states named when there are few, otherwise the extremes @param {string[]} list @param {Record<string, number|null>} vals @param {(v:number)=>string} show */
  const whyOf = (list, vals, show) => {
    if (list.length <= 4) return 'They were ' + joinNames(list.map((x) => STATE_NAMES[x]).sort()) + '.';
    const top = list.slice().sort((a, b) => Number(vals[b]) - Number(vals[a]) || a.localeCompare(b))[0];
    return `${STATE_NAMES[top]} was highest at ${show(Number(vals[top]))}.`;
  };
  const metric = (id) => { const { lens, index } = metricIndexById(cfg, id); return { item: cfg[lens].items[Number(index)], vals: stateData[lens][index], y: Number(years[lens][index]) }; };
  const places = (it, y) => 'CDC PLACES, ' + ((it.source.match(/(\d{4}) release/) || [])[1] || '') + ' release (county estimates rolled up to the state; the count computed)';
  const push = (o) => { if (!o.a) throw new Error('[vital-stats] ' + o.id + ' counts zero states'); out.push(Q(Object.assign({ unit: 'states', pre: '', suf: '', dp: 0 }, o))); };

  let m = metric('patient/obesity');
  let list = over(m.vals, 100 / 3);
  push({ id: 'count-obesity-third', cat: 'Health', q: `In how many of the fifty states did at least one in three adults have obesity in ${m.y}?`,
    a: list.length, src: places(m.item, m.y), url: m.item.sourceUrl, year: m.y, checked: String(m.item.retrievedDate), why: whyOf(list, m.vals, pct) });
  m = metric('patient/current-smoking'); list = over(m.vals, 15);
  push({ id: 'count-smoking-15', cat: 'Health', q: `In how many of the fifty states did 15 percent or more of adults smoke cigarettes in ${m.y}?`,
    a: list.length, src: places(m.item, m.y), url: m.item.sourceUrl, year: m.y, checked: String(m.item.retrievedDate), why: whyOf(list, m.vals, pct) });
  m = metric('patient/diabetes'); list = over(m.vals, 12.5);
  push({ id: 'count-diabetes-eighth', cat: 'Health', q: `In how many of the fifty states had at least one in eight adults been diagnosed with diabetes, as of ${m.y}?`,
    a: list.length, src: places(m.item, m.y), url: m.item.sourceUrl, year: m.y, checked: String(m.item.retrievedDate), why: whyOf(list, m.vals, pct) });
  m = metric('payer/uninsured'); list = over(m.vals, 10);
  push({ id: 'count-uninsured-10', cat: 'Coverage', q: `In how many of the fifty states did 10 percent or more of people under 65 have no health insurance in ${m.y}?`,
    a: list.length, src: 'U.S. Census Bureau, Small Area Health Insurance Estimates (SAHIE) (the count computed)', url: m.item.sourceUrl, year: m.y,
    checked: String(m.item.retrievedDate), why: whyOf(list, m.vals, pct) });
  m = metric('baseline/pop-65-plus'); list = over(m.vals, 20);
  push({ id: 'count-65-plus-fifth', cat: 'Coverage', q: `In how many of the fifty states was at least one person in five 65 or older, per the Census ${m.y - 4} to ${m.y} estimates?`,
    a: list.length, src: 'U.S. Census Bureau, American Community Survey 5-year estimates (the count computed)', url: m.item.sourceUrl, year: m.y,
    checked: String(m.item.retrievedDate), why: whyOf(list, m.vals, pct) });
  m = metric('economics/median-household-income'); list = over(m.vals, 80);
  push({ id: 'count-income-80k', cat: 'Money', q: `In how many of the fifty states was median household income $80,000 or more in ${m.y}?`,
    a: list.length, src: 'U.S. Census Bureau, Small Area Income and Poverty Estimates (SAIPE) (the count computed)', url: m.item.sourceUrl, year: m.y,
    checked: String(m.item.retrievedDate), why: whyOf(list, m.vals, (v) => '$' + commas(v) + 'k') });
  const payCount = (soc, line, id, words) => {
    const pay = P.occupations[soc].pay; const l = over(pay, line);
    push({ id, cat: 'Workforce', q: words, a: l.length,
      src: 'BLS, Occupational Employment and Wage Statistics, ' + P.period + ' state estimates (the count computed)', url: P.url,
      year: P.year, checked: P.checked, why: whyOf(l, pay, usd) });
  };
  payCount('29-1141', 100000, 'count-rn-100k', `In how many of the fifty states was the median pay for registered nurses $100,000 or more in ${P.period}?`);
  payCount('29-1126', 80000, 'count-rt-80k', `In how many of the fifty states did respiratory therapists earn a median of $80,000 or more in ${P.period}?`);
  return out;
}

// ─── 5. credential exams (career-tree-creds.json) ───────────────────────────

// key -> the question and a context line built from that credential's own record
const PASS = [
  { key: 'nclex-rn', q: (c) => `What percent of U.S.-educated, first-time NCLEX-RN takers passed in ${c.passYear}?`,
    why: () => '186,760 U.S.-educated candidates tested that year.' },
  { key: 'nclex-pn', q: (c) => `What percent of U.S.-educated, first-time NCLEX-PN takers passed in ${c.passYear}?`,
    why: () => 'It is the licensing exam for practical and vocational nurses.' },
  { key: 'nbrc-tmc', q: (c) => `What percent of first-time takers passed the NBRC Therapist Multiple-Choice exam at the lower (CRT) cut score in ${c.passYear}?`,
    why: () => 'The higher cut score, needed to sit for the clinical simulation exam, was cleared by 69.9 percent.' },
  { key: 'nbrc-accs', q: (c) => `What percent of new candidates passed the NBRC's adult critical care specialty exam (ACCS) in ${c.passYear}?`,
    why: () => 'The ACCS is a specialty credential for RRTs who work in adult critical care.' },
  { key: 'nccpa-pance', q: (c) => `What percent of first-time takers passed the PANCE, the physician assistant certification exam, in ${c.passYear}?`,
    why: () => 'NCCPA gives the exam; passing it is how a PA earns the PA-C.' },
  { key: 'naplex', q: (c) => `What percent of ${c.passYear} pharmacy graduates passed the NAPLEX on their first attempt?`,
    why: () => 'The rate for 2024 graduates was 75.9 percent.' },
  { key: 'aanp-fnp', q: (c) => `What percent of first-time takers passed the AANPCB family nurse practitioner exam in ${c.passYear}?`,
    why: () => 'DNP-prepared candidates passed at 88 percent.' },
  { key: 'ccrn', q: (c) => `What percent of first-time takers passed the adult CCRN critical care nursing exam in ${c.passYear}?`,
    why: () => '17,151 nurses sat for it that year.' },
  { key: 'nbcot-otr', q: (c) => `What percent of new occupational therapy graduates passed the NBCOT OTR exam on their first attempt in ${c.passYear}?`,
    why: () => 'Counting retakes, 92 percent of those graduates passed within a year of graduating.' },
  { key: 'bcba', q: (c) => `What percent of first-time takers passed the BCBA behavior analyst exam in ${c.passYear}?`,
    why: () => '9,955 candidates took it for the first time that year.' }
];
const FEES = [
  { key: 'nbcrna-nce', q: () => 'What does it cost to take the NCE, the national certification exam for nurse anesthetists, in dollars?' },
  { key: 'iblce-ibclc', q: () => 'What does the IBCLC lactation consultant exam cost a U.S. candidate, in dollars?' },
  { key: 'ccrn', q: () => 'What does the CCRN critical care nursing exam cost a nurse who is not an AACN member, in dollars?',
    why: () => 'AACN members pay $260.' },
  { key: 'amcb-cnm', q: () => 'What does the AMCB certification exam for nurse midwives cost, in dollars?',
    why: () => 'Repeat takers passed at 51 percent in 2024.' },
  { key: 'arrt-r', q: () => 'What does ARRT charge to apply for the radiography (R.T.(R)) exam, in dollars?' }
];

function credQuestions() {
  const creds = readJson(path.join(ASSETS, 'career-tree-creds.json'));
  const checked = String(creds.meta.updated);
  const out = [];
  for (const p of PASS) {
    const c = creds.credentials[p.key];
    if (!c || typeof c.pass !== 'number') throw new Error('[vital-stats] no pass rate for ' + p.key);
    out.push(Q({ id: 'pass-' + p.key, cat: 'Workforce', q: p.q(c), a: c.pass, unit: 'percent', pre: '', suf: '%',
      dp: Number.isInteger(c.pass) ? 0 : 1, src: `${c.org}, ${c.exam} pass-rate report`, url: c.url,
      year: Number(c.passYear), checked, why: p.why() }));
  }
  for (const f of FEES) {
    const c = creds.credentials[f.key];
    const m = String(c && c.fee).match(/\$([\d,]+)/);
    if (!m) throw new Error('[vital-stats] no fee for ' + f.key);
    const firstTime = `First-time candidates passed at ${commas(c.pass, Number.isInteger(c.pass) ? 0 : 1)} percent in ${c.passYear}.`;
    out.push(Q({ id: 'fee-' + f.key, cat: 'Money', q: f.q(), a: Number(m[1].replace(/,/g, '')), unit: 'dollars', pre: '$', suf: '', dp: 0,
      src: `${c.org} exam fee, from the site's credential data`, year: Number(checked.slice(0, 4)), checked,
      why: f.why ? f.why() : firstTime }));
  }
  return out;
}

// ─── 6. facility counts: hospitals, dialysis, ASCs ───────────────────────────

/** @param {any[]} arr @param {(x:any)=>string|null|undefined} key */
function tally(arr, key) {
  /** @type {Record<string, number>} */
  const m = {};
  for (const x of arr) { const k = key(x); if (k == null) continue; m[k] = (m[k] || 0) + 1; }
  return m;
}
/** 1-based rank of state st among the 50 states in a tally (ties share the better rank) */
function rankOf(counts, st) {
  const v = counts[st] || 0;
  return 1 + STATES_50.filter((s) => (counts[s] || 0) > v).length;
}
/** a plain sentence saying where a state's count stands */
function rankWhy(counts, st) {
  const n = (s) => counts[s] || 0;
  const v = n(st);
  const r = rankOf(counts, st);
  const ties = STATES_50.filter((s) => s !== st && n(s) === v).map((s) => STATE_NAMES[s]).sort();
  const above = STATES_50.filter((s) => n(s) > v).sort((a, b) => n(b) - n(a) || a.localeCompare(b));
  const below = STATES_50.filter((s) => n(s) < v).sort((a, b) => n(a) - n(b) || a.localeCompare(b));
  const has = (list) => (list.length > 1 ? 'have' : 'has');
  if (!above.length && !ties.length) {
    const next = STATES_50.filter((s) => s !== st).sort((a, b) => n(b) - n(a) || a.localeCompare(b))[0];
    return `No state has more; ${STATE_NAMES[next]} is next with ${commas(n(next))}.`;
  }
  if (!above.length) return `${STATE_NAMES[st]} and ${joinNames(ties)} are tied for the most of any state.`;
  if (!below.length) return ties.length ? `${STATE_NAMES[st]} and ${joinNames(ties)} are tied for the fewest of any state.` : 'No state has fewer.';
  if (above.length <= 3) return `Only ${joinNames(above.map((s) => STATE_NAMES[s]))} ${has(above)} more.`;
  if (below.length <= 3) return `Only ${joinNames(below.map((s) => STATE_NAMES[s]))} ${has(below)} fewer.`;
  if (ties.length) return `${STATE_NAMES[st]} is tied with ${joinNames(ties)} for ${ordinal(r)} among the states.`;
  return `That ranks ${ordinal(r)} among the states.`;
}

function facilityQuestions() {
  const H = readJson(path.join(ASSETS, 'us-hospitals.json')).hospitals;
  const D = readJson(path.join(ASSETS, 'us-dialysis.json')).facilities;
  const A = readJson(path.join(ASSETS, 'us-ascs.json')).facilities;
  const P = FACILITY_PULL;
  const hosp = {
    src: 'CMS Care Compare, Hospital General Information (counted from the site\'s ' + P.label + ' pull)',
    url: 'https://data.cms.gov/provider-data/dataset/xubh-q36u'
  };
  const onList = 'on CMS\'s Care Compare hospital list in ' + P.label;
  const out = [];
  const add = (o) => out.push(Q(Object.assign({ unit: 'hospitals', pre: '', suf: '', dp: 0, year: P.year, checked: P.checked }, hosp, o)));

  const byType = tally(H, (h) => h.t);
  const byOwn = tally(H, (h) => h.o);
  const rated = H.filter((h) => h.r != null);
  const noEr = H.filter((h) => h.e === 0);
  const noErPsych = noEr.filter((h) => h.t === 'psych').length;
  const psychNoEr = H.filter((h) => h.t === 'psych' && h.e === 0).length;
  const count = (f) => H.filter(f).length;

  add({ id: 'hosp-cms-total', cat: 'Hospitals', q: `How many hospitals were ${onList}?`, a: H.length,
    why: 'The list runs from academic medical centers to psychiatric, children\'s and VA hospitals.' });
  add({ id: 'hosp-cah', cat: 'Hospitals', q: `How many critical access hospitals were ${onList}?`, a: byType.cah,
    /* checked 2026-09-24, cms.gov Critical Access Hospitals: no more than 25 inpatient beds, paid 101 percent of reasonable cost */
    why: 'Critical access hospitals are small rural hospitals, 25 inpatient beds at most, that Medicare pays on a cost basis.' });
  add({ id: 'hosp-reh', cat: 'Hospitals', q: `How many rural emergency hospitals were ${onList}?`, a: byType.rural,
    /* checked 2026-09-24, cms.gov Rural Emergency Hospitals: set up by the Consolidated Appropriations Act, 2021, in effect
       January 1, 2023; no inpatient care, emergency and observation only */
    why: 'The designation began in 2023 for rural hospitals that keep an emergency department and stop inpatient care.' });
  add({ id: 'hosp-psych', cat: 'Hospitals', q: `How many psychiatric hospitals were ${onList}?`, a: byType.psych,
    why: `${commas(psychNoEr)} of them list no emergency services.` });
  const childBy = tally(H.filter((h) => h.t === 'child'), (h) => h.s);
  const childTop = STATES_50.slice().sort((a, b) => (childBy[b] || 0) - (childBy[a] || 0) || a.localeCompare(b))[0];
  add({ id: 'hosp-childrens', cat: 'Hospitals', q: `How many children's hospitals were ${onList}?`, a: byType.child,
    why: `${STATE_NAMES[childTop]} has the most, with ${childBy[childTop]}.` });
  add({ id: 'hosp-va', cat: 'Hospitals', q: `How many VA hospitals were ${onList}?`, a: byType.va,
    why: `The Veterans Health Administration runs them; military hospitals are a separate group of ${byType.dod} on the list.` });
  add({ id: 'hosp-five-star', cat: 'Hospitals', q: `How many hospitals ${onList} had a five-star overall rating?`,
    a: count((h) => h.r === 5),
    why: `${commas(rated.length)} hospitals on the list had a star rating at all.` });
  add({ id: 'hosp-no-er', cat: 'Hospitals', q: `How many hospitals ${onList} reported no emergency services?`, a: noEr.length,
    why: `Psychiatric hospitals make up ${commas(noErPsych)} of them.` });
  add({ id: 'hosp-for-profit', cat: 'Hospitals', q: `How many for-profit hospitals were ${onList}?`, a: byOwn.fp,
    why: `Nonprofits are the biggest group at ${commas(byOwn.np)}, and government hospitals number ${commas(byOwn.gov)}.` });

  // health systems, via the AHRQ Compendium crosswalk in the same file
  const bySys = tally(H, (h) => h.sys);
  const topSys = Object.keys(bySys).sort((a, b) => bySys[b] - bySys[a] || a.localeCompare(b))[0];
  if (topSys !== 'HCA Healthcare') throw new Error('[vital-stats] HCA is no longer the largest system in the file');
  const sysQ = 'Matching CMS\'s ' + P.label + ' hospital list to AHRQ\'s 2023 Compendium of U.S. Health Systems, how many hospitals belong to ';
  const sysSrc = 'CMS Care Compare hospital list joined to the AHRQ Compendium of U.S. Health Systems, 2023 (counted from the site\'s hospital file)';
  add({ id: 'hosp-system-hca', cat: 'Hospitals', q: sysQ + 'HCA Healthcare?', a: bySys['HCA Healthcare'], src: sysSrc,
    url: 'https://www.ahrq.gov/chsp/data-resources/compendium.html', year: 2023,
    why: 'No system on the list has more hospitals.' });
  const uhsPsych = count((h) => h.sys === 'Universal Health Services' && h.t === 'psych');
  add({ id: 'hosp-system-uhs', cat: 'Hospitals', q: sysQ + 'Universal Health Services?', a: bySys['Universal Health Services'], src: sysSrc,
    url: 'https://www.ahrq.gov/chsp/data-resources/compendium.html', year: 2023,
    why: `${commas(uhsPsych)} of them are psychiatric hospitals.` });

  // by state. A state with none of a kind gets no question about it (a zero is not a guess worth betting on).
  /** @param {string} slug @param {Record<string,number>} counts @param {string[]} core @param {(S:string, id:string)=>string} q
   *  @param {object} [extra] @param {Record<string,string>} [whyFor] */
  const perState = (slug, counts, core, q, extra, whyFor) => {
    for (const st of STATES_50) {
      const n = counts[st] || 0;
      const isCore = core.includes(st);
      if (!n) { if (isCore) throw new Error('[vital-stats] ' + slug + ' has none in ' + st); continue; }
      add(Object.assign({ id: slug + '-' + st.toLowerCase(), cat: 'Hospitals', q: q(STATE_NAMES[st], slug + '-' + st.toLowerCase()), a: n,
        why: (whyFor && whyFor[st]) || rankWhy(counts, st), st, k: slug, more: !isCore }, extra || {}));
    }
  };
  const byState = tally(H, (h) => h.s);
  perState('hosp-count', byState, ['TX', 'CA', 'KS', 'UT', 'RI'], (S, id) => pickSaying(id, [`How many hospitals in ${S} were ${onList}?`,
    `Count every hospital in ${S} on CMS's Care Compare list in ${P.label}. How many is that?`]));
  // the same count as a place among the fifty
  for (const st of STATES_50) {
    const place = placeOf(byState, st, 'highest', STATES_50);
    const top = STATES_50.slice().sort((a, b) => (byState[b] || 0) - (byState[a] || 0) || a.localeCompare(b))[0];
    add({ id: 'rank-hosp-count-' + st.toLowerCase(), cat: 'Hospitals', unit: 'place', pre: '#', f: 'rank', st, k: 'hosp-count', more: st !== 'UT',
      q: `Rank the fifty states by how many hospitals they have on CMS's Care Compare list (${P.label}), most first. What place is ${STATE_NAMES[st]}?`,
      a: place, why: place === 1 ? `${STATE_NAMES[st]} has ${commas(byState[st])}, the most.` : `${STATE_NAMES[st]} has ${commas(byState[st] || 0)}; ${STATE_NAMES[top]} has the most, ${commas(byState[top])}.` });
  }
  const cahBy = tally(H.filter((h) => h.t === 'cah'), (h) => h.s);
  perState('hosp-cah', cahBy, ['TX', 'KS', 'UT'], (S, id) => pickSaying(id, [`How many critical access hospitals in ${S} were ${onList}?`,
    `${S} had how many critical access hospitals on CMS's Care Compare list in ${P.label}?`]));
  const fpBy = tally(H.filter((h) => h.o === 'fp'), (h) => h.s);
  perState('hosp-for-profit', fpBy, ['TX', 'LA'], (S) => `How many for-profit hospitals in ${S} were ${onList}?`, {},
    { LA: `That is ${commas(fpBy.LA / byState.LA * 100, 0)} percent of the ${commas(byState.LA)} Louisiana hospitals on the list.` });
  const fiveBy = tally(H.filter((h) => h.r === 5), (h) => h.s);
  perState('hosp-five-star', fiveBy, ['UT'], (S) => `How many hospitals in ${S} ${onList} had a five-star overall rating?`);
  const psychBy = tally(H.filter((h) => h.t === 'psych'), (h) => h.s);
  perState('hosp-psych', psychBy, ['LA'], (S) => `How many psychiatric hospitals in ${S} were ${onList}?`);
  const rehBy = tally(H.filter((h) => h.t === 'rural'), (h) => h.s);
  perState('hosp-reh', rehBy, ['MS'], (S) => `How many rural emergency hospitals in ${S} were ${onList}?`);

  // dialysis
  const dial = {
    src: 'CMS, Dialysis Facility Listing by Facility (counted from the site\'s ' + P.label + ' pull)',
    url: 'https://data.cms.gov/provider-data/dataset/23ew-n7w9', unit: 'facilities'
  };
  const dBy = tally(D, (d) => d.s);
  const dChain = tally(D, (d) => d.sys);
  const dFp = D.filter((d) => d.o === 'fp').length;
  add(Object.assign({}, dial, { id: 'dialysis-total', cat: 'Hospitals', q: `How many dialysis facilities were on CMS's dialysis facility list in ${P.label}?`,
    a: D.length, why: `${commas(dFp / D.length * 100, 0)} percent of them are run for profit.` }));
  add(Object.assign({}, dial, { id: 'dialysis-big-two', cat: 'Hospitals', unit: 'percent', suf: '%',
    q: `What percent of the dialysis facilities on CMS's list in ${P.label} belong to DaVita or Fresenius Medical Care?`,
    a: (dChain['DaVita'] + dChain['Fresenius Medical Care']) / D.length * 100,
    src: dial.src.replace('counted', 'share computed'),
    why: `DaVita has ${commas(dChain['DaVita'])} and Fresenius ${commas(dChain['Fresenius Medical Care'])}.` }));
  perState('dialysis', dBy, ['TX', 'UT'], (S, id) => pickSaying(id, [`How many dialysis facilities in ${S} were on CMS's list in ${P.label}?`,
    `Counting every dialysis facility on CMS's list in ${P.label}, how many were in ${S}?`]), dial);

  // ambulatory surgical centers
  const asc = {
    src: 'CMS, Ambulatory Surgical Center Quality Measures, facility file (counted from the site\'s ' + P.label + ' pull)',
    url: 'https://data.cms.gov/provider-data/dataset/4jcv-atw7', unit: 'facilities'
  };
  const aBy = tally(A, (a) => a.s);
  const territories = Object.keys(aBy).filter((k) => !STATE_NAMES[k]).sort();
  const terrN = territories.reduce((s, k) => s + aBy[k], 0);
  const terrName = { PR: 'Puerto Rico', GU: 'Guam', VI: 'the U.S. Virgin Islands', AS: 'American Samoa', MP: 'the Northern Mariana Islands' };
  add(Object.assign({}, asc, { id: 'asc-total', cat: 'Hospitals', q: `How many ambulatory surgical centers were in CMS's ASC quality file in ${P.label}?`,
    a: A.length, why: `${commas(terrN)} of them are in ${joinNames(territories.map((k) => terrName[k] || k))}.` }));
  perState('asc', aBy, ['CA', 'MD', 'UT'], (S, id) => pickSaying(id, [`How many ambulatory surgical centers in ${S} were in CMS's ASC quality file in ${P.label}?`,
    `Outpatient surgery centers: how many in ${S} were in CMS's ASC quality file in ${P.label}?`]), asc);
  return out;
}

// ─── 7. Utah hospital prices (hospital-prices.json) ─────────────────────────

function priceQuestions() {
  const PR = readJson(path.join(ASSETS, 'hospital-prices.json'));
  const H = readJson(path.join(ASSETS, 'us-hospitals.json')).hospitals;
  const name = Object.fromEntries(H.map((h) => [h.id, titleCase(h.n)]));
  const basket = PR._meta.basket;
  const checked = String(PR._meta.built);
  const src = 'Hospital price transparency file (45 CFR 180.50), from the site\'s Utah price pull';
  /** [hospital id, gross, cash] for every hospital that posted a gross charge */
  const rows = (k) => Object.entries(PR.byId)
    .filter(([, v]) => v.px && v.px[k] && typeof v.px[k][0] === 'number')
    .map(([id, v]) => ({ id, gross: v.px[k][0], cash: v.px[k][1], up: v.up }));
  /** the year a hospital's file was posted, from its own date stamp */
  const yearOf = (up) => Number((String(up).match(/(\d{4})/) || [])[1]);
  const code = (k) => basket[k].type + ' ' + basket[k].code;
  const label = { mribrain: 'a brain MRI without contrast', er4: 'a level 4 emergency visit', ctabd: 'a CT of the abdomen and pelvis with contrast' };
  const pick = (k, id) => {
    const r = rows(k).find((x) => x.id === id);
    if (!r) throw new Error('[vital-stats] no ' + k + ' price for ' + id);
    return r;
  };
  const out = [];
  const add = (o) => out.push(Q(Object.assign({ cat: 'Money', unit: 'dollars', pre: '$', suf: '', dp: 0, src, checked, st: 'UT' }, o)));

  const mri = rows('mribrain');
  const mriMin = mri.reduce((a, b) => (b.gross < a.gross ? b : a));
  const mriMax = mri.reduce((a, b) => (b.gross > a.gross ? b : a));
  const imcMri = pick('mribrain', '460010');
  add({ id: 'price-mri-imc', q: `What gross charge does ${name['460010']} post for ${label.mribrain} (${code('mribrain')}), in dollars?`,
    a: imcMri.gross, year: yearOf(imcMri.up), why: `Its discounted cash price for the same scan is ${usd(imcMri.cash)}.` });
  if (mriMin.id !== '460009') throw new Error('[vital-stats] University of Utah is no longer the lowest MRI gross charge');
  add({ id: 'price-mri-uofu', q: `What gross charge does ${name['460009']} post for ${label.mribrain} (${code('mribrain')}), in dollars?`,
    a: mriMin.gross, year: yearOf(mriMin.up), why: `That is the lowest gross charge for the scan among the ${mri.length} Utah hospitals in the pull.` });
  add({ id: 'price-mri-max-ut', q: `What gross charge does ${name[mriMax.id]} post for ${label.mribrain} (${code('mribrain')}), in dollars?`,
    a: mriMax.gross, year: yearOf(mriMax.up), why: `No Utah hospital in the pull posts a higher one; the median is ${usd(median(mri.map((r) => r.gross)))}.` });

  const er = rows('er4');
  const erMin = er.reduce((a, b) => (b.gross < a.gross ? b : a));
  const erMax = er.reduce((a, b) => (b.gross > a.gross ? b : a));
  add({ id: 'price-er4-median-ut', src: 'Hospital price transparency files (45 CFR 180.50), median computed from the site\'s Utah price pull',
    q: `Across the ${er.length} Utah hospitals in the site's price pull, what is the median gross charge for ${label.er4} (${code('er4')}), in dollars?`,
    a: median(er.map((r) => r.gross)), year: Number(checked.slice(0, 4)),
    why: `Gross charges run from ${usd(erMin.gross)} at ${name[erMin.id]} to ${usd(erMax.gross)} at ${name[erMax.id]}.` });
  const imcEr = pick('er4', '460010');
  add({ id: 'price-er4-cash-imc', q: `What discounted cash price does ${name['460010']} post for ${label.er4} (${code('er4')}), in dollars?`,
    a: imcEr.cash, year: yearOf(imcEr.up), why: `Its gross charge for the same visit is ${usd(imcEr.gross)}.` });

  const ct = rows('ctabd');
  const ctMin = ct.reduce((a, b) => (b.gross < a.gross ? b : a));
  const ctMax = ct.reduce((a, b) => (b.gross > a.gross ? b : a));
  add({ id: 'price-ct-max-ut', q: `What gross charge does ${name[ctMax.id]} post for ${label.ctabd} (${code('ctabd')}), in dollars?`,
    a: ctMax.gross, year: yearOf(ctMax.up), why: `${name[ctMin.id]} posts the lowest in the Utah pull, ${usd(ctMin.gross)}.` });
  return out;
}

// ─── assemble, check, write ──────────────────────────────────────────────────

function validate(bank) {
  const seen = new Set();
  for (const q of bank.questions) {
    const tag = '[vital-stats] ' + q.id + ': ';
    if (seen.has(q.id)) throw new Error(tag + 'duplicate id');
    seen.add(q.id);
    if (!/^[a-z0-9-]+$/.test(q.id)) throw new Error(tag + 'id must be lowercase letters, digits and hyphens');
    if (!CATS.includes(q.cat)) throw new Error(tag + 'unknown category ' + q.cat);
    if (typeof q.a !== 'number' || !Number.isFinite(q.a) || q.a <= 0) throw new Error(tag + 'answer must be a finite positive number');
    for (const k of ['q', 'unit', 'src', 'checked', 'why']) if (!q[k] || typeof q[k] !== 'string') throw new Error(tag + 'missing ' + k);
    if (!Number.isInteger(q.year) || q.year < 2000 || q.year > 2100) throw new Error(tag + 'bad year');
    if ('st' in q && !STATE_NAMES[q.st]) throw new Error(tag + 'unknown state ' + q.st);
    if (q.more && !q.st) throw new Error(tag + 'a state-game-only question must name its state');
  }
  const text = JSON.stringify(bank);
  if (text.includes('\u2014')) throw new Error('[vital-stats] an em dash got into the bank');
}

function build() {
  const cfg = readJson(path.join(DATA, 'metricsConfig.json'));
  const stateData = readJson(path.join(DATA, 'stateData.json'));
  const years = readJson(path.join(DATA, 'dataYears.json'));
  const countyData = readJson(path.join(ASSETS, 'countyData.json'));
  const curated = readJson(CURATED);

  const all = [
    ...curatedQuestions(),
    ...stateQuestions(cfg, stateData, years),
    ...countyQuestions(cfg, stateData, countyData, years),
    ...blsQuestions(),
    ...statePayQuestions(),
    ...countQuestions(cfg, stateData, years),
    ...credQuestions(),
    ...facilityQuestions(),
    ...priceQuestions()
  ];
  // grouped by category, source order kept inside each group
  const questions = CATS.flatMap((c) => all.filter((q) => q.cat === c));
  const bank = { v: 1, built: String(curated.checked), questions };
  validate(bank);
  // one question per line: small diffs when a number changes
  return '{"v":1,"built":' + JSON.stringify(bank.built) + ',"questions":[\n' +
    questions.map((q) => JSON.stringify(q)).join(',\n') + '\n]}\n';
}

if (require.main === module) {
  const text = build();
  fs.writeFileSync(OUT, text);
  const bank = JSON.parse(text);
  const by = tally(bank.questions, (q) => q.cat);
  console.log('vital-stats: ' + bank.questions.length + ' questions -> ' + path.relative(ROOT, OUT));
  console.log('  ' + CATS.map((c) => c + ' ' + (by[c] || 0)).join(' · '));
  const mix = bank.questions.filter((q) => !q.more).length;
  const perSt = tally(bank.questions.filter((q) => q.st), (q) => q.st);
  const counts = Object.values(perSt);
  console.log('  everyday mix ' + mix + ' · state games ' + bank.questions.filter((q) => q.st).length +
    ' (' + Object.keys(perSt).length + ' states, ' + Math.min(...counts) + ' to ' + Math.max(...counts) + ' each)');
}

module.exports = { build, OUT };
