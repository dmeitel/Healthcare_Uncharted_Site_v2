'use strict';
/**
 * FEED: state laws on the Population Health Map's policy lens, where a live check agrees (2026-10-20, bank version 3).
 *
 * Reads: src/_data/metricsConfig.json and src/_data/stateData.json (the map's policy measures), scripts/data/
 * huddle-law-checks.json (each law checked live, with its source, a quote and the day it was read) and
 * scripts/data/vital-stats-curated.json (the Medicaid expansion count Vital Stats checked live).
 * The policy lens was hand-entered in 2025, and the state feed (state-metrics.js) asks only what a pull refreshed or a
 * live count backs. This feed asks a measure only when every state's value on the map matches the live check; one state
 * out of step and the measure asks nothing, so the map and the question can never disagree.
 * Asks:
 *   - nurse practitioner practice (AANP's 2026 map): which of these states gives full practice authority, which
 *     restricts it to career-long supervision, which requires a career-long collaborative agreement, which does not
 *     give full practice, which of two does, and how many states give it;
 *   - Medicaid expansion: the "has adopted" and "has not" questions for the states the state feed did not ask, and
 *     which of two has adopted it.
 * A new row: a law added to huddle-law-checks.json with a WORDS line here, checked against the map's own values.
 */
const { readJson, rngFrom, STATES, FIFTY, keyName, kOf, joinNames, mapSlug, withDistractors, dateWords } = require('../lib');

const reads = ['src/_data/metricsConfig.json', 'src/_data/stateData.json', 'scripts/data/huddle-law-checks.json', 'scripts/data/vital-stats-curated.json', 'src/_data/dataYears.json'];

/** a value of the map's policy measure, read by its id */
function measure(cfg, data, id) {
  const items = (cfg.policy || {}).items || [];
  const i = items.findIndex((x) => x.id === id);
  return i < 0 ? null : { it: items[i], vals: (data.policy || {})[String(i)] || {}, index: String(i) };
}

