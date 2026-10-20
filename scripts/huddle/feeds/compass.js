'use strict';
/**
 * FEED: the Assignment Compass's state taxes and living costs (2026-10-18).
 *
 * Reads: src/assets/data/assignment-compass.json. Its _meta carries the tax year and where the tax tables came from
 * ("authored 2026-08" is the check date), and the MERIC cost of living source with its retrieved date (colRetrieved).
 * Asks:
 *   - taxes (Policy): which of these states has no income tax on wages, which taxes income at one flat rate, which of
 *     two flat states has the higher rate, which of four states has the highest top rate;
 *   - living costs (Payer, health care costs under Patient): for each MERIC index the file carries (colKeys), which of
 *     four states is highest or lowest, which of two is higher, and which state is highest of all fifty.
 * A new row: a state's tax type or rate, or a new index in colKeys with a line in INDEX, changes these on the next build.
 */
const { readJson, rngFrom, STATES, FIFTY, keyName, commas, median, joinNames, kOf, idOf, fourForm, twoForm, withDistractors } = require('../lib');

const reads = ['src/assets/data/assignment-compass.json'];

/** what each MERIC index is called in a question, and where it lands; an index with no line here is not asked */
const INDEX = {
  overall: { what: 'overall cost of living', z: 'pay', f: 'Living costs' },
  health: { what: 'cost of health care', z: 'pat', f: 'Care costs' },
  housing: { what: 'cost of housing', z: 'pay', f: 'Living costs' },
  grocery: { what: 'cost of groceries', z: 'pay', f: 'Living costs' },
  utilities: { what: 'cost of utilities', z: 'pay', f: 'Living costs' },
  transportation: { what: 'cost of transportation', z: 'pay', f: 'Living costs' }
};

