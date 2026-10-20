#!/usr/bin/env node
'use strict';
/**
 * build-huddle.js · the question bank for Daily Huddle (2026-10-14).
 *
 *   npm run build:huddle        writes src/assets/data/huddle-questions.json
 *
 * Daily Huddle is a hex trivia board: 19 tiles in the Atlas zones, crossed from the top row to the bottom.
 * Each tile is one question from this bank. The bank is BUILT, never typed: it reads
 *
 *   - Vital Stats' bank (src/assets/data/vital-stats-questions.json): the national numbers as they are, and the
 *     state questions turned into "which of these four states" and "which is higher" choices, plus state numbers;
 *   - the license compacts (src/_data/licensure.json), which David keeps current;
 *   - clinical math, generated here: every number is in the question, so it states nothing about any drug (DH2);
 *   - the hand-checked sets in scripts/data/huddle-curated.json (normals, laws, health IT, odd codes), each with
 *     its source, a verbatim quote and the date it was checked. Normals are drafts until David checks them (DH2).
 *
 *   - the FEEDS (section 6, bank version 2, 2026-10-18): one small module per site data file in scripts/huddle/feeds/,
 *     each asking about every row of its file: the map's state measures, the license compacts, the Assignment Compass's
 *     taxes and living costs, the Vendor Directory, the credential exams, the hospital cost reports, the school file,
 *     state pay, bedside math and the map's counties. Their questions carry b: 2.
 *   - bank version 3 (2026-10-20, DECISIONS DH12, first dealt 2026-10-25): six more feeds (state-laws, licensing,
 *     compass-more, vendor-facts, care-sites, state-more) grow Policy, Patient and Health Tech to 300 or more each, so
 *     the daily's 60-day memory has room. A law or a federal figure is asked only where a live check in
 *     scripts/data/huddle-law-checks.json agrees with the site's data.
 *
 * Every question carries `why`, its explanation line, written from the same rows as the question (DH12): the builder
 * writes it for sections 2 and 3, each feed for its own, and lib.js `check` stops the build on a feed question without one.
 * Adding a data set: when a site data file gains a row (a metric, a vendor, a credential, a school year), run
 * npm run build:huddle and the feed that reads it turns the row into questions, no code change. A new FILE gets a new
 * feed: copy the shortest one in scripts/huddle/feeds/, point it at the file, take src, yr and ck from the file's own
 * metadata, and add it to the list in scripts/huddle/feeds/index.js. Then npm run huddle:report shows what it made.
 *
 * Plan: docs/HU-HEX-TRIVIA-PLAN-2026-10-14.md. Deterministic: the same inputs write the same file, apart from `built`.
 *
 * A question:
 *   id   unique             z  zone (sci prv pat ph pay pol tec)     f  family (the tile's label comes from it)
 *   k    template (no two tiles on one board share it)              d  dots, 1 to 3, how hard
 *   t    'choice' | 'number'
 *   q    the question       sub  the line under it (how it is counted)
 *   o    the options (choice), a  the right option's index (choice) or the number (number)
 *   tol  a number counts within this share of the answer; abs  or within this much either way
 *   pre suf dp unit  how a number is shown and read (Vital Stats' rules)
 *   v    what each option's value was, shown with the answer (choice questions built from data)
 *   why  one plain line       src url yr ck  the source, its year and the date it was checked
 *   see  'tool|query|label', the place on the site that shows it (Vital Stats' format)
 *   draft  true on normals until David has checked them
 *   h    the hint lifeline (DH8): one line of foothold from the same data that never states the answer, where the
 *        data can supply one. Adding hints changes no id and no order, so every board deals the same tiles.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'src', 'assets', 'data', 'huddle-questions.json');
const VS = path.join(ROOT, 'src', 'assets', 'data', 'vital-stats-questions.json');
const LIC = path.join(ROOT, 'src', '_data', 'licensure.json');
const CURATED = path.join(ROOT, 'scripts', 'data', 'huddle-curated.json');

// the seeded generator (mulberry32, the same steps as hu-rng.js) and the state names live in scripts/huddle/lib.js now,
// shared with the feeds; they are the same functions, so every question below comes out as it did before
const { rngFrom, STATES, keyName, versionBank, placeWhy, pairWhy } = require('./huddle/lib');
const { today } = require('./lib/session');
const { runFeeds } = require('./huddle/feeds');

/* ── THE STATE TEMPLATES ─────────────────────────────────────────────────────────────────────────────────
   Vital Stats asks each of these about one state at a time. Here a template becomes three kinds of tile:
   which of four states is highest or lowest (2 dots), which of two is higher (1 dot), and the state's own
   number (3 dots, within 10 percent). `what` finishes "Which of these states had the highest ..."; `low`
   says whether the lowest-first version reads naturally too. */
