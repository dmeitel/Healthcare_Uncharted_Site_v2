'use strict';
/**
 * FEED: the license compacts, beyond who is in each one (2026-10-18).
 *
 * Reads: src/_data/licensure.json, the Assignment Compass's licensure file that David keeps current (he chairs the
 * USRC Legislative Affairs Committee). Its _meta.retrieved is the check date; each compact names its own site.
 * Section 3 of the builder already asks which states are in or out of each compact and how many joined. This feed asks:
 *   - which profession a compact is for, by its short name;
 *   - which state has passed a compact but is not yet taking part (the `pending` list, "enacted" or "passed" only);
 *   - which state belongs to both of two working compacts;
 *   - which state is on none of the compacts' member lists;
 *   - how many of the compacts list a state;
 *   - which compact is not yet issuing privileges.
 * A new row: a profession with a compact, or a state added to a compact's members or pending list, changes these
 * questions on the next build.
 */
const { readJson, rngFrom, STATES, FIFTY, keyName, kOf, idOf, dateWords, joinNames, withDistractors } = require('../lib');

const reads = ['src/_data/licensure.json'];
const WORD = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

function build() {
  const lic = readJson(reads[0]);
  const asOf = lic._meta && lic._meta.retrieved;
  if (!asOf) return [];
  const when = dateWords(asOf);
  const yr = Number(String(asOf).slice(0, 4));
  const C = [];
  for (const [prof, P] of Object.entries(lic.professions)) {
    const c = P.compact;
    if (!c || !Array.isArray(c.members) || !c.members.length) continue;
    C.push({ ...c, prof, label: P.label, in50: c.members.filter((s) => FIFTY.includes(s)) });
  }
  if (C.length < 4) return [];
  const out = [];
  const listed = `Member states as of ${when}, by each compact's own list. A state that has passed one but not yet put it in place does not count.`;
  const base = (c) => ({ z: 'pol', f: 'Compacts', src: c.name + ', member states', url: c.url, yr, ck: asOf });
  const r = rngFrom('huddle|lc');

  // which profession a compact is for, by its short name
  for (const c of C) {
    const p = withDistractors(r, c.label, C.map((x) => x.label), 4);
    if (!p) continue;
    out.push({ ...base(c), id: 'lc-code-' + idOf(c.code), k: kOf('lc', 'code'), d: 1, t: 'choice',
      q: `Which license is the ${c.code} compact for?`, o: p.o, a: p.a, why: `${c.code} is the ${c.name}.` });
  }

  // passed but not yet taking part
  for (const c of C) {
    const pend = Object.entries(c.pending || {}).filter(([s, how]) => FIFTY.includes(s) && /^(enacted|passed)/i.test(how)).map(([s]) => s);
    for (const st of pend) {
      const p = withDistractors(r, st, FIFTY.filter((s) => !pend.includes(s)), 4);
      out.push({ ...base(c), id: `lc-pending-${idOf(c.code)}-${st.toLowerCase()}`, k: kOf('lc', 'pending', c.code), d: 3, t: 'choice',
        q: `As of ${when}, which of these states had passed the ${c.name} but was not yet taking part?`, o: p.o.map(keyName), a: p.a,
        why: `${STATES[st]}: ${c.pending[st]}. ${pend.length === 1 ? 'It was the only state waiting.' : `${pend.length} states were waiting: ${joinNames(pend.map((s) => STATES[s]))}.`}`,
        h: `${c.in50.length} states ${c.operational ? 'were members' : 'had enacted it'} already.` });
    }
  }

  // in both of two working compacts
  const live = C.filter((c) => c.operational);
  for (let i = 0; i < live.length; i++) {
    for (let j = i + 1; j < live.length; j++) {
      const A = live[i], B = live[j];
      const both = FIFTY.filter((s) => A.in50.includes(s) && B.in50.includes(s));
      const one = FIFTY.filter((s) => !both.includes(s) && (A.in50.includes(s) || B.in50.includes(s)));
      const neither = FIFTY.filter((s) => !both.includes(s) && !one.includes(s));
      if (!both.length || one.length + neither.length < 3) continue;
      for (const st of r.shuffle(both).slice(0, 3)) {
        // the wrong answers are in one of the two where they can be, so knowing one list is not enough
        const wrong = r.shuffle(one).slice(0, 2).concat(r.shuffle(neither).slice(0, 1));
        const p = withDistractors(r, st, wrong.length === 3 ? wrong : one.concat(neither), 4);
        out.push({ ...base(A), id: `lc-both-${idOf(A.code)}-${idOf(B.code)}-${st.toLowerCase()}`, k: kOf('lc', 'both', A.code, B.code), d: 2, t: 'choice',
          q: `As of ${when}, which of these states was a member of both the ${A.name} and the ${B.name}?`, sub: listed,
          o: p.o.map(keyName), a: p.a, src: `${A.name} and ${B.name}, member states`,
          why: `The ${A.code} listed ${A.in50.length} states and the ${B.code} ${B.in50.length}; ${both.length} were on both lists.`,
          h: `${both.length} states were in both.` });
      }
    }
  }

  // on none of the lists
  const names = C.map((c) => c.code);
  const onNone = FIFTY.filter((s) => !C.some((c) => c.in50.includes(s)));
  for (const st of onNone) {
    const p = withDistractors(r, st, FIFTY.filter((s) => !onNone.includes(s)), 4);
    out.push({ z: 'pol', f: 'Compacts', src: 'The license compacts\' member lists (' + names.join(', ') + ')', yr, ck: asOf,
      id: 'lc-none-' + st.toLowerCase(), k: kOf('lc', 'none'), d: 2, t: 'choice',
      q: `As of ${when}, which of these states was a member of none of these ${WORD[C.length] || C.length} license compacts: ${joinNames(names)}?`, sub: listed,
      o: p.o.map(keyName), a: p.a, why: `${joinNames(onNone.map((s) => STATES[s]))} ${onNone.length > 1 ? 'were' : 'was'} on none of the lists.`,
      h: `${onNone.length} states were on none of them.` });
  }

  // how many of the compacts list a state
  const many = (s) => C.filter((c) => c.in50.includes(s)).length;
  const pickStates = ['UT', ...r.shuffle(FIFTY.filter((s) => s !== 'UT'))].slice(0, 10);
  for (const st of pickStates) {
    const n = many(st);
    const span = [...Array(C.length + 1).keys()];                 // 0 to the number of compacts
    const near = span.filter((x) => x !== n).sort((a, b) => Math.abs(a - n) - Math.abs(b - n) || a - b).slice(0, 3);
    const opts = [n, ...near].sort((a, b) => a - b);
    out.push({ z: 'pol', f: 'Compacts', src: 'The license compacts\' member lists (' + names.join(', ') + ')', yr, ck: asOf,
      id: 'lc-count-' + st.toLowerCase(), k: kOf('lc', 'howmany'), d: 3, t: 'choice',
      q: `As of ${when}, how many of these ${WORD[C.length] || C.length} license compacts listed ${STATES[st]} as a member: ${joinNames(names)}?`, sub: listed,
      o: opts.map(String), a: opts.indexOf(n),
      why: n ? `${STATES[st]} was in ${joinNames(C.filter((c) => c.in50.includes(st)).map((c) => c.code))}.` : `${STATES[st]} was in none of them.` });
  }

  // not yet issuing privileges
  for (const c of C.filter((x) => !x.operational)) {
    const p = withDistractors(r, c.name, live.map((x) => x.name), 4);
    if (!p) continue;
    out.push({ ...base(c), id: 'lc-notlive-' + idOf(c.code), k: kOf('lc', 'notlive'), d: 2, t: 'choice',
      q: `As of ${when}, which of these license compacts was not yet issuing privileges to practice?`, o: p.o, a: p.a,
      why: c.statusLine || `${c.in50.length} states have enacted it; privileges start once it is in place.`,
      h: `${c.in50.length} states had enacted it so far.` });
  }
  return out;
}

module.exports = { name: 'licensure', prefix: 'lc-', reads, build };
