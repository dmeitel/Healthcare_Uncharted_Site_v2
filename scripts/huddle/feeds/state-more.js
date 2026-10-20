'use strict';
/**
 * FEED: more of the Patient measures on the Population Health Map, for the states the earlier feeds left (2026-10-20,
 * bank version 3).
 *
 * Reads: what the state feed reads (src/_data/metricsConfig.json, stateData.json, dataYears.json, through
 * state-metrics.js, measures) and what the county feed reads (through counties.js, askCounties), and Vital Stats' bank
 * for the state numbers the builder's TEMPLATES ask. Every question here has the same words, source and rules as the
 * one its form already asks; it only reaches the states those feeds did not draw, so the Patient zone has room for a
 * 60-day memory without a new kind of question. For each Patient measure a pull refreshed (the uninsured rate, the
 * routine checkup and Medicare telehealth use):
 *   - where six more states fall when the fifty are ranked;
 *   - six more states' own numbers;
 *   - up to six more "which of these counties" and six more "which of two counties", in states not asked yet.
 * A new row: a Patient measure a pull refreshes joins these on the next build.
 */
const { rngFrom, STATES, FIFTY, keyName, idOf, kOf, ordinal, median, hintOK } = require('../lib');
const { measures, rangeWhy } = require('./state-metrics');
const { askCounties } = require('./counties');

const reads = ['src/_data/metricsConfig.json', 'src/_data/stateData.json', 'src/_data/dataYears.json', 'src/assets/data/countyData.json',
  'src/assets/data/vital-stats-questions.json'];

function build(ctx) {
  const fed = new Set((ctx.fed || []).map((q) => q.id));
  const old = new Set((ctx.old || []).map((q) => q.id));
  const out = [];
  const pats = measures(ctx).filter((m) => m.z === 'pat' && m.fresh && m.S && m.it.unit !== 'Y/N');
  for (const m of pats) {
    const { it, lens, vals, y, slug, W, T, base, S, what } = m;
    const id0 = idOf(it.id.split('/')[1]);
    const see = (st) => 'plm|lens=' + lens + '&metric=' + slug + (st ? '&state=' + st : '') + '|' + (st ? STATES[st] : 'every state');
    const rows = FIFTY.filter((s) => typeof vals[s] === 'number' && Number.isFinite(vals[s])).map((s) => ({ st: s, v: vals[s] }));
    if (rows.length < 40) continue;
    const hint = `Fifty-state median: ${S.fmt(median(rows.map((r) => r.v)))}.`;
    const r = rngFrom('huddle|sx|' + it.id);

    // ── where a state falls (the state feed's rule: place 1 is the best end, never a state near a line) ──
    const sorted = rows.slice().sort((a, b) => b.v - a.v || a.st.localeCompare(b.st));
    const first = it.dir === -1 ? 'lowest' : 'highest';
    const ranked = first === 'highest' ? sorted : sorted.slice().reverse();
    const place = (x) => 1 + ranked.filter((z) => (first === 'highest' ? z.v > x.v : z.v < x.v)).length;
    const BUCKETS = [[1, 10], [11, 25], [26, 40], [41, 50]], EDGE = [10, 11, 25, 26, 40, 41];
    const bucketOf = (p) => BUCKETS.findIndex(([a, b]) => p >= a && p <= b);
    const safe = ranked.filter((x) => { const p = place(x), last = p + ranked.filter((z) => z.v === x.v).length - 1;
      return bucketOf(p) === bucketOf(last) && !EDGE.includes(p) && !EDGE.includes(last) && !fed.has(`sm-${id0}-rank-${x.st.toLowerCase()}`); });
    for (const x of r.shuffle(safe).slice(0, 6)) {
      const p = place(x);
      out.push({ ...base, id: `sx-${id0}-rank-${x.st.toLowerCase()}`, k: kOf('sm', it.id, 'rank'), d: 3, t: 'choice',
        q: `Rank the fifty states by ${what}, ${first} first. Where does ${STATES[x.st]} fall?`,
        sub: `Place 1 has the ${first} figure.`, o: BUCKETS.map(([a, b]) => `${a} to ${b}`), a: bucketOf(p),
        why: p === 1 ? `${STATES[x.st]} was first, at ${S.fmt(x.v)}.` : `${STATES[x.st]} placed ${ordinal(p)} at ${S.fmt(x.v)}; ${STATES[ranked[0].st]} was first at ${S.fmt(ranked[0].v)}.`,
        h: hint, see: see(x.st) });
    }

    // ── a state's own number ──
    if (T) {
      // the builder's TEMPLATES ask six states from Vital Stats' own wording; these are six more from the same rows
      const key = Object.keys(ctx.TEMPLATES).find((k) => ctx.TEMPLATES[k] === T);
      const vsRows = ctx.vs.filter((q) => q.k === key && !q.f && q.st && FIFTY.includes(q.st) && !old.has(`${key}-num-${q.st.toLowerCase()}`));
      for (const q0 of rngFrom('huddle|sx|num|' + key).shuffle(vsRows).slice(0, 6)) {
        const q = { ...base, id: `sx-${idOf(key)}-num-${q0.st.toLowerCase()}`, k: kOf('sx', key, 'num'), d: 3, t: 'number', q: q0.q, sub: q0.sub,
          a: q0.a, tol: 0.10, pre: q0.pre || '', suf: q0.suf || '', dp: q0.dp || 0, unit: q0.unit, why: q0.why || rangeWhy(rows, S.fmt, q0.st), see: q0.see || see(q0.st) };
        if (hintOK(q, hint)) q.h = hint;
        out.push(q);
      }
    } else if (W.num) {
      const left = rows.filter((x) => !fed.has(`sm-${id0}-num-${x.st.toLowerCase()}`));
      for (const x of rngFrom('huddle|sx|num|' + it.id).shuffle(left).slice(0, 6)) {
        const q = { ...base, id: `sx-${id0}-num-${x.st.toLowerCase()}`, k: kOf('sm', it.id, 'num'), d: 3, t: 'number', q: W.num(STATES[x.st], y),
          sub: W.sub || (it.sub ? it.sub + '.' : undefined), a: x.v, tol: 0.10, pre: S.pre, suf: S.suf, dp: S.dp, unit: S.unit,
          why: rangeWhy(rows, S.fmt, x.st), see: see(x.st) };
        if (hintOK(q, hint)) q.h = hint;
        out.push(q);
      }
    }
  }

  // ── more counties, in states the county feed did not ask ──
  const skip = new Set();
  for (const m of pats) {
    const id0 = idOf(m.it.id.split('/')[1]);
    for (const st of FIFTY) if (fed.has(`co-${id0}-${st.toLowerCase()}-four-0`) || fed.has(`co-${id0}-${st.toLowerCase()}-two-0`)) skip.add(m.it.id + '|' + st);
  }
  out.push(...askCounties(ctx, { idp: 'sx-co-', seed: 'huddle|sx|co|', only: (m) => m.z === 'pat', skip, cap: 6 }));
  return out;
}

module.exports = { name: 'state-more', prefix: 'sx-', reads, build };