const TEMPLATES = {
  'pay-rn': { z: 'prv', f: 'Pay', what: 'median annual pay for registered nurses in May 2025' },
  'pay-rt': { z: 'prv', f: 'Pay', what: 'median annual pay for respiratory therapists in May 2025' },
  'pay-lpn': { z: 'prv', f: 'Pay', what: 'median annual pay for licensed practical and vocational nurses in May 2025' },
  'pay-np': { z: 'prv', f: 'Pay', what: 'median annual pay for nurse practitioners in May 2025' },
  'pay-pa': { z: 'prv', f: 'Pay', what: 'median annual pay for physician assistants in May 2025' },
  'pay-pharmacist': { z: 'prv', f: 'Pay', what: 'median annual pay for pharmacists in May 2025' },
  'pay-radtech': { z: 'prv', f: 'Pay', what: 'median annual pay for radiologic technologists and technicians in May 2025' },
  'pay-cna': { z: 'prv', f: 'Pay', what: 'median annual pay for nursing assistants in May 2025' },
  'pay-med-assistant': { z: 'prv', f: 'Pay', what: 'median annual pay for medical assistants in May 2025' },
  'pay-health-manager': { z: 'prv', f: 'Pay', what: 'median annual pay for medical and health services managers in May 2025' },
  'sch-rt': { z: 'prv', f: 'Schools', what: 'number of schools that awarded a respiratory therapy degree in 2023-24', low: false },
  'sch-rn': { z: 'prv', f: 'Schools', what: 'number of schools that awarded a registered nursing degree or diploma in 2023-24', low: false },
  'sch-grads-rt': { z: 'prv', f: 'Schools', what: 'number of respiratory therapy degrees awarded in 2023-24', low: false },
  'hosp-count': { z: 'prv', f: 'Hospitals', what: 'number of hospitals on CMS\'s Care Compare list in June 2026', low: false },
  'hosp-cah': { z: 'prv', f: 'Hospitals', what: 'number of critical access hospitals on CMS\'s Care Compare list in June 2026', low: false },
  'dialysis': { z: 'prv', f: 'Hospitals', what: 'number of dialysis facilities on CMS\'s list in June 2026', low: false },
  'asc': { z: 'prv', f: 'Hospitals', what: 'number of ambulatory surgical centers in CMS\'s ASC quality file in June 2026', low: false },
  'uninsured': { z: 'pat', f: 'Coverage', what: 'share of people under 65 with no health insurance in 2023' },
  'checkup': { z: 'pat', f: 'Checkups', what: 'share of adults who had a routine checkup in the past year, as of 2023' },
  'hosp-five-star': { z: 'pat', f: 'Hospital stars', what: 'number of five-star hospitals on CMS\'s Care Compare list in June 2026', low: false },
  'obesity': { z: 'ph', f: 'State health', what: 'share of adults with obesity in 2023' },
  'smoking': { z: 'ph', f: 'State health', what: 'share of adults who smoked cigarettes in 2023' },
  'diabetes': { z: 'ph', f: 'State health', what: 'share of adults with diagnosed diabetes in 2023' },
  'heart-disease': { z: 'ph', f: 'State health', what: 'share of adults reporting coronary heart disease, angina or a past heart attack in 2023' },
  'high-bp': { z: 'ph', f: 'State health', what: 'share of adults with diagnosed high blood pressure in 2023' },
  'copd': { z: 'ph', f: 'State health', what: 'share of adults with diagnosed COPD in 2023' },
  'asthma': { z: 'ph', f: 'State health', what: 'share of adults with current asthma in 2023' },
  'depression': { z: 'ph', f: 'State health', what: 'share of adults ever diagnosed with depression, as of 2023' },
  'fair-poor-health': { z: 'ph', f: 'State health', what: 'share of adults who rated their own health fair or poor in 2023' },
  'low-birthweight': { z: 'ph', f: 'Births', what: 'share of babies born weighing under 2,500 grams, by the County Health Rankings' },
  'ypll': { z: 'ph', f: 'Early deaths', what: 'years of life lost to early deaths per 100,000 people, by the County Health Rankings' },
  'median-age': { z: 'ph', f: 'Age', what: 'median age, by the Census 2020 to 2024 estimates' },
  'age-65-plus': { z: 'pay', f: 'Medicare age', what: 'share of people 65 or older, by the Census 2020 to 2024 estimates' },
  'income': { z: 'pay', f: 'Income', what: 'median household income in 2024' },
};

