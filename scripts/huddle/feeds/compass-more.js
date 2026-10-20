'use strict';
/**
 * FEED: more from the Assignment Compass's tax, paycheck and cost files (2026-10-20, bank version 3).
 *
 * Reads: src/assets/data/assignment-compass.json (state income tax specs for the 2025 tax year, the mandatory worker
 * payroll deductions, the federal payroll tax and the standard per diem, and the MERIC cost of living indexes),
 * src/assets/data/assignment-compass-counties.json (each state's combined state and average local sales tax, from the
 * Tax Foundation's 2025 table) and scripts/data/huddle-law-checks.json (the federal figures, checked live).
 * The compass feed (compass.js) asks which states have no wage tax or a flat one, two flat rates against each other, the
 * highest top rate, and the MERIC indexes four, two and top. This asks what it leaves:
 *   - taxes (Policy): each flat-tax state's own rate, the lowest top rate among bracket states, the lowest of four flat
 *     rates, and how many states tax wages each way;
 *   - paychecks (Policy): what each state's paid leave or disability deduction took, and the federal payroll tax, only
 *     where the live check agrees with the compass's federal block;
 *   - per diem (Policy): the federal standard lodging and meals rates, where the live check agrees;
 *   - sales tax (Policy): which of four or two states had the higher combined rate, the top and bottom of the fifty,
 *     and which states had none;
 *   - health care costs (Patient): which of these states sat above (or below) the U.S. average on the MERIC health
 *     index, where a state ranks, and how many sat above it.
 * A new row: a state's tax type or rate, a payroll deduction with a rate, or a new tax year re-deals these.
 */
const { readJson, rngFrom, STATES, FIFTY, keyName, commas, median, joinNames, ordinal, kOf, idOf, fourForm, twoForm, withDistractors, placeOf, whyFor } = require('../lib');

const reads = ['src/assets/data/assignment-compass.json', 'src/assets/data/assignment-compass-counties.json', 'scripts/data/huddle-law-checks.json'];
const SALES_URL = 'https://taxfoundation.org/data/all/state/sales-tax-rates-2025/';

/** a rate as a person writes it: 0.045 -> 4.5%, 0.00388 -> 0.388% */
const rate = (x) => String(Math.round(x * 100000) / 1000) + '%';
/** a dollar amount */
const usd = (x) => '$' + commas(x);
/** four ordered choices with the answer at a seeded place, each step apart; null when the low end would pass `floor` */
function ladder(rng, a, step, floor, fmt) {
  const places = [0, 1, 2, 3].filter((k) => a - k * step >= floor);
  if (!places.length) return null;
  const k = places[Math.floor(rng() * places.length)];
  const vals = [0, 1, 2, 3].map((j) => a + (j - k) * step);
  return { o: vals.map(fmt), a: k };
}

