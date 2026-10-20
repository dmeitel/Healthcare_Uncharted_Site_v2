'use strict';
/**
 * scripts/huddle/lib.js · what Daily Huddle's builder and its feeds share (2026-10-18).
 *
 * The seeded generator and the state names moved here from scripts/build-huddle.js unchanged, so the questions that
 * builder already wrote come out byte for byte as before. The rest is for the feeds in scripts/huddle/feeds/: number
 * formats, the "which of these states" forms with the near-tie rules section 2 of the builder uses, the place on the
 * site that shows a fact (`see`), and `check`, which holds every new question to the same rules
 * tests/huddle-questions.test.js holds the bank to, so a bad question stops the build instead of reaching a board.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
/** @param {string} rel a path from the repo root */
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));

/* ── a seeded generator (mulberry32, the same steps as hu-rng.js) so the bank never changes by itself ── */
function rngFrom(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  let a = h >>> 0;
  const next = () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  next.int = (lo, hi) => lo + Math.floor(next() * (hi - lo + 1));
  next.pick = (list) => list[Math.floor(next() * list.length)];
  next.shuffle = (list) => { const a2 = list.slice(); for (let i = a2.length - 1; i > 0; i--) { const j = Math.floor(next() * (i + 1)); [a2[i], a2[j]] = [a2[j], a2[i]]; } return a2; };
  return next;
}

const STATES = { AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado', CT: 'Connecticut',
  DE: 'Delaware', DC: 'the District of Columbia', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana',
  IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan',
  MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire',
  NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma',
  OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas',
  UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming' };
// an option names a state the way a person says it; DC reads "D.C." on a key
const keyName = (st) => (st === 'DC' ? 'D.C.' : STATES[st]);
const FIFTY = Object.keys(STATES).filter((s) => s !== 'DC');

/* ── numbers, hand-rolled so the output never depends on the machine's locale data ── */
function round(v, dp) { const f = Math.pow(10, dp); return Math.round(v * f) / f; }
function commas(v, dp = 0) {
  const s = round(v, dp).toFixed(dp);
  const [int, frac] = s.split('.');
  const w = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return frac ? w + '.' + frac : w;
}
function median(xs) { const s = xs.slice().sort((a, b) => a - b); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
/** '2026-08-05' -> 'August 5, 2026'; '2026-08' -> 'August 2026' */
function dateWords(d) {
  const m = String(d).match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/);
  if (!m) return String(d);
  return MONTHS[Number(m[2]) - 1] + (m[3] ? ' ' + Number(m[3]) + ',' : '') + ' ' + m[1];
}
function joinNames(names) {
  if (names.length === 1) return names[0];
  if (names.length === 2) return names[0] + ' and ' + names[1];
  return names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1];
}
function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/* ── names and keys ──
   A new template key is lowercase words joined by dots, with no hyphen in it. Daily Huddle's "Your field" lean reads a
   template key for hyphen-separated profession words (rt, rn, md, do, nclex and the rest, FIELDS in the page's engine);
   a dotted key can never match one by accident, so a new question only joins a field when the engine is told to. */