/* the national Vital Stats questions, by family; anything unmapped stays out (and the test lists it) */
function nationalHome(q) {
  const id = q.id;
  if (q.st) return id.startsWith('price-') ? { z: 'pat', f: 'Patient costs' } : null;
  if (/^(pass-|fee-)/.test(id)) return { z: 'prv', f: 'Exams' };
  if (/^(kff-|part-b-|part-a-|nhe-oop)/.test(id)) return { z: 'pat', f: 'Patient costs' };
  if (q.cat === 'Coverage') return { z: 'pay', f: 'Coverage' };
  if (q.cat === 'Money') return { z: 'pay', f: 'Spending' };
  if (q.cat === 'Health') return { z: 'ph', f: 'U.S. health' };
  if (q.cat === 'Hospitals') return { z: 'prv', f: 'Hospitals' };
  if (q.cat === 'Workforce') return { z: 'prv', f: 'Workforce' };
  return null;
}

const out = [];
const seen = new Set();
function add(q) {
  if (seen.has(q.id)) throw new Error('two questions share the id ' + q.id);
  seen.add(q.id);
  out.push(q);
}
const pct = (v) => Math.round(v * 10) / 10;

/* ── 1. Vital Stats, national: the number as it is ── */
const vs = JSON.parse(fs.readFileSync(VS, 'utf8')).questions;
for (const q of vs) {
  if (q.k || q.f) continue;                                  // state templates and their forms come in section 2
  const home = nationalHome(q);
  if (!home) continue;
  add({ id: 'vs-' + q.id, z: home.z, f: home.f, k: 'vs-' + q.id, d: 2, t: 'number', q: q.q, sub: q.sub, a: q.a, tol: 0.15,
    pre: q.pre || '', suf: q.suf || '', dp: q.dp || 0, unit: q.unit, why: q.why, src: q.src, url: q.url, yr: q.year, ck: q.checked, see: q.see });
}