function build() {
  const A = readJson(reads[0]), CO = readJson(reads[1]), L = readJson(reads[2]);
  const M = A._meta || {};
  const out = [];
  const rows50 = FIFTY.filter((s) => A.states[s]).map((s) => ({ st: s, ...A.states[s] }));

  // ── taxes ──
  const taxCk = (String(M.taxSources || '').match(/authored (\d{4}-\d{2}(?:-\d{2})?)/) || [])[1];
  const ty = Number(M.taxYear);
  if (taxCk && ty) {
    const base = { z: 'pol', f: 'Taxes', src: String(M.taxSources).replace(/,? authored \d{4}-\d{2}(-\d{2})?\.?.*$/, ''), yr: ty, ck: taxCk };
    const r = rngFrom('huddle|ax|tax');
    const of = (type) => rows50.filter((x) => x.tax && x.tax.type === type).map((x) => x.st);
    const none = of('none'), flat = of('flat'), brackets = of('brackets');
    const flatRows = flat.map((s) => ({ st: s, v: A.states[s].tax.rate * 100 }));
    const fl = (s) => rate(A.states[s].tax.rate);
    const lo = flatRows.slice().sort((a, b) => a.v - b.v)[0], hi = flatRows.slice().sort((a, b) => b.v - a.v)[0];
    const range = `the ${flat.length} flat rates ran from ${fl(lo.st)} in ${STATES[lo.st]} to ${fl(hi.st)} in ${STATES[hi.st]}`;

    // each flat-tax state's own rate
    for (const st of r.shuffle(flat)) {
      const mine = A.states[st].tax.rate * 100;
      const others = [...new Set(flatRows.map((x) => x.v))].filter((v) => Math.abs(v - mine) >= 0.2);
      if (others.length < 3) continue;
      const vals = [mine, ...r.shuffle(others).slice(0, 3)].sort((a, b) => a - b);
      out.push({ ...base, id: `ax-flatrate-${st.toLowerCase()}`, k: kOf('ax', 'flatrate'), d: 3, t: 'choice',
        q: `What was ${STATES[st]}'s flat income tax rate on wages for the ${ty} tax year?`, o: vals.map((v) => rate(v / 100)), a: vals.indexOf(mine),
        why: `${STATES[st]} taxed wages at one rate, ${fl(st)}; ${range}.`, h: `${flat.length} states use one flat rate.` });
    }
    // the lowest of four flat rates
    const flatWhyLow = (st) => { const p = placeOf(flatRows, st, true);
      return p === 1 ? `${STATES[st]} had the lowest flat rate of the ${flat.length} flat-tax states, ${fl(st)}.` : `Counted from the bottom of the ${flat.length} flat rates, ${STATES[st]}'s ${fl(st)} placed ${ordinal(p)}; ${STATES[lo.st]} had the lowest, ${fl(lo.st)}.`; };
    for (let n = 0, tries = 0; n < 6 && tries < 300; tries++) {
      const four = r.shuffle(flatRows).slice(0, 4);
      const vals = four.map((x) => x.v), best = Math.min(...vals), rest = vals.filter((v) => v !== best);
      if (rest.length !== 3 || Math.min(...rest) - best < 0.4) continue;
      const ans = vals.indexOf(best);
      if (out.some((q) => q.k === kOf('ax', 'flatlow') && q.o[q.a] === keyName(four[ans].st) && q.o.slice().sort().join() === four.map((x) => keyName(x.st)).sort().join())) continue;
      out.push({ ...base, id: `ax-flatlow-four-${n}`, k: kOf('ax', 'flatlow'), d: 2, t: 'choice',
        q: `Of these four flat-tax states, which had the lowest rate on wages for the ${ty} tax year?`, o: four.map((x) => keyName(x.st)), a: ans,
        v: four.map((x) => fl(x.st)), h: `${flat.length} states use one flat rate.`, why: flatWhyLow(four[ans].st) });
      n++;
    }
    // the lowest top rate among the bracket states
    const topOf = (s) => { const b = A.states[s].tax.brackets && A.states[s].tax.brackets.s; return b && b.length ? b[b.length - 1] : null; };
    const topRows = brackets.filter((s) => topOf(s)).map((s) => ({ st: s, v: topOf(s)[1] * 100 }));
    for (let n = 0, tries = 0; n < 6 && tries < 300; tries++) {
      const four = r.shuffle(topRows).slice(0, 4);
      const vals = four.map((x) => x.v), best = Math.min(...vals), rest = vals.filter((v) => v !== best);
      if (rest.length !== 3 || Math.min(...rest) - best < 0.5) continue;
      const ans = vals.indexOf(best), t = topOf(four[ans].st);
      if (out.some((q) => q.k === kOf('ax', 'toplow') && q.o[q.a] === keyName(four[ans].st))) continue;   // a new answer each time
      out.push({ ...base, id: `ax-toplow-four-${n}`, k: kOf('ax', 'toplow'), d: 3, t: 'choice',
        q: `Which of these states had the lowest top income tax rate for the ${ty} tax year?`, sub: 'The rate on the last dollar of a single filer\'s highest bracket.',
        o: four.map((x) => keyName(x.st)), a: ans, v: four.map((x) => rate(x.v / 100)), h: `${brackets.length} states tax income in brackets.`,
        why: `${STATES[four[ans].st]}'s top rate of ${rate(t[1])} applied to a single filer's taxable income over ${usd(t[0])}.` });
      n++;
    }
    // how many states tax wages each way (D.C. taxes in brackets and is not counted)
    const sub = 'Count the states, from 0 to 50. D.C. is not counted.';
    for (const { key, list, words, d, why } of [
      { key: 'none', list: none, words: `have no state income tax on wages for the ${ty} tax year`, d: 2, why: `The ${none.length}: ${joinNames(none.map((s) => STATES[s]))}.` },
      { key: 'flat', list: flat, words: `tax wages at one flat rate for the ${ty} tax year`, d: 3, why: `The ${flat.length}: ${joinNames(flat.map((s) => STATES[s]))}.` },
      { key: 'brackets', list: brackets, words: `tax wages in brackets, with rates that rise with income, for the ${ty} tax year`, d: 3,
        why: `${brackets.length} states and D.C. used brackets; ${none.length} had no wage tax and ${flat.length} one flat rate.` }]) {
      out.push({ ...base, id: `ax-howmany-${key}`, k: kOf('ax', 'howmany'), d, t: 'number', q: `How many states ${words}?`, sub,
        a: list.length, abs: 0.5, pre: '', suf: '', dp: 0, unit: 'states', why });
    }
  }

  // ── paychecks: the state deductions ──
  if (taxCk && ty) {
    const base = { z: 'pol', f: 'Paychecks', src: 'State paid leave and disability programs, 2025 worker rates (the Assignment Compass\'s payroll table)', yr: ty, ck: taxCk };
    const all = [];
    for (const x of rows50) for (const p of x.payroll || []) if (typeof p.rate === 'number' && !p.capAnnual) all.push({ st: x.st, ...p });
    const r = rngFrom('huddle|ax|payroll');
    for (const p of all) {
      const mine = p.rate * 100;
      const others = [...new Set(all.map((x) => x.rate * 100))].filter((v) => Math.abs(v - mine) >= 0.1);
      if (others.length < 3) continue;
      const vals = [mine, ...r.shuffle(others).slice(0, 3)].sort((a, b) => a - b);
      const first = String(p.note || '').split(/[.,]/)[0].trim();
      out.push({ ...base, id: `ax-payroll-${idOf(p.label)}`, k: kOf('ax', 'payroll'), d: 3, t: 'choice',
        q: `In ${ty}, what share of a worker's wages did ${STATES[p.st]} take for ${p.label}?`,
        sub: first && !/\d/.test(first) ? first + '.' : undefined, o: vals.map((v) => rate(v / 100)), a: vals.indexOf(mine),
        why: `${p.label} took ${rate(p.rate)} of wages in ${ty}${p.base ? `, on the first ${usd(p.base)} of a year's pay` : ''}.` });
    }
  }

  // ── paychecks and per diem: the federal figures, where the live check agrees ──
  const F = (A.federal || {}).fica, K = L['fica-2025'];
  if (F && K && F.ssRate === K.ssRate && F.medicare === K.medicare && F.addlMedicare === K.addlMedicare && F.ssBase === K.ssBase && F.addlStart && F.addlStart.s === K.addlStartSingle) {
    const base = { z: 'pol', f: 'Paychecks', src: K.src, url: K.url, yr: K.yr, ck: K.ck };
    const r = rngFrom('huddle|ax|fica');
    const four = (list, right) => { const o = r.shuffle(list); return { o: o.map((x) => rate(x)), a: o.indexOf(right) }; };
    let p = four([K.ssRate, K.medicare, K.ssRate + K.medicare, 2 * K.ssRate], K.ssRate);
    out.push({ ...base, id: 'ax-fica-ss', k: kOf('ax', 'fica', 'ss'), d: 1, t: 'choice', q: `What share of an employee's wages went to Social Security tax in ${K.yr}?`,
      sub: 'The employee\'s share. The employer pays a matching share.', o: p.o, a: p.a,
      why: `Employees paid ${rate(K.ssRate)} on wages up to ${usd(K.ssBase)} in ${K.yr}, and employers matched it; Medicare took another ${rate(K.medicare)} with no cap.` });
    p = four([K.addlMedicare, K.medicare, 2 * K.medicare, K.ssRate], K.medicare);
    out.push({ ...base, id: 'ax-fica-medicare', k: kOf('ax', 'fica', 'medicare'), d: 2, t: 'choice', q: `What share of an employee's wages went to Medicare tax in ${K.yr}?`,
      sub: 'The employee\'s share, before the Additional Medicare tax. The employer pays a matching share.', o: p.o, a: p.a,
      why: `Employees paid ${rate(K.medicare)} of all wages, matched by the employer; above ${usd(K.addlStartSingle)} a year, employers withhold another ${rate(K.addlMedicare)}.` });
    const b = ladder(r, K.ssBase, 8000, 100000, usd);
    if (b) out.push({ ...base, src: K.ssBaseSrc, url: K.ssBaseUrl, id: 'ax-fica-base', k: kOf('ax', 'fica', 'base'), d: 3, t: 'choice',
      q: `Social Security tax applied to an employee's wages up to what amount in ${K.yr}?`, o: b.o, a: b.a,
      why: `Social Security tax stopped at ${usd(K.ssBase)} of wages in ${K.yr}, which capped an employee's share at $${commas(K.ssBase * K.ssRate, 2)}.` });
    const t = ladder(r, K.addlStartSingle, 50000, 100000, usd);
    if (t) out.push({ ...base, id: 'ax-fica-addl', k: kOf('ax', 'fica', 'addl'), d: 3, t: 'choice',
      q: `Employers withhold the ${rate(K.addlMedicare)} Additional Medicare tax once an employee's wages for the year pass what amount?`, o: t.o, a: t.a,
      why: `Employers withhold it on wages over ${usd(K.addlStartSingle)} in a calendar year, whatever the employee's filing status.` });
  }
  const G = M.conusStandard, GK = L['gsa-fy2026'];
  if (G && GK && G.fy === GK.fy && G.lodging === GK.lodging && G.mie === GK.mie) {
    const base = { z: 'pol', f: 'Per diem', src: GK.src, url: GK.url, yr: GK.yr, ck: GK.ck };
    const r = rngFrom('huddle|ax|perdiem');
    const sub = 'Federal fiscal year 2026 ran from October 1, 2025 to September 30, 2026.';
    const lodge = ladder(r, G.lodging, 15, 50, usd), meals = ladder(r, G.mie, 6, 30, usd);
    if (lodge) out.push({ ...base, id: 'ax-perdiem-lodging', k: kOf('ax', 'perdiem', 'lodging'), d: 3, t: 'choice',
      q: `What was the federal standard per diem for lodging in fiscal year ${G.fy}, in places without a higher rate of their own?`, sub, o: lodge.o, a: lodge.a,
      why: `GSA held the standard lodging rate at ${usd(G.lodging)} a night for fiscal ${G.fy}, unchanged from the year before; the meals and incidentals rate stayed at ${usd(G.mie)} a day.` });
    if (meals) out.push({ ...base, id: 'ax-perdiem-meals', k: kOf('ax', 'perdiem', 'meals'), d: 2, t: 'choice',
      q: `What was the federal standard daily rate for meals and incidentals in fiscal year ${G.fy}?`, sub, o: meals.o, a: meals.a,
      why: `GSA kept the standard meals and incidentals rate at ${usd(G.mie)} a day for fiscal ${G.fy}, with the standard lodging rate at ${usd(G.lodging)}.` });
  }

  // ── sales tax ──
  const SM = CO._meta || {};
  if (SM.retrieved && /2025/.test(String(SM.salesTaxSource))) {
    const rows = FIFTY.filter((s) => CO.states[s] && typeof CO.states[s].s === 'number').map((s) => ({ st: s, v: CO.states[s].s }));
    const fmt = (v) => commas(Math.round(v * 10 + 1e-9) / 10, 1) + '%';
    const base = { z: 'pol', f: 'Sales tax', src: 'Tax Foundation, State and Local Sales Tax Rates, 2025 (the Assignment Compass\'s county file)', url: SALES_URL, yr: 2025, ck: String(SM.retrieved),
      sub: 'The state rate plus the average local rate, as of January 1, 2025.' };
    const what = 'combined state and average local sales tax rate on January 1, 2025';
    const hint = `Fifty-state median: ${fmt(median(rows.map((x) => x.v)))}.`;
    const r = rngFrom('huddle|ax|sales');
    out.push(...fourForm({ rows, fmt, dp: 1, rng: r, idp: 'ax-sales', k: kOf('ax', 'sales', 'four'), what, low: true, base, hint, why: whyFor(rows, fmt) }));
    out.push(...twoForm({ rows, fmt, dp: 1, rng: r, idp: 'ax-sales', k: kOf('ax', 'sales', 'two'), what, base, hint, why: whyFor(rows, fmt) }));
    const sorted = rows.slice().sort((a, b) => b.v - a.v || a.st.localeCompare(b.st));
    for (const dir of ['hi']) {
      const top = sorted[0];
      const apart = sorted.filter((x) => top.v - x.v >= 0.3);
      const p = withDistractors(r, top, apart, 4);
      if (!p) continue;
      out.push({ ...base, id: `ax-sales-top-${dir}`, k: kOf('ax', 'sales', 'top'), d: 2, t: 'choice', q: `Of all fifty states, which had the highest ${what}?`,
        o: p.o.map((x) => keyName(x.st)), a: p.a, v: p.o.map((x) => fmt(x.v)), h: hint,
        why: `${STATES[top.st]} was highest at ${fmt(top.v)}; ${STATES[sorted[1].st]} was next at ${fmt(sorted[1].v)}.` });
    }
    const zero = rows.filter((x) => x.v === 0).map((x) => x.st), taxed = rows.filter((x) => x.v >= 5).map((x) => x.st);
    for (const st of zero) {
      const p = withDistractors(r, st, taxed, 4);
      out.push({ ...base, id: `ax-sales-none-${st.toLowerCase()}`, k: kOf('ax', 'sales', 'none'), d: 1, t: 'choice',
        q: 'Which of these states had a combined state and local sales tax rate of zero on January 1, 2025?', o: p.o.map(keyName), a: p.a,
        why: `The Tax Foundation's table put the combined rate at zero in ${zero.length} states: ${joinNames(zero.map((s) => STATES[s]))}.` });
    }
  }

  // ── health care costs on the MERIC index (Patient) ──
  const keys = Array.isArray(M.colKeys) ? M.colKeys : [];
  const hi = keys.indexOf('health');
  const quarter = (String(M.colSource || '').match(/(Q[1-4] 20\d{2})/) || [])[1];
  const colYr = Number((String(M.colSource || '').match(/(20\d{2})/) || [])[1]);
  if (hi >= 0 && quarter && colYr && M.colRetrieved) {
    const rows = rows50.filter((x) => Array.isArray(x.col) && typeof x.col[hi] === 'number').map((x) => ({ st: x.st, v: x.col[hi] }));
    const fmt = (v) => commas(v, 1);
    const sub = 'An index: 100 is the U.S. average, 120 is 20 percent above it.';
    const base = { z: 'pat', f: 'Care costs', src: M.colSource, yr: colYr, ck: M.colRetrieved, sub };
    const above = rows.filter((x) => x.v >= 102), below = rows.filter((x) => x.v <= 98), over = rows.filter((x) => x.v > 100);
    const r = rngFrom('huddle|ax|health');
    for (const { key, right, wrong, n } of [{ key: 'above', right: above, wrong: below, n: 8 }, { key: 'below', right: below, wrong: above, n: 6 }]) {
      const words = key;
      for (const x of r.shuffle(right).slice(0, n)) {
        const p = withDistractors(r, x, wrong, 4);
        out.push({ ...base, id: `ax-health-${key}-${x.st.toLowerCase()}`, k: kOf('ax', 'health', key), d: 2, t: 'choice',
          q: `Which of these states had health care costs ${words} the U.S. average on the MERIC index (${quarter})?`, o: p.o.map((y) => keyName(y.st)), a: p.a,
          v: p.o.map((y) => fmt(y.v)), why: `${STATES[x.st]} stood at ${fmt(x.v)}; ${over.length} of the fifty states sat above 100.` });
      }
    }
    // where a state falls, never near a line
    const sorted = rows.slice().sort((a, b) => b.v - a.v || a.st.localeCompare(b.st));
    const place = (x) => 1 + sorted.filter((y) => y.v > x.v).length;
    const BUCKETS = [[1, 10], [11, 25], [26, 40], [41, 50]], EDGE = [10, 11, 25, 26, 40, 41];
    const bucketOf = (p) => BUCKETS.findIndex(([a, b]) => p >= a && p <= b);
    const safe = sorted.filter((x) => { const p = place(x), last = p + sorted.filter((y) => y.v === x.v).length - 1; return bucketOf(p) === bucketOf(last) && !EDGE.includes(p) && !EDGE.includes(last); });
    for (const x of r.shuffle(safe).slice(0, 6)) {
      const p = place(x);
      out.push({ ...base, id: `ax-health-rank-${x.st.toLowerCase()}`, k: kOf('ax', 'health', 'rank'), d: 3, t: 'choice',
        q: `Rank the fifty states by the cost of health care on the MERIC index (${quarter}), highest first. Where does ${STATES[x.st]} fall?`,
        sub: 'Place 1 has the highest cost.', o: BUCKETS.map(([a, b]) => `${a} to ${b}`), a: bucketOf(p),
        why: `${STATES[x.st]} placed ${ordinal(p)} at ${fmt(x.v)}; ${STATES[sorted[0].st]} was highest at ${fmt(sorted[0].v)} and ${STATES[sorted[sorted.length - 1].st]} lowest at ${fmt(sorted[sorted.length - 1].v)}.` });
    }
    out.push({ ...base, id: 'ax-health-count', k: kOf('ax', 'health', 'count'), d: 3, t: 'number',
      q: `In how many of the fifty states was health care costlier than the U.S. average on the MERIC index (${quarter})?`,
      sub: 'Count the states over 100, from 0 to 50. D.C. is not counted.', a: over.length, abs: 0.5, pre: '', suf: '', dp: 0, unit: 'states',
      why: `${STATES[sorted[0].st]} was highest at ${fmt(sorted[0].v)} and ${STATES[sorted[sorted.length - 1].st]} lowest at ${fmt(sorted[sorted.length - 1].v)}.` });
  }
  return out;
}

module.exports = { name: 'compass-more', prefix: 'ax-', reads, build };
