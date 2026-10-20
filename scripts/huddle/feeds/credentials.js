'use strict';
/**
 * FEED: the credential exams in the Career Tree (2026-10-18).
 *
 * Reads: src/assets/data/career-tree-creds.json, national exam statistics "straight from each credentialing body".
 * Its meta.updated is the check date; each exam carries its body (org), its report's link (url) and its pass year.
 * Vital Stats already asks ten pass rates and five fees as numbers. This feed asks:
 *   - which organization gives an exam (skipped when the exam's name or its path already names the body);
 *   - which of two exams had the higher first-time pass rate in the same year, and which of four the lowest
 *     (first-time cohorts only, and only with a clear gap, eight points for two and five for four).
 * A new row: an exam added to the file, with its org and a first-time pass rate, joins these on the next build.
 * Where the exam has a specialty card of its own in the Career Tree (career-tree.json, meta.specialtyCerts), the
 * answer links to it the way build-vital-stats.js links the ACCS: 'ct|cred=<face>|the <face> card'.
 */
const { readJson, rngFrom, commas, kOf, idOf, withDistractors } = require('../lib');

const reads = ['src/assets/data/career-tree-creds.json', 'src/assets/data/career-tree.json'];

const short = (org) => String(org).split(' (')[0].trim();
/** an organization on a key: "ETS / ASHA" would read as two keys, so it says "ETS and ASHA" */
const orgKey = (org) => String(org).replace(/\s*\/\s*/g, ' and ');
const examName = (c) => (/\b(exam|examination|certification)\b/i.test(c.exam) ? `the ${c.exam}` : `the ${c.exam} exam`);