/* ── 2. Vital Stats, state templates: choices and numbers ── */
const byK = {};
for (const q of vs) if (q.k && !q.f && q.st && STATES[q.st] && TEMPLATES[q.k]) (byK[q.k] = byK[q.k] || []).push(q);
const fmt = (q, v) => (q.pre || '') + (q.dp ? v.toLocaleString('en-US', { minimumFractionDigits: q.dp, maximumFractionDigits: q.dp }) : Math.round(v).toLocaleString('en-US')) + (q.suf || '');
for (const k of Object.keys(TEMPLATES)) {
  const T = TEMPLATES[k];
  const rows = (byK[k] || []).filter((q) => q.st !== 'DC');   // the choices are among the fifty states
  if (rows.length < 12) continue;
  const one = rows[0];
  const base = { z: T.z, f: T.f, src: one.src, url: one.url, yr: one.year, ck: one.checked };
  // THE HINT (DH8): the data has no national figure for these, so the hint is the median across the states it covers,
  // rounded like every figure in the game. A state's own number gets it only when the median, as shown, would not
  // itself count as the answer.
  const sorted = rows.map((q) => q.a).sort((x, y) => x - y), n = sorted.length;
  const mid = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
  const shown = fmt(one, mid), shownN = parseFloat(shown.replace(/[^0-9.]/g, ''));
  const hint = `${n}-state median: ${shown}`
    + `${/^(hospitals|schools|degrees|facilities)$/.test(one.unit || '') ? ' ' + one.unit : ''}.`;
  // THE EXPLANATION (2026-10-20, DH12): where the right state placed among all of them, from the same rows. Written only
  // where Vital Stats gave no line; it is read by the answer card alone, so no board deals differently for it.
  const rowsV = rows.map((q) => ({ st: q.st, v: q.a }));
  const ONE = { hospitals: 'hospital', schools: 'school', degrees: 'degree', facilities: 'facility' };
  const showV = (v) => fmt(one, v) + (ONE[one.unit] ? ' ' + (v === 1 ? ONE[one.unit] : one.unit) : '');
  const ofV = n === 50 ? 'the 50 states' : `the ${n} states with ${ONE[one.unit] ? 'any' : 'data'}`;
  const r = rngFrom('huddle|' + k);
  // which of four: 8 per template, half asking for the lowest where that reads naturally
  for (let n = 0, tries = 0; n < 8 && tries < 200; tries++) {
    const four = r.shuffle(rows).slice(0, 4);
    const low = T.low !== false && n % 2 === 1;
    const vals = four.map((q) => q.a);
    const best = low ? Math.min(...vals) : Math.max(...vals);
    const rest = vals.filter((v) => v !== best);
    if (rest.length !== 3) continue;                          // a tie at the top is no question
    const next = low ? Math.min(...rest) : Math.max(...rest);
    if (Math.abs(best - next) < Math.max(Math.abs(best) * 0.03, one.dp ? 0.3 : 1)) continue;   // too close to call
    const ans = vals.indexOf(best);
    const winner = four[ans];
    add({ ...base, id: `${k}-four-${n}`, k: `${k}-four`, d: 2, t: 'choice',
      q: `Which of these states had the ${low ? 'lowest' : 'highest'} ${T.what}?`,
      o: four.map((q) => keyName(q.st)), a: ans, v: four.map((q) => fmt(q, q.a)), see: winner.see,
      why: one.why && /range ran from/.test(one.why) ? one.why : placeWhy(rowsV, showV, winner.st, low, ofV), h: hint });
    n++;
  }
  // which of two is higher: 8 per template
  for (let n = 0, tries = 0; n < 8 && tries < 200; tries++) {
    const two = r.shuffle(rows).slice(0, 2);
    const [x, y] = two.map((q) => q.a);
    if (Math.abs(x - y) < Math.max(Math.max(Math.abs(x), Math.abs(y)) * 0.06, one.dp ? 0.5 : 1)) continue;
    const ans = x > y ? 0 : 1;
    add({ ...base, id: `${k}-two-${n}`, k: `${k}-two`, d: 1, t: 'choice',
      q: `Which state had the higher ${T.what}?`,
      o: two.map((q) => keyName(q.st)), a: ans, v: two.map((q) => fmt(q, q.a)), see: two[ans].see, h: hint,
      why: pairWhy(rowsV, showV, two[ans].st, two[1 - ans].st, ofV) });
    n++;
  }
  // the state's own number: 6 per template, within 10 percent
  for (const q of r.shuffle(rows).slice(0, 6)) {
    add({ ...base, id: `${k}-num-${q.st.toLowerCase()}`, k: `${k}-num`, d: 3, t: 'number', q: q.q, sub: q.sub, a: q.a, tol: 0.10,
      pre: q.pre || '', suf: q.suf || '', dp: q.dp || 0, unit: q.unit, why: q.why, see: q.see,
      h: Math.abs(shownN - q.a) > Math.abs(q.a) * 0.10 ? hint : undefined });
  }
}