function build(ctx) {
  const cfg = readJson(reads[0]), data = readJson(reads[1]), checks = readJson(reads[2]), curated = readJson(reads[3]).questions;
  const out = [];
  const see = (it, st) => `plm|lens=policy&metric=${mapSlug(it.name)}&state=${st}|${STATES[st]}`;

  // ── nurse practitioner practice ──
  const np = measure(cfg, data, 'policy/np-scope'), C = checks['np-scope'];
  if (np && C) {
    const TIER = { 3: 'full', 2: 'reduced', 1: 'restricted' };
    const all = FIFTY.concat(['DC']);
    const agrees = all.every((st) => (C[TIER[np.vals[st]]] || []).includes(st));
    if (agrees) {
      const full = FIFTY.filter((s) => C.full.includes(s)), reduced = FIFTY.filter((s) => C.reduced.includes(s)), restricted = FIFTY.filter((s) => C.restricted.includes(s));
      const base = { z: 'pol', f: 'NP practice', src: C.src, url: C.url, yr: C.yr, ck: C.ck };
      const asOf = dateWords(String(C.asOf).replace(/^(\d{2})\/(\d{4})$/, '$2-$1'));   // '05/2026' -> 'May 2026'
      const r = rngFrom('huddle|sl|np');
      const names = (list) => joinNames(list.map((s) => STATES[s]));
      const FULL = 'Full practice: NPs evaluate, diagnose, order tests and prescribe under the state board of nursing alone.';
      const forms = [
        { key: 'full', right: full, wrong: reduced.concat(restricted), n: 8, d: 2, sub: FULL,
          q: 'On AANP\'s 2026 map, which of these states gives nurse practitioners full practice authority?',
          why: (st) => `${STATES[st]} is one of ${full.length} states, plus D.C., that AANP's ${asOf} map lists as full practice.` },
        { key: 'restricted', right: restricted, wrong: full.concat(reduced), n: 8, d: 2,
          sub: 'Restricted practice: state law requires career-long supervision, delegation or team management by another provider.',
          q: 'On AANP\'s 2026 map, which of these states restricts nurse practitioners to career-long supervision by another provider?',
          why: () => `AANP's ${asOf} map lists ${restricted.length} restricted states: ${names(restricted)}.` },
        { key: 'reduced', right: reduced, wrong: full.concat(restricted), n: 6, d: 3,
          sub: 'Reduced practice: state law requires a career-long collaborative agreement with another provider, or limits a setting.',
          q: 'On AANP\'s 2026 map, which of these states requires nurse practitioners to keep a career-long collaborative agreement?',
          why: () => `AANP's ${asOf} map lists ${reduced.length} reduced-practice states: ${names(reduced)}.` },
        { key: 'notfull', right: reduced.concat(restricted), wrong: full, n: 6, d: 2, sub: FULL,
          q: 'On AANP\'s 2026 map, which of these states does NOT give nurse practitioners full practice authority?',
          why: (st) => `AANP's ${asOf} map lists ${STATES[st]} as ${C.reduced.includes(st) ? 'reduced' : 'restricted'} practice; ${full.length} states and D.C. are full practice.` }
      ];
      for (const F of forms) {
        // Utah first where it is a right answer (David's state), then the rest in the seed's order
        const picks = [...F.right.filter((s) => s === 'UT'), ...r.shuffle(F.right.filter((s) => s !== 'UT'))].slice(0, F.n);
        for (const st of picks) {
          const p = withDistractors(r, st, F.wrong, 4);
          out.push({ ...base, id: `sl-np-${F.key}-${st.toLowerCase()}`, k: kOf('sl', 'np', F.key), d: F.d, t: 'choice', q: F.q, sub: F.sub,
            o: p.o.map(keyName), a: p.a, why: F.why(st), see: see(np.it, st) });
        }
      }
      // which of two: a full-practice state against a restricted one
      const fs = r.shuffle(full.filter((s) => s !== 'UT')).slice(0, 6), rs = r.shuffle(restricted).slice(0, 6);
      fs.forEach((st, i) => {
        if (!rs[i]) return;
        const order = r.shuffle([st, rs[i]]);
        out.push({ ...base, id: `sl-np-pair-${st.toLowerCase()}-${rs[i].toLowerCase()}`, k: kOf('sl', 'np', 'pair'), d: 1, t: 'choice', sub: FULL,
          q: 'On AANP\'s 2026 map, which of these two states gives nurse practitioners full practice authority?', o: order.map(keyName), a: order.indexOf(st),
          why: `${STATES[st]} is full practice and ${STATES[rs[i]]} is restricted, requiring career-long supervision.`, see: see(np.it, st) });
      });
      // how many
      out.push({ ...base, id: 'sl-np-count', k: kOf('sl', 'np', 'count'), d: 3, t: 'number',
        q: 'How many states give nurse practitioners full practice authority on AANP\'s 2026 map?', sub: 'Count the states, from 0 to 50. D.C. is not counted.',
        a: full.length, abs: 0.5, pre: '', suf: '', dp: 0, unit: 'states',
        why: `AANP's ${asOf} map lists ${full.length} states and D.C. as full practice, ${reduced.length} as reduced and ${restricted.length} as restricted.`,
        h: `${restricted.length} states are restricted.`, see: `plm|lens=policy&metric=${mapSlug(np.it.name)}|every state` });
    }
  }

  // ── Medicaid expansion: the states the state feed did not ask ──
  const mx = measure(cfg, data, 'policy/medicaid-expansion');
  const fact = curated.find((c) => c.id === 'medicaid-expansion-2026');
  if (mx && fact) {
    const yes = Object.keys(mx.vals).filter((s) => mx.vals[s] === 1), no = FIFTY.filter((s) => mx.vals[s] === 0);
    if (yes.length === fact.a) {
      const yes50 = yes.filter((s) => s !== 'DC');
      const y = Number((readJson(reads[4]).policy || {})[mx.index]);
      if (!y) return out;
      const base = { z: 'pol', f: 'Medicaid', src: mx.it.source, url: mx.it.sourceUrl, yr: y, ck: String(mx.it.retrievedDate) };
      const sub = 'The expansion covers adults with incomes up to 138 percent of the federal poverty level.';
      const why = `${yes50.length} states and D.C. have adopted it; ${no.length} have not: ${joinNames(no.map((s) => STATES[s]))}.`;
      const asked = new Set((ctx.fed || []).filter((q) => /^sm-medicaid-expansion-(in|out)-/.test(q.id)).map((q) => q.id.slice(-2).toUpperCase()));
      const r = rngFrom('huddle|sl|medicaid');
      for (const { form, right, wrong, words, n } of [{ form: 'in', right: yes50, wrong: no, words: 'has adopted the ACA Medicaid expansion', n: 8 },
        { form: 'out', right: no, wrong: yes50, words: 'has NOT adopted the ACA Medicaid expansion', n: 8 }]) {
        for (const st of r.shuffle(right.filter((s) => !asked.has(s))).slice(0, n)) {
          const p = withDistractors(r, st, wrong, 4);
          out.push({ ...base, id: `sl-medicaid-${form}-${st.toLowerCase()}`, k: kOf('sl', 'medicaid', form), d: 2, t: 'choice',
            q: `Which of these states ${words}, as of ${y}?`, sub, o: p.o.map(keyName), a: p.a, why, h: `${no.length} states had not adopted it.`, see: see(mx.it, st) });
        }
      }
      const ys = r.shuffle(yes50).slice(0, 6), ns = r.shuffle(no).slice(0, 6);
      ns.forEach((n0, i) => {
        const order = r.shuffle([ys[i], n0]);
        out.push({ ...base, id: `sl-medicaid-pair-${ys[i].toLowerCase()}-${n0.toLowerCase()}`, k: kOf('sl', 'medicaid', 'pair'), d: 1, t: 'choice',
          q: `Which of these two states has adopted the ACA Medicaid expansion, as of ${y}?`, sub, o: order.map(keyName), a: order.indexOf(ys[i]), why, see: see(mx.it, ys[i]) });
      });
    }
  }
  return out;
}

module.exports = { name: 'state-laws', prefix: 'sl-', reads, build };