const kOf = (...parts) => parts.map((p) => String(p).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')).join('.');
/** an id piece: lowercase letters, digits and hyphens */
const idOf = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
/** the Population Health Map's slug for a measure, exactly as multi-lens-map.js writes it (and build-vital-stats.js) */
const mapSlug = (n) => String(n).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/* ── the four and two forms, with section 2's rules ──
   rows: [{ st, v }] for the fifty states (DC already out). Four: which of four is highest (or lowest), 2 dots, skipped
   when the best and the next are within 3 percent. Two: which of two is higher, 1 dot, skipped inside 6 percent. The
   absolute floor scales with the decimals a number is shown to. Every option's value rides along in `v`. */
function floorFor(dp, wide) { return dp >= 2 ? (wide ? 0.05 : 0.03) : dp === 1 ? (wide ? 0.5 : 0.3) : 1; }
function fourForm(o) {
  const { rows, fmt, dp, rng, idp, k, what, low, base, hint, n = 8, d = 2, seeOf } = o;
  const out = [];
  for (let i = 0, tries = 0; i < n && tries < 200 && rows.length >= 6; tries++) {
    const four = rng.shuffle(rows).slice(0, 4);
    const lo = low && i % 2 === 1;
    const vals = four.map((r) => r.v);
    const best = lo ? Math.min(...vals) : Math.max(...vals);
    const rest = vals.filter((v) => v !== best);
    if (rest.length !== 3) continue;
    const next = lo ? Math.min(...rest) : Math.max(...rest);
    if (Math.abs(best - next) < Math.max(Math.abs(best) * 0.03, floorFor(dp, false))) continue;
    const ans = vals.indexOf(best);
    out.push({ ...base, id: `${idp}-four-${i}`, k, d, t: 'choice', q: `Which of these states had the ${lo ? 'lowest' : 'highest'} ${what}?`,
      o: four.map((r) => keyName(r.st)), a: ans, v: four.map((r) => fmt(r.v)), see: seeOf ? seeOf(four[ans].st) : undefined, h: hint });
    i++;
  }
  return out;
}
function twoForm(o) {
  const { rows, fmt, dp, rng, idp, k, what, base, hint, n = 8, d = 1, seeOf } = o;
  const out = [];
  for (let i = 0, tries = 0; i < n && tries < 200 && rows.length >= 4; tries++) {
    const two = rng.shuffle(rows).slice(0, 2);
    const [x, y] = two.map((r) => r.v);
    if (Math.abs(x - y) < Math.max(Math.max(Math.abs(x), Math.abs(y)) * 0.06, floorFor(dp, true))) continue;
    const ans = x > y ? 0 : 1;
    out.push({ ...base, id: `${idp}-two-${i}`, k, d, t: 'choice', q: `Which state had the higher ${what}?`,
      o: two.map((r) => keyName(r.st)), a: ans, v: two.map((r) => fmt(r.v)), see: seeOf ? seeOf(two[ans].st) : undefined, h: hint });
    i++;
  }
  return out;
}
/** pick `n` options for "which one" around a right answer: distractors drawn from `pool`, each passing `far` */
function withDistractors(rng, right, pool, n, far) {
  const picks = rng.shuffle(pool.filter((x) => x !== right && (!far || far(x)))).slice(0, n - 1);
  if (picks.length < n - 1) return null;
  const order = rng.shuffle([...Array(n).keys()]);
  const all = [right, ...picks];
  return { o: order.map((i) => all[i]), a: order.indexOf(0), all, order };
}

/* ── the voice and the bank's rules, checked on every new question ── */
const BANNED = /\b(delve|straightforward|genuinely|transformative|here's the thing|let's be clear|make no mistake|receipts)\b/i;
const DOSE = /\b(what is the|what's the|usual|standard|recommended|maximum|max) (adult |daily |starting )?dose\b|\bdose of\b/i;
const ZONES = ['sci', 'prv', 'pat', 'ph', 'tec', 'pol', 'pay'];
/** the "Your field" words in the page's engine (src/fun/daily-huddle/index.html, FIELDS); a new key must not trip one */
const FIELD_RES = [/(^|-)(rt|nbrc|rcic)(-|$)|^math-(cyl|ibw|vt|ve|pf)$/, /(^|-)(rn|lpn|np|aprn|dnp|ccrn|nclex|ncsbn|nlc|aanp|nbcrna|cnm)(-|$)|^math-(gtt|rate|mcg|draw|map)$/,
  /(^|-)(physician|physicians|md|do|aamc|imlc)(-|$)|^math-(vt|pf|map|mcg)$/, /(^|-)(pharmacist|naplex)(-|$)|^math-(mcg|draw|rate|ibw)$/];
const words = (q) => [q.q, q.sub, q.why, q.h, ...(q.o || []), ...(q.v || [])].filter(Boolean).join(' \n ');
/** a number in a hint that would itself count as the answer (the test's rule) */
const counts = (q, x) => (q.abs != null ? Math.abs(x - q.a) <= q.abs + 1e-9 : Math.abs(x - q.a) <= Math.abs(q.a) * (q.tol || 0.1) + 1e-9);
/** does this hint keep to the rules? (one short line, no right option, no number that counts) */
function hintOK(q, h) {
  if (!h || !/^[^\n]{8,80}\.$/.test(h)) return false;
  if (q.t === 'choice') return !h.includes(q.o[q.a]);
  const nums = (h.replace(/^\d+-state median: /, '').match(/\d[\d,]*(\.\d+)?/g) || []).map((x) => Number(x.replace(/,/g, '')));
  return nums.every((x) => !counts(q, x));
}
/** throws on the first rule a question breaks; returns the question with empty fields dropped */
function check(q, feed) {
  const tag = `[huddle:${feed}] ${q.id}: `;
  const bad = (m) => { throw new Error(tag + m); };
  if (!q.id || !/^[a-z0-9-]+$/.test(q.id)) bad('an id is lowercase letters, digits and hyphens');
  if (/^(norm|pol|tec|icd|vs|cmp|math)-/.test(q.id)) bad('that id prefix belongs to the hand-checked or older sections');
  if (!ZONES.includes(q.z)) bad('zone ' + q.z);
  if (!q.f || q.f.length > 14) bad('a family is a short tile label: ' + q.f);
  if (!q.k || !/^[a-z0-9_.]+$/.test(q.k) || !q.k.includes('.')) bad('a new template key is dotted words with no hyphen: ' + q.k);
  if (FIELD_RES.some((re) => re.test(q.k))) bad('the key would join a profession field: ' + q.k);
  if (![1, 2, 3].includes(q.d)) bad('dots 1 to 3');
  if (!q.q || !/\?$/.test(q.q.trim())) bad('a question ends in a question mark');
  if (!q.src || !q.ck || !/^\d{4}-\d{2}(-\d{2})?$/.test(String(q.ck))) bad('a source and a check date');
  if (!Number.isInteger(q.yr) || q.yr < 1800 || q.yr > 2100) bad('a year');
  if (q.t === 'choice') {
    if (![2, 4].includes(q.o.length) || new Set(q.o).size !== q.o.length) bad('two or four distinct options');
    if (!Number.isInteger(q.a) || q.a < 0 || q.a >= q.o.length) bad('the right option is one of them');
    if (q.v && q.v.length !== q.o.length) bad('a value for every option');
    if (/-four-|-two-/.test(q.id)) {
      const nums = q.v.map((s) => parseFloat(String(s).replace(/[^0-9.\-]/g, '')));
      const best = /lowest/.test(q.q) ? Math.min(...nums) : Math.max(...nums);
      if (nums[q.a] !== best) bad('the right answer is not the extreme of the values shown');
    }
  } else if (q.t === 'number') {
    if (!Number.isFinite(q.a) || q.a < 0) bad('a number answer');
    if (!((q.tol > 0 && q.tol <= 0.25) || q.abs > 0)) bad('a share or an amount that counts');
  } else bad('choice or number');
  if (q.h && !hintOK(q, q.h)) bad('the hint breaks a rule: ' + q.h);
  const t = words(q);
  if (/[—–]/.test(t)) bad('a dash');
  if (BANNED.test(t)) bad('a banned word');
  if (DOSE.test(q.q)) bad('asks for a dose');
  if (q.f === 'Clinical math' && !/^Arithmetic/.test(q.src)) bad('clinical math is arithmetic');
  if (q.see && !/^[a-z]+\|[^|]*\|[^|]+$/.test(q.see)) bad('a see link is "tool|address|label"');
  return Object.fromEntries(Object.entries(q).filter(([, v]) => v !== undefined && v !== '' && v !== null));
}

/* VERSIONS (2026-10-18). A board is dealt from its version's questions in file order, so once a version has dealt a daily
   its questions never move and never leave; otherwise a past daily replays as a different board and a saved run whose
   question is gone will not restore. A version is OPEN until its first day comes (no daily has been dealt from it yet),
   and an open version can still change freely. versionBank merges a fresh build into the bank as it was:
   - a question the bank had keeps its version (b) and its place, with this build's words and answer;
   - a question new to the bank joins the open version, or opens a new one that first deals on `from`; it goes at the end;
   - a question this build no longer makes simply leaves an open version; from a version that has dealt, it stays, frozen
     as it was and marked `gone` with the last version that deals it, so the old deals hold and no newer one deals it.
   The first bank (no `versions` in it) is version 1 for questions without b and version 2 from 2026-10-20 for the rest.
   @param {{questions:any[], versions?:Record<string,string>}|null} prev the bank as it was
   @param {any[]} built this build's questions, in build order
   @param {{from:string, today:string}} o the first day a new version deals, and today (YYYY-MM-DD, Mountain time)
   @returns {{questions:any[], versions:Record<string,string>, added:string[], gone:string[], dropped:string[]}} */
function versionBank(prev, built, o) {
  const versions = { ...((prev && prev.versions) || { 2: '2026-10-20' }) };
  if (!prev) return { questions: built, versions, added: [], gone: [], dropped: [] };
  const open = (v) => v > 1 && !!versions[v] && versions[v] > o.today;
  const now = new Map(built.map((q) => [q.id, q]));
  const had = new Set(prev.questions.map((q) => q.id));
  const added = built.filter((q) => !had.has(q.id)).map((q) => q.id);
  const leaving = prev.questions.filter((q) => !now.has(q.id) && !q.gone);
  const dropped = leaving.filter((q) => open(q.b || 1)).map((q) => q.id);
  const gone = leaving.filter((q) => !open(q.b || 1)).map((q) => q.id);
  const last = Math.max(1, ...Object.keys(versions).map(Number));
  let into = open(last) ? last : 0;
  if (!into && (added.length || gone.length)) { into = last + 1; versions[into] = o.from; }
  const keep = (q, b) => { const c = { ...q }; delete c.b; return b > 1 ? { ...c, b } : c; };
  const questions = [];
  for (const p of prev.questions) {
    const q = now.get(p.id);
    if (q) questions.push(keep(q, p.b || 1));
    else if (p.gone) questions.push(p);
    else if (!open(p.b || 1)) questions.push({ ...p, gone: into - 1 });
  }
  for (const id of added) questions.push(keep(now.get(id), into));
  return { questions, versions, added, gone, dropped };
}

module.exports = { ROOT, readJson, rngFrom, STATES, keyName, FIFTY, round, commas, median, dateWords, joinNames, ordinal,
  kOf, idOf, mapSlug, fourForm, twoForm, withDistractors, hintOK, check, FIELD_RES, versionBank };
