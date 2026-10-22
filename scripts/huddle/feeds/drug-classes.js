'use strict';
/**
 * FEED: the drug classes of the drugs Medicare fills most (2026-10-20, bank version 4, DECISIONS DH13).
 *
 * Reads: scripts/data/huddle-drug-classes.json (built by scripts/huddle/pull-drug-classes.js, npm run huddle:drugs: each
 * drug's 2024 Medicare Part D claims and its FDA Established Pharmacologic Class from NLM's RxClass) and
 * scripts/data/huddle-drug-class-names.json (what each FDA class is called on a tile, hand-written, read by David).
 * Plan: docs/HU-HUDDLE-DATA-SETS-PLAN-2026-10-20.md.
 *
 * Drugs only as facts (DH2): a drug's class, never a dose or what it treats. Two questions:
 *   - which class a drug is in, for each of the most-filled drugs whose FDA classes all come to one tile name;
 *   - which of four drugs is in a class, for each class with a drug here (a second one where the class has three or more).
 * A wrong answer is a real class, or a drug in one, and never half right: never a name in the right one's group (a
 * thiazide and a thiazide-like diuretic), never an umbrella name (antiarrhythmic) many drugs could be called. Wrong
 * answers come from the same area of the body where it has three, so lisinopril is asked among heart drugs.
 * A new row: run npm run huddle:drugs, then npm run build:huddle; a class the names list does not have stops the build.
 */
const { readJson, rngFrom, kOf, idOf, joinNames, ordinal } = require('../lib');

const reads = ['scripts/data/huddle-drug-classes.json', 'scripts/data/huddle-drug-class-names.json'];
const RANKS = 200;   // the plan's "200 drugs Medicare filled most"

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
// "Beta blocker" in a sentence is "beta blocker"; "ACE inhibitor" and "GLP-1 agonist" keep their capitals
const inLine = (n) => (/^[A-Z0-9][A-Z0-9-]+\b/.test(n.split(' ')[0]) && /[A-Z0-9]{2}/.test(n.split(' ')[0]) ? n : n.charAt(0).toLowerCase() + n.slice(1));
const art = (c) => (c.an ? 'an ' : 'a ') + inLine(c.name);
const claimsText = (n) => (n >= 1e6 ? (Math.round(n / 1e5) / 10).toFixed(1) + ' million' : String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','));
const dotsFor = (rank) => (rank <= 50 ? 1 : rank <= 120 ? 2 : 3);

/** three wrong answers from `pool` (classes, or drugs by their class), the same area first, in the seeded order. Where
 *  the right answer is an umbrella name, only from other areas: a dopamine antagonist is half right for an antiemetic. */
function wrongs(r, pool, c) {
  const area = (x) => (x.c || x).area;
  const near = c.broad ? [] : r.shuffle(pool.filter((x) => area(x) === c.area));
  const far = r.shuffle(pool.filter((x) => area(x) !== c.area));
  return near.concat(far).slice(0, 3);
}
/** the right answer among three wrong ones, in the seeded order */
function four(r, right, wrong) {
  const all = [right, ...wrong];
  const order = r.shuffle([0, 1, 2, 3]);
  return { all: order.map((i) => all[i]), a: order.indexOf(0) };
}

function build() {
  const D = readJson(reads[0]), N = readJson(reads[1]);
  const M = D._meta, cls = N.classes, skip = N.skipDrugs || {};
  const missing = [...new Set(D.drugs.flatMap((d) => d.epc))].filter((e) => !cls[e]);
  if (missing.length) throw new Error('[huddle:drug-classes] the names list has no tile name for ' + missing.join(', ') + ' (scripts/data/huddle-drug-class-names.json)');

  // the drugs a tile can ask about: one ingredient, every FDA class it has comes to one tile name
  const drugs = [];
  for (const d of D.drugs) {
    if (d.rank > RANKS || skip[d.name] || !d.epc.length) continue;
    const named = d.epc.map((e) => cls[e]);
    if (named.some((c) => c.skip) || new Set(named.map((c) => c.name)).size !== 1) continue;
    drugs.push({ ...d, c: named[0] });
  }
  // every tile name the list has, once, for wrong answers
  const names = new Map();
  for (const c of Object.values(cls)) if (!c.skip && !names.has(c.name)) names.set(c.name, c);
  const apart = (a, b) => a.name !== b.name && !(a.group && a.group === b.group);
  const members = (c) => drugs.filter((x) => x.c.name === c.name);

  const base = { z: 'sci', f: 'Drug classes', t: 'choice', yr: M.claims.year, ck: M.pulled, url: M.classes.url,
    src: `FDA class via NLM RxClass, courtesy of the National Library of Medicine; ${M.claims.name}, ${M.claims.year}` };
  const fdaOf = (d) => joinNames(d.epc);
  const out = [];

  // ── which class is this drug in ──
  const r1 = rngFrom('huddle|rx|class');
  for (const d of drugs) {
    const pool = [...names.values()].filter((x) => !x.broad && apart(x, d.c));
    const p = four(r1, d.c, wrongs(r1, pool, d.c));
    const others = members(d.c).filter((x) => x.name !== d.name).slice(0, 2).map((x) => x.name);
    out.push({ ...base, id: 'rx-class-' + idOf(d.name), k: kOf('rx', 'class'), d: dotsFor(d.rank),
      q: `Which drug class is ${d.name} in?`, sub: 'The class on its FDA label.',
      o: p.all.map((c) => c.name), a: p.a,
      why: `${cap(d.name)} is ${art(d.c)}; the FDA class on its label is ${fdaOf(d)}. Medicare Part D counted ${claimsText(d.claims)} claims for it in ${M.claims.year}, the ${d.rank > 1 ? ordinal(d.rank) + ' ' : ''}most of any single drug.`,
      h: others.length ? `Also in its class: ${joinNames(others)}.` : undefined });
  }

  // ── which of these drugs is in this class ──
  const r2 = rngFrom('huddle|rx|is');
  const seen = new Set();
  for (const d of drugs) {
    const c = d.c;
    if (c.broad || seen.has(c.name)) continue;
    seen.add(c.name);
    const m = members(c);
    m.slice(0, m.length >= 3 ? 2 : 1).forEach((right, i) => {
      const pool = drugs.filter((x) => !x.c.broad && apart(x.c, c));
      const p = four(r2, right, wrongs(r2, pool, c));
      const more = m.filter((x) => !p.all.includes(x)).slice(0, 1).map((x) => x.name);
      out.push({ ...base, id: `rx-is-${idOf(c.name)}-${i + 1}`, k: kOf('rx', 'is'), d: dotsFor(right.rank),
        q: `Which of these is ${art(c)}?`, sub: 'By the class on each drug\'s FDA label.',
        o: p.all.map((x) => x.name), a: p.a, v: p.all.map((x) => x.c.name),
        why: `${cap(right.name)} is ${art(c)}; the FDA class on its label is ${fdaOf(right)}. The others are each in another class, shown with the answers.`,
        h: more.length ? `Another in the class: ${more[0]}.` : undefined });
    });
  }
  return out;
}

module.exports = { name: 'drug-classes', prefix: 'rx-', reads, build };