function build() {
  const A = readJson(reads[0]);
  const M = A._meta || {};
  const out = [];
  const rows50 = FIFTY.filter((s) => A.states[s]).map((s) => ({ st: s, ...A.states[s] }));

  // ── taxes ──
  const taxCk = (String(M.taxSources || '').match(/authored (\d{4}-\d{2}(?:-\d{2})?)/) || [])[1];
  if (taxCk && M.taxYear) {
    const ty = Number(M.taxYear);
    const base = { z: 'pol', f: 'Taxes', src: String(M.taxSources).replace(/,? authored \d{4}-\d{2}(-\d{2})?\.?.*$/, ''), yr: ty, ck: taxCk };
    const r = rngFrom('huddle|ac|tax');
    const none = rows50.filter((x) => x.tax && x.tax.type === 'none').map((x) => x.st);
    const flat = rows50.filter((x) => x.tax && x.tax.type === 'flat').map((x) => x.st);
    const brackets = rows50.filter((x) => x.tax && x.tax.type === 'brackets').map((x) => x.st);
    // a bracket state some would call flat (one rate above an exempt first slice, or a flat rate plus a surtax) is never
    // the wrong answer to "which taxes at one flat rate"
    const nearFlat = (st) => { const t = A.states[st].tax, b = (t.brackets && t.brackets.s) || [];
      return new Set(b.map((x) => x[1]).filter((x) => x > 0)).size <= 1 || /surtax/i.test((t.notes || []).join(' ')); };
    const pct = (v) => commas(v * 100, v * 100 % 1 ? 2 : 0).replace(/(\.\d)0$/, '$1') + '%';
    for (const st of r.shuffle(none).slice(0, 8)) {
      const p = withDistractors(r, st, flat.concat(brackets), 4);
      out.push({ ...base, id: 'ac-notax-' + st.toLowerCase(), k: kOf('ac', 'notax'), d: 1, t: 'choice',
        q: `Which of these states has no state income tax on wages for the ${ty} tax year?`, o: p.o.map(keyName), a: p.a,
        why: `The ${none.length} states with no tax on wages: ${joinNames(none.map((s) => STATES[s]))}.`, h: `${none.length} states have none.` });
    }
    for (const st of r.shuffle(flat).slice(0, 8)) {
      const p = withDistractors(r, st, brackets.filter((s) => !nearFlat(s)).concat(none), 4);
      out.push({ ...base, id: 'ac-flat-' + st.toLowerCase(), k: kOf('ac', 'flat'), d: 2, t: 'choice',
        q: `Which of these states taxes wages at one flat rate for the ${ty} tax year?`, o: p.o.map(keyName), a: p.a,
        why: `${STATES[st]} taxes income at a flat ${pct(A.states[st].tax.rate)}.`, h: `${flat.length} states use one flat rate.` });
    }
    // which flat rate is higher (a clear half point apart)
    const flatRows = flat.map((s) => ({ st: s, v: A.states[s].tax.rate * 100 }));
    for (let n = 0, tries = 0; n < 6 && tries < 200; tries++) {
      const two = r.shuffle(flatRows).slice(0, 2);
      if (Math.abs(two[0].v - two[1].v) < 0.5) continue;
      const ans = two[0].v > two[1].v ? 0 : 1;
      out.push({ ...base, id: `ac-flatrate-two-${n}`, k: kOf('ac', 'flatrate'), d: 2, t: 'choice',
        q: `Both of these states tax income at one flat rate. Which rate was higher for the ${ty} tax year?`, o: two.map((x) => keyName(x.st)), a: ans,
        v: two.map((x) => pct(x.v / 100)), h: `Flat rates ran from ${pct(Math.min(...flatRows.map((x) => x.v)) / 100)} to ${pct(Math.max(...flatRows.map((x) => x.v)) / 100)}.` });
      n++;
    }
    // the highest top rate among states with brackets (a clear point apart)
    const topRate = (s) => { const t = A.states[s].tax; const b = t.brackets && t.brackets.s; return b && b.length ? b[b.length - 1][1] * 100 : null; };
    const topRows = brackets.map((s) => ({ st: s, v: topRate(s) })).filter((x) => x.v != null);
    for (let n = 0, tries = 0; n < 8 && tries < 300; tries++) {
      const four = r.shuffle(topRows).slice(0, 4);
      const vals = four.map((x) => x.v), best = Math.max(...vals), rest = vals.filter((v) => v !== best);
      if (rest.length !== 3 || best - Math.max(...rest) < 1) continue;
      const ans = vals.indexOf(best);
      out.push({ ...base, id: `ac-toprate-four-${n}`, k: kOf('ac', 'toprate'), d: 3, t: 'choice',
        q: `Which of these states had the highest top income tax rate for the ${ty} tax year?`, sub: 'The rate on the last dollar of a single filer\'s highest bracket.',
        o: four.map((x) => keyName(x.st)), a: ans, v: four.map((x) => pct(x.v / 100)), h: `${brackets.length} states tax income in brackets.` });
      n++;
    }
  }

  // ── living costs (MERIC) ──
  const colCk = M.colRetrieved, colSrc = M.colSource;
  const keys = Array.isArray(M.colKeys) ? M.colKeys : [];
  const colYr = Number((String(colSrc || '').match(/(20\d{2})/) || [])[1]);
  const quarter = (String(colSrc || '').match(/(Q[1-4] 20\d{2})/) || [])[1];
  if (colCk && colSrc && colYr && quarter) {
    keys.forEach((key, i) => {
      const I = INDEX[key];
      if (!I) return;
      const rows = rows50.filter((x) => Array.isArray(x.col) && typeof x.col[i] === 'number').map((x) => ({ st: x.st, v: x.col[i] }));
      if (rows.length < 40) return;
      const fmt = (v) => commas(v, 1);
      const base = { z: I.z, f: I.f, src: colSrc, yr: colYr, ck: colCk, sub: 'An index: 100 is the U.S. average, 120 is 20 percent above it.' };
      const what = `${I.what} on the MERIC index (${quarter})`;
      const hint = `Fifty-state median: ${fmt(median(rows.map((x) => x.v)))}.`;
      const r = rngFrom('huddle|ac|' + key);
      const idp = 'ac-' + idOf(key);
      out.push(...fourForm({ rows, fmt, dp: 1, rng: r, idp, k: kOf('ac', key, 'four'), what, low: true, base, hint }));
      out.push(...twoForm({ rows, fmt, dp: 1, rng: r, idp, k: kOf('ac', key, 'two'), what, base, hint }));
      const sorted = rows.slice().sort((a, b) => b.v - a.v || a.st.localeCompare(b.st));
      for (const dir of ['hi', 'lo']) {
        const order = dir === 'hi' ? sorted : sorted.slice().reverse();
        const top = order[0];
        if (order[1].v === top.v) continue;
        const apart = order.filter((x) => Math.abs(x.v - top.v) >= Math.max(Math.abs(top.v) * 0.03, 0.3));
        const p = withDistractors(r, top, apart, 4);
        if (!p) continue;
        out.push({ ...base, id: `${idp}-top-${dir}`, k: kOf('ac', key, 'top'), d: 2, t: 'choice',
          q: `Of all fifty states, which had the ${dir === 'hi' ? 'highest' : 'lowest'} ${what}?`, o: p.o.map((x) => keyName(x.st)), a: p.a,
          v: p.o.map((x) => fmt(x.v)), h: hint,
          why: `${STATES[top.st]} was ${dir === 'hi' ? 'highest' : 'lowest'} at ${fmt(top.v)}; ${STATES[order[1].st]} was next at ${fmt(order[1].v)}.` });
      }
    });
  }
  return out;
}

module.exports = { name: 'compass', prefix: 'ac-', reads, build };