function build(ctx) {
  const C = readJson(reads[0]);
  const tree = readJson(reads[1]);
  const ck = C.meta && C.meta.updated;
  if (!ck) return [];
  const faces = new Set(((tree.meta || {}).specialtyCerts || []).map((s) => s.face));
  const faceOf = {};
  for (const [face, key] of Object.entries(C.faceMap || {})) if (faces.has(face)) faceOf[key] = face;
  const list = Object.entries(C.credentials).map(([key, c]) => ({ key, ...c })).filter((c) => c.org && c.exam && typeof c.pass === 'number');
  const out = [];
  const r = rngFrom('huddle|cr');
  const see = (c) => (faceOf[c.key] ? `ct|cred=${encodeURIComponent(faceOf[c.key])}|the ${faceOf[c.key]} card` : undefined);
  const yrOf = (c) => Number(c.passYear) || Number(String(ck).slice(0, 4));

  // which organization gives the exam
  const orgs = [...new Set(list.map((c) => c.org))];
  for (const c of list) {
    const s = short(c.org);
    if (c.exam.includes(s) || String(c.chain || '').includes(s)) continue;          // the question would give it away
    const p = withDistractors(r, c.org, orgs, 4, (x) => short(x) !== s);
    if (!p) continue;
    out.push({ z: 'prv', f: 'Exam boards', src: `${c.org}, ${c.exam} report`, url: c.url, yr: yrOf(c), ck,
      id: 'cr-body-' + idOf(c.key), k: kOf('cr', 'body', c.key), d: 2, t: 'choice',
      q: `Which organization gives ${examName(c)}?`, sub: c.chain ? `The path: ${c.chain}.` : undefined, o: p.o.map(orgKey), a: p.a,
      why: `${c.org} reported a pass rate of ${commas(c.pass, Number.isInteger(c.pass) ? 0 : 1)} percent for ${c.passYear} (${c.cohort}).`, see: see(c) });
  }

  // first-time pass rates, compared inside one year
  // the TMC's rate is at one of its two cut scores, so it never stands beside a single-score exam
  const firstTime = list.filter((c) => /first/i.test(String(c.cohort)) && !/cut/i.test(String(c.cohort)) && !c.passLabel && Number(c.passYear));
  const years = [...new Set(firstTime.map((c) => Number(c.passYear)))].sort();
  const label = (c) => `${c.exam} (${short(c.org)})`;
  const pct = (v) => commas(v, Number.isInteger(v) ? 0 : 1) + '%';
  for (const y of years) {
    const rows = firstTime.filter((c) => Number(c.passYear) === y);
    if (rows.length < 4) continue;
    const lo = Math.min(...rows.map((c) => c.pass)), hi = Math.max(...rows.map((c) => c.pass));
    const hint = `First-time rates in ${y} ran from ${pct(lo)} to ${pct(hi)}.`;
    // THE EXPLANATION (2026-10-20, DH12): the lowest exam's place among every first-time rate on file for the year
    const lowWhy = (c, all) => { const top = all.filter((x) => x.pass === hi).map((x) => x.exam);
      return `${c.exam} passed ${pct(c.pass)} of first-time takers in ${y}; of the ${all.length} exams on file that year, ${top.join(' and ')} passed the most, ${pct(hi)}.`; };
    const base = { z: 'prv', f: 'Exams', src: 'Each exam body\'s own pass-rate report, from the Career Tree\'s credential data', yr: y, ck,
      sub: 'First-time takers, from each exam body\'s own report.' };
    for (let n = 0, tries = 0; n < 6 && tries < 300; tries++) {
      const two = r.shuffle(rows).slice(0, 2);
      if (Math.abs(two[0].pass - two[1].pass) < 8) continue;
      const ans = two[0].pass > two[1].pass ? 0 : 1;
      out.push({ ...base, id: `cr-pass-${y}-two-${n}`, k: kOf('cr', 'pass', y), d: 2, t: 'choice',
        q: `Which exam had the higher first-time pass rate in ${y}?`, o: two.map(label), a: ans, v: two.map((c) => pct(c.pass)), h: hint, url: two[ans].url,
        why: `${two[ans].exam} passed ${pct(two[ans].pass)} of first-time takers in ${y} and ${two[1 - ans].exam} ${pct(two[1 - ans].pass)}, each by its own body's report.` });
      n++;
    }
    for (let n = 0, tries = 0; n < 4 && tries < 300; tries++) {
      const four = r.shuffle(rows).slice(0, 4);
      const vals = four.map((c) => c.pass), best = Math.min(...vals), rest = vals.filter((v) => v !== best);
      if (rest.length !== 3 || Math.min(...rest) - best < 5) continue;
      const ans = vals.indexOf(best);
      out.push({ ...base, id: `cr-passlow-${y}-four-${n}`, k: kOf('cr', 'passlow', y), d: 3, t: 'choice',
        q: `Which of these exams had the lowest first-time pass rate in ${y}?`, o: four.map(label), a: ans, v: four.map((c) => pct(c.pass)), h: hint,
        url: four[ans].url, why: lowWhy(four[ans], rows) });
      n++;
    }
  }

  // an exam's own first-time pass rate, where Vital Stats does not ask it already (its ids are pass-<key>)
  const asked = new Set(ctx.vs.filter((q) => /^pass-/.test(q.id)).map((q) => q.id.slice(5)));
  for (const c of firstTime) {
    if (asked.has(c.key)) continue;
    const cohort = String(c.cohort).replace(/^./, (x) => x.toUpperCase());
    out.push({ z: 'prv', f: 'Exams', src: `${c.org}, ${c.exam} pass-rate report`, url: c.url, yr: Number(c.passYear), ck,
      id: 'cr-rate-' + idOf(c.key), k: kOf('cr', 'rate', c.key), d: 3, t: 'number',
      q: `What percent of first-time takers passed ${examName(c)} in ${c.passYear}?`, sub: `${cohort}, by ${c.org}'s own report.`,
      a: c.pass, tol: 0.1, pre: '', suf: '%', dp: Number.isInteger(c.pass) ? 0 : 1, unit: 'percent',
      why: c.note || `That is ${c.org}'s own figure for ${c.passYear} (${c.cohort}).`, see: see(c) });
  }
  return out;
}

module.exports = { name: 'credentials', prefix: 'cr-', reads, build };