/* ── 3. The license compacts (David keeps these current; verified 2026-08-05) ── */
const lic = JSON.parse(fs.readFileSync(LIC, 'utf8'));
const asOf = lic._meta && lic._meta.retrieved;
const asOfWords = new Date(asOf + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const FIFTY = Object.keys(STATES).filter((s) => s !== 'DC');
for (const [prof, P] of Object.entries(lic.professions)) {
  const c = P.compact;
  if (!c || !Array.isArray(c.members) || !c.members.length) continue;
  const members = c.members.filter((s) => FIFTY.includes(s));
  const pending = Object.keys(c.pending || {});
  const outside = FIFTY.filter((s) => !members.includes(s) && !pending.includes(s));
  const joined = c.operational ? 'is a member of' : 'has enacted';
  const asWord = `Member states as of ${asOfWords}, by the compact's own list. States that have passed it but not yet put it in place do not count.`;
  const howMany = `${members.length} states ${c.operational ? 'are members' : 'have enacted it'}.`;   // the hint (DH8); never on the count tile
  const base = { z: 'pol', f: 'Compacts', src: c.name + ', member states', url: c.url, yr: Number(String(asOf).slice(0, 4)), ck: asOf, sub: asWord };
  const r = rngFrom('huddle|compact|' + c.code);
  const known = c.code === 'NLC' ? 1 : 2;
  for (let n = 0; n < 4 && members.length >= 1 && outside.length >= 3; n++) {
    const pick = [r.pick(members), ...r.shuffle(outside).slice(0, 3)];
    const order = r.shuffle([0, 1, 2, 3]);
    add({ ...base, id: `cmp-${c.code.toLowerCase()}-in-${n}`, k: `cmp-${c.code.toLowerCase()}-in`, d: known, t: 'choice',
      q: `Which of these states ${joined} the ${c.name}?`, o: order.map((i) => keyName(pick[i])), a: order.indexOf(0),
      why: `${members.length} states ${c.operational ? 'are members' : 'have enacted it'}.`, h: howMany });
  }
  for (let n = 0; n < 4 && members.length >= 3 && outside.length >= 1; n++) {
    const pick = [r.pick(outside), ...r.shuffle(members).slice(0, 3)];
    const order = r.shuffle([0, 1, 2, 3]);
    add({ ...base, id: `cmp-${c.code.toLowerCase()}-out-${n}`, k: `cmp-${c.code.toLowerCase()}-out`, d: 2, t: 'choice',
      q: `Which of these states has NOT ${c.operational ? 'joined' : 'enacted'} the ${c.name}?`, o: order.map((i) => keyName(pick[i])), a: order.indexOf(0),
      why: `${members.length} states ${c.operational ? 'are members' : 'have enacted it'}.`, h: howMany });
  }
  // how many: four counts, the real one among them
  const nm = members.length;
  const passed = Object.entries(c.pending || {}).filter(([s, how]) => FIFTY.includes(s) && /^(enacted|passed)/i.test(how));
  const opts = [nm, nm + 4, nm - 5, nm + 9].filter((x) => x > 0);
  if (opts.length === 4) {
    const order = r.shuffle([0, 1, 2, 3]);
    add({ ...base, id: `cmp-${c.code.toLowerCase()}-count`, k: `cmp-${c.code.toLowerCase()}-count`, d: 3, t: 'choice',
      q: `How many states ${c.operational ? 'are members of' : 'have enacted'} the ${c.name}?`, o: order.map((i) => String(opts[i])), a: order.indexOf(0),
      why: `The compact's own list, as of ${asOfWords}, counted ${nm} states ${c.operational ? 'as members' : 'that have enacted it'}${passed.length ? `; ${passed.length} more had passed it but were not yet taking part` : ''}.` });
  }
}

/* ── 4. Clinical math: every number is in the question (DH2). Nothing here claims a dose for any drug. ── */
const MATH_SRC = { src: 'Arithmetic. Every number is given in the question.', ck: '2026-10-14' };
// h is the hint (DH8): the formula, or the first step where the question already gives the formula
function math(id, k, d, q, a, abs, sub, why, h) {
  add({ id, z: 'sci', f: 'Clinical math', k, d, t: 'number', q, sub, a, abs, pre: '', suf: '', dp: abs < 1 ? 1 : 0, why, ...MATH_SRC, h });
}
{
  const r = rngFrom('huddle|math');
  // oxygen cylinder: factor given
  for (const { cyl, fac } of [{ cyl: 'E', fac: 0.28 }, { cyl: 'D', fac: 0.16 }]) {
    for (let n = 0; n < 6; n++) {
      const psi = r.pick([2000, 1800, 1600, 1500, 1200, 1000, 900]);
      const flow = r.pick([2, 3, 4, 5, 6, 10]);
      const min = Math.floor(psi * fac / flow);
      math(`math-cyl-${cyl.toLowerCase()}-${n}`, 'math-cyl', 2, `${cyl === 'E' ? 'An' : 'A'} ${cyl} oxygen cylinder reads ${psi.toLocaleString('en-US')} psi and its cylinder factor is ${fac} L/psi. How many minutes will it last at ${flow} L/min?`,
        min, 1, 'Round down to whole minutes. Leave no reserve.', `${psi.toLocaleString('en-US')} × ${fac} = ${pct(psi * fac)} liters, and ${pct(psi * fac)} ÷ ${flow} = ${pct(psi * fac / flow)} minutes.`,
        'Minutes = psi × cylinder factor ÷ flow in L/min.');
    }
  }
  // volume to draw up
  const DOSE = [[250, 500, 5], [125, 250, 5], [40, 20, 1], [5, 10, 1], [1, 4, 2], [75, 50, 1], [300, 100, 2], [12.5, 25, 1]];
  DOSE.forEach(([want, have, per], n) => {
    const ml = want / have * per;
    math(`math-draw-${n}`, 'math-draw', 1, `${want} mg is ordered. The vial holds ${have} mg in ${per} mL. How many mL do you draw up?`,
      Math.round(ml * 10) / 10, 0.05, 'Round to one decimal place.', `${want} ÷ ${have} × ${per} = ${pct(ml)} mL.`,
      'mL to draw = dose ordered ÷ dose in the vial × mL in the vial.');
  });
  // pump rate
  for (const [vol, hrs] of [[1000, 8], [500, 4], [1000, 10], [250, 2], [1000, 12], [750, 6]]) {
    math(`math-rate-${vol}-${hrs}`, 'math-rate', 1, `${vol.toLocaleString('en-US')} mL is to run over ${hrs} hours on a pump. What rate do you set, in mL/hr?`,
      Math.round(vol / hrs), 1, 'Round to a whole number.', `${vol} ÷ ${hrs} = ${pct(vol / hrs)} mL/hr.`, 'mL/hr = total mL ÷ hours.');
  }
  // gravity drip
  for (const [vol, hrs, gtt] of [[1000, 8, 15], [500, 4, 20], [1000, 6, 10], [250, 2, 15], [100, 1, 60], [500, 5, 15]]) {
    const v = vol * gtt / (hrs * 60);
    math(`math-gtt-${vol}-${hrs}-${gtt}`, 'math-gtt', 2, `${vol.toLocaleString('en-US')} mL is to run over ${hrs} hours on gravity tubing that gives ${gtt} drops per mL. How many drops a minute?`,
      Math.round(v), 1, 'Round to a whole number.', `${vol} × ${gtt} ÷ ${hrs * 60} minutes = ${pct(v)} drops a minute.`,
      `Drops a minute = mL × drops per mL ÷ minutes, and ${hrs} ${hrs === 1 ? 'hour is' : 'hours is'} ${hrs * 60} minutes.`);
  }
  // mean arterial pressure, formula given
  for (const [s, dia] of [[120, 80], [90, 60], [150, 90], [100, 50], [138, 72], [84, 48]]) {
    const m = (s + 2 * dia) / 3;
    math(`math-map-${s}-${dia}`, 'math-map', 2, `A blood pressure reads ${s}/${dia}. Using MAP = (systolic + 2 × diastolic) ÷ 3, what is the MAP?`,
      Math.round(m), 1, 'Round to a whole number, in mmHg.', `(${s} + ${2 * dia}) ÷ 3 = ${pct(m)}.`, `Start with 2 × ${dia} = ${2 * dia}.`);
  }
  // predicted body weight, formula given
  const PEOPLE = [{ sex: 'man', base: 50, ft: 5, inch: 10 }, { sex: 'woman', base: 45.5, ft: 5, inch: 4 }, { sex: 'man', base: 50, ft: 6, inch: 1 },
    { sex: 'woman', base: 45.5, ft: 5, inch: 7 }, { sex: 'man', base: 50, ft: 5, inch: 6 }, { sex: 'woman', base: 45.5, ft: 5, inch: 2 }];
  for (const { sex, base, ft, inch } of PEOPLE) {
    const over = ft * 12 + inch - 60;
    const kg = base + 2.3 * over;
    math(`math-ibw-${sex}-${ft}${inch}`, 'math-ibw', 3, `A ${sex} is ${ft} feet ${inch} inches tall. Using ${base} + 2.3 × (inches over 5 feet), what is the predicted body weight in kg?`,
      Math.round(kg), 1, 'Round to a whole number.', `${over} inches over 5 feet: ${base} + 2.3 × ${over} = ${pct(kg)} kg.`,
      `${ft} feet ${inch} ${inch === 1 ? 'inch is' : 'inches is'} ${over} inches over 5 feet.`);
  }
  // tidal volume from a weight and mL/kg
  for (const [kg, per] of [[70, 6], [62, 8], [55, 6], [80, 7], [68, 8], [74, 6]]) {
    math(`math-vt-${kg}-${per}`, 'math-vt', 1, `At ${per} mL/kg of predicted body weight, what tidal volume is that for ${kg} kg, in mL?`,
      kg * per, 1, undefined, `${kg} × ${per} = ${kg * per} mL.`, 'Tidal volume = weight in kg × mL/kg.');
  }
  // minute ventilation
  for (const [vt, rr] of [[500, 14], [450, 16], [400, 20], [600, 12], [350, 24], [550, 18]]) {
    const ve = vt * rr / 1000;
    math(`math-ve-${vt}-${rr}`, 'math-ve', 1, `Tidal volume ${vt} mL, respiratory rate ${rr}. What is the minute ventilation, in L/min?`,
      Math.round(ve * 10) / 10, 0.05, 'One decimal place.', `${vt} × ${rr} = ${(vt * rr).toLocaleString('en-US')} mL, which is ${pct(ve)} L/min.`,
      'Minute ventilation = tidal volume × rate, and 1,000 mL is 1 L.');
  }
  // P/F ratio
  for (const [pao2, fio2] of [[80, 0.4], [60, 0.5], [95, 0.3], [70, 0.7], [120, 0.6], [55, 0.35]]) {
    const pf = pao2 / fio2;
    math(`math-pf-${pao2}-${fio2 * 100}`, 'math-pf', 2, `PaO2 ${pao2} mmHg on an FiO2 of ${fio2}. What is the P/F ratio?`,
      Math.round(pf), 1, 'PaO2 divided by FiO2, to a whole number.', `${pao2} ÷ ${fio2} = ${pct(pf)}.`,
      `${pao2} ÷ ${fio2} is the same as ${(pao2 * 100).toLocaleString('en-US')} ÷ ${Math.round(fio2 * 100)}.`);
  }
  // mg to mcg
  for (const mg of [0.25, 0.125, 0.5, 0.05, 1.5, 0.075]) {
    math(`math-mcg-${String(mg).replace('.', '')}`, 'math-mcg', 1, `How many micrograms are in ${mg} mg?`, Math.round(mg * 1000), 1, undefined, `${mg} × 1,000 = ${mg * 1000} mcg.`,
      '1 mg is 1,000 mcg.');
  }
}

/* ── 5. The hand-checked sets ── */
let curated = { questions: [] };
if (fs.existsSync(CURATED)) curated = JSON.parse(fs.readFileSync(CURATED, 'utf8'));
const FAM = { normals: 'Normals', laws: 'Laws', tech: 'Health IT', codes: 'Odd codes' };
for (const c of curated.questions || []) {
  add({ id: c.id, z: c.zone, f: FAM[c.fam] || c.fam, k: c.k || c.id, d: c.dots, t: 'choice', q: c.q, sub: c.sub, o: c.opts, a: c.ans,
    why: c.why, src: c.src, url: c.url, yr: c.year, ck: c.checked, quote: c.quote, draft: c.draft || undefined });
}

/* ── 6. The feeds: bank version 2 (2026-10-18) ──
   Everything above is bank version 1. It keeps its words and its place at the head of the file, because boards #1 to #6
   were dealt from it in file order. The feeds in scripts/huddle/feeds/ each read one of the site's data files and ask
   about every row in it; a feed takes its source, year and check date from that file. Every question they make is held
   to the bank's rules as it is made (scripts/huddle/lib.js, check), skips any question text the bank already asks, and
   carries b: 2, so the page can deal the days before version 2 from version 1 alone. npm run huddle:report counts them. */
const fed = runFeeds({ TEMPLATES, vs, old: out });
/* the source line a player reads names the publisher and the release; a data file's own notes on how it was built
   ("county-native, state = pop-weighted rollup") stay in the file (2026-10-18 spot check). Cut after the first closing
   parenthesis when notes follow it. A line the data writes as a verdict ("The first try matters.") is dropped. */
const playerSrc = (src) => String(src || '').replace(/^([^()]*\([^()]*\)),\s.*$/, '$1');
const plainWhy = (why) => (why ? String(why).replace(/\s*The first try matters\.?$/, '') : why);
for (const q of fed.questions) add({ ...q, src: playerSrc(q.src), why: plainWhy(q.why), b: 2 });

/* ── 7. Versions: every question keeps the version and the place it joined with (2026-10-18) ──
   A live board is dealt from its version in file order, so the build is merged into the bank as it was
   (scripts/huddle/lib.js, versionBank): new questions join a new version that first deals on --from=YYYY-MM-DD (by
   default three days on, in Mountain time, after a push can land), and a question a source no longer makes stays, frozen
   and marked gone, so no past board changes and no saved run loses its tiles; a version whose first day has not come is
   still open and changes freely. The page reads the versions from the bank. */
const built = out.map((q) => Object.fromEntries(Object.entries(q).filter(([, v]) => v !== undefined && v !== '')));
const PREV = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : null;
const fromArg = (process.argv.find((a) => a.startsWith('--from=')) || '').slice(7);
const soon = new Date(Date.now() + 3 * 86400000);
const V = versionBank(PREV, built, { from: /^\d{4}-\d{2}-\d{2}$/.test(fromArg) ? fromArg : today(soon), today: today() });

/* ── write ── */
const clean = V.questions;
const zones = {};
for (const q of clean) { const z = zones[q.z] = zones[q.z] || { n: 0, d1: 0, d2: 0, d3: 0 }; z.n++; z['d' + q.d]++; }
const file = { v: 1, built: new Date().toISOString().slice(0, 10), versions: V.versions, zones, questions: clean };
// --check: build in memory and fail if the committed bank is stale (tests/huddle-questions.test.js runs it)
if (process.argv.includes('--check')) {
  const was = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : null;
  const same = was && JSON.stringify({ ...was, built: '' }) === JSON.stringify({ ...file, built: '' });
  console.log(same ? 'huddle-questions.json matches its sources' : 'huddle-questions.json is stale: run npm run build:huddle');
  process.exit(same ? 0 : 1);
}
fs.writeFileSync(OUT, JSON.stringify(file));
console.log(`huddle-questions.json: ${clean.length} questions, ${(fs.statSync(OUT).size / 1024).toFixed(0)} KB`);
const top = Math.max(...Object.keys(V.versions).map(Number));
if (V.added.length) console.log(`  ${V.added.length} new questions join version ${top}, first dealt ${V.versions[top]} (change it with --from=YYYY-MM-DD)`);
if (V.dropped.length) console.log(`  ${V.dropped.length} questions left version ${top} before its first day: ${V.dropped.slice(0, 12).join(', ')}`);
if (V.gone.length) console.log(`  ${V.gone.length} questions no source makes any more, kept frozen and dealt by no newer version: ${V.gone.slice(0, 12).join(', ')}${V.gone.length > 12 ? ' ...' : ''}`);
for (const [z, s] of Object.entries(zones)) console.log(`  ${z.padEnd(4)} ${String(s.n).padStart(4)}  1 dot ${s.d1}, 2 dots ${s.d2}, 3 dots ${s.d3}`);
for (const F of fed.report) {
  console.log(`  feed ${F.name.padEnd(14)} ${String(F.n).padStart(4)} questions, ${String(F.templates).padStart(3)} templates${F.dropped.length ? `, ${F.dropped.length} dropped as repeats` : ''}`);
}
